'use client';

import { useState, useCallback } from 'react';

export default function CopyProfileUrlButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy profile URL: ', err);
    }
  }, []);

  return (
    <button
      onClick={handleCopy}
      className={`
        px-3.5 py-2 rounded-xl text-xs font-semibold font-mono uppercase tracking-wider
        transition-all duration-300 flex items-center gap-1.5 cursor-pointer border shrink-0
        ${copied
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15'
          : 'bg-accent/10 hover:bg-accent/20 text-accent border-accent/20 hover:border-accent/40'
        }
      `}
      title={copied ? 'Profile URL copied' : 'Copy profile URL to clipboard'}
    >
      {copied ? (
        <>
          <svg className="h-3.5 w-3.5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>Link Copied!</span>
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span>Copy Profile Link</span>
        </>
      )}
    </button>
  );
}
