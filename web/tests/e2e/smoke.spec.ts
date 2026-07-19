import { expect, test, type Page } from '@playwright/test'

/**
 * Interaction smoke for the jetpack-compress landing. Proves the controls do
 * something real: nav/anchor links scroll, every CTA and the /system-card link
 * resolve, the pipeline replays, the Adler gauge sweeps to its number, the SIMD
 * race runs (and re-runs on demand), the CLI copy button copies, the
 * cursor-reactive hero responds to the pointer, scroll reveals resolve, and
 * 375px has no user-scrollable horizontal overflow — all with a clean console.
 */

interface Instrumented extends Page {
  __consoleIssues?: string[]
  __pageErrors?: string[]
}

function instrument(page: Page) {
  const p = page as Instrumented
  p.__consoleIssues = []
  p.__pageErrors = []
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') {
      p.__consoleIssues?.push(`${m.type()}: ${m.text()}`)
    }
  })
  page.on('pageerror', (e) => p.__pageErrors?.push(e.message))
}

function assertClean(page: Page) {
  const p = page as Instrumented
  expect(p.__consoleIssues ?? [], 'console should be free of errors/warnings').toEqual([])
  expect(p.__pageErrors ?? [], 'no uncaught page errors').toEqual([])
}

/** Poll until section `id` has been scrolled into the upper portion of the viewport. */
async function expectScrolledTo(page: Page, id: string) {
  await expect
    .poll(
      () =>
        page.evaluate((target) => {
          const el = document.getElementById(target)
          if (!el) return Number.POSITIVE_INFINITY
          return el.getBoundingClientRect().top / window.innerHeight
        }, id),
      { message: `should scroll ${id} into view`, timeout: 8_000 },
    )
    .toBeLessThan(0.6)
}

test.describe('jetpack-compress interaction smoke', () => {
  test.beforeEach(({ page }) => instrument(page))

  test('nav anchor links scroll to each act', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const nav = page.locator('.nav-links')
    for (const [label, id] of [
      ['Problem', 'problem'],
      ['Solution', 'solution'],
      ['Inside', 'inside'],
      ['Proof', 'proof'],
    ] as const) {
      await nav.getByRole('link', { name: label, exact: true }).click()
      await expectScrolledTo(page, id)
    }
    assertClean(page)
  })

  test('hero CTAs and the System Card link resolve', async ({ page }) => {
    await page.goto('/')

    const source = page.getByRole('link', { name: /View the source/i }).first()
    await expect(source).toHaveAttribute('href', /github\.com\/yadava5\/jetpack-compress/)
    await expect(source).toHaveAttribute('target', '_blank')

    const card = page.getByRole('link', { name: /Read the System Card/i }).first()
    await expect(card).toHaveAttribute('href', '/system-card/')
    assertClean(page)
  })

  test('/system-card returns 200 and renders', async ({ page, request }) => {
    const res = await request.get('/system-card/')
    expect(res.status()).toBe(200)
    expect(await res.text()).toMatch(/System Card/i)

    await page.goto('/system-card/')
    await expect(page).toHaveTitle(/System Card/i)
    await expect(page.locator('#root')).not.toBeEmpty()
    assertClean(page)
  })

  test('the Adler gauge sweeps in and shows its measured multiple', async ({ page }) => {
    await page.goto('/')
    await page.locator('.gauge-card').scrollIntoViewIfNeeded()

    // The dial arc gets the `in` class once it enters the viewport.
    await expect(page.locator('.gauge-svg')).toHaveClass(/\bin\b/)
    // The hero multiple (CountUp) rolls up and settles on 2.8x. Scope to the
    // gauge card — ParallelTimeline reuses the .gauge-mult class too.
    const mult = page.locator('.gauge-card .gauge-mult')
    await mult.scrollIntoViewIfNeeded()
    await expect(mult).toContainText(/2\.8×/, { timeout: 8_000 })
    assertClean(page)
  })

  test('the SIMD race runs to completion and re-runs on demand', async ({ page }) => {
    await page.goto('/')

    const race = page.locator('.viz-card', { has: page.getByRole('button', { name: /Run the race again/i }) })
    await race.scrollIntoViewIfNeeded()

    const scalarFill = race.locator('.race-fill.scalar')
    const vectorFill = race.locator('.race-fill.vector')
    const widthPct = async (loc: ReturnType<Page['locator']>) =>
      loc.evaluate((el) => {
        const parent = (el.parentElement as HTMLElement).getBoundingClientRect().width
        return parent > 0 ? (el.getBoundingClientRect().width / parent) * 100 : 0
      })

    // Auto-run on scroll-in fills both lanes to 100%.
    await expect.poll(() => widthPct(scalarFill), { timeout: 8_000 }).toBeGreaterThan(98)
    await expect.poll(() => widthPct(vectorFill), { timeout: 8_000 }).toBeGreaterThan(98)

    // Re-running has a real effect: the button resets and drives the lanes
    // back to full again.
    const runAgain = page.getByRole('button', { name: /Run the race again/i })
    await runAgain.click()
    await expect.poll(() => widthPct(scalarFill), { timeout: 8_000 }).toBeGreaterThan(98)
    await expect(runAgain).toBeEnabled()
    assertClean(page)
  })

  test('the CLI copy button copies the command', async ({ page }) => {
    await page.goto('/')
    const copy = page.getByRole('button', { name: /Copy command to clipboard/i })
    await copy.scrollIntoViewIfNeeded()
    await copy.click()

    // Button acknowledges the copy.
    await expect(copy).toContainText(/copied/i)
    // And the clipboard actually holds the command.
    const clip = await page.evaluate(() => navigator.clipboard.readText())
    expect(clip).toMatch(/jetpack-compress\.jar/)
    expect(clip).toMatch(/add-modules=jdk\.incubator\.vector/)
    assertClean(page)
  })

  test('scroll reveals resolve to visible', async ({ page }) => {
    await page.goto('/')
    // Drive the first reveal wrapper in the proof act into view and confirm
    // it resolves (the scroll-reveal is the page's core entrance interaction).
    const reveal = page.locator('#proof .reveal').first()
    await reveal.scrollIntoViewIfNeeded()
    await expect(reveal).toHaveClass(/\bin\b/)
    await expect
      .poll(() => reveal.evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 6_000 })
      .toBeGreaterThan(0.9)
    assertClean(page)
  })

  test('the pipeline diagram plays and the replay control re-runs it', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('reduced'), 'replay control is motion-only')
    await page.goto('/')

    const pipe = page.locator('.pipe-flow')
    await pipe.scrollIntoViewIfNeeded()
    // Auto-plays on scroll-in.
    await expect(pipe).toHaveClass(/\bplay\b/)
    await expect(page.locator('.pipe-packets')).toBeAttached()

    // Replay re-runs it (the svg is re-keyed and returns to the playing state).
    await page.getByRole('button', { name: /Replay the pipeline animation/i }).click()
    await expect(page.locator('.pipe-flow')).toHaveClass(/\bplay\b/)
    await expect(page.locator('.pipe-packets')).toBeAttached()
    assertClean(page)
  })

  test('the cursor-reactive hero responds to the pointer', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('reduced'), 'cursor interactions are motion-only')
    await page.goto('/')

    // Char-field: hovering the wordmark lifts nearby letters (--w > 0).
    await page.locator('.hero-title').hover()
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const chars = Array.from(document.querySelectorAll<HTMLElement>('.hero-title .rx-char'))
            return Math.max(0, ...chars.map((c) => Number(c.style.getPropertyValue('--w') || 0)))
          }),
        { message: 'a letter near the cursor should weight up', timeout: 4_000 },
      )
      .toBeGreaterThan(0)

    // Tilt: hovering the hero viz card toggles the tilt state.
    await page.locator('.hero-viz').hover()
    await expect(page.locator('.hero-viz')).toHaveClass(/\btilt-on\b/)

    // Magnetic: hovering the primary CTA wrapper toggles the magnet state.
    await page.locator('.hero-cta .mag').hover()
    await expect(page.locator('.hero-cta .mag')).toHaveClass(/\bmag-on\b/)
    assertClean(page)
  })

  test('no user-scrollable horizontal overflow at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    for (const id of ['top', 'problem', 'solution', 'inside', 'proof', 'try', 'portfolio']) {
      await page.evaluate((target) => {
        document.getElementById(target)?.scrollIntoView({ block: 'start', behavior: 'auto' })
      }, id)
      const report = await page.evaluate(() => {
        // The page must not scroll horizontally even when nudged.
        window.scrollTo(400, window.scrollY)
        const scrolledX = window.scrollX
        window.scrollTo(0, window.scrollY)
        const iw = document.documentElement.clientWidth
        const uncontained: string[] = []
        for (const el of Array.from(document.body.querySelectorAll('*'))) {
          const r = el.getBoundingClientRect()
          if (!r.width || r.right <= iw + 1) continue
          let n = el.parentElement
          let contained = false
          while (n) {
            const o = getComputedStyle(n).overflowX
            if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') {
              contained = true
              break
            }
            n = n.parentElement
          }
          if (!contained) uncontained.push((el.textContent ?? '').trim().slice(0, 30) || el.tagName)
        }
        return { scrolledX, uncontained }
      })
      expect(report.scrolledX, `#${id} must not scroll horizontally`).toBe(0)
      expect(report.uncontained, `#${id} has content spilling past the viewport`).toEqual([])
    }
    assertClean(page)
  })
})
