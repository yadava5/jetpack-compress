import { useEffect, useRef } from 'react'

/**
 * The living background — jetpack's own domain, drawn quietly behind everything.
 *
 *   · a faint dot grid that BRIGHTENS in amber near the cursor (systems texture)
 *   · byte squares that drift in lanes and periodically FOLD together into a
 *     denser block, then release — the compression motif, in ambient form
 *
 * It is deliberately low-contrast so it never competes with the copy, it pauses
 * when the tab is hidden, and under prefers-reduced-motion it paints a single
 * calm frame and never animates.
 */

type Byte = {
  runId: number
  offset: number // resting x offset from the run centre
  y: number
  size: number
  tone: number // 0 steel .. 1 amber
}

type Run = {
  cx: number // drifting centre x
  y: number
  vx: number
  period: number
  phase: number
}

const GRID = 58
const RUN_COUNT = 9
const PER_RUN = 4

export function ByteField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvasEl: HTMLCanvasElement | null = canvasRef.current
    if (!canvasEl) return
    const context = canvasEl.getContext('2d')
    if (!context) return
    // Non-null aliases so the nested render functions keep the narrowed types.
    const canvas: HTMLCanvasElement = canvasEl
    const ctx: CanvasRenderingContext2D = context

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(2, window.devicePixelRatio || 1)

    let w = 0
    let h = 0
    let dots: { x: number; y: number }[] = []
    let runs: Run[] = []
    let bytes: Byte[] = []
    const pointer = { x: -9999, y: -9999, active: false }

    function build() {
      // Size from the scrollbar-excluded viewport, and set the display size
      // explicitly so a transient/overflowing layout can't strand or stretch the
      // canvas. The ResizeObserver below re-runs this the moment the size settles.
      w = document.documentElement.clientWidth || window.innerWidth
      h = document.documentElement.clientHeight || window.innerHeight
      if (!w || !h) return
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      dots = []
      for (let x = GRID; x < w; x += GRID) {
        for (let y = GRID; y < h; y += GRID) dots.push({ x, y })
      }

      runs = []
      bytes = []
      for (let r = 0; r < RUN_COUNT; r++) {
        const dir = Math.random() < 0.5 ? -1 : 1
        runs.push({
          cx: Math.random() * w,
          y: 40 + Math.random() * (h - 80),
          vx: dir * (4 + Math.random() * 8), // px/sec
          period: 6 + Math.random() * 5,
          phase: Math.random() * Math.PI * 2,
        })
        for (let i = 0; i < PER_RUN; i++) {
          bytes.push({
            runId: r,
            offset: (i - (PER_RUN - 1) / 2) * (16 + Math.random() * 8),
            y: runs[r].y + (Math.random() * 8 - 4),
            size: 3 + Math.random() * 2,
            tone: Math.random() < 0.5 ? 0.85 : 0.15,
          })
        }
      }
    }

    function drawDots() {
      const R = 150
      for (const d of dots) {
        let a = 0.05
        let amber = 0
        if (pointer.active) {
          const dist = Math.hypot(d.x - pointer.x, d.y - pointer.y)
          if (dist < R) {
            const prox = 1 - dist / R
            a = 0.05 + prox * 0.5
            amber = prox
          }
        }
        if (amber > 0.02) {
          ctx.fillStyle = `rgba(255, 158, 44, ${a})`
        } else {
          ctx.fillStyle = `rgba(150, 160, 172, ${a})`
        }
        const s = 1.4 + amber * 1.4
        ctx.fillRect(d.x - s / 2, d.y - s / 2, s, s)
      }
    }

    function drawBytes(time: number) {
      for (const run of runs) {
        // 0 = spread (drifting), 1 = fully folded into a block
        const fold = reduced
          ? 0.35
          : (Math.sin((time / run.period) * Math.PI * 2 + run.phase) * 0.5 + 0.5) ** 2
        // block backing when folded
        if (fold > 0.25) {
          const bw = 26
          const bh = 16
          ctx.fillStyle = `rgba(255, 158, 44, ${0.05 * fold})`
          ctx.strokeStyle = `rgba(255, 158, 44, ${0.12 * fold})`
          ctx.lineWidth = 1
          roundRect(ctx, run.cx - bw / 2, run.y - bh / 2, bw, bh, 3)
          ctx.fill()
          ctx.stroke()
        }
      }
      for (const b of bytes) {
        const run = runs[b.runId]
        const fold = reduced
          ? 0.35
          : (Math.sin((time / run.period) * Math.PI * 2 + run.phase) * 0.5 + 0.5) ** 2
        const x = run.cx + b.offset * (1 - fold * 0.86)
        const y = b.y + (run.y - b.y) * fold
        let a = 0.08 + fold * 0.14
        if (pointer.active) {
          const dist = Math.hypot(x - pointer.x, y - pointer.y)
          if (dist < 160) a += (1 - dist / 160) * 0.3
        }
        ctx.fillStyle =
          b.tone > 0.5
            ? `rgba(255, 158, 44, ${a})`
            : `rgba(107, 165, 196, ${a * 0.8})`
        ctx.fillRect(x - b.size / 2, y - b.size / 2, b.size, b.size)
      }
    }

    let raf = 0
    let last = performance.now()
    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      ctx.clearRect(0, 0, w, h)
      for (const run of runs) {
        run.cx += run.vx * dt
        if (run.cx < -60) run.cx = w + 60
        if (run.cx > w + 60) run.cx = -60
      }
      drawDots()
      drawBytes(now / 1000)
      raf = requestAnimationFrame(frame)
    }

    function renderStatic() {
      ctx.clearRect(0, 0, w, h)
      drawDots()
      drawBytes(0)
    }

    function onPointer(e: PointerEvent) {
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.active = true
      if (reduced) renderStatic()
    }
    function onLeave() {
      pointer.active = false
      if (reduced) renderStatic()
    }
    function onVisibility() {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf), (raf = 0)
      } else if (!reduced && !raf) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    }

    let resizeT = 0
    function onResize() {
      window.clearTimeout(resizeT)
      resizeT = window.setTimeout(() => {
        build()
        renderStatic() // always keep a painted frame after a resize
      }, 120)
    }

    build()
    renderStatic() // paint an initial frame immediately — never a blank canvas
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', onResize)
    // Self-heal: re-size the moment the viewport box is actually measured.
    const ro = new ResizeObserver(onResize)
    ro.observe(canvas)

    if (!reduced) {
      document.addEventListener('visibilitychange', onVisibility)
      raf = requestAnimationFrame(frame)
    }

    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      window.clearTimeout(resizeT)
    }
  }, [])

  return <canvas ref={canvasRef} className="byte-field" aria-hidden="true" />
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
