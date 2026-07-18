package com.ayush.jetpack;

import com.ayush.jetpack.core.GzipDecompressor;
import com.ayush.jetpack.core.ParallelGzipCompressor;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Random;
import java.util.zip.GZIPInputStream;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Round-trip correctness: {@code decompress(compress(x)) == x} across input profiles, compression
 * levels, and block sizes -- crucially including block sizes small enough to force many parallel
 * blocks stitched into one gzip member. Every output is also decoded by a directly-constructed
 * {@link GZIPInputStream} to prove it is standard single-member gzip, not just something our own
 * decompressor happens to accept.
 */
class RoundTripTest {

    private static final int[] LEVELS = {0, 1, 6, 9, -1};
    private static final int[] BLOCK_SIZES = {16, 64, 1000, 1 << 16, 1 << 20};

    /** Compress with every level/blockSize combo and verify the round-trip two independent ways. */
    private void verify(byte[] input) throws IOException {
        for (int level : LEVELS) {
            for (int blockSize : BLOCK_SIZES) {
                byte[] gz = new ParallelGzipCompressor(level, blockSize).compress(input);

                assertTrue(gz.length >= 18, "gzip stream too short");
                assertEquals((byte) 0x1f, gz[0]);
                assertEquals((byte) 0x8b, gz[1]);
                assertEquals((byte) 0x08, gz[2]); // CM = DEFLATE

                // (1) our decompressor
                assertArrayEquals(input, GzipDecompressor.decompress(gz),
                        () -> "our decompressor level=" + level + " block=" + blockSize + " len=" + input.length);

                // (2) a plain GZIPInputStream, proving standard-gzip validity
                byte[] viaJdk;
                try (GZIPInputStream in = new GZIPInputStream(new ByteArrayInputStream(gz))) {
                    viaJdk = in.readAllBytes();
                }
                assertArrayEquals(input, viaJdk,
                        () -> "GZIPInputStream level=" + level + " block=" + blockSize + " len=" + input.length);
            }
        }
    }

    @Test
    void emptyInput() throws IOException {
        verify(new byte[0]);
    }

    @Test
    void singleByte() throws IOException {
        verify(new byte[] {42});
    }

    @Test
    void shortText() throws IOException {
        verify("The quick brown fox jumps over the lazy dog.".getBytes(StandardCharsets.UTF_8));
    }

    @ParameterizedTest
    @ValueSource(ints = {15, 16, 17, 63, 64, 65, 999, 1000, 1001, 65535, 65536, 65537})
    void boundaryLengths(int len) throws IOException {
        byte[] data = new byte[len];
        new Random(len).nextBytes(data);
        verify(data);
    }

    @Test
    void highlyCompressibleZeros() throws IOException {
        verify(new byte[500_000]); // all zeros
    }

    @Test
    void highlyCompressibleRepeated() throws IOException {
        byte[] data = new byte[300_000];
        byte[] pattern = "jetpack-".getBytes(StandardCharsets.US_ASCII);
        for (int i = 0; i < data.length; i++) {
            data[i] = pattern[i % pattern.length];
        }
        verify(data);
    }

    @Test
    void incompressibleRandom() throws IOException {
        byte[] data = new byte[400_000];
        new Random(0xBADF00D).nextBytes(data);
        verify(data);
    }

    @Test
    void allByteValues() throws IOException {
        byte[] data = new byte[256 * 400];
        for (int i = 0; i < data.length; i++) {
            data[i] = (byte) (i & 0xFF);
        }
        verify(data);
    }

    @Test
    void largeMultiBlockRandomThenCompressible() throws IOException {
        // Mixed content large enough to span many 1 MiB blocks.
        byte[] data = new byte[5_000_000];
        Random r = new Random(1);
        r.nextBytes(data);
        java.util.Arrays.fill(data, 2_000_000, 3_500_000, (byte) 'Z'); // a compressible stretch
        verify(data);
    }

    @Test
    void offsetAndLengthSlice() throws IOException {
        byte[] backing = new byte[10_000];
        new Random(5).nextBytes(backing);
        byte[] gz = new ParallelGzipCompressor(6, 512).compress(backing, 1234, 4096);
        byte[] expected = java.util.Arrays.copyOfRange(backing, 1234, 1234 + 4096);
        assertArrayEquals(expected, GzipDecompressor.decompress(gz));
    }
}
