import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource-variable/inter'
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/jetbrains-mono'
import './index.css'
import './visuals.css'
import './layout.css'
import './interactions.css'
import './compress.css'

import App from './App'
import { CompressApp } from './compress/CompressApp'

const root = document.getElementById('root')
if (!root) throw new Error('#root not found')

/**
 * Tiny path router. Vercel rewrites every non-static path to index.html, so we
 * branch here: `/app` (and `/compress`) render the real in-browser tool, and
 * everything else renders the landing. Navigation between the two is a plain
 * full-page link — no client-side router dependency needed.
 */
const path = window.location.pathname.replace(/\/+$/, '')
const isTool = path === '/app' || path === '/compress'

createRoot(root).render(<StrictMode>{isTool ? <CompressApp /> : <App />}</StrictMode>)
