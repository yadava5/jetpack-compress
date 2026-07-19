/**
 * jetpack-compress System Card — copy + verified data (self-contained).
 *
 * Every number here is verified against the jetpack-compress repo (branch
 * main) and carries a `source · file:line` rail where it is a measured or
 * enforced fact. Nothing is invented. The provenance of each figure:
 *
 *   · Test counts (72 total; 21/35/11/3/2 by suite) — target/surefire-reports
 *     "Tests run: N, Failures: 0, Errors: 0, Skipped: 0" per suite.
 *   · Throughput (1.54 / 4.34 / 14.1 GB/s; 66.8 / 434.6 MB/s; 2.8× / ~6.5×) —
 *     the README "Benchmarks" table (a reduced quick JMH run; the parallel
 *     figure carries a ±50% error bar, stated wherever it appears).
 *   · Constants (1 MiB block, NMAX 5552, MOD 65521, POLY 0xEDB88320, JDK 25,
 *     JUnit 5.11.4, JMH 1.37) — read straight from the source / pom.xml.
 *
 * Two honesty calls, stated plainly wherever they matter:
 *   · The DEFLATE entropy coder is DELEGATED to java.util.zip.Deflater (zlib);
 *     this project frames and parallelizes DEFLATE, it does not re-implement it.
 *   · The one illustrative CLI transcript (build-closing) uses the REAL output
 *     format (Main.java:101–103, :143) with example byte values — labeled as
 *     such, because the Java engine was not built for this booklet.
 */

// ---------------------------------------------------------------------------
// Brand / masthead
// ---------------------------------------------------------------------------

export const BRAND = {
  name: "jetpack-compress",
  subtitle: "Parallel gzip on virtual threads — byte-for-byte real gzip.",
  author: "Ayush Yadav",
  year: "2026",
  liveUrl: "jetpack-compress.vercel.app",
  qrTarget: "https://jetpack-compress.vercel.app",
  repo: "github.com/yadava5/jetpack-compress",
} as const;

export const MASTHEAD = {
  volume: "Vol. 01 · System Card",
  kicker:
    "A parallel, gzip-compatible compression engine on JDK 25 — the block scheduler, the hand-vectorized SIMD stage, and a scope that is honest about what is hand-written and what is zlib.",
  colophonLines: [
    "© 2026 · Ayush Yadav",
    "Parallel gzip engine · JDK 25",
    "Output is standard gzip · personal project, no warranty",
  ],
} as const;

// ---------------------------------------------------------------------------
// Welcome / endpaper — ≤ 80 words.
// ---------------------------------------------------------------------------

export const ABSTRACT = {
  greeting: "Welcome.",
  body:
    "Single-threaded gzip leaves a modern many-core CPU mostly idle. jetpack-compress splits the input into blocks, DEFLATE-compresses them concurrently on virtual threads, and stitches the pieces into one byte-valid gzip member any tool can read. The novelty is the parallel framing and a hand-vectorized Adler-32 — not a new codec: DEFLATE entropy coding is delegated to zlib on purpose. It ships with 72 green tests and cross-tool gzip validation.",
} as const;

// ---------------------------------------------------------------------------
// Chapter TOC — page ranges track manifest.ts.
// ---------------------------------------------------------------------------

export const CHAPTERS = [
  { num: "01", name: "WHY", pages: "04 – 07", sectionKey: "01_WHY" as const },
  { num: "02", name: "HOW", pages: "08 – 12", sectionKey: "02_HOW" as const },
  { num: "03", name: "INSIDE", pages: "13 – 16", sectionKey: "03_INSIDE" as const },
  { num: "04", name: "PROOF", pages: "17 – 20", sectionKey: "04_PROOF" as const },
  { num: "05", name: "BUILD", pages: "21 – 23", sectionKey: "05_BUILD" as const },
] as const;

// TOC editorial bands ----------------------------------------------------------

export const TOC = {
  chapterTaglines: {
    WHY: "the cores are sitting idle",
    HOW: "split · fan out · stitch one member",
    INSIDE: "SIMD, mmap, and honest scope",
    PROOF: "2.8× · ~6.5× · 72 green",
    BUILD: "JDK 25 · Maven · CLI + JMH",
  } as Record<string, string>,
  chapterGlyphs: {
    WHY: "▟",
    HOW: "⋔",
    INSIDE: "▤",
    PROOF: "✓",
    BUILD: "⌗",
  } as Record<string, string>,
  audience: [
    { key: "Systems / JVM", val: "the block scheduler, SYNC_FLUSH stitching, the CRC fold." },
    { key: "Perf / SIMD", val: "the Vector API Adler-32 and the honest 2.8× — pp. 17–20." },
    { key: "Reviewers", val: "start at §01, finish at a CLI you can run yourself." },
  ],
  readingPaths: [
    { key: "Skim · 5 min", val: "the cover, the fan-out, the two bench pages." },
    { key: "Deep · 20 min", val: "cover to cover — built for one sitting." },
    { key: "Diagrams only", val: "the fan-out (p.09), the byte-map (p.10), the lanes (p.14)." },
  ],
  atAGlance: [
    { key: "2.8×", val: "hand-vectorized Adler-32 over scalar Java." },
    { key: "~6.5×", val: "parallel over single-thread gzip (±50%, quick run)." },
    { key: "72 green", val: "incl. real gzip -t / gzip -dc cross-tool." },
  ],
  glossary: [
    { term: "DEFLATE", def: "LZ77 + Huffman — the codec inside gzip." },
    { term: "SYNC_FLUSH", def: "byte-align a block; BFINAL stays 0." },
    { term: "Adler-32", def: "rolling checksum; here, hand-vectorized." },
    { term: "Vector API", def: "portable JDK SIMD (jdk.incubator.vector)." },
    { term: "FFM", def: "Foreign Function & Memory — mmap, no copy." },
    { term: "vthread", def: "cheap JDK thread; one per block." },
  ],
  colophon: [
    "© 2026 · Ayush Yadav",
    "jetpack-compress · System Card Vol. 01",
    "Output is standard gzip · no warranty",
  ],
  teaser:
    "A printed walkthrough of a parallel compressor — the why, the framing, the SIMD, the receipts. Read it with the repo open.",
} as const;

// ---------------------------------------------------------------------------
// The JDK 25 feature ledger — reused across INSIDE / BUILD. `kind` drives the
// hand-written (amber) vs delegated (steel) color language.
// ---------------------------------------------------------------------------

export const FEATURES = [
  {
    id: "vector",
    label: "Vector API (SIMD)",
    module: "jdk.incubator.vector · incubating",
    where: "vector/VectorizedAdler32.java",
    kind: "hand-written" as const,
    blurb:
      "Adler-32 hand-vectorized: byte→int lane widening, position-weighted S1/S2 reductions, NMAX-segmented modulo. Bit-identical to java.util.zip.Adler32.",
  },
  {
    id: "ffm",
    label: "Foreign Function & Memory",
    module: "java.lang.foreign · JEP 454 (final)",
    where: "io/MappedInput.java",
    kind: "hand-written" as const,
    blurb:
      "Read-only memory-mapped input over a shared Arena. Gigabyte files are read as a MemorySegment — never copied whole onto the Java heap.",
  },
  {
    id: "vthreads",
    label: "Virtual threads",
    module: "JEP 444 (final)",
    where: "core/ParallelGzipCompressor.java",
    kind: "hand-written" as const,
    blurb:
      "One virtual thread per block via Executors.newVirtualThreadPerTaskExecutor(), behind a bounded in-flight window so peak memory stays independent of file size.",
  },
  {
    id: "deflate",
    label: "DEFLATE entropy coding",
    module: "java.util.zip.Deflater (zlib)",
    where: "core/ParallelGzipCompressor.java",
    kind: "delegated" as const,
    blurb:
      "LZ77 + Huffman coding is delegated to zlib — a correct, battle-tested encoder. This project parallelizes and frames DEFLATE; it does not re-implement it.",
  },
  {
    id: "decode",
    label: "DEFLATE decoding",
    module: "java.util.zip.GZIPInputStream",
    where: "core/GzipDecompressor.java",
    kind: "delegated" as const,
    blurb:
      "Decompression is delegated on purpose — the strongest proof the output is standard gzip, and it handles concatenated members transparently.",
  },
] as const;

// ---------------------------------------------------------------------------
// Section 01 — WHY
// ---------------------------------------------------------------------------

export const WHY = {
  divider: { subtitle: "a many-core CPU, and gzip using one lane of it" },

  idle: {
    eyebrow: "§01 · THE IDLE MACHINE",
    headline: "gzip uses one core. The rest sit idle.",
    pullQuote:
      "A 10-core laptop runs gzip on a single thread. Nine cores watch.",
    body: [
      "Classic gzip — java.util.zip.GZIPOutputStream, the gzip(1) binary — is a single-threaded pipeline. It reads, LZ77-matches, and Huffman-codes one byte-stream at a time, on one core. On the 10-core machine these benchmarks ran on, that is roughly a tenth of the silicon doing work and the rest parked.",
      "The codec is not the bottleneck; the schedule is. DEFLATE has no data dependency that forces the whole file through one thread — only the habit of streaming it that way. Split the file, and the same encoder can run on every core at once.",
    ],
    coda:
      "The throughput you are missing is not a faster codec. It is the cores you already paid for.",
    stats: [
      { value: "1 / 10", label: "cores busy · single-thread gzip" },
      { value: "66.8", label: "MB/s · single-thread ceiling", unit: "MB/s" },
    ],
    source:
      "source · bench/CompressionBenchmark.java:87 (singleThreadedJdk) · README 'Benchmarks'",
  },

  floor: {
    eyebrow: "§01 · THROUGHPUT ON THE FLOOR",
    headline: "66.8 MB/s, on a machine that could do far more.",
    lede:
      "Single-threaded java.util.zip tops out at 66.8 MB/s on a 32 MiB mixed corpus at level 6. That is the floor this project measures against — and the number a block scheduler is built to beat.",
    body:
      "Throughput left on the floor is the whole opportunity: the same DEFLATE level, the same output format, the same correctness — just scheduled across the cores instead of one. §04 measures what that recovers — about 434.6 MB/s, roughly 6.5× on a quick run. This chapter is only the gap.",
    floorValue: "66.8",
    floorLabel: "MB/s · single-thread java.util.zip · level 6 · 32 MiB corpus",
    recoveredValue: "434.6",
    recoveredLabel: "MB/s · block-parallel (measured §04 · ±50% quick run)",
    source:
      "source · bench/CompressionBenchmark.java:40–95 · README 'Benchmarks'",
  },

  scope: {
    eyebrow: "§01 · AN HONEST SCOPE",
    headline: "This parallelizes gzip. It does not reinvent it.",
    thesis:
      "The novelty is the parallel framing and a hand-vectorized SIMD stage — not a new codec.",
    body: [
      "Being precise about this is the point. The DEFLATE entropy coder — LZ77 match-finding plus Huffman coding — is delegated to java.util.zip.Deflater (zlib), a correct, battle-tested implementation. This project does not re-implement it, and does not claim to.",
      "What is hand-written is the parallel framing around that encoder: block splitting, a virtual-thread scheduler with a bounded in-flight window, the SYNC_FLUSH stitching into a single gzip member, a GF(2) parallel CRC, and a genuinely hand-vectorized Adler-32. A from-scratch DEFLATE encoder is named, explicitly, as future work.",
    ],
    handWritten: [
      "Parallel block framing + virtual-thread scheduler",
      "SYNC_FLUSH single-member stitching",
      "GF(2) crc32_combine parallel CRC",
      "Hand-vectorized Adler-32 (Vector API)",
      "FFM memory-mapped input",
    ],
    delegated: [
      "DEFLATE entropy coding → java.util.zip.Deflater (zlib)",
      "Decompression → java.util.zip.GZIPInputStream",
    ],
    planned: [
      "From-scratch DEFLATE encoder (LZ77 + Huffman)",
      "Entropy-driven per-block level heuristic",
      "GraalVM native-image; preset-dictionary carry-over",
    ],
    source:
      "source · core/ParallelGzipCompressor.java:44–49 · README 'Implemented vs. delegated vs. planned'",
  },
} as const;

// ---------------------------------------------------------------------------
// Section 02 — HOW
// ---------------------------------------------------------------------------

export const HOW = {
  divider: { subtitle: "split into blocks · fan out on virtual threads · stitch one member" },

  blocks: {
    eyebrow: "§02 · SPLIT & FAN OUT",
    headline: "One file, many blocks, one thread each.",
    lede:
      "The input — a byte array or an FFM memory-mapped segment — is cut into fixed-size blocks (1 MiB by default). Each block is submitted to its own virtual thread; a bounded in-flight window keeps only so many compressed-but-unwritten blocks alive at once, so peak memory does not track file size.",
    body:
      "Blocks run on Executors.newVirtualThreadPerTaskExecutor(). The writer drains completed blocks in submission order from a bounded deque — default max-in-flight is 2× the core count — writing each block and folding its CRC as it goes.",
    stats: [
      { value: "1 MiB", label: "default block size" },
      { value: "2× cores", label: "max blocks in flight" },
      { value: "1 : block", label: "virtual thread per block" },
    ],
    source:
      "source · core/ParallelGzipCompressor.java:143–176 (split + window) · :150 (vthread executor) · :54 (1 MiB)",
  },

  stitch: {
    eyebrow: "§02 · SINGLE-MEMBER STITCHING",
    headline: "Independent blocks, one valid stream.",
    lede:
      "The trick that makes concatenated blocks a legal gzip: every block but the last is flushed with Deflater.SYNC_FLUSH — byte-aligned, an empty stored block, but BFINAL = 0. Only the last block is finish()ed, setting BFINAL = 1. The decoder walks block after block until it hits the final one.",
    body:
      "Each block uses a fresh Deflater with no preset dictionary, so its LZ77 back-references stay inside the block — a strict subset of what DEFLATE allows, hence always decodable. The cost is a small ratio hit near block boundaries: the standard pigz trade-off, taken deliberately in exchange for parallelism.",
    source:
      "source · core/ParallelGzipCompressor.java:178–210 (SYNC_FLUSH vs finish) · :56–63 (header) · :212–217 (trailer)",
  },

  crc: {
    eyebrow: "§02 · THE CRC, FOLDED",
    headline: "Parallel CRC, no second pass.",
    lede:
      "The gzip trailer needs the CRC-32 of the whole input. Re-scanning the file serially would throw away the parallelism, so each worker computes the CRC-32 of its own block and the writer folds them together in order.",
    body:
      "Crc32Combine is a direct port of zlib's crc32_combine: it treats CRC-32 as a linear operator over GF(2), so appending a block's bytes is a fixed 32×32 bit-matrix multiply, built by repeatedly squaring the 'append one zero bit' operator. Same reflected polynomial (0xEDB88320) as java.util.zip.CRC32 — so the folded result is bit-identical to a serial CRC over the concatenation, and a unit test asserts exactly that.",
    stats: [
      { value: "0xEDB88320", label: "reflected CRC-32 polynomial" },
      { value: "GF(2)", label: "32×32 bit-matrix combine" },
      { value: "11 / 11", label: "Crc32CombineTest · green" },
    ],
    source:
      "source · core/Crc32Combine.java:19–101 (:22 = 0xEDB88320) · core/ParallelGzipCompressor.java:163,170 (fold)",
  },

  vthreads: {
    eyebrow: "§02 · VIRTUAL THREADS, HONESTLY",
    headline: "Cheap threads. Not free cores.",
    lede:
      "Block compression is CPU-bound, so the effective parallelism is bounded by the JVM's carrier-thread pool — roughly the core count — not by how many virtual threads you spawn.",
    body: [
      "This is stated plainly because it is easy to oversell. Virtual threads do not manufacture parallelism beyond the cores present. What they buy here is real: every core stays busy, and each block gets clean, structured per-task concurrency — submit, await, fold — with no hand-tuned thread pool.",
      "The measured ~6.5× on 10 cores is consistent with exactly that: throughput scales roughly with cores over single-threaded java.util.zip, which is what the block-per-vthread design is for.",
    ],
    pullQuote:
      "Virtual threads are the scheduler, not the speedup. The cores are the speedup.",
    source:
      "source · core/ParallelGzipCompressor.java:128–135 (JavaDoc) · :150 · README 'A note on virtual threads and CPU-bound work'",
  },
} as const;

// ---------------------------------------------------------------------------
// Section 03 — INSIDE
// ---------------------------------------------------------------------------

export const INSIDE = {
  divider: { subtitle: "the hand-vectorized checksum, memory-mapped I/O, and what's delegated" },

  simd: {
    eyebrow: "§03 · HAND-VECTORIZED ADLER-32",
    headline: "Adler-32, one SIMD stride at a time.",
    lede:
      "Adler-32's serial form has a loop-carried dependency — each running sum A feeds the next B — which blocks naive vectorization. The classic fix, used here, splits each NMAX-capped segment into two order-free reductions: S1 = Σ bytes and S2 = Σ position × byte, then reconstructs A and B exactly.",
    body:
      "Both S1 and S2 vectorize: each stride loads a ByteVector (16 bytes on this machine's 128-bit NEON), widens it to int lanes with a B2I convert, and accumulates the plain and position-weighted sums. Segments cap at NMAX = 5552 bytes (the zlib constant) so the accumulators never overflow before the modulo. The result is bit-identical to java.util.zip.Adler32 — a 35-test suite pins it.",
    stats: [
      { value: "16 B", label: "SIMD stride · 128-bit NEON" },
      { value: "5552", label: "NMAX segment · zlib constant" },
      { value: "65521", label: "MOD · largest prime < 2¹⁶" },
    ],
    honestNote:
      "It is used honestly as a fast content fingerprint (the CLI adler command) — not as the gzip trailer checksum, which is CRC-32 per the spec.",
    source:
      "source · vector/VectorizedAdler32.java:112 (vector byte[]) · :183 (B2I widening) · :47 (NMAX) · :46 (MOD)",
  },

  ffm: {
    eyebrow: "§03 · MEMORY-MAPPED, NEVER COPIED",
    headline: "Read the file where it lies.",
    lede:
      "Large inputs are memory-mapped with the finalized Foreign Function & Memory API (java.lang.foreign, JEP 454). FileChannel.map returns a MemorySegment whose lifetime is bound to a shared Arena — so many virtual-thread block workers read slices of the same mapping concurrently, and gigabyte files never land on the Java heap.",
    body:
      "The two newest APIs meet in one command: jetpack adler <file> memory-maps the input with FFM and runs the vectorized Adler-32 straight over the MemorySegment — SIMD reading vectors directly from mapped memory, no intermediate copy. Zero-length files are handled specially, since a length-0 mmap is not portable.",
    facts: [
      { k: "API", v: "java.lang.foreign · JEP 454 (final)" },
      { k: "MAPPING", v: "FileChannel.map · READ_ONLY" },
      { k: "SHARING", v: "Arena.ofShared() · concurrent slice reads" },
      { k: "EMPTY FILE", v: "length-0 segment · mmap(0) not portable" },
    ],
    source:
      "source · io/MappedInput.java:37–49 (open + shared Arena) · cli/Main.java:141–144 (adler over mmap)",
  },

  delegated: {
    eyebrow: "§03 · HAND-WRITTEN vs zlib",
    headline: "Exactly which parts are mine.",
    lede:
      "The honest table. Three JDK 25 platform features are exercised by hand; the DEFLATE codec is delegated to zlib on purpose.",
    plainStatement:
      "Stated plainly: this project contains no from-scratch DEFLATE encoder. LZ77 + Huffman coding runs through java.util.zip.Deflater (zlib), and decompression through GZIPInputStream. Delegating the codec is also the strongest proof the output is standard gzip. A hand-written encoder is future work, not a hidden claim.",
    source:
      "source · README 'JDK 25 features used' · core/ParallelGzipCompressor.java:44–49 · core/GzipDecompressor.java:10–19",
  },
} as const;

// ---------------------------------------------------------------------------
// Section 04 — PROOF
// ---------------------------------------------------------------------------

/** Benchmark environment — stated with every number so the reader can judge it. */
export const BENCH_META = {
  machine: "Apple Silicon (arm64) · 10 cores · 128-bit NEON, 16-byte stride",
  jvm: "OpenJDK 25.0.3 (Homebrew)",
  harness: "JMH 1.37 · throughput mode · Score = bytes/second",
  quickRun: "reduced quick run · 1 fork · 3 warmup + 4 measurement iters × 1 s",
} as const;

export const PROOF = {
  divider: { subtitle: "2.8× measured · ~6.5× on a quick run · 72 green · byte-valid gzip" },

  simd: {
    eyebrow: "§04 · SIMD, MEASURED",
    headline: "2.8× — vector over scalar.",
    hero: "2.8×",
    heroLabel: "hand-vectorized Adler-32 over scalar Java",
    bars: [
      { id: "scalar", label: "Adler32.scalar", note: "pure-Java baseline", gbps: 1.54, mult: "1.0×", role: "baseline" as const },
      { id: "vector", label: "Adler32.vector", note: "Vector API · the honest SIMD result", gbps: 4.34, mult: "2.8×", role: "hero" as const },
      { id: "intrinsic", label: "Adler32.jdkIntrinsic", note: "native intrinsic · reference, not beaten", gbps: 14.1, mult: "9.2×", role: "reference" as const },
    ],
    body:
      "The meaningful comparison is vector vs scalar — both pure Java, only the Vector API differs: 1.54 → 4.34 GB/s, a 2.8× gain. The JDK's own Adler32 is a hand-tuned native intrinsic at 14.1 GB/s; it is shown as a reference point, not a target that was beaten. On this 128-bit-SIMD (NEON) machine the Vector-API gain is modest by design — expect larger wins on AVX2 / AVX-512.",
    buffer: "8 MiB random buffer",
    source:
      "source · bench/Adler32Benchmark.java:34–64 (:36 = 8 MiB buffer) · README 'Benchmarks'",
  },

  parallel: {
    eyebrow: "§04 · PARALLEL, MEASURED",
    headline: "~6.5× — with the error bar to prove I mean it.",
    hero: "~6.5×",
    heroLabel: "parallel over single-thread java.util.zip · ±50% on the quick run",
    bars: [
      { id: "single", label: "singleThreadedJdk", note: "GZIPOutputStream · level 6", mbps: 66.8, mult: "1.0×", role: "baseline" as const },
      { id: "parallel", label: "parallelVirtualThreads", note: "block-parallel · level 6 · 10 cores", mbps: 434.6, mult: "~6.5×", role: "hero" as const, errorPct: 50 },
    ],
    body:
      "Block-parallel virtual threads vs single-threaded GZIPOutputStream — same DEFLATE level 6, same 32 MiB mixed corpus (text runs plus incompressible noise): 66.8 → 434.6 MB/s, about 6.5× on 10 cores. The honest asterisk: this is a reduced quick run (1 fork, 3 warmup + 4 measurement iterations of 1 s), and the parallel figure in particular carries wide error bars — roughly ±50%. Re-run the full harness for tight numbers.",
    errorNote: "±50% · quick-run error bar",
    corpus: "32 MiB mixed corpus",
    source:
      "source · bench/CompressionBenchmark.java:34–95 (:42 = 32 MiB, :44 = level 6) · README 'Benchmarks'",
  },

  tests: {
    eyebrow: "§04 · THE RECEIPTS",
    headline: "72 tests, and it's real gzip.",
    body:
      "Correctness is the headline feature, not an afterthought. mvn test runs 72 tests, all green — Tests run: 72, Failures: 0, Errors: 0, Skipped: 0. The output is validated three ways: round-tripped through GZIPInputStream, shelled out to the real gzip(1) for gzip -t / gzip -dc, and the SIMD checksum cross-checked bit-for-bit against java.util.zip.Adler32.",
    total: "72",
    suites: [
      { name: "RoundTripTest", count: 21, proves: "decompress(compress(x)) == x across empty / 1-byte / boundary / all-zeros / repeated / random / all-256-value / 5 MB inputs, × 5 levels × 5 block sizes — checked by our decoder and a plain GZIPInputStream." },
      { name: "Adler32Test", count: 35, proves: "the Vector API checksum is bit-identical to java.util.zip.Adler32 across the known-answer vector, stride/NMAX sweeps, slices, the FFM path, and 500 fuzz trials." },
      { name: "Crc32CombineTest", count: 11, proves: "folded per-block CRCs equal a serial CRC over the concatenation." },
      { name: "CrossToolTest", count: 3, proves: "our output passes the system gzip -t / gzip -dc byte-for-byte, and we decode what gzip -9 produced." },
      { name: "MappedInputTest", count: 2, proves: "FFM mmap reads back exactly what is on disk, including the empty file." },
    ],
    crossTool:
      "gzip -t / gzip -dc — the strongest proof: the system gzip decompresses our output byte-for-byte, and we decode what gzip -9 produced.",
    source:
      "source · target/surefire-reports (72 total) · test/CrossToolTest.java · test/RoundTripTest.java · test/Adler32Test.java",
  },
} as const;

// ---------------------------------------------------------------------------
// Section 05 — BUILD
// ---------------------------------------------------------------------------

export const BUILD = {
  divider: { subtitle: "JDK 25 · Maven · the CLI, and the JMH harness behind a profile" },

  stack: {
    eyebrow: "§05 · THE STACK",
    headline: "What it's built on.",
    lede:
      "One module, JDK 25, Maven. The incubating Vector API is wired into every stage; the JMH harness lives behind a profile so the default build never touches it.",
    rows: [
      { area: "LANGUAGE", tech: "JDK 25", note: "records · switch expressions · text blocks · virtual threads" },
      { area: "SIMD", tech: "jdk.incubator.vector (incubating)", note: "--add-modules on compile / test / exec / JMH" },
      { area: "MEMORY", tech: "java.lang.foreign · JEP 454 (final)", note: "mmap over a shared Arena" },
      { area: "CODEC", tech: "java.util.zip.Deflater / GZIPInputStream", note: "zlib — delegated on purpose" },
      { area: "BUILD", tech: "Maven · maven.compiler.release = 25", note: "single-module, no shading in the default build" },
      { area: "TESTS", tech: "JUnit 5.11.4 · 72 tests", note: "incl. external gzip(1) cross-tool round-trips" },
      { area: "BENCH", tech: "JMH 1.37 · -Pbench profile", note: "shaded benchmarks.jar, off the default path" },
    ],
    closing:
      "The whole engine is four hand-written classes — ParallelGzipCompressor, Crc32Combine, VectorizedAdler32, MappedInput — plus a thin CLI, wrapped around zlib for the codec.",
    source:
      "source · pom.xml:16 (release 25) · :19 (JUnit 5.11.4) · :20 (JMH 1.37) · :25 (add-modules) · :102 (bench profile)",
  },

  // The Try-It page (page 23, the second-to-last recto). Build + run it locally
  // in three lines on the left; the live app on a scannable QR card on the
  // right. The very last page is a pure closing — no QR, no CTA — so this page
  // owns the "go to the product" moment.
  closing: {
    eyebrow: "§05 · TRY IT",
    headline: "Try it.",
    tagline: "Build and run it locally in a few lines — then scan to open the live, in-browser walkthrough.",
    // Illustrative transcript — the output FORMAT is taken verbatim from the
    // source (Main.java:101–103 compress, :143 adler); the specific byte
    // counts / ratio / hash are example values, since the Java engine was not
    // built for this booklet.
    cli: [
      { c: "$ mvn -q -DskipTests package", o: "# builds target/jetpack-compress.jar" },
      { c: "$ VEC=--add-modules=jdk.incubator.vector", o: "" },
      { c: "$ java $VEC -jar target/jetpack-compress.jar compress notes.txt -l 6", o: "compressed notes.txt (1,048,576 bytes) -> notes.txt.gz (431,020 bytes)  ratio=0.411  17 ms  61.7 MB/s" },
      { c: "$ gzip -t notes.txt.gz && gzip -dc notes.txt.gz | diff - notes.txt", o: "# integrity OK — identical, byte for byte" },
      { c: "$ java $VEC -jar target/jetpack-compress.jar adler notes.txt", o: "adler32(vector) 8f2a4c19  notes.txt  (1,048,576 bytes, 16-byte SIMD stride)" },
    ],
    cliNote: "illustrative session — the output format is real (Main.java:101–103, :143); the byte values are an example, not a captured run.",
    // Try-It QR card (moved here from the old back cover).
    qrTarget: "https://jetpack-compress.vercel.app",
    scanCaption: "scan to open the live app",
    scanSub: "An interactive, in-browser walkthrough of the engine — the pipeline, the SIMD stage, and the receipts. No JDK required.",
    liveLabel: "LIVE APP",
    liveUrl: "jetpack-compress.vercel.app",
    repoLabel: "SOURCE",
    repoUrl: "github.com/yadava5/jetpack-compress",
    steps: [
      { k: "01", v: "package the jar" },
      { k: "02", v: "compress a file" },
      { k: "03", v: "let system gzip verify it" },
    ],
    microNote: "split · fan out · stitch · verify",
  },
} as const;

// ---------------------------------------------------------------------------
// Back cover
// ---------------------------------------------------------------------------

// Back cover (page 24) — a PURE closing that bookends the front cover. The
// same full-bleed pipeline field (reseeded + dimmed), a quiet wordmark, the
// colophon, and one closing line. No QR, no URL, no CTA — the reader was sent
// to the product on the Try-It page; the last page just closes the book.
export const BACK_COVER = {
  wordmark: "jetpack-compress",
  motif: "one member · every core",
  colophon: ["System Card · Vol. 01", "Ayush Yadav · 2026", "Output is standard gzip · no warranty"],
  closingLine: "— One member. Every core. Real gzip.",
  endMark: "fin.",
} as const;
