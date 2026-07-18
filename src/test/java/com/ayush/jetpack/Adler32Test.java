package com.ayush.jetpack;

import com.ayush.jetpack.vector.VectorizedAdler32;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.lang.foreign.MemorySegment;
import java.nio.charset.StandardCharsets;
import java.util.Random;
import java.util.zip.Adler32;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * The Vector API Adler-32 must be bit-identical to {@link java.util.zip.Adler32}. This is the
 * correctness anchor for the project's only hand-vectorized component; it also pins down the
 * Vector API's byte-to-int expansion convention (a wrong lane/weight mapping fails here).
 */
class Adler32Test {

    private static long jdk(byte[] data) {
        Adler32 a = new Adler32();
        a.update(data);
        return a.getValue();
    }

    private static long unsigned(int checksum) {
        return checksum & 0xFFFFFFFFL;
    }

    @Test
    void knownAnswerWikipedia() {
        // The canonical Adler-32 test vector.
        byte[] data = "Wikipedia".getBytes(StandardCharsets.US_ASCII);
        assertEquals(0x11E60398L, unsigned(VectorizedAdler32.vector(data)));
        assertEquals(0x11E60398L, unsigned(VectorizedAdler32.scalar(data)));
    }

    @Test
    void emptyInput() {
        byte[] empty = new byte[0];
        assertEquals(1L, unsigned(VectorizedAdler32.vector(empty)));
        assertEquals(1L, unsigned(VectorizedAdler32.scalar(empty)));
        assertEquals(jdk(empty), unsigned(VectorizedAdler32.vector(empty)));
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3, 7, 15, 16, 17, 31, 32, 33, 63, 64, 65, 127, 128, 129,
            255, 256, 1000, 4096, 5551, 5552, 5553, 11104, 65536, 1_000_003})
    void matchesJdkAcrossSizes(int size) {
        byte[] data = new byte[size];
        new Random(0xC0FFEE ^ size).nextBytes(data);
        long expected = jdk(data);
        assertEquals(expected, unsigned(VectorizedAdler32.scalar(data)), "scalar size=" + size);
        assertEquals(expected, unsigned(VectorizedAdler32.vector(data)), "vector size=" + size);
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 1, 200, 255})
    void matchesJdkForConstantBytes(int byteValue) {
        // Constant high bytes stress the modulo/overflow handling in the weighted sum.
        byte[] data = new byte[100_000];
        java.util.Arrays.fill(data, (byte) byteValue);
        long expected = jdk(data);
        assertEquals(expected, unsigned(VectorizedAdler32.scalar(data)));
        assertEquals(expected, unsigned(VectorizedAdler32.vector(data)));
    }

    @Test
    void matchesJdkWithOffsetAndLength() {
        byte[] data = new byte[10_000];
        new Random(42).nextBytes(data);
        int off = 37;
        int len = 9001;
        Adler32 a = new Adler32();
        a.update(data, off, len);
        long expected = a.getValue();
        assertEquals(expected, unsigned(VectorizedAdler32.scalar(data, off, len)));
        assertEquals(expected, unsigned(VectorizedAdler32.vector(data, off, len)));
    }

    @Test
    void memorySegmentPathMatchesJdk() {
        byte[] data = new byte[200_003];
        new Random(7).nextBytes(data);
        long expected = jdk(data);
        MemorySegment seg = MemorySegment.ofArray(data);
        assertEquals(expected, unsigned(VectorizedAdler32.vector(seg, 0L, data.length)));
        // Sub-range of the segment.
        Adler32 a = new Adler32();
        a.update(data, 100, 50_000);
        assertEquals(a.getValue(), unsigned(VectorizedAdler32.vector(seg, 100L, 50_000L)));
    }

    @Test
    void randomizedFuzzAgainstJdk() {
        Random r = new Random(123456789L);
        for (int trial = 0; trial < 500; trial++) {
            int size = r.nextInt(20_000);
            byte[] data = new byte[size];
            r.nextBytes(data);
            long expected = jdk(data);
            assertEquals(expected, unsigned(VectorizedAdler32.vector(data)), "trial=" + trial + " size=" + size);
        }
    }
}
