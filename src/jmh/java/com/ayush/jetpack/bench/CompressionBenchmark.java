package com.ayush.jetpack.bench;

import com.ayush.jetpack.core.ParallelGzipCompressor;
import org.openjdk.jmh.annotations.Benchmark;
import org.openjdk.jmh.annotations.BenchmarkMode;
import org.openjdk.jmh.annotations.Fork;
import org.openjdk.jmh.annotations.Level;
import org.openjdk.jmh.annotations.Measurement;
import org.openjdk.jmh.annotations.Mode;
import org.openjdk.jmh.annotations.OperationsPerInvocation;
import org.openjdk.jmh.annotations.OutputTimeUnit;
import org.openjdk.jmh.annotations.Param;
import org.openjdk.jmh.annotations.Scope;
import org.openjdk.jmh.annotations.Setup;
import org.openjdk.jmh.annotations.State;
import org.openjdk.jmh.annotations.Warmup;
import org.openjdk.jmh.infra.Blackhole;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Random;
import java.util.concurrent.TimeUnit;
import java.util.zip.GZIPOutputStream;

/**
 * Throughput: the parallel virtual-thread compressor vs single-threaded {@link GZIPOutputStream}.
 *
 * <p>{@code @OperationsPerInvocation} is set to the corpus size in bytes, so JMH's Throughput figure
 * is reported directly in <strong>bytes/second</strong> (multiply by 1e-6 for MB/s). Both sides
 * produce a valid gzip stream at the same DEFLATE level, so this is an apples-to-apples compare
 * whose only real variable is single-threaded vs. block-parallel.
 */
@State(Scope.Benchmark)
@BenchmarkMode(Mode.Throughput)
@OutputTimeUnit(TimeUnit.SECONDS)
@Fork(value = 1, jvmArgsAppend = {"--add-modules=jdk.incubator.vector"})
@Warmup(iterations = 3, time = 2)
@Measurement(iterations = 5, time = 2)
public class CompressionBenchmark {

    static final int CORPUS_BYTES = 32 * 1024 * 1024; // 32 MiB

    @Param({"6"})
    public int level;

    private byte[] corpus;
    private ParallelGzipCompressor parallel;

    @Setup(Level.Trial)
    public void setup() {
        corpus = buildCorpus(CORPUS_BYTES);
        parallel = new ParallelGzipCompressor(level, ParallelGzipCompressor.DEFAULT_BLOCK_SIZE);
    }

    /** A semi-realistic mix: repetitive text-like runs interleaved with incompressible noise. */
    private static byte[] buildCorpus(int size) {
        byte[] data = new byte[size];
        Random r = new Random(20260718L);
        byte[] words = ("the quick brown fox jumps over the lazy dog "
                + "lorem ipsum dolor sit amet consectetur adipiscing elit ").getBytes();
        int i = 0;
        while (i < size) {
            if (r.nextInt(4) == 0) {
                int run = Math.min(size - i, 256 + r.nextInt(1024));
                for (int k = 0; k < run && i < size; k++) {
                    data[i++] = (byte) r.nextInt(256);
                }
            } else {
                for (byte b : words) {
                    if (i >= size) {
                        break;
                    }
                    data[i++] = b;
                }
            }
        }
        return data;
    }

    @Benchmark
    @OperationsPerInvocation(CORPUS_BYTES)
    public void parallelVirtualThreads(Blackhole bh) {
        bh.consume(parallel.compress(corpus));
    }

    @Benchmark
    @OperationsPerInvocation(CORPUS_BYTES)
    public void singleThreadedJdk(Blackhole bh) throws IOException {
        ByteArrayOutputStream bos = new ByteArrayOutputStream(corpus.length / 2);
        try (LeveledGzipOutputStream gz = new LeveledGzipOutputStream(bos, level)) {
            gz.write(corpus);
        }
        bh.consume(bos.toByteArray());
    }

    /** {@link GZIPOutputStream} pinned to a specific DEFLATE level via the inherited deflater. */
    private static final class LeveledGzipOutputStream extends GZIPOutputStream {
        LeveledGzipOutputStream(OutputStream out, int level) throws IOException {
            super(out, 64 * 1024);
            def.setLevel(level); // `def` is the protected Deflater from DeflaterOutputStream
        }
    }
}
