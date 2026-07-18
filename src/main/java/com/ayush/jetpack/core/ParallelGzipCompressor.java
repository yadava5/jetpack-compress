package com.ayush.jetpack.core;

import com.ayush.jetpack.io.MappedInput;

import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.lang.foreign.MemorySegment;
import java.lang.foreign.ValueLayout;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.zip.CRC32;
import java.util.zip.Deflater;

/**
 * A pigz-style parallel gzip compressor.
 *
 * <p>The input is split into fixed-size blocks that are DEFLATE-compressed independently and
 * concurrently, each on its own <em>virtual thread</em> (JDK 21+ / finalized). The result is a
 * <strong>single-member</strong> gzip stream that any standard tool decompresses
 * ({@code gzip -d}, {@link java.util.zip.GZIPInputStream}).
 *
 * <h2>How independent blocks form one valid DEFLATE stream</h2>
 * Every block except the last is flushed with {@link Deflater#SYNC_FLUSH}, which byte-aligns the
 * output and emits an empty stored block, but leaves {@code BFINAL = 0}. The blocks are therefore
 * concatenable: the decoder walks block after block until it reaches the final block. Only the last
 * block is {@link Deflater#finish() finished} (setting {@code BFINAL = 1}). Because each block uses
 * a fresh {@link Deflater} with no preset dictionary, its LZ77 back-references stay inside the
 * block; in the concatenated stream that is a strict subset of what DEFLATE allows, so it decodes
 * correctly (at a slight ratio cost near block boundaries -- the standard pigz trade-off).
 *
 * <h2>Parallel CRC</h2>
 * The gzip trailer needs the CRC-32 of the whole input. Each worker computes the CRC-32 of its own
 * block (hardware-accelerated {@link CRC32}); the writer folds them together in order with
 * {@link Crc32Combine}, so there is no second serial pass over the data.
 *
 * <h2>What is delegated vs. hand-written</h2>
 * The DEFLATE entropy coding itself is delegated to {@link java.util.zip.Deflater} (zlib) -- this is
 * a correct, battle-tested encoder. What this class contributes is the <em>parallel framing</em>:
 * block splitting, concurrent scheduling on virtual threads with a bounded in-flight window, the
 * SYNC_FLUSH stitching into a single gzip member, and the combined CRC. A from-scratch DEFLATE
 * encoder is explicitly out of scope (see README "Implemented vs. planned").
 */
public final class ParallelGzipCompressor {

    /** Default block size: 1 MiB. Large enough that per-block framing overhead is negligible. */
    public static final int DEFAULT_BLOCK_SIZE = 1 << 20;

    private static final byte[] GZIP_HEADER = {
            (byte) 0x1f, (byte) 0x8b, // magic
            Deflater.DEFLATED,        // CM = 8
            0,                        // FLG
            0, 0, 0, 0,               // MTIME = 0
            0,                        // XFL
            (byte) 0xff               // OS = 255 (unknown), matching java.util.zip.GZIPOutputStream
    };

    private final int level;
    private final int blockSize;
    private final int maxInFlight;

    /** Compressor with default level and 1 MiB blocks. */
    public ParallelGzipCompressor() {
        this(Deflater.DEFAULT_COMPRESSION, DEFAULT_BLOCK_SIZE);
    }

    /**
     * @param level     DEFLATE level 0-9, or {@link Deflater#DEFAULT_COMPRESSION} (-1)
     * @param blockSize block size in bytes (must be {@code > 0})
     */
    public ParallelGzipCompressor(int level, int blockSize) {
        this(level, blockSize, Math.max(2, Runtime.getRuntime().availableProcessors() * 2));
    }

    /**
     * @param level       DEFLATE level 0-9, or {@link Deflater#DEFAULT_COMPRESSION} (-1)
     * @param blockSize   block size in bytes (must be {@code > 0})
     * @param maxInFlight maximum number of blocks compressed-but-not-yet-written (bounds memory)
     */
    public ParallelGzipCompressor(int level, int blockSize, int maxInFlight) {
        if (level < -1 || level > 9) {
            throw new IllegalArgumentException("level must be -1..9: " + level);
        }
        if (blockSize <= 0) {
            throw new IllegalArgumentException("blockSize must be > 0: " + blockSize);
        }
        if (maxInFlight < 1) {
            throw new IllegalArgumentException("maxInFlight must be >= 1: " + maxInFlight);
        }
        this.level = level;
        this.blockSize = blockSize;
        this.maxInFlight = maxInFlight;
    }

    /**
     * Compresses {@code in} to {@code out} using an FFM memory-mapped view of the input file, so
     * even multi-gigabyte inputs are never fully copied onto the Java heap.
     */
    public void compressFile(Path in, Path out) throws IOException {
        try (MappedInput mapped = MappedInput.open(in);
             OutputStream os = new BufferedOutputStream(Files.newOutputStream(out), 1 << 16)) {
            compress(mapped.segment(), 0L, mapped.size(), os);
        }
    }

    /** Compresses {@code input} fully and returns the gzip bytes. */
    public byte[] compress(byte[] input) {
        return compress(input, 0, input.length);
    }

    /** Compresses {@code input[off..off+len)} and returns the gzip bytes. */
    public byte[] compress(byte[] input, int off, int len) {
        ByteArrayOutputStream out = new ByteArrayOutputStream(Math.max(64, len / 2));
        try {
            compress(MemorySegment.ofArray(input), (long) off, (long) len, out);
        } catch (IOException e) {
            // ByteArrayOutputStream never throws IOException.
            throw new AssertionError(e);
        }
        return out.toByteArray();
    }

    /**
     * Compresses {@code length} bytes starting at {@code offset} of {@code source} (which may be a
     * heap array segment or an FFM memory-mapped file) and writes a complete gzip stream to
     * {@code out}. This is the primary engine both the in-memory and file paths funnel through.
     */
    public void compress(MemorySegment source, long offset, long length, OutputStream out)
            throws IOException {
        if (offset < 0 || length < 0 || offset + length > source.byteSize()) {
            throw new IndexOutOfBoundsException(
                    "offset=" + offset + " length=" + length + " size=" + source.byteSize());
        }

        // At least one block, so an empty input still emits a valid (empty) final DEFLATE block.
        long blocks = Math.max(1L, (length + blockSize - 1) / blockSize);

        out.write(GZIP_HEADER);

        long combinedCrc = 0L;
        long totalLen = 0L;

        try (ExecutorService exec = Executors.newVirtualThreadPerTaskExecutor()) {
            Deque<Future<Block>> window = new ArrayDeque<>(maxInFlight + 1);
            for (long b = 0; b < blocks; b++) {
                long start = offset + b * (long) blockSize;
                int thisLen = (int) Math.min((long) blockSize, offset + length - start);
                boolean last = (b == blocks - 1);
                final long fStart = start;
                final int fLen = thisLen;
                window.addLast(exec.submit(() -> compressBlock(source, fStart, fLen, last)));

                if (window.size() >= maxInFlight) {
                    Block done = take(window.pollFirst());
                    out.write(done.data);
                    combinedCrc = Crc32Combine.combine(combinedCrc, done.crc, done.rawLen);
                    totalLen += done.rawLen;
                }
            }
            while (!window.isEmpty()) {
                Block done = take(window.pollFirst());
                out.write(done.data);
                combinedCrc = Crc32Combine.combine(combinedCrc, done.crc, done.rawLen);
                totalLen += done.rawLen;
            }
        }

        writeTrailer(out, combinedCrc, totalLen);
    }

    /** Compresses a single block into raw (nowrap) DEFLATE bytes and computes its CRC-32. */
    private Block compressBlock(MemorySegment source, long start, int len, boolean last) {
        byte[] raw = new byte[len];
        MemorySegment.copy(source, ValueLayout.JAVA_BYTE, start, raw, 0, len);

        CRC32 crc = new CRC32();
        crc.update(raw, 0, len);

        Deflater deflater = new Deflater(level, /* nowrap = */ true);
        try {
            deflater.setInput(raw, 0, len);
            ByteArrayOutputStream bos = new ByteArrayOutputStream(Math.max(32, len / 2));
            byte[] buf = new byte[64 * 1024];
            if (last) {
                deflater.finish();
                while (!deflater.finished()) {
                    int n = deflater.deflate(buf, 0, buf.length);
                    bos.write(buf, 0, n);
                }
            } else {
                // Drain a SYNC_FLUSH: keep pulling until the output buffer is no longer filled
                // completely, which signals the flush (and its empty stored block) is fully emitted.
                int n;
                do {
                    n = deflater.deflate(buf, 0, buf.length, Deflater.SYNC_FLUSH);
                    bos.write(buf, 0, n);
                } while (n == buf.length);
            }
            return new Block(bos.toByteArray(), crc.getValue(), len);
        } finally {
            deflater.end();
        }
    }

    private void writeTrailer(OutputStream out, long combinedCrc, long totalLen) throws IOException {
        byte[] trailer = new byte[8];
        writeLE(trailer, 0, combinedCrc & 0xFFFFFFFFL);
        writeLE(trailer, 4, totalLen & 0xFFFFFFFFL); // ISIZE = input length mod 2^32
        out.write(trailer);
    }

    private static void writeLE(byte[] dst, int off, long value) {
        dst[off] = (byte) (value);
        dst[off + 1] = (byte) (value >>> 8);
        dst[off + 2] = (byte) (value >>> 16);
        dst[off + 3] = (byte) (value >>> 24);
    }

    private static Block take(Future<Block> future) throws IOException {
        try {
            return future.get();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("interrupted while compressing", e);
        } catch (ExecutionException e) {
            Throwable cause = e.getCause();
            if (cause instanceof RuntimeException re) {
                throw re;
            }
            throw new IOException("block compression failed", cause);
        }
    }

    /** One compressed block: its raw DEFLATE bytes, the CRC-32 of its source bytes, and its length. */
    private record Block(byte[] data, long crc, int rawLen) {
    }
}
