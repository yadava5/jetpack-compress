# jetpack-compress

A high-throughput, **gzip-compatible** parallel compression engine written in modern Java
(JDK 25). It splits input into independent blocks, DEFLATE-compresses them concurrently on
**virtual threads**, and stitches the results into a single, standard gzip stream that any tool
decompresses — `gzip -d`, `zcat`, `java.util.zip.GZIPInputStream`. It exists to exercise, honestly
and correctly, the newest parts of the Java platform: the **Vector API**, the **Foreign Function &
Memory API**, and **virtual threads**.

> **Status:** compiles clean on JDK 25 and all **72 tests pass** (`Tests run: 72, Failures: 0,
> Errors: 0, Skipped: 0`), including external-tool round-trips against the system `gzip(1)`.
>
> **Landing:** a self-contained web landing in [`web/`](web/) *visualizes* the engine — the parallel
> pipeline, the scalar-vs-vector SIMD race, and the benchmark bars (every number matches the table
> below, error bars included). See [Web landing](#web-landing).

---

## Why it's interesting

- **It's real gzip, proven three ways.** Output is validated by round-tripping through
  `GZIPInputStream`, by shelling out to the external `gzip -t` / `gzip -dc`, and the SIMD checksum
  is cross-checked against Python's `zlib.adler32`. Correctness is the headline feature, not an
  afterthought.
- **Honest SIMD.** The Vector API powers a genuinely hand-vectorized Adler-32 that is **2.8x faster
  than the equivalent scalar Java** and bit-identical to `java.util.zip.Adler32`. The DEFLATE core
  is delegated to a correct implementation (zlib via `java.util.zip.Deflater`) — this README is
  explicit about exactly which parts are hand-written and which are delegated.
- **Modern I/O.** Large inputs are memory-mapped with the finalized FFM API and read straight into
  the compressor (and into the vectorized checksum) without copying the whole file onto the heap.

---

## JDK 25 features used

| Feature | Module / JEP | Where it lives | Hand-written or delegated |
|---|---|---|---|
| **Vector API (SIMD)** | `jdk.incubator.vector` (incubating) | `vector/VectorizedAdler32.java` | **Hand-written**, benchmarked vs scalar |
| **Foreign Function & Memory API** | `java.lang.foreign` (JEP 454, final) | `io/MappedInput.java`, `core/ParallelGzipCompressor.java` | **Hand-written** mmap + `MemorySegment` reads |
| **Virtual threads** | JEP 444 (final) | `core/ParallelGzipCompressor.java` | **Hand-written** block scheduler |
| **DEFLATE entropy coding** | `java.util.zip.Deflater` (zlib) | `core/ParallelGzipCompressor.java` | **Delegated** (correct, battle-tested) |
| **DEFLATE decoding** | `java.util.zip.GZIPInputStream` | `core/GzipDecompressor.java` | **Delegated** |
| Records, switch expressions, text blocks, `Executors.newVirtualThreadPerTaskExecutor()` | core language / library | throughout | — |

The `jdk.incubator.vector` module is *incubating*, so it must be added explicitly at every stage
(`--add-modules=jdk.incubator.vector`). The Maven build wires that flag into compile, test, `exec`,
and the JMH fork; you only pass it by hand when launching the CLI or benchmark jar directly.

---

## Quick start

Requires **JDK 25** and Maven.

```bash
# Compile
mvn -q compile

# Run the full test suite (round-trip + external gzip cross-tool + SIMD correctness)
mvn -q -DskipTests=false test

# Build the runnable jar
mvn -q -DskipTests package
```

### CLI

The CLI needs the incubator Vector module enabled:

```bash
JAR=target/jetpack-compress.jar
VEC=--add-modules=jdk.incubator.vector

# Compress (memory-maps the input via FFM; -l level 0-9, -b block size in bytes)
java $VEC -jar $JAR compress bigfile.bin bigfile.bin.gz -l 6 -b 1048576

# Decompress (delegates to GZIPInputStream)
java $VEC -jar $JAR decompress bigfile.bin.gz recovered.bin

# Vectorized Adler-32 read straight from a memory-mapped file (FFM + Vector API together)
java $VEC -jar $JAR adler bigfile.bin

# Environment / selected SIMD width
java $VEC -jar $JAR info
```

Because the output is standard gzip, this round-trips with system tools:

```bash
java $VEC -jar $JAR compress notes.txt notes.txt.gz
gzip -t notes.txt.gz        # integrity OK
gzip -dc notes.txt.gz | diff - notes.txt   # identical
```

---

## Architecture

```
                input bytes / mmap'd MemorySegment
                              │
              split into fixed-size blocks (default 1 MiB)
                              │
        ┌─────────────┬───────┴───────┬─────────────┐
        ▼             ▼               ▼             ▼        (virtual thread per block,
   Deflater(nowrap) …            …            Deflater       bounded in-flight window)
   + CRC32 of block                              (last)
        │             │               │             │
   SYNC_FLUSH     SYNC_FLUSH      SYNC_FLUSH     finish()  → BFINAL=1
        └─────────────┴───────┬───────┴─────────────┘
                              ▼
   [gzip header] [raw deflate block 0][…1][…2]…[final block] [CRC32 · ISIZE]
                              │
                    one valid single-member gzip stream
```

**Single-member stitching.** Every block except the last is flushed with `Deflater.SYNC_FLUSH`,
which byte-aligns its output and emits an empty stored block but leaves `BFINAL = 0`, so the blocks
concatenate into one DEFLATE stream. Only the last block is `finish()`ed (`BFINAL = 1`). Each block
uses a fresh deflater with no preset dictionary, so its back-references stay within the block — a
strict subset of what DEFLATE allows, hence always decodable (the standard pigz trade-off: a small
ratio cost near block boundaries in exchange for parallelism).

**Parallel CRC.** The gzip trailer needs the CRC-32 of the *whole* input. Each worker computes the
CRC-32 of its own block; the writer folds them in order with `Crc32Combine` (a GF(2) port of zlib's
`crc32_combine`), avoiding a second serial pass over the data.

**Bounded memory.** Blocks are scheduled on `Executors.newVirtualThreadPerTaskExecutor()` but the
writer only keeps a bounded window of compressed-but-unwritten blocks in flight, so peak memory is
independent of file size.

**A note on virtual threads and CPU-bound work.** Block compression is CPU-bound, so the *effective*
parallelism is bounded by the JVM's carrier-thread pool (≈ number of cores), not by the number of
virtual threads. Virtual threads still buy real throughput here (all cores stay busy) and give clean
per-block structured concurrency; they are not claimed to add parallelism beyond the core count.

---

## Implemented vs. delegated vs. planned

Being precise about this is the point.

### Implemented (hand-written in this repo)
- Parallel block framing: splitting, virtual-thread scheduling with a bounded in-flight window,
  `SYNC_FLUSH` stitching into a **single** gzip member, header/trailer encoding.
- `Crc32Combine` — GF(2) matrix `crc32_combine`, so the CRC is computed in parallel per block and
  folded, not re-scanned. Unit-tested against a serial CRC over the concatenation.
- `VectorizedAdler32` — a genuinely hand-vectorized Adler-32 using `jdk.incubator.vector`
  (byte→int lane widening, position-weighted reductions, `NMAX`-segmented modulo), with `byte[]`
  and FFM `MemorySegment` inputs. Bit-identical to `java.util.zip.Adler32`.
- `MappedInput` — FFM (`java.lang.foreign`) read-only memory mapping over a shared `Arena`.
- CLI and JMH harness.

### Delegated (correctly, on purpose)
- **The DEFLATE encoder itself** — LZ77 + Huffman entropy coding is done by
  `java.util.zip.Deflater` (zlib). This project parallelizes and frames DEFLATE; it does not
  re-implement it.
- **Decompression** — `java.util.zip.GZIPInputStream`. Delegating is the strongest proof the output
  is standard gzip, and it transparently handles concatenated members too.

### Planned / not done (aspirational — not in this build)
- A **from-scratch DEFLATE encoder** (own LZ77 match finder + Huffman coder). This is the big one;
  today the entropy coding is delegated.
- An **entropy-driven per-block heuristic** (use a fast vectorized histogram/entropy estimate to
  pick compression level or to store incompressible blocks). The Adler-32 machinery shows the SIMD
  approach; the level-selection policy itself is not wired in.
- **GraalVM `native-image`.** Not built or benchmarked here. It would need a reflection/FFM config
  and the Vector API's runtime behaviour under native-image verified; treat it as a documented
  future step, not a claim.
- Preset-dictionary carry-over between adjacent blocks to recover the boundary ratio loss.

---

## Benchmarks

Numbers below are **real, measured on this machine**, not estimates:

- Apple Silicon (arm64), 10 cores, **128-bit SIMD (16-byte stride, NEON)**
- OpenJDK **25.0.3** (Homebrew)
- JMH 1.37, throughput mode, `@OperationsPerInvocation` = buffer size, so **Score is bytes/second**

> ⚠️ These come from a **reduced quick run** (1 fork, 3 warmup + 4 measurement iterations of 1 s).
> They are indicative. The parallel-compression figure in particular has wide error bars on a quick
> run; re-run with the full harness for rigorous numbers. On a 128-bit-SIMD machine the Vector API
> gain is modest by design — expect larger vectorized-Adler wins on AVX2/AVX-512 (32/64-byte stride).

| Benchmark | Score | ≈ Throughput | Takeaway |
|---|---:|---:|---|
| `Adler32.scalar` (pure Java) | 1.54e9 B/s | **1.54 GB/s** | scalar baseline |
| `Adler32.vector` (Vector API) | 4.34e9 B/s | **4.34 GB/s** | **2.8x over scalar** — the honest SIMD result |
| `Adler32.jdkIntrinsic` (`java.util.zip.Adler32`) | 1.41e10 B/s | 14.1 GB/s | native intrinsic reference point (not beaten) |
| `Compression.singleThreadedJdk` (level 6) | 6.68e7 B/s | **66.8 MB/s** | single-thread `GZIPOutputStream` |
| `Compression.parallelVirtualThreads` (level 6) | 4.35e8 B/s | **434.6 MB/s** | **~6.5x over single-thread** (10 cores; ±50% on quick run) |

**Interpretation, honestly:** the meaningful SIMD comparison is *vector vs scalar Java* (2.8x) —
both are pure Java and only the Vector API differs. The JDK's `Adler32` is a hand-tuned native
intrinsic and is expected to be faster than a Vector-API port; it is shown as a reference, not as a
target that was beaten. The parallel compressor scales roughly with cores over single-threaded
`java.util.zip`, which is the whole point of the block/virtual-thread design.

### Reproduce

```bash
# Build the benchmark uber-jar (JMH lives behind the `bench` profile; the default build never touches it)
mvn -q -Pbench -DskipTests package

# Quick run (what the table above used)
java --add-modules=jdk.incubator.vector -jar target/benchmarks.jar -f 1 -wi 3 -i 4 -w 1 -r 1

# Rigorous run (slower, tight error bars)
java --add-modules=jdk.incubator.vector -jar target/benchmarks.jar

# Just one benchmark class
java --add-modules=jdk.incubator.vector -jar target/benchmarks.jar Adler32
```

---

## Correctness / testing

`mvn test` runs 72 tests:

- **`RoundTripTest`** — `decompress(compress(x)) == x` across empty / 1-byte / boundary-length /
  all-zeros / repeated / random-incompressible / all-256-byte-values / 5 MB mixed inputs, times five
  compression levels, times five block sizes (including 16-byte blocks that force many parallel
  blocks). Each output is verified both by our decompressor and by a plain `GZIPInputStream`.
- **`CrossToolTest`** — shells out to the real `gzip(1)`: our output must pass `gzip -t` and
  `gzip -dc` byte-for-byte, and we must decode what system `gzip -9` produced. Self-skips if `gzip`
  is not on `PATH` (it was present and these ran in the reported result).
- **`Adler32Test`** — the Vector API checksum is bit-identical to `java.util.zip.Adler32` across the
  Wikipedia known-answer vector, size sweeps around the SIMD stride and `NMAX` boundaries, constant
  bytes, offset/length slices, the FFM `MemorySegment` path, and 500 randomized fuzz trials.
- **`Crc32CombineTest`** — folded per-block CRCs equal a serial CRC over the concatenation.
- **`MappedInputTest`** — FFM mmap reads back exactly what's on disk, including the empty file.

---

## Project layout

```
jetpack-compress/
├── pom.xml                     # release 25; incubator-vector flags for compile/test/exec/JMH; `bench` profile
├── README.md
├── src/
    ├── main/java/com/ayush/jetpack/
    │   ├── core/
    │   │   ├── ParallelGzipCompressor.java   # virtual-thread block compressor → single gzip member
    │   │   ├── GzipDecompressor.java         # delegates to GZIPInputStream
    │   │   └── Crc32Combine.java             # GF(2) crc32_combine
    │   ├── vector/
    │   │   └── VectorizedAdler32.java        # hand-vectorized Adler-32 (jdk.incubator.vector)
    │   ├── io/
    │   │   └── MappedInput.java              # FFM memory-mapped input (java.lang.foreign)
    │   └── cli/
    │       └── Main.java                     # compress / decompress / adler / info
    ├── test/java/com/ayush/jetpack/          # 72 tests (JUnit 5)
    └── jmh/java/com/ayush/jetpack/bench/     # JMH harness (built only under -Pbench)
└── web/                                      # Vite + React 19 + TS landing (self-contained SPA)
    ├── src/components/                       # hero + 3 animated visuals (pipeline, SIMD race, bars)
    ├── src/data/facts.ts                     # single source of truth; every number verified here
    └── vercel.json                          # Vercel config (project root = web/)
```

---

## Web landing

A self-contained single-page landing lives in [`web/`](web/), built with **Vite + React 19 +
TypeScript** (Tailwind for layout). It is evidence-forward: it *visualizes* the engine rather than
describing it, and every number on the page is read from one module (`web/src/data/facts.ts`) that
mirrors this README — the 2.8× SIMD result, the ~6.5× parallel result (±50% on the quick run), the 72
tests, and the honest "DEFLATE is delegated to zlib" scope are all stated plainly.

Three real, animated visuals:

1. **Parallel pipeline** — one input stream splitting into 1 MiB blocks, fanning out to
   virtual-thread workers, and stitching (`SYNC_FLUSH`) back into a single gzip member.
2. **SIMD lanes** — scalar (1 byte/step) vs vectorized Adler-32 (16-byte NEON stride) racing, landing
   on the measured **2.8×** (not 16×, and not against the JDK intrinsic).
3. **Benchmark bars** — the 2.8× and ~6.5× figures, each scoped to what it measures, with the JDK
   intrinsic shown as a "not beaten" reference and a ±50% error whisker on the quick-run parallel number.

```bash
cd web
npm install
npm run dev       # local dev server
npm run build     # production build -> web/dist  (must pass; `npm run typecheck` too)
```

The deploy target is **Vercel with the project root set to `web/`** (`web/vercel.json` is committed).

---

## License

Personal portfolio project. No warranty. The DEFLATE codec is `java.util.zip` (zlib); the
`crc32_combine` logic follows zlib's algorithm.
