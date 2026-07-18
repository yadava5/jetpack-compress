package com.ayush.jetpack.core;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.zip.GZIPInputStream;

/**
 * Gzip decompression.
 *
 * <p>Decompression is intentionally <strong>delegated</strong> to
 * {@link java.util.zip.GZIPInputStream}. There is no benefit to re-implementing a DEFLATE decoder:
 * the JDK's is correct and fast, and delegating is the strongest possible proof that what
 * {@link ParallelGzipCompressor} emits is standard gzip. {@code GZIPInputStream} also transparently
 * handles concatenated gzip members, so it round-trips both our single-member output and any
 * multi-member gzip file.
 */
public final class GzipDecompressor {

    private static final int BUFFER = 64 * 1024;

    private GzipDecompressor() {
    }

    /** Decompresses a full gzip byte array to its original bytes. */
    public static byte[] decompress(byte[] gzip) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream(Math.max(64, gzip.length * 3));
        decompress(new ByteArrayInputStream(gzip), out);
        return out.toByteArray();
    }

    /** Streams a gzip {@code in} to raw bytes on {@code out}. Neither stream is closed. */
    public static void decompress(InputStream in, OutputStream out) throws IOException {
        try (GZIPInputStream gz = new GZIPInputStream(in, BUFFER)) {
            byte[] buf = new byte[BUFFER];
            int n;
            while ((n = gz.read(buf)) != -1) {
                out.write(buf, 0, n);
            }
        }
    }
}
