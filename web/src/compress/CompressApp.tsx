import { useCallback, useMemo, useRef, useState, type DragEvent } from 'react'
import { SITE, THESIS } from '../data/facts'
import { GitHubIcon, BookIcon, ArrowDown, ArrowRight, CheckIcon } from '../components/icons'
import {
  compress,
  decompress,
  compressedName,
  decompressedName,
  detectFormat,
  supportsCompressionStream,
  formatBytes,
  formatExactBytes,
  formatRatio,
  ratio,
  savedPercent,
  formatSaved,
  throughputMBps,
  formatThroughput,
  formatDuration,
  FORMATS,
  FORMAT_LIST,
  MAX_INPUT_BYTES,
  LARGE_INPUT_BYTES,
  type CompressionFormat,
  type TransformResult,
} from './core'

type Mode = 'compress' | 'decompress'
type JobStatus = 'running' | 'done' | 'error'

interface Job {
  id: string
  name: string
  mode: Mode
  format: CompressionFormat
  status: JobStatus
  progress: number
  inputBytes: number
  result?: TransformResult
  outName?: string
  error?: string
}

/** ~1.5 MB of realistic, compressible log text — lets a visitor try the tool with no file of their own. */
function makeSample(): File {
  const levels = ['INFO', 'DEBUG', 'INFO', 'INFO', 'WARN']
  const msgs = [
    'worker ready, awaiting block',
    'block scheduled on virtual thread',
    'DEFLATE flushed (SYNC_FLUSH), BFINAL=0',
    'adler32(vector) folded, 16-byte SIMD stride',
    'crc32_combine over block boundary ok',
    'stitched member, gzip -t would pass',
  ]
  const lines: string[] = []
  for (let i = 0; i < 18000; i++) {
    const s = String(i % 60).padStart(2, '0')
    lines.push(
      `2026-07-20T10:${s}:${s} ${levels[i % levels.length]} [w${i % 10}] ${msgs[i % msgs.length]} seq=${i}`,
    )
  }
  return new File([lines.join('\n')], 'sample-engine.log', { type: 'text/plain' })
}

export function CompressApp() {
  const supported = useMemo(() => supportsCompressionStream(), [])
  const [mode, setMode] = useState<Mode>('compress')
  const [format, setFormat] = useState<CompressionFormat>('gzip')
  const [jobs, setJobs] = useState<Job[]>([])
  const [dragging, setDragging] = useState(false)
  const dragDepth = useRef(0)
  const idRef = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const patch = useCallback((id: string, next: Partial<Job>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...next } : j)))
  }, [])

  const process = useCallback(
    async (blob: Blob, job: Job) => {
      if (blob.size > MAX_INPUT_BYTES) {
        patch(job.id, {
          status: 'error',
          error: `File is ${formatBytes(blob.size)} — over the ${formatBytes(
            MAX_INPUT_BYTES,
          )} in-browser cap. Use the CLI for files this large.`,
        })
        return
      }
      try {
        const onProgress = (read: number) =>
          patch(job.id, { progress: blob.size ? Math.min(1, read / blob.size) : 1 })
        const result =
          job.mode === 'compress'
            ? await compress(blob, job.format, onProgress)
            : await decompress(blob, job.format, onProgress)
        const outName =
          job.mode === 'compress'
            ? compressedName(job.name, job.format)
            : decompressedName(job.name, job.format)
        patch(job.id, { status: 'done', progress: 1, result, outName })
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err)
        patch(job.id, {
          status: 'error',
          error:
            job.mode === 'decompress'
              ? `Could not decompress as ${FORMATS[job.format].label}. Is it a valid ${
                  FORMATS[job.format].label
                } stream? (${detail})`
              : `Compression failed: ${detail}`,
        })
      }
    },
    [patch],
  )

  const addFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return
      let activeFormat = format

      // In decompress mode, auto-pick the format from the first recognised
      // extension — a small convenience the visitor can still override.
      if (mode === 'decompress') {
        const detected = files.map((f) => detectFormat(f.name)).find(Boolean)
        if (detected && detected !== activeFormat) {
          activeFormat = detected
          setFormat(detected)
        }
      }

      const created: Array<{ job: Job; blob: Blob }> = files.map((file) => {
        const id = `job-${idRef.current++}`
        return {
          job: {
            id,
            name: file.name,
            mode,
            format: activeFormat,
            status: 'running',
            progress: 0,
            inputBytes: file.size,
          },
          blob: file,
        }
      })

      setJobs((prev) => [...created.map((c) => c.job), ...prev])
      // Process sequentially so peak memory stays bounded on a batch.
      for (const { job, blob } of created) {
        await process(blob, job)
      }
    },
    [format, mode, process],
  )

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      dragDepth.current = 0
      setDragging(false)
      const files = Array.from(e.dataTransfer.files)
      void addFiles(files)
    },
    [addFiles],
  )

  const download = useCallback((job: Job) => {
    if (!job.result || !job.outName) return
    const url = URL.createObjectURL(job.result.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = job.outName
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 5000)
  }, [])

  const removeJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id))
  }, [])

  const clearAll = useCallback(() => setJobs([]), [])

  const done = jobs.filter((j) => j.status === 'done')
  const totals = done.reduce(
    (acc, j) => {
      if (j.result) {
        acc.in += j.result.inputBytes
        acc.out += j.result.outputBytes
      }
      return acc
    },
    { in: 0, out: 0 },
  )

  return (
    <div className="app-shell cx-page">
      <AppNav />

      <main className="wrap cx-main">
        <header className="cx-head">
          <div className="kicker">in-browser tool · nothing is uploaded</div>
          <h1 className="cx-title">
            Compress a file <span className="accent">right here.</span>
          </h1>
          <p className="lead cx-lead">
            Drop a file and the page compresses it with the browser's native{' '}
            <span className="fg">CompressionStream</span> — the same DEFLATE (zlib) the Java engine
            delegates its entropy coding to. Every number below is measured on your machine, in this
            tab. It never leaves it.
          </p>
        </header>

        {!supported ? (
          <div className="card cx-fallback" role="alert">
            <h2 className="cx-fallback-title">This browser can't run the demo</h2>
            <p>
              The tool needs the native <code>CompressionStream</code> API, which this browser
              doesn't expose. It's available in current Chrome, Edge, Firefox and Safari. You can
              still run the real engine from the{' '}
              <a className="cx-link" href={SITE.repo} target="_blank" rel="noreferrer noopener">
                command line
              </a>
              .
            </p>
          </div>
        ) : (
          <>
            <div className="cx-controls" role="group" aria-label="Compression settings">
              <div className="cx-control">
                <span className="cx-control-label mono">operation</span>
                <Segmented
                  ariaLabel="Operation"
                  value={mode}
                  onChange={(v) => setMode(v as Mode)}
                  options={[
                    { value: 'compress', label: 'Compress' },
                    { value: 'decompress', label: 'Decompress' },
                  ]}
                />
              </div>
              <div className="cx-control">
                <span className="cx-control-label mono">format</span>
                <Segmented
                  ariaLabel="Format"
                  value={format}
                  onChange={(v) => setFormat(v as CompressionFormat)}
                  options={FORMAT_LIST.map((f) => ({ value: f, label: FORMATS[f].label }))}
                />
              </div>
              <p className="cx-format-blurb mono">{FORMATS[format].blurb}</p>
            </div>

            <div
              className={`cx-drop${dragging ? ' is-dragging' : ''}`}
              onDragEnter={(e) => {
                e.preventDefault()
                dragDepth.current += 1
                setDragging(true)
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={(e) => {
                e.preventDefault()
                dragDepth.current -= 1
                if (dragDepth.current <= 0) setDragging(false)
              }}
              onDrop={onDrop}
              aria-label={`Drag files here to ${mode}, or use the choose-files button`}
            >
              <div className="cx-drop-icon" aria-hidden="true">
                <ArrowDown size={22} />
              </div>
              <p className="cx-drop-lead">
                Drag {mode === 'compress' ? 'any file' : 'a compressed file'} here
              </p>
              <p className="cx-drop-sub mono">
                streamed through {FORMATS[format].label} · up to {formatBytes(MAX_INPUT_BYTES)} ·
                batch supported
              </p>
              <div className="cx-drop-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => inputRef.current?.click()}
                >
                  Choose file{mode === 'compress' ? 's' : ''}
                </button>
                {mode === 'compress' && (
                  <button type="button" className="btn btn-ghost" onClick={() => void addFiles([makeSample()])}>
                    Try a sample file
                  </button>
                )}
              </div>
              <input
                ref={inputRef}
                type="file"
                multiple
                className="cx-file-input"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? [])
                  void addFiles(files)
                  e.target.value = ''
                }}
              />
            </div>

            {jobs.length > 0 && (
              <section className="cx-results" aria-label="Results" aria-live="polite">
                <div className="cx-results-head">
                  <h2 className="cx-results-title">
                    {jobs.length} file{jobs.length > 1 ? 's' : ''}
                  </h2>
                  <button type="button" className="btn btn-ghost cx-clear" onClick={clearAll}>
                    Clear all
                  </button>
                </div>

                {done.length > 1 && (
                  <div className="cx-summary card">
                    <BatchStat label="files" value={String(done.length)} />
                    <BatchStat label="total in" value={formatBytes(totals.in)} />
                    <BatchStat label="total out" value={formatBytes(totals.out)} />
                    <BatchStat
                      label={mode === 'compress' ? 'overall ratio' : 'overall expansion'}
                      value={formatRatio(
                        mode === 'compress'
                          ? ratio(totals.in, totals.out)
                          : ratio(totals.out, totals.in),
                      )}
                      accent
                    />
                  </div>
                )}

                <ul className="cx-list">
                  {jobs.map((job) => (
                    <JobRow key={job.id} job={job} onDownload={download} onRemove={removeJob} />
                  ))}
                </ul>
              </section>
            )}

            <HonestNotes />
          </>
        )}
      </main>

      <AppFooter />
    </div>
  )
}

/* ---- pieces ------------------------------------------------------------ */

function JobRow({
  job,
  onDownload,
  onRemove,
}: {
  job: Job
  onDownload: (job: Job) => void
  onRemove: (id: string) => void
}) {
  const r = job.result
  const isCompress = job.mode === 'compress'
  const empty = job.inputBytes === 0
  const large = job.inputBytes >= LARGE_INPUT_BYTES

  return (
    <li className={`cx-item card cx-item-${job.status}`}>
      <div className="cx-item-top">
        <div className="cx-file">
          <span className="cx-file-name">{job.name}</span>
          <span className="cx-file-sub mono">
            {job.mode} · {FORMATS[job.format].label}
            {job.status === 'done' && r ? (
              <>
                {' '}
                · {formatBytes(r.inputBytes)} → {formatBytes(r.outputBytes)}
              </>
            ) : null}
          </span>
        </div>
        <div className="cx-item-actions">
          {job.status === 'done' && (
            <button type="button" className="btn cx-download" onClick={() => onDownload(job)}>
              <ArrowDown size={13} />
              Download {job.outName ? job.outName.split('/').pop() : ''}
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost cx-remove"
            onClick={() => onRemove(job.id)}
            aria-label={`Remove ${job.name}`}
          >
            Remove
          </button>
        </div>
      </div>

      {job.status === 'running' && (
        <div className="cx-progress" aria-hidden="true">
          <div className="cx-progress-fill" style={{ width: `${Math.round(job.progress * 100)}%` }} />
        </div>
      )}

      {job.status === 'error' && <p className="cx-error mono">{job.error}</p>}

      {job.status === 'done' && r && (
        <>
          <div className="cx-stats">
            <Stat label="original" value={formatBytes(r.inputBytes)} sub={formatExactBytes(r.inputBytes)} />
            <Stat
              label={isCompress ? 'compressed' : 'restored'}
              value={formatBytes(r.outputBytes)}
              sub={formatExactBytes(r.outputBytes)}
            />
            <Stat
              label={isCompress ? 'ratio' : 'expansion'}
              value={formatRatio(
                isCompress ? ratio(r.inputBytes, r.outputBytes) : ratio(r.outputBytes, r.inputBytes),
              )}
              accent
            />
            {isCompress && (
              <Stat label="space saved" value={formatSaved(savedPercent(r.inputBytes, r.outputBytes))} />
            )}
            <Stat
              label="throughput"
              value={formatThroughput(
                throughputMBps(isCompress ? r.inputBytes : r.outputBytes, r.elapsedMs),
              )}
            />
            <Stat label="time" value={formatDuration(r.elapsedMs)} />
          </div>
          {empty && (
            <p className="cx-item-note mono">
              Empty input — the {formatBytes(r.outputBytes)} out is just the {FORMATS[job.format].label}{' '}
              framing.
            </p>
          )}
          {isCompress && !empty && r.outputBytes >= r.inputBytes && (
            <p className="cx-item-note mono">
              Already compressed / high-entropy — DEFLATE can't shrink it, so the container added a
              little overhead. Honest ~1×.
            </p>
          )}
          {large && (
            <p className="cx-item-note mono">Large file — throughput reflects a single browser tab.</p>
          )}
        </>
      )}
    </li>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="cx-stat">
      <div className="cx-stat-k mono">{label}</div>
      <div className={`cx-stat-v${accent ? ' accent' : ''}`}>{value}</div>
      {sub ? <div className="cx-stat-sub mono">{sub}</div> : null}
    </div>
  )
}

function BatchStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="cx-batch-stat">
      <span className="cx-batch-k mono">{label}</span>
      <span className={`cx-batch-v${accent ? ' accent' : ''}`}>{value}</span>
    </div>
  )
}

function Segmented({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
  ariaLabel: string
}) {
  return (
    <div className="cx-seg" role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`cx-seg-btn${value === opt.value ? ' is-on' : ''}`}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function HonestNotes() {
  return (
    <section className="cx-notes card" aria-label="How this relates to the engine">
      <div className="cx-notes-head">
        <CheckIcon size={15} />
        <h2 className="cx-notes-title">What this demo is — and isn't</h2>
      </div>
      <ul className="cx-notes-list">
        <li>
          <span className="cx-note-k mono">same DEFLATE</span>
          <span>
            The browser's <code>CompressionStream</code> is zlib's DEFLATE — the exact encoder the
            Java engine delegates its entropy coding to. So the <em>bytes</em> you get here are the
            same kind the engine emits, and any tool decompresses them.
          </span>
        </li>
        <li>
          <span className="cx-note-k mono">not the engine</span>
          <span>
            This is <em>not</em> the JVM engine running in your browser. {THESIS} The engine's real
            contribution — parallel block framing on virtual threads and a hand-vectorized SIMD
            Adler-32 — runs on the JDK and is what the benchmarks measure.
          </span>
        </li>
        <li>
          <span className="cx-note-k mono">fixed level</span>
          <span>
            <code>CompressionStream</code> exposes no compression level, so this demo runs zlib's
            default. The CLI's <code>-l 0…9</code> and <code>-b</code> block-size flags aren't
            available in the browser API.
          </span>
        </li>
        <li>
          <span className="cx-note-k mono">local only</span>
          <span>
            Files are read and processed in this tab with the streaming Web APIs. Nothing is
            uploaded; there is no server.
          </span>
        </li>
      </ul>
      <div className="cx-notes-cta">
        <a className="btn btn-card" href={SITE.systemCard}>
          <BookIcon />
          Read the System Card
        </a>
        <a className="btn" href={SITE.repo} target="_blank" rel="noreferrer noopener">
          <GitHubIcon />
          Source + benchmarks
        </a>
      </div>
    </section>
  )
}

function AppNav() {
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <a href="/" className="nav-brand sqz-host" aria-label="jetpack-compress home">
          <BrandGlyph />
          <span className="mono nav-word">
            jetpack-<span className="squeeze">compress</span>
          </span>
          <span className="chip chip-amber nav-jdk">demo</span>
        </a>
        <nav className="nav-links" aria-label="Sections">
          <a href="/#problem">Problem</a>
          <a href="/#solution">Solution</a>
          <a href="/#inside">Inside</a>
          <a href="/#proof">Proof</a>
        </nav>
        <div className="nav-actions">
          <a className="nav-card" href="/">
            <ArrowRight size={13} />
            <span className="nav-card-label">Overview</span>
          </a>
          <a className="btn nav-gh" href={SITE.repo} target="_blank" rel="noreferrer noopener">
            <GitHubIcon />
            <span className="nav-gh-label">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  )
}

function AppFooter() {
  return (
    <footer className="cx-foot">
      <div className="wrap cx-foot-inner">
        <span className="mono">jetpack-compress · in-browser demo</span>
        <a className="cx-link" href="/">
          Back to the overview
        </a>
      </div>
    </footer>
  )
}

function BrandGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
      <g fill="none" stroke="var(--color-amber)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 9 H13" />
        <path d="M5 16 H18" />
        <path d="M5 23 H13" />
        <path d="M13 9 L19 16 L13 23" />
        <path d="M19 16 H25" />
      </g>
    </svg>
  )
}
