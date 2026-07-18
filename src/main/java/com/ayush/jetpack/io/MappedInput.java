package com.ayush.jetpack.io;

import java.io.IOException;
import java.lang.foreign.Arena;
import java.lang.foreign.MemorySegment;
import java.nio.channels.FileChannel;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

/**
 * A read-only, memory-mapped view of a file exposed as an FFM {@link MemorySegment}.
 *
 * <p>Uses the finalized Foreign Function &amp; Memory API ({@code java.lang.foreign}, JEP 454):
 * {@link FileChannel#map(FileChannel.MapMode, long, long, Arena)} maps the whole file into native
 * memory whose lifetime is bound to an {@link Arena}. A <em>shared</em> arena is used so the many
 * virtual-thread block workers of {@link com.ayush.jetpack.core.ParallelGzipCompressor} can read
 * slices of the same mapping concurrently without copying the file onto the Java heap first.
 *
 * <p>Zero-length files are handled specially: {@code mmap} of length 0 is not portable, so an empty
 * {@link MemorySegment#NULL}-backed zero-size segment is returned instead.
 *
 * <p>Always use in try-with-resources; {@link #close()} closes the arena, which unmaps the file.
 */
public final class MappedInput implements AutoCloseable {

    private final Arena arena;
    private final MemorySegment segment;
    private final long size;

    private MappedInput(Arena arena, MemorySegment segment, long size) {
        this.arena = arena;
        this.segment = segment;
        this.size = size;
    }

    /** Memory-maps {@code path} read-only. */
    public static MappedInput open(Path path) throws IOException {
        Arena arena = Arena.ofShared();
        try (FileChannel channel = FileChannel.open(path, StandardOpenOption.READ)) {
            long size = channel.size();
            MemorySegment segment = size == 0
                    ? MemorySegment.ofArray(new byte[0])
                    : channel.map(FileChannel.MapMode.READ_ONLY, 0, size, arena);
            return new MappedInput(arena, segment, size);
        } catch (IOException | RuntimeException e) {
            arena.close();
            throw e;
        }
    }

    /** The mapped, read-only segment (valid until {@link #close()}). */
    public MemorySegment segment() {
        return segment;
    }

    /** File size in bytes. */
    public long size() {
        return size;
    }

    @Override
    public void close() {
        arena.close();
    }
}
