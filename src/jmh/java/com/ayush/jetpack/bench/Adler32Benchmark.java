package com.ayush.jetpack.bench;

import com.ayush.jetpack.vector.VectorizedAdler32;
import org.openjdk.jmh.annotations.Benchmark;
import org.openjdk.jmh.annotations.BenchmarkMode;
import org.openjdk.jmh.annotations.Fork;
import org.openjdk.jmh.annotations.Level;
import org.openjdk.jmh.annotations.Measurement;
import org.openjdk.jmh.annotations.Mode;
import org.openjdk.jmh.annotations.OperationsPerInvocation;
import org.openjdk.jmh.annotations.OutputTimeUnit;
import org.openjdk.jmh.annotations.Scope;
import org.openjdk.jmh.annotations.Setup;
import org.openjdk.jmh.annotations.State;
import org.openjdk.jmh.annotations.Warmup;

import java.util.Random;
import java.util.concurrent.TimeUnit;
import java.util.zip.Adler32;

/**
 * Throughput of the hand-vectorized Adler-32 vs the scalar reference vs the JDK's
 * {@link java.util.zip.Adler32}. Reported in bytes/second ({@code @OperationsPerInvocation} = buffer
 * size). The JDK row is a reference point, not the thing being beaten: {@link Adler32} is a native
 * intrinsic. The meaningful comparison is {@code vector} vs {@code scalar} -- both pure Java, one
 * using the Vector API.
 */
@State(Scope.Benchmark)
@BenchmarkMode(Mode.Throughput)
@OutputTimeUnit(TimeUnit.SECONDS)
@Fork(value = 1, jvmArgsAppend = {"--add-modules=jdk.incubator.vector"})
@Warmup(iterations = 3, time = 1)
@Measurement(iterations = 5, time = 1)
public class Adler32Benchmark {

    static final int BUFFER_BYTES = 8 * 1024 * 1024; // 8 MiB

    private byte[] data;

    @Setup(Level.Trial)
    public void setup() {
        data = new byte[BUFFER_BYTES];
        new Random(0xADE1E7L).nextBytes(data);
    }

    @Benchmark
    @OperationsPerInvocation(BUFFER_BYTES)
    public int scalar() {
        return VectorizedAdler32.scalar(data);
    }

    @Benchmark
    @OperationsPerInvocation(BUFFER_BYTES)
    public int vector() {
        return VectorizedAdler32.vector(data);
    }

    @Benchmark
    @OperationsPerInvocation(BUFFER_BYTES)
    public long jdkIntrinsic() {
        Adler32 a = new Adler32();
        a.update(data);
        return a.getValue();
    }
}
