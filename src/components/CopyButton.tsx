'use client';

import { useState, useCallback } from 'react';

type CopyButtonProps = {
  textToCopy: string;
  label: string;
  successLabel?: string;
  className?: string;
};

export default function CopyButton({
  textToCopy,
  label,
  successLabel = 'Copied!',
  className = '',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, [textToCopy]);

  return (
    <button
      onClick={handleCopy}
      className={`
        w-full text-[10px] font-bold py-2.5 px-4 rounded-lg transition-all duration-200 
        font-mono uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5
        ${copied 
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15'
          : className || 'bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 hover:border-accent/40'
        }
      `}
      title={copied ? 'Copied successfully' : `Copy ${label}`}
    >
      {copied ? (
        <>
          <svg className="h-3.5 w-3.5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>{successLabel}</span>
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
