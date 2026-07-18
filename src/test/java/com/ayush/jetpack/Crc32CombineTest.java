package com.ayush.jetpack;

import com.ayush.jetpack.core.Crc32Combine;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Arrays;
import java.util.Random;
import java.util.zip.CRC32;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * {@link Crc32Combine} must reproduce, from per-part CRCs, exactly what a single serial CRC over the
 * concatenation produces. This is what makes the parallel compressor's CRC step correct.
 */
class Crc32CombineTest {

    private static long crc(byte[] data, int off, int len) {
        CRC32 c = new CRC32();
        c.update(data, off, len);
        return c.getValue();
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 15, 16, 100, 1000, 65536})
    void combineTwoPartsMatchesSerial(int splitFactor) {
        Random r = new Random(99 * splitFactor);
        byte[] a = new byte[splitFactor];
        byte[] b = new byte[splitFactor * 3 + 1];
        r.nextBytes(a);
        r.nextBytes(b);

        byte[] whole = new byte[a.length + b.length];
        System.arraycopy(a, 0, whole, 0, a.length);
        System.arraycopy(b, 0, whole, a.length, b.length);

        long expected = crc(whole, 0, whole.length);
        long combined = Crc32Combine.combine(crc(a, 0, a.length), crc(b, 0, b.length), b.length);
        assertEquals(expected, combined);
    }

    @Test
    void combineWithEmptySecondPartIsIdentity() {
        byte[] a = "hello world".getBytes();
        long crcA = crc(a, 0, a.length);
        assertEquals(crcA, Crc32Combine.combine(crcA, new CRC32().getValue(), 0));
    }

    @Test
    void combineWithEmptyFirstPartYieldsSecond() {
        byte[] b = "second".getBytes();
        long crcB = crc(b, 0, b.length);
        // crc of empty prefix is 0.
        assertEquals(crcB, Crc32Combine.combine(0L, crcB, b.length));
    }

    @Test
    void foldingManyBlocksMatchesSerial() {
        // Emulates the compressor: split a buffer into N blocks, CRC each, fold in order.
        Random r = new Random(2024);
        byte[] data = new byte[1_000_003];
        r.nextBytes(data);
        int blockSize = 4096;

        long folded = 0L;
        for (int off = 0; off < data.length; off += blockSize) {
            int len = Math.min(blockSize, data.length - off);
            long blockCrc = crc(data, off, len);
            folded = Crc32Combine.combine(folded, blockCrc, len);
        }
        assertEquals(crc(data, 0, data.length), folded);
    }

    @Test
    void combineIsAssociativeAcrossThreeParts() {
        Random r = new Random(555);
        byte[] a = new byte[123];
        byte[] b = new byte[4567];
        byte[] c = new byte[89];
        r.nextBytes(a);
        r.nextBytes(b);
        r.nextBytes(c);

        long ab = Crc32Combine.combine(crc(a, 0, a.length), crc(b, 0, b.length), b.length);
        long abc = Crc32Combine.combine(ab, crc(c, 0, c.length), c.length);

        byte[] whole = new byte[a.length + b.length + c.length];
        int p = 0;
        for (byte[] part : Arrays.asList(a, b, c)) {
            System.arraycopy(part, 0, whole, p, part.length);
            p += part.length;
        }
        assertEquals(crc(whole, 0, whole.length), abc);
    }
}
