package com.ayush.jetpack.core;

/**
 * Combines two CRC-32 checksums without re-reading the underlying bytes.
 *
 * <p>Given {@code crc(A)}, {@code crc(B)} and {@code len(B)}, this computes {@code crc(A || B)}.
 * That is what makes the CRC step of the parallel compressor embarrassingly parallel: every worker
 * computes the CRC-32 of its own block (via the hardware-accelerated {@link java.util.zip.CRC32}),
 * and the writer folds the per-block CRCs together in order instead of doing a second serial pass
 * over the whole input.
 *
 * <p>This is a direct port of zlib's {@code crc32_combine}, which models CRC-32 as a linear
 * operator over GF(2): appending {@code n} zero bits to a message is a fixed 32x32 bit-matrix
 * multiply, and appending {@code n} zero bits is built up by repeatedly squaring the
 * "append one zero bit" operator (binary exponentiation over the bit length). The reflected
 * polynomial {@code 0xEDB88320} is the same one {@link java.util.zip.CRC32} uses, so results are
 * bit-identical to a single serial CRC over the concatenation (verified in the test suite).
 */
public final class Crc32Combine {

    /** Reflected CRC-32 polynomial (IEEE 802.3), matching {@link java.util.zip.CRC32}. */
    private static final long POLY = 0xEDB88320L;

    private Crc32Combine() {
    }

    /** Multiply the GF(2) vector {@code vec} by the 32x32 bit-matrix {@code mat}. */
    private static long matrixTimes(long[] mat, long vec) {
        long sum = 0;
        int i = 0;
        while (vec != 0) {
            if ((vec & 1) != 0) {
                sum ^= mat[i];
            }
            vec >>>= 1;
            i++;
        }
        return sum & 0xFFFFFFFFL;
    }

    /** Square a GF(2) bit-matrix: {@code square = mat * mat}. */
    private static void matrixSquare(long[] square, long[] mat) {
        for (int n = 0; n < 32; n++) {
            square[n] = matrixTimes(mat, mat[n]);
        }
    }

    /**
     * Returns the CRC-32 of {@code A || B} given {@code crcA = crc(A)}, {@code crcB = crc(B)} and
     * the byte length of {@code B}. CRCs are the usual unsigned 32-bit values carried in a long.
     *
     * @param crcA CRC-32 of the first part
     * @param crcB CRC-32 of the second part
     * @param lenB length of the second part, in bytes (must be {@code >= 0})
     * @return CRC-32 of the concatenation
     */
    public static long combine(long crcA, long crcB, long lenB) {
        if (lenB < 0) {
            throw new IllegalArgumentException("lenB must be non-negative: " + lenB);
        }
        if (lenB == 0) {
            return crcA & 0xFFFFFFFFL;
        }

        long[] even = new long[32]; // even-power-of-two zeros operator
        long[] odd = new long[32];  // odd-power-of-two zeros operator

        // odd := operator that appends one zero *bit* (the polynomial + identity rows).
        odd[0] = POLY;
        long row = 1;
        for (int n = 1; n < 32; n++) {
            odd[n] = row;
            row <<= 1;
        }
        matrixSquare(even, odd);  // even = append 2 zero bits
        matrixSquare(odd, even);  // odd  = append 4 zero bits

        long crc = crcA & 0xFFFFFFFFL;
        long len = lenB;
        // Binary exponentiation over the byte length of B. The first square inside the loop turns
        // the 4-bit operator into the 8-bit (one zero byte) operator, so `len` is counted in bytes.
        // This mirrors zlib's crc32_combine exactly.
        do {
            matrixSquare(even, odd);
            if ((len & 1) != 0) {
                crc = matrixTimes(even, crc);
            }
            len >>>= 1;
            if (len == 0) {
                break;
            }
            matrixSquare(odd, even);
            if ((len & 1) != 0) {
                crc = matrixTimes(odd, crc);
            }
            len >>>= 1;
        } while (len != 0);

        crc ^= (crcB & 0xFFFFFFFFL);
        return crc & 0xFFFFFFFFL;
    }
}
