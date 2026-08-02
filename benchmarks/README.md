# benchmarks/

Committed JMH output, so every throughput figure quoted in the top-level [`README.md`](../README.md),
in [`web/src/data/facts.ts`](../web/src/data/facts.ts), and in the printed booklet can be traced to a
machine-readable run instead of a transcribed console session.

| File | What it is |
|---|---|
| `jmh-results.json` | **Quick run** — 1 fork, 3x1 s warmup, 4x1 s measurement. NOT what the top-level README's table quotes; that table is the rigorous run below. |
| `jmh-results-rigorous.json` | **Rigorous run** — 3 forks, 3x2 s warmup, 5x2 s measurement. Tighter error bars; use this one when the quick run's spread matters. |
| `ENVIRONMENT.md` | The machine, JDK, and measurement conditions. Read it before comparing against your own numbers. |

Both JSON files are raw JMH `-rf json` output: they carry their own `forks` / `warmupIterations` /
`measurementIterations` / `jdkVersion` / `vmVersion` fields plus every individual iteration's raw
value, so the parameters are self-describing and the error bars are recomputable.

## What was measured

Apple M1 Pro, 10 cores, 128-bit NEON, OpenJDK 25.0.3, JMH 1.37, throughput mode, `Score` in
bytes/second. Full detail in [`ENVIRONMENT.md`](ENVIRONMENT.md). Error is JMH's 99.9% CI.

| Benchmark | Quick (1 fork, 4x1 s) | Rigorous (3 forks, 5x2 s) |
|---|---:|---:|
| `Adler32.scalar` | 1.501 ± 0.166 GB/s | **1.518 ± 0.060 GB/s** |
| `Adler32.vector` | 4.378 ± 0.557 GB/s | **4.257 ± 0.293 GB/s** |
| `Adler32.jdkIntrinsic` | 13.81 ± 2.65 GB/s | **14.06 ± 0.39 GB/s** |
| `Compression.singleThreadedJdk` (level 6) | 66.00 ± 0.33 MB/s | **66.17 ± 0.49 MB/s** |
| `Compression.parallelVirtualThreads` (level 6) | 454.9 ± 22.2 MB/s | **422.0 ± 21.1 MB/s** |
| **`vector` / `scalar`** | 2.92x | **2.80x** |
| **`parallel` / `singleThreaded`** | 6.89x | **6.38x** |

The rigorous run is the one to quote. Note the two headline ratios move between runs even though
each run's own interval is narrow — the parallel ratio spans 6.38x-6.89x across these two runs,
which is a better sense of the real uncertainty than either error bar alone.

## Reproduce

Requires **JDK 25** — the project compiles at `release 25` and needs the incubating
`jdk.incubator.vector` module. See [`ENVIRONMENT.md`](ENVIRONMENT.md) for the exact build used and
for the `PATH`/`JAVA_HOME` gotcha.

```bash
# 0. Point at a JDK 25 (adjust the path to yours; a JDK 21 on PATH will not build this)
export JAVA_HOME=/opt/homebrew/opt/openjdk@25/libexec/openjdk.jdk/Contents/Home

# 1. Build the benchmark uber-jar (JMH lives behind the `bench` profile)
mvn -q -Pbench -DskipTests package

# 2. Quick run -> benchmarks/jmh-results.json   (~40 s)
"$JAVA_HOME/bin/java" --add-modules=jdk.incubator.vector -jar target/benchmarks.jar \
  -f 1 -wi 3 -i 4 -w 1 -r 1 \
  -rf json -rff benchmarks/jmh-results.json

# 3. Rigorous run -> benchmarks/jmh-results-rigorous.json   (~6 min)
"$JAVA_HOME/bin/java" --add-modules=jdk.incubator.vector -jar target/benchmarks.jar \
  -f 3 -wi 3 -i 5 -w 2 -r 2 \
  -rf json -rff benchmarks/jmh-results-rigorous.json

# One class only
"$JAVA_HOME/bin/java" --add-modules=jdk.incubator.vector -jar target/benchmarks.jar Adler32
```

Both commands run the whole suite: `Adler32Benchmark` (`scalar`, `vector`, `jdkIntrinsic`, 8 MiB
random buffer) and `CompressionBenchmark` (`singleThreadedJdk`, `parallelVirtualThreads`, 32 MiB
mixed corpus, DEFLATE level 6).

## Reading the numbers

Every benchmark sets `@OperationsPerInvocation` to its buffer size, so **JMH's `Score` is in
bytes/second** — divide by `1e9` for GB/s, `1e6` for MB/s. A one-liner:

```bash
python3 - <<'EOF'
import json
for b in json.load(open('benchmarks/jmh-results.json')):
    m = b['primaryMetric']
    print(f"{b['benchmark'].split('.')[-1]:<24} {m['score']/1e9:8.3f} GB/s  +/- {m['scoreError']/1e9:.3f}")
EOF
```

Two comparisons are the point, and only these two:

- **`vector` vs `scalar`** — both pure Java, only the Vector API differs. This is the honest SIMD
  result. `jdkIntrinsic` (`java.util.zip.Adler32`) is a hand-tuned native intrinsic included as a
  *reference point that is not beaten*, never as a baseline to divide by.
- **`parallelVirtualThreads` vs `singleThreadedJdk`** — same DEFLATE level, both emitting valid
  gzip; the only variable is single-threaded vs block-parallel.

Throughput is a property of the host. Numbers from a different chip, core count, or SIMD width are
not comparable to these — re-run rather than reuse.
