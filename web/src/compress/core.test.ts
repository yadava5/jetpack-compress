import { describe, it, expect } from 'vitest'
import {
  compress,
  decompress,
  compressedName,
  decompressedName,
  detectFormat,
  formatBytes,
  formatExactBytes,
  ratio,
  formatRatio,
  savedPercent,
  formatSaved,
  throughputMBps,
  formatThroughput,
  formatDuration,
  supportsCompressionStream,
  FORMAT_LIST,
  type CompressionFormat,
} from './core'

/** Build a Blob from a UTF-8 string. */
function blobOf(text: string): Blob {
  return new Blob([new TextEncoder().encode(text)])
}

async function bytesOf(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer())
}

/** A compressible sample: a long, repetitive log-like body. */
const COMPRESSIBLE = Array.from({ length: 2000 }, (_, i) =>
  `2026-07-20T10:${String(i % 60).padStart(2, '0')}:00 INFO worker ready block=${i % 8}`,
).join('\n')

describe('supportsCompressionStream', () => {
  it('is available in this runtime', () => {
    expect(supportsCompressionStream()).toBe(true)
  })
})

describe('round-trip across all formats', () => {
  for (const format of FORMAT_LIST) {
    it(`compress -> decompress is lossless for ${format}`, async () => {
      const input = blobOf(COMPRESSIBLE)
      const c = await compress(input, format as CompressionFormat)
      const d = await decompress(c.blob, format as CompressionFormat)
      const original = await bytesOf(input)
      const restored = await bytesOf(d.blob)
      expect(restored).toEqual(original)
      expect(d.outputBytes).toBe(input.size)
    })
  }
})

describe('measured stats are real and honest', () => {
  it('shrinks compressible input and reports a ratio > 1', async () => {
    const input = blobOf(COMPRESSIBLE)
    const c = await compress(input, 'gzip')
    expect(c.inputBytes).toBe(input.size)
    expect(c.outputBytes).toBeGreaterThan(0)
    expect(c.outputBytes).toBeLessThan(c.inputBytes)
    expect(ratio(c.inputBytes, c.outputBytes)).toBeGreaterThan(1)
    expect(c.elapsedMs).toBeGreaterThanOrEqual(0)
  })

  it('reports honest ~1x (or expansion) for already-random input', async () => {
    const random = new Uint8Array(64 * 1024)
    for (let i = 0; i < random.length; i++) random[i] = (Math.random() * 256) | 0
    const input = new Blob([random])
    const c = await compress(input, 'gzip')
    // Incompressible data cannot beat ~1x; gzip framing may even expand it.
    expect(ratio(c.inputBytes, c.outputBytes)).toBeLessThan(1.1)
  })

  it('emits a gzip magic-byte header for the gzip format', async () => {
    const c = await compress(blobOf('hello world'), 'gzip')
    const head = await bytesOf(c.blob)
    expect(head[0]).toBe(0x1f)
    expect(head[1]).toBe(0x8b)
  })
})

describe('edge cases', () => {
  it('handles an empty input (only framing bytes out)', async () => {
    const input = new Blob([])
    const c = await compress(input, 'gzip')
    expect(c.inputBytes).toBe(0)
    expect(c.outputBytes).toBeGreaterThan(0) // gzip header + trailer
    const d = await decompress(c.blob, 'gzip')
    expect(d.outputBytes).toBe(0)
  })

  it('rejects invalid data on decompression', async () => {
    const garbage = new Blob([new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])])
    await expect(decompress(garbage, 'gzip')).rejects.toBeTruthy()
  })

  it('reports progress that ends at the input size', async () => {
    const input = blobOf(COMPRESSIBLE)
    let last = 0
    await compress(input, 'gzip', (n) => {
      last = n
    })
    expect(last).toBe(input.size)
  })
})

describe('filename helpers', () => {
  it('adds the format extension on compress', () => {
    expect(compressedName('notes.txt', 'gzip')).toBe('notes.txt.gz')
    expect(compressedName('data.bin', 'deflate')).toBe('data.bin.zz')
    expect(compressedName('x', 'deflate-raw')).toBe('x.deflate')
  })

  it('strips the extension on decompress', () => {
    expect(decompressedName('notes.txt.gz', 'gzip')).toBe('notes.txt')
    expect(decompressedName('data.zz', 'deflate')).toBe('data')
    expect(decompressedName('mystery', 'gzip')).toBe('mystery.out')
  })

  it('detects the format from a filename', () => {
    expect(detectFormat('a.gz')).toBe('gzip')
    expect(detectFormat('a.zz')).toBe('deflate')
    expect(detectFormat('a.deflate')).toBe('deflate-raw')
    expect(detectFormat('a.txt')).toBeNull()
  })
})

describe('formatting', () => {
  it('formats byte sizes with binary units', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1024)).toBe('1.00 KB')
    expect(formatBytes(1536)).toBe('1.50 KB')
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB')
    expect(formatBytes(-1)).toBe('—')
  })

  it('formats exact byte counts', () => {
    expect(formatExactBytes(1509376)).toBe('1,509,376 bytes')
  })

  it('formats ratios and saved percentages', () => {
    expect(formatRatio(3.2)).toBe('3.20×')
    expect(formatRatio(0)).toBe('—')
    expect(Math.round(savedPercent(1000, 250))).toBe(75)
    expect(formatSaved(75)).toBe('75%')
    expect(formatSaved(-4)).toBe('-4%')
    expect(formatSaved(0)).toBe('0%')
  })

  it('formats throughput and duration', () => {
    expect(throughputMBps(1024 * 1024, 1000)).toBeCloseTo(1, 5)
    expect(formatThroughput(0)).toBe('—')
    expect(formatThroughput(42.4)).toBe('42.4 MB/s')
    expect(formatThroughput(2048)).toBe('2.00 GB/s')
    expect(formatDuration(0.4)).toBe('<1 ms')
    expect(formatDuration(450)).toBe('450 ms')
    expect(formatDuration(1500)).toBe('1.50 s')
  })
})
