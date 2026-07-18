package com.ayush.jetpack;

import com.ayush.jetpack.core.GzipDecompressor;
import com.ayush.jetpack.core.ParallelGzipCompressor;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Random;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Validates interoperability with the real, external {@code gzip(1)} tool -- the strongest possible
 * "this is honest gzip" evidence. These tests {@link Assumptions#assumeTrue assume} {@code gzip} is
 * on the PATH and self-skip where it is not, so the build stays green on machines without it.
 */
class CrossToolTest {

    private static boolean gzipAvailable() {
        try {
            Process p = new ProcessBuilder("gzip", "--version")
                    .redirectErrorStream(true).start();
            return p.waitFor(10, TimeUnit.SECONDS) && p.exitValue() == 0;
        } catch (IOException | InterruptedException e) {
            return false;
        }
    }

    private static byte[] sample() {
        byte[] data = new byte[2_000_000];
        Random r = new Random(2026);
        r.nextBytes(data);
        // Add a compressible region so the output is not purely stored.
        java.util.Arrays.fill(data, 500_000, 1_200_000, (byte) '=');
        return data;
    }

    @Test
    void ourOutputDecompressesWithSystemGzip(@TempDir Path dir) throws Exception {
        Assumptions.assumeTrue(gzipAvailable(), "gzip not on PATH");
        byte[] original = sample();

        // Compress via the FFM memory-mapped file path, forcing many blocks (small block size).
        Path raw = dir.resolve("raw.bin");
        Files.write(raw, original);
        Path gz = dir.resolve("raw.bin.gz");
        new ParallelGzipCompressor(6, 64 * 1024).compressFile(raw, gz);

        // gzip -t validates integrity; gzip -dc emits the original bytes.
        Process test = new ProcessBuilder("gzip", "-t", gz.toString())
                .redirectErrorStream(true).start();
        assertTrue(test.waitFor(30, TimeUnit.SECONDS));
        assertEquals(0, test.exitValue(), "gzip -t reported the stream as corrupt");

        Process dec = new ProcessBuilder("gzip", "-dc", gz.toString()).start();
        byte[] out = dec.getInputStream().readAllBytes();
        assertTrue(dec.waitFor(30, TimeUnit.SECONDS));
        assertEquals(0, dec.exitValue());
        assertArrayEquals(original, out, "system gzip -dc output differs from original");
    }

    @Test
    void weDecompressSystemGzipOutput(@TempDir Path dir) throws Exception {
        Assumptions.assumeTrue(gzipAvailable(), "gzip not on PATH");
        byte[] original = ("interoperability check -- "
                + "jetpack must read what standard gzip writes\n").repeat(5000)
                .getBytes(StandardCharsets.UTF_8);

        Path raw = dir.resolve("msg.txt");
        Files.write(raw, original);
        // -k keep, -f force overwrite, -9 max: produces msg.txt.gz
        Process comp = new ProcessBuilder("gzip", "-kf9", raw.toString())
                .redirectErrorStream(true).start();
        assertTrue(comp.waitFor(30, TimeUnit.SECONDS));
        assertEquals(0, comp.exitValue());

        byte[] gz = Files.readAllBytes(dir.resolve("msg.txt.gz"));
        assertArrayEquals(original, GzipDecompressor.decompress(gz),
                "our decompressor differs from the original that system gzip compressed");
    }

    @Test
    void compressFileRoundTripsInProcess(@TempDir Path dir) throws IOException {
        // The FFM mmap file path must round-trip on its own, independent of external gzip.
        for (int size : new int[] {0, 1, 1023, 1024, 1_500_000}) {
            byte[] original = new byte[size];
            new Random(size).nextBytes(original);
            Path raw = dir.resolve("f" + size + ".bin");
            Files.write(raw, original);
            Path gz = dir.resolve("f" + size + ".bin.gz");
            new ParallelGzipCompressor(6, 4096).compressFile(raw, gz);
            assertArrayEquals(original, GzipDecompressor.decompress(Files.readAllBytes(gz)),
                    "compressFile round-trip failed at size " + size);
        }
    }
}
