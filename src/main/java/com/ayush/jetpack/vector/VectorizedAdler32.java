package com.ayush.jetpack.vector;

import java.lang.foreign.MemorySegment;
import java.lang.foreign.ValueLayout;
import java.nio.ByteOrder;

import jdk.incubator.vector.ByteVector;
import jdk.incubator.vector.IntVector;
import jdk.incubator.vector.VectorOperators;
import jdk.incubator.vector.VectorSpecies;

/**
 * Adler-32 checksum, hand-vectorized with the JDK Vector API ({@code jdk.incubator.vector}).
 *
 * <p>This is the project's genuinely hand-written SIMD component (the DEFLATE core delegates to
 * zlib; this does not). Adler-32 is
 * <pre>
 *   A = 1 + sum(b_i)                        (mod 65521)
 *   B = sum(A_i)                            (mod 65521)
 *   checksum = (B &lt;&lt; 16) | A
 * </pre>
 * The serial form has a loop-carried dependency (each {@code A} feeds the next {@code B}), which
 * blocks naive vectorization. The classic fix, used here, is to accumulate two order-free sums over
 * a segment of {@code n} bytes:
 * <pre>
 *   S1 = sum_{j=1..n} b_j
 *   S2 = sum_{j=1..n} j * b_j
 * </pre>
 * and then reconstruct exactly:
 * <pre>
 *   A' = A + S1
 *   B' = B + n*A + ((n+1)*S1 - S2)
 * </pre>
 * Both {@code S1} and {@code S2} are plain reductions, so they vectorize: each stride loads a
 * {@link ByteVector}, widens it to {@code int} lanes, and accumulates the plain sum and the
 * position-weighted sum. Segments are capped at {@code NMAX = 5552} bytes (the zlib constant) so the
 * reductions never overflow before the modulo.
 *
 * <p>Correctness is pinned to {@link java.util.zip.Adler32}: the test suite asserts bit-identical
 * results across empty, tiny, large, and random inputs. It is used honestly as a fast content
 * fingerprint (exposed via the CLI {@code adler} command); it is <em>not</em> the gzip trailer
 * checksum, which is CRC-32 per the gzip spec.
 */
public final class VectorizedAdler32 {

    private static final int MOD = 65521;      // largest prime below 2^16
    private static final int NMAX = 5552;      // max bytes before the accumulators must be reduced

    private static final VectorSpecies<Byte> BSP = ByteVector.SPECIES_PREFERRED;
    private static final VectorSpecies<Integer> ISP = IntVector.SPECIES_PREFERRED;
    private static final int L = ISP.length();          // int lanes per vector
    private static final int STRIDE = BSP.length();      // bytes consumed per stride
    private static final int PARTS = STRIDE / L;          // == 4 for the preferred species

    /**
     * Position weights for each expansion part. When a {@code STRIDE}-byte vector is widened to
     * {@code int} in {@code PARTS} chunks, part {@code p} yields source lanes {@code [p*L, p*L+L)},
     * so its 1-based within-stride position is {@code p*L + lane + 1}.
     */
    private static final IntVector[] WEIGHTS = new IntVector[PARTS];

    static {
        for (int part = 0; part < PARTS; part++) {
            int[] w = new int[L];
            for (int lane = 0; lane < L; lane++) {
                w[lane] = part * L + lane + 1;
            }
            WEIGHTS[part] = IntVector.fromArray(ISP, w, 0);
        }
    }

    private VectorizedAdler32() {
    }

    // ------------------------------------------------------------------------------------------
    // Scalar reference (no JDK Adler32) -- the honest baseline the JMH harness measures against.
    // ------------------------------------------------------------------------------------------

    /** Scalar Adler-32 over {@code data}. */
    public static int scalar(byte[] data) {
        return scalar(data, 0, data.length);
    }

    /** Scalar Adler-32 over {@code data[off..off+len)}. */
    public static int scalar(byte[] data, int off, int len) {
        long a = 1, b = 0;
        int i = off;
        int end = off + len;
        while (i < end) {
            int n = Math.min(NMAX, end - i);
            for (int k = 0; k < n; k++) {
                a += data[i + k] & 0xFF;
                b += a;
            }
            a %= MOD;
            b %= MOD;
            i += n;
        }
        return (int) ((b << 16) | a);
    }

    // ------------------------------------------------------------------------------------------
    // Vectorized (jdk.incubator.vector) -- byte[] source.
    // ------------------------------------------------------------------------------------------

    /** Vectorized Adler-32 over {@code data}. */
    public static int vector(byte[] data) {
        return vector(data, 0, data.length);
    }

    /** Vectorized Adler-32 over {@code data[off..off+len)}. Bit-identical to {@link #scalar}. */
    public static int vector(byte[] data, int off, int len) {
        long a = 1, b = 0;
        int i = off;
        int end = off + len;
        while (i < end) {
            int n = Math.min(NMAX, end - i);
            long a0 = a;
            long s1 = 0, s2 = 0; // s2 = sum of (1-based position within segment) * byte
            int p = 0;
            int bound = BSP.loopBound(n);
            for (; p < bound; p += STRIDE) {
                ByteVector bv = ByteVector.fromArray(BSP, data, i + p);
                long[] sums = accumulateStride(bv);
                long strideSum = sums[0];
                long strideWeighted = sums[1];
                s1 += strideSum;
                s2 += (long) p * strideSum + strideWeighted;
            }
            for (; p < n; p++) {
                int v = data[i + p] & 0xFF;
                s1 += v;
                s2 += (long) (p + 1) * v;
            }
            long t = (n + 1L) * s1 - s2; // == sum (n-j+1) * b_j, always >= 0
            a = (a0 + s1) % MOD;
            b = ((b % MOD) + (n % MOD) * (a0 % MOD) % MOD + t % MOD) % MOD;
            i += n;
        }
        return (int) ((b << 16) | a);
    }

    // ------------------------------------------------------------------------------------------
    // Vectorized (jdk.incubator.vector) -- FFM MemorySegment source (e.g. a memory-mapped file).
    // ------------------------------------------------------------------------------------------

    /** Vectorized Adler-32 over {@code segment[off..off+len)}, reading vectors straight from FFM memory. */
    public static int vector(MemorySegment segment, long off, long len) {
        long a = 1, b = 0;
        long i = off;
        long end = off + len;
        while (i < end) {
            int n = (int) Math.min((long) NMAX, end - i);
            long a0 = a;
            long s1 = 0, s2 = 0;
            int p = 0;
            int bound = BSP.loopBound(n);
            for (; p < bound; p += STRIDE) {
                ByteVector bv = ByteVector.fromMemorySegment(BSP, segment, i + p, ByteOrder.nativeOrder());
                long[] sums = accumulateStride(bv);
                s1 += sums[0];
                s2 += (long) p * sums[0] + sums[1];
            }
            for (; p < n; p++) {
                int v = segment.get(ValueLayout.JAVA_BYTE, i + p) & 0xFF;
                s1 += v;
                s2 += (long) (p + 1) * v;
            }
            long t = (n + 1L) * s1 - s2;
            a = (a0 + s1) % MOD;
            b = ((b % MOD) + (n % MOD) * (a0 % MOD) % MOD + t % MOD) % MOD;
            i += n;
        }
        return (int) ((b << 16) | a);
    }

    /**
     * Widens one {@code STRIDE}-byte vector to unsigned int lanes and returns
     * {@code {plainSum, weightedSum}} where {@code weightedSum} weights each byte by its 1-based
     * position within the stride. Kept branch-free and allocation-light (a 2-element array the JIT
     * scalar-replaces).
     */
    private static long[] accumulateStride(ByteVector bv) {
        IntVector sum = IntVector.zero(ISP);
        IntVector weighted = IntVector.zero(ISP);
        for (int part = 0; part < PARTS; part++) {
            IntVector iv = ((IntVector) bv.convertShape(VectorOperators.B2I, ISP, part)).and(0xFF);
            sum = sum.add(iv);
            weighted = weighted.add(iv.mul(WEIGHTS[part]));
        }
        // strideSum <= STRIDE*255 and strideWeighted <= sum(1..STRIDE)*255 both fit in an int.
        return new long[] {
                sum.reduceLanes(VectorOperators.ADD) & 0xFFFFFFFFL,
                weighted.reduceLanes(VectorOperators.ADD) & 0xFFFFFFFFL
        };
    }

    /** Vector lane width actually selected at runtime (bytes per stride). Useful for diagnostics. */
    public static int strideBytes() {
        return STRIDE;
    }
}
