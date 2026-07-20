/* ------------------------------------------------------------------ *
 * jetpack-compress — in-browser compression core.
 *
 * Pure, DOM-free logic that runs a Blob through the platform's native
 * CompressionStream / DecompressionStream (DEFLATE). Everything is
 * streamed chunk-by-chunk (input.stream() -> transform -> collector) so a
 * large file is never held whole in a single ArrayBuffer. Only the
 * produced output accumulates, because a downloadable Blob needs it.
 *
 * This is the SAME native DEFLATE the Java engine delegates to (zlib) —
 * it is NOT the Java engine. The engine's own contribution is the
 * parallel block framing (virtual threads) and the hand-vectorized
 * SIMD Adler-32; that runs on the JVM, not in the browser.
 *
 * The module depends only on Web Streams + Blob + performance, which are
 * globals in both the browser and Node 18+, so it is unit-testable.
 * ------------------------------------------------------------------ */

export type CompressionFormat = 'gzip' | 'deflate' | 'deflate-raw'

export interface FormatMeta {
  id: CompressionFormat
  /** Short label for the selector. */
  label: string
  /** Extension appended when compressing (e.g. `.gz`). */
  ext: string
  /** MIME type stamped on the compressed Blob. */
  mime: string
  /** One-line description of the container the format produces. */
  blurb: string
}

/** The three formats CompressionStream / DecompressionStream accept. */
export const FORMATS: Record<CompressionFormat, FormatMeta> = {
  gzip: {
    id: 'gzip',
    label: 'gzip',
    ext: '.gz',
    mime: 'application/gzip',
    blurb: 'RFC 1952 — DEFLATE with a gzip header, CRC-32 and length trailer. What the engine emits.',
  },
  deflate: {
    id: 'deflate',
    label: 'deflate (zlib)',
    ext: '.zz',
    mime: 'application/zlib',
    blurb: 'RFC 1950 — DEFLATE inside a zlib wrapper with an Adler-32 check.',
  },
  'deflate-raw': {
    id: 'deflate-raw',
    label: 'deflate-raw',
    ext: '.deflate',
    mime: 'application/octet-stream',
    blurb: 'RFC 1951 — raw DEFLATE, no header or checksum.',
  },
}

export const FORMAT_LIST: readonly CompressionFormat[] = ['gzip', 'deflate', 'deflate-raw']

/** Extensions we recognise when guessing a format for decompression. */
const EXT_TO_FORMAT: ReadonlyArray<[string, CompressionFormat]> = [
  ['.gz', 'gzip'],
  ['.gzip', 'gzip'],
  ['.tgz', 'gzip'],
  ['.zz', 'deflate'],
  ['.zlib', 'deflate'],
  ['.deflate', 'deflate-raw'],
  ['.raw', 'deflate-raw'],
]

/**
 * A sane cap on input size. We stream, so we never hold the whole input in
 * one buffer, but the produced output (and, for decompression, potentially a
 * much larger result) does live in memory as a Blob. 1 GiB keeps a browser
 * tab safe; above it we ask the user to use the CLI instead.
 */
export const MAX_INPUT_BYTES = 1024 * 1024 * 1024 // 1 GiB
/** Above this we still run, but the UI warns it may be slow / memory-heavy. */
export const LARGE_INPUT_BYTES = 100 * 1024 * 1024 // 100 MiB

/** True when the runtime exposes the native compression primitives. */
export function supportsCompressionStream(): boolean {
  return (
    typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined'
  )
}

export interface TransformResult {
  /** The compressed / decompressed bytes, ready to download. */
  blob: Blob
  /** Bytes read from the source. */
  inputBytes: number
  /** Bytes produced. */
  outputBytes: number
  /** Wall-clock time for the whole stream, in milliseconds. */
  elapsedMs: number
}

/**
 * Stream `input` through `transform`, metering source bytes for progress and
 * collecting the output into a Blob. Source chunks are pumped into the
 * transform's writable while the readable is drained concurrently, so the
 * whole input is never held in one buffer. Shared by compress() and
 * decompress(); rejects (via the drain side) on invalid input.
 */
async function run(
  input: Blob,
  transform: CompressionStream | DecompressionStream,
  mime: string,
  onProgress?: (readBytes: number) => void,
): Promise<TransformResult> {
  const start = now()
  const writer = transform.writable.getWriter()
  const reader = transform.readable.getReader()

  const pump = (async () => {
    const src = input.stream().getReader()
    let readBytes = 0
    try {
      for (;;) {
        const { done, value } = await src.read()
        if (done) break
        readBytes += value.byteLength
        onProgress?.(readBytes)
        await writer.write(value)
      }
      await writer.close()
    } catch (err) {
      await writer.abort(err).catch(() => {})
      throw err
    } finally {
      src.releaseLock()
    }
  })()

  const parts: BlobPart[] = []
  let outputBytes = 0
  const drain = (async () => {
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        if (value && value.byteLength) {
          outputBytes += value.byteLength
          parts.push(value)
        }
      }
    } finally {
      reader.releaseLock()
    }
  })()

  // Settle both sides so a failure on one never leaves the other as an
  // unhandled rejection, then surface the first error if any.
  const settled = await Promise.allSettled([pump, drain])
  const failed = settled.find((s) => s.status === 'rejected')
  if (failed) throw (failed as PromiseRejectedResult).reason

  return {
    blob: new Blob(parts, { type: mime }),
    inputBytes: input.size,
    outputBytes,
    elapsedMs: now() - start,
  }
}

/** Compress a Blob with the browser's native DEFLATE in the given container. */
export function compress(
  input: Blob,
  format: CompressionFormat,
  onProgress?: (readBytes: number) => void,
): Promise<TransformResult> {
  return run(input, new CompressionStream(format), FORMATS[format].mime, onProgress)
}

/** Decompress a Blob that was produced with the given container. Rejects on invalid input. */
export function decompress(
  input: Blob,
  format: CompressionFormat,
  onProgress?: (readBytes: number) => void,
): Promise<TransformResult> {
  return run(input, new DecompressionStream(format), 'application/octet-stream', onProgress)
}

/* ---- filenames --------------------------------------------------------- */

/** Name for a compressed download, e.g. `notes.txt` -> `notes.txt.gz`. */
export function compressedName(name: string, format: CompressionFormat): string {
  return `${name || 'file'}${FORMATS[format].ext}`
}

/**
 * Name for a decompressed download. Strips the matching (or any recognised)
 * compressed extension; falls back to a `.out` suffix so we never collide
 * with the input name.
 */
export function decompressedName(name: string, format: CompressionFormat): string {
  const lower = name.toLowerCase()
  const own = FORMATS[format].ext
  if (lower.endsWith(own) && name.length > own.length) {
    return name.slice(0, -own.length)
  }
  for (const [ext] of EXT_TO_FORMAT) {
    if (lower.endsWith(ext) && name.length > ext.length) {
      return name.slice(0, -ext.length)
    }
  }
  return `${name || 'file'}.out`
}

/** Guess a decompression format from a filename, or null if unrecognised. */
export function detectFormat(name: string): CompressionFormat | null {
  const lower = name.toLowerCase()
  for (const [ext, format] of EXT_TO_FORMAT) {
    if (lower.endsWith(ext)) return format
  }
  return null
}

/* ---- formatting helpers ------------------------------------------------ */

/** Human byte size using binary units (KB = 1024 B), e.g. `1.44 MB`. */
export function formatBytes(n: number): string {
  if (!isFinite(n) || n < 0) return '—'
  if (n < 1024) return `${n} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let v = n / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  const digits = v >= 100 ? 0 : v >= 10 ? 1 : 2
  return `${v.toFixed(digits)} ${units[i]}`
}

/** Exact byte count with thousands separators, e.g. `1,509,376 bytes`. */
export function formatExactBytes(n: number): string {
  return `${n.toLocaleString('en-US')} bytes`
}

/** Compression ratio input/output; 0 when output is empty. */
export function ratio(inputBytes: number, outputBytes: number): number {
  if (outputBytes <= 0) return 0
  return inputBytes / outputBytes
}

export function formatRatio(r: number): string {
  if (!isFinite(r) || r <= 0) return '—'
  return `${r.toFixed(2)}×`
}

/** Percentage of size removed; negative when the output grew. */
export function savedPercent(inputBytes: number, outputBytes: number): number {
  if (inputBytes <= 0) return 0
  return (1 - outputBytes / inputBytes) * 100
}

export function formatSaved(pct: number): string {
  if (!isFinite(pct)) return '—'
  // Positive = shrank (the good case), shown plainly; negative = grew.
  const rounded = Math.abs(pct) >= 10 ? Math.round(pct) : Number(pct.toFixed(1))
  return `${rounded}%`
}

/** Throughput in MiB/s for `bytes` processed in `ms` milliseconds. */
export function throughputMBps(bytes: number, ms: number): number {
  if (ms <= 0 || bytes <= 0) return 0
  return bytes / (1024 * 1024) / (ms / 1000)
}

export function formatThroughput(mbps: number): string {
  if (!isFinite(mbps) || mbps <= 0) return '—'
  if (mbps >= 1024) return `${(mbps / 1024).toFixed(2)} GB/s`
  return `${mbps.toFixed(mbps >= 100 ? 0 : 1)} MB/s`
}

export function formatDuration(ms: number): string {
  if (!isFinite(ms) || ms < 0) return '—'
  if (ms < 1) return '<1 ms'
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}
