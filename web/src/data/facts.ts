/**
 * Single source of truth for every claim rendered on this page.
 *
 * Every number and caption here was verified against the jetpack-compress repo:
 *   - counts + pass/fail from target/surefire-reports (re-run under OpenJDK 25.0.3)
 *   - throughput numbers from the README "Benchmarks" table (quick JMH run)
 *   - scope statements from the source (ParallelGzipCompressor, VectorizedAdler32, MappedInput)
 *
 * If a number is not honest and reproducible, it does not belong in this file.
 */

export const SITE = {
  name: 'jetpack-compress',
  tagline: 'Parallel, gzip-compatible compression on JDK 25.',
  repo: 'https://github.com/yadava5/jetpack-compress',
  /** The System Card booklet, built as a static sub-site served from this same origin. */
  systemCard: '/system-card/',
  /** The in-browser compression tool — a real, usable demo built on CompressionStream. */
  app: '/app',
  jdk: 'JDK 25',
  oneLiner:
    'A gzip-compatible parallel compression engine: blocks compress concurrently on virtual threads and stitch into one byte-valid gzip member any tool can decompress.',
} as const

/** The honest thesis — stated up front, repeated in the scope section. */
export const THESIS =
  'The novelty is the parallel framing and the hand-vectorized SIMD stage — not a new codec. DEFLATE entropy coding is delegated to zlib (java.util.zip.Deflater) on purpose; a from-scratch encoder is future work.'

export const HERO_BADGES = [
  { label: 'Vector API', sub: 'jdk.incubator.vector' },
  { label: 'Virtual threads', sub: 'JEP 444' },
  { label: 'FFM', sub: 'java.lang.foreign · JEP 454' },
] as const

export const PROOF_STRIP = [
  { k: '72', v: 'tests green', mono: 'Tests run: 72 · Failures: 0 · Errors: 0' },
  { k: 'gzip -t', v: 'cross-tool validated', mono: 'output passes gzip -t / gzip -dc' },
  { k: 'byte-valid', v: 'gzip member', mono: 'GZIPInputStream round-trips it' },
] as const

/** JDK 25 platform features, and honestly which parts are hand-written vs delegated. */
export const FEATURES = [
  {
    id: 'vector',
    title: 'Vector API (SIMD)',
    module: 'jdk.incubator.vector · incubating',
    where: 'vector/VectorizedAdler32.java',
    kind: 'hand-written',
    body: 'Adler-32 hand-vectorized: byte→int lane widening, position-weighted (S1/S2) reductions, NMAX-segmented modulo. Bit-identical to java.util.zip.Adler32.',
  },
  {
    id: 'ffm',
    title: 'Foreign Function & Memory',
    module: 'java.lang.foreign · JEP 454 (final)',
    where: 'io/MappedInput.java',
    kind: 'hand-written',
    body: 'Read-only memory-mapped input over a shared Arena. Multi-gigabyte files are read as a MemorySegment — never copied whole onto the Java heap.',
  },
  {
    id: 'vthreads',
    title: 'Virtual threads',
    module: 'JEP 444 (final)',
    where: 'core/ParallelGzipCompressor.java',
    kind: 'hand-written',
    body: 'One virtual thread per block via Executors.newVirtualThreadPerTaskExecutor(), scheduled behind a bounded in-flight window so peak memory stays independent of file size.',
  },
  {
    id: 'deflate',
    title: 'DEFLATE entropy coding',
    module: 'java.util.zip.Deflater (zlib)',
    where: 'core/ParallelGzipCompressor.java',
    kind: 'delegated',
    body: 'LZ77 + Huffman coding is delegated to zlib — a correct, battle-tested encoder. This project parallelizes and frames DEFLATE; it does not re-implement it.',
  },
] as const

/** Implemented vs delegated vs planned — being precise about this is the point. */
export const SCOPE = {
  implemented: [
    'Parallel block framing: splitting, virtual-thread scheduling with a bounded in-flight window, SYNC_FLUSH stitching into a single gzip member, header/trailer encoding.',
    'Crc32Combine — GF(2) crc32_combine, so the CRC is computed per block and folded in order, not re-scanned serially.',
    'VectorizedAdler32 — genuinely hand-vectorized Adler-32 (jdk.incubator.vector), byte[] and FFM MemorySegment inputs, bit-identical to the JDK.',
    'MappedInput — FFM (java.lang.foreign) read-only memory mapping over a shared Arena. Plus a CLI and a JMH harness.',
  ],
  delegated: [
    'The DEFLATE encoder itself — LZ77 + Huffman entropy coding is done by java.util.zip.Deflater (zlib).',
    'Decompression — java.util.zip.GZIPInputStream. Delegating is the strongest proof the output is standard gzip.',
  ],
  planned: [
    'A from-scratch DEFLATE encoder (own LZ77 match finder + Huffman coder). This is the big one; today the entropy coding is delegated.',
    'An entropy-driven per-block heuristic (vectorized histogram to pick level / store incompressible blocks). The SIMD machinery exists; the policy is not wired in.',
    'GraalVM native-image, and preset-dictionary carry-over between adjacent blocks to recover the boundary ratio loss.',
  ],
} as const

/** Benchmark environment — stated with every number so the reader can judge it. */
export const BENCH_META = {
  machine: 'Apple M1 Pro (arm64) · 10 cores · 128-bit SIMD, 16-byte NEON stride',
  jvm: 'OpenJDK 25.0.3 (Homebrew)',
  harness: 'JMH 1.37 · throughput mode · Score = bytes/second',
  caveat:
    'Reduced quick run: 1 fork, 3 warmup + 4 measurement iterations of 1 s. Indicative, not rigorous. The parallel-compression figure in particular has wide error bars (±50%) on a quick run.',
} as const

/**
 * Adler-32 throughput. The meaningful comparison is vector vs scalar — both pure Java,
 * only the Vector API differs. The JDK intrinsic is a reference point, NOT a target that was beaten.
 */
export const ADLER_BENCH = {
  unit: 'GB/s',
  bars: [
    {
      id: 'scalar',
      label: 'Adler32.scalar',
      note: 'pure Java baseline',
      gbps: 1.54,
      mult: 1.0,
      role: 'baseline' as const,
    },
    {
      id: 'vector',
      label: 'Adler32.vector',
      note: 'Vector API — the honest SIMD result',
      gbps: 4.34,
      mult: 2.8,
      role: 'hero' as const,
    },
    {
      id: 'intrinsic',
      label: 'Adler32.jdkIntrinsic',
      note: 'native intrinsic — reference, not beaten',
      gbps: 14.1,
      mult: 9.2,
      role: 'reference' as const,
    },
  ],
  headline: '2.8×',
  headlineSub: 'vector over scalar (both pure Java)',
  buffer: '8 MiB random buffer',
} as const

/** Parallel compression throughput vs single-threaded java.util.zip, same DEFLATE level. */
export const COMPRESSION_BENCH = {
  unit: 'MB/s',
  bars: [
    {
      id: 'single',
      label: 'singleThreadedJdk',
      note: 'GZIPOutputStream, level 6',
      mbps: 66.8,
      mult: 1.0,
      role: 'baseline' as const,
    },
    {
      id: 'parallel',
      label: 'parallelVirtualThreads',
      note: 'block-parallel, level 6, 10 cores',
      mbps: 434.6,
      mult: 6.5,
      role: 'hero' as const,
      errorPct: 50,
    },
  ],
  headline: '~6.5×',
  headlineSub: 'parallel over single-thread · ±50% on the quick run',
  corpus: '32 MiB mixed corpus (text runs + incompressible noise)',
} as const

/** The 72 tests, by suite, and what each one proves. */
export const TESTS = {
  total: 72,
  suites: [
    {
      name: 'RoundTripTest',
      count: 21,
      proves:
        'decompress(compress(x)) == x across empty / 1-byte / boundary / all-zeros / repeated / random / all-256-values / 5 MB inputs, × 5 levels × 5 block sizes. Verified by our decompressor AND a plain GZIPInputStream.',
    },
    {
      name: 'Adler32Test',
      count: 35,
      proves:
        'The Vector API checksum is bit-identical to java.util.zip.Adler32 across the known-answer vector, size sweeps around the SIMD stride and NMAX, slices, the FFM path, and 500 randomized fuzz trials.',
    },
    {
      name: 'Crc32CombineTest',
      count: 11,
      proves: 'Folded per-block CRCs equal a serial CRC over the concatenation.',
    },
    {
      name: 'CrossToolTest',
      count: 3,
      proves:
        'Shells out to the real gzip(1): our output passes gzip -t and gzip -dc byte-for-byte, and we decode what system gzip -9 produced.',
    },
    {
      name: 'MappedInputTest',
      count: 2,
      proves: 'FFM mmap reads back exactly what is on disk, including the empty file.',
    },
  ],
} as const

/** Architecture notes — the honest details that make the parallelism correct. */
export const ARCH_NOTES = [
  {
    title: 'Single-member stitching',
    body: 'Every block but the last is flushed with Deflater.SYNC_FLUSH (byte-aligned, empty stored block, BFINAL = 0), so blocks concatenate into one DEFLATE stream. Only the last is finish()ed (BFINAL = 1).',
  },
  {
    title: 'Why it always decodes',
    body: 'Each block uses a fresh Deflater with no preset dictionary, so its back-references stay inside the block — a strict subset of what DEFLATE allows. The cost is a small ratio hit near block boundaries: the standard pigz trade-off.',
  },
  {
    title: 'Parallel CRC',
    body: 'The gzip trailer needs the CRC-32 of the whole input. Each worker computes its own block CRC; the writer folds them in order with Crc32Combine (a GF(2) crc32_combine), avoiding a second serial pass.',
  },
  {
    title: 'Virtual threads, honestly',
    body: 'Block compression is CPU-bound, so effective parallelism is bounded by the carrier pool (≈ cores), not the number of virtual threads. They buy real throughput and clean structured concurrency — not parallelism beyond the core count.',
  },
] as const

/** Real CLI usage, copied from the README. Runs with the incubator Vector module enabled. */
export const CLI = {
  env: 'java --add-modules=jdk.incubator.vector -jar jetpack-compress.jar',
  lines: [
    { c: '$ java $VEC -jar $JAR compress notes.txt notes.txt.gz -l 6', o: 'compressed notes.txt -> notes.txt.gz  ratio=0.41  …' },
    { c: '$ gzip -t notes.txt.gz', o: '# integrity OK — it is real gzip' },
    { c: '$ gzip -dc notes.txt.gz | diff - notes.txt', o: '# identical, byte for byte' },
    { c: '$ java $VEC -jar $JAR adler notes.txt', o: 'adler32(vector) 1a0b3f7e  notes.txt  (…, 16-byte SIMD stride)' },
  ],
  commands: [
    { name: 'compress', args: '<input> [output] [-l LEVEL 0-9] [-b BLOCK_BYTES]' },
    { name: 'decompress', args: '<input> [output]' },
    { name: 'adler', args: '<input>' },
    { name: 'info', args: '' },
  ],
} as const

/**
 * ------------------------------------------------------------------ *
 * NARRATIVE — the storytelling spine that threads the page.
 * Copy only; every number it cites is derived from the verified
 * benchmarks above (10 cores + 66.8 MB/s single-thread from BENCH_META
 * and COMPRESSION_BENCH). No new claims are introduced here.
 * ------------------------------------------------------------------ */

/** The five acts, in order. Labels drive the chaptered section heads. */
export const ACTS = {
  problem: { n: '01', label: 'The problem' },
  solution: { n: '02', label: 'The idea' },
  inside: { n: '03', label: 'Inside the engine' },
  proof: { n: '04', label: 'The proof' },
  tryit: { n: '05', label: 'Run it yourself' },
} as const

/** PROBLEM — one core busy, the rest idle. Numbers are this machine's, stated as such. */
export const PROBLEM = {
  cores: 10, // Apple M1 Pro (arm64) · 10 cores — see BENCH_META.machine
  active: 1, // a single-threaded DEFLATE loop occupies one
  idle: 9,
  singleMbps: COMPRESSION_BENCH.bars[0].mbps, // 66.8 MB/s single-thread baseline
  activeLabel: 'gzip · one DEFLATE loop',
  idleLabel: 'idle',
} as const

/** The two invariants that make "still real gzip" true — pulled forward into the solution. */
export const SOLUTION_INVARIANTS = [ARCH_NOTES[0], ARCH_NOTES[1]] as const
/** The two honest caveats that keep the parallelism correct — shown inside the engine. */
export const INSIDE_NOTES = [ARCH_NOTES[2], ARCH_NOTES[3]] as const

/** The portfolio strip — the interconnection across the live projects. */
export const PROJECTS = [
  {
    name: 'fast-mnist',
    href: 'https://fast-mnist.vercel.app',
    desc: 'C++ SIMD neural net + web demo',
  },
  {
    name: 'JobTracker',
    href: 'https://jobtracker-web-five.vercel.app',
    desc: 'Email-powered application tracker',
  },
  {
    name: 'TaskFlow',
    href: 'https://taskflow-calendar-ashy.vercel.app',
    desc: 'Calendar + NLP task management',
  },
  {
    name: 'LifeQuest',
    href: 'https://lifequest-sigma-fawn.vercel.app',
    desc: 'Gamified routine tracker',
  },
  {
    name: 'Agentic AutoML',
    href: 'https://agentic-automl.vercel.app',
    desc: 'AI-augmented AutoML toolchain',
  },
  {
    name: 'in-browser classifier',
    href: 'https://huggingface.co/spaces/yadava5/jobtracker-classifier',
    desc: 'Transformers.js on a HF Space',
  },
] as const
