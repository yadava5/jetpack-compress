package com.ayush.jetpack;

import com.ayush.jetpack.io.MappedInput;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.lang.foreign.MemorySegment;
import java.lang.foreign.ValueLayout;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;

/** Verifies the FFM memory-mapped input reads back exactly what is on disk. */
class MappedInputTest {

    @Test
    void mapsFileContentsExactly(@TempDir Path dir) throws IOException {
        byte[] data = new byte[123_457];
        new Random(11).nextBytes(data);
        Path file = dir.resolve("data.bin");
        Files.write(file, data);

        try (MappedInput mapped = MappedInput.open(file)) {
            assertEquals(data.length, mapped.size());
            MemorySegment seg = mapped.segment();
            byte[] copy = seg.asSlice(0, data.length).toArray(ValueLayout.JAVA_BYTE);
            assertArrayEquals(data, copy);
            // Spot-check random single-byte reads.
            assertEquals(data[0], seg.get(ValueLayout.JAVA_BYTE, 0));
            assertEquals(data[data.length - 1], seg.get(ValueLayout.JAVA_BYTE, data.length - 1L));
        }
    }

    @Test
    void emptyFileMapsToZeroLengthSegment(@TempDir Path dir) throws IOException {
        Path file = dir.resolve("empty.bin");
        Files.write(file, new byte[0]);
        try (MappedInput mapped = MappedInput.open(file)) {
            assertEquals(0L, mapped.size());
            assertEquals(0L, mapped.segment().byteSize());
        }
    }
}
