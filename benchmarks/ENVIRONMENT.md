# Benchmark environment

The machine the committed JMH results in this directory were measured on. The README's numbers
carry a `±5.0%` style caveat precisely because throughput is a property of *this* box, not of the
code alone — so treat everything below as part of the result, not as trivia.

Recorded: 2026-07-27.

## Hardware

| | |
|---|---|
| Model | Apple MacBook Pro (`MacBookPro18,3`) |
| Chip | Apple M1 Pro (arm64) |
| Cores | 10 logical / 10 physical — **8 Performance + 2 Efficiency** |
| SIMD | 128-bit NEON — `ByteVector.SPECIES_PREFERRED` = `S_128_BIT`, **16-byte stride**, `IntVector.SPECIES_PREFERRED` = 4 lanes |
| Memory | 16 GiB |
| Page size | 16 KiB |

The vector width was read back from the JVM, not assumed:

```
$ java --add-modules=jdk.incubator.vector ...
ByteVector.SPECIES_PREFERRED shape=S_128_BIT bits=128 byteStride=16
IntVector.SPECIES_PREFERRED  shape=S_128_BIT bits=128 intLanes=4
availableProcessors=10
```

128 bits is why the Vector-API Adler-32 win is 2.8-2.9x and not larger: each stride consumes 16
bytes. On AVX2 (32-byte) or AVX-512 (64-byte) hosts, expect a different — likely larger —
`vector` / `scalar` ratio. **Do not port this repo's SIMD ratio to another architecture.**

The 10-core count is likewise the ceiling on the parallel-compression figure: `ParallelGzipCompressor`
defaults to `availableProcessors() * 2` in-flight blocks over `Executors.newVirtualThreadPerTaskExecutor()`,
so the 6.4-6.9x measured speedup over single-threaded `GZIPOutputStream` is bounded by 10 cores (and
by the 2 of those being efficiency cores).

## Software

| | |
|---|---|
| OS | macOS 26.5.1 (build `25F80`), arm64 |
| JDK | **OpenJDK 25.0.3** (Homebrew), released 2026-04-21 |
| JVM | OpenJDK 64-Bit Server VM 25.0.3, mixed mode, sharing |
| `JAVA_HOME` | `/opt/homebrew/Cellar/openjdk@25/25.0.3/libexec/openjdk.jdk/Contents/Home` |
| Maven | Apache Maven 3.9.16 |
| JMH | 1.37 (`jmh-core` + `jmh-generator-annprocess`, `bench` profile) |
| Required flag | `--add-modules=jdk.incubator.vector` (incubating module, needed at compile **and** run time) |

> **Gotcha that will bite a re-run:** the `java` first on this machine's `PATH` is Temurin **21**,
> which cannot build (`release 25`) or run this project. Export `JAVA_HOME` to the JDK 25 above and
> invoke `$JAVA_HOME/bin/java` explicitly. `mvn -version` reporting a *different* JDK than
> `java -version` is normal here and is not a signal that the build used the right one.

## Measurement conditions — stated honestly

These runs were **not** taken under laboratory conditions:

- Ordinary laptop session; other user processes were resident (no single-user / minimal-boot mode).
- No CPU pinning, no `taskset`/QoS class forcing, no disabling of turbo, DVFS, or thermal management.
  macOS is free to migrate threads between Performance and Efficiency cores mid-iteration.
- No fixed heap sizing; JMH forks inherit default JVM ergonomics.
- JMH itself flags that Compiler Blackholes are in experimental use on this JVM.

Consequence: the committed error bars are real and worth reading. On the quick run the 99.9% CI
reaches ±19.2% (`jdkIntrinsic`), ±12.7% (`vector`) and ±11.0% (`scalar`); the rigorous run pulls
those to ±2.8%, ±6.9% and ±4.0%. The compression benchmarks are far steadier (±0.5-0.7% on
`singleThreadedJdk`, ±5.0% on `parallelVirtualThreads` in *both* runs) — but note that the
*parallel/single ratio* still moved 6.89x → 6.38x between the two runs, so run-to-run spread on
that ratio (~8%) is wider than either run's own interval suggests. Prefer the rigorous file, and
re-run rather than trusting a single fork.
