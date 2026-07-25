// Shared setup for the browser checks.
//
// These drive the real built app in Chromium, which is the only way to catch the
// things that keep going wrong here: a rule that does not match, a colour that
// collides, a table that grows wider than its container, a value formatted two
// different ways on two tabs. `npm test` covers the pure logic; this covers what
// only exists once it is rendered.
//
// Playwright is NOT a dependency of this project – it is whatever the machine
// happens to have. If it is missing the run says so and exits 0, so a checkout
// without it is not a broken build.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const SHOTS = join(ROOT, 'test', 'browser', 'screenshots')

const CANDIDATES = [
  'playwright',
  '/opt/node22/lib/node_modules/playwright/index.js',
  '/usr/lib/node_modules/playwright/index.js',
  '/usr/local/lib/node_modules/playwright/index.js'
]

export async function loadChromium() {
  for (const c of CANDIDATES) {
    try {
      const mod = await import(c)
      const pw = mod.default || mod
      if (pw && pw.chromium) return pw.chromium
    } catch (_) {
      /* try the next one */
    }
  }
  return null
}

/**
 * Build once, serve the build, and hand back the URL vite actually printed –
 * which carries the base path, so this keeps working if the repository (and
 * with it the base) is ever renamed again.
 */
export function startPreview(port = 4330) {
  return new Promise((resolve, reject) => {
    // No --strictPort on purpose: vite moves to the next free port if this one
    // is taken, and the URL is read from what it actually printed.
    const proc = spawn('npm', ['run', 'preview', '--', '--port', String(port)], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe']
    })
    let out = ''
    const done = setTimeout(() => reject(new Error('preview did not start:\n' + out)), 30000)
    proc.stdout.on('data', (b) => {
      out += b.toString()
      const m = out.match(/(http:\/\/localhost:\d+\/\S*)/)
      if (m) {
        clearTimeout(done)
        resolve({ url: m[1].replace(/\/?$/, '/'), stop: () => proc.kill('SIGTERM') })
      }
    })
    proc.stderr.on('data', (b) => { out += b.toString() })
    proc.on('exit', (code) => { clearTimeout(done); reject(new Error('preview exited with ' + code + '\n' + out)) })
  })
}

/** Collects pass/fail lines so the runner can report one summary at the end. */
export function reporter(name) {
  const fails = []
  console.log('\n' + name)
  return {
    fails,
    ok(cond, msg) {
      console.log((cond ? '  PASS ' : '  FAIL ') + msg)
      if (!cond) fails.push(name + ': ' + msg)
      return cond
    }
  }
}

export function shotDir() {
  rmSync(SHOTS, { recursive: true, force: true })
  mkdirSync(SHOTS, { recursive: true })
  return SHOTS
}

/** WCAG contrast – small enough to keep here rather than pull in a dependency. */
export function contrast(a, b) {
  const lum = (hex) => {
    const [r, g, bl] = [0, 2, 4].map((i) => parseInt(hex.replace('#', '').slice(i, i + 2), 16) / 255)
    const f = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl)
  }
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

export const STORAGE_KEY = 'ewl737:data:v1'
export const hasBuild = () => existsSync(join(ROOT, 'dist', 'index.html'))
