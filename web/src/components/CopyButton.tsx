import { useState } from 'react'
import { CopyIcon, CheckIcon } from './icons'

export function CopyButton({ text, label = 'copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <button className="btn cli-copy" onClick={onCopy} aria-label="Copy command to clipboard">
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? 'copied' : label}
    </button>
  )
}
