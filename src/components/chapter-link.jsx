"use client"

export default function ChapterLink({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-body border-b border-[var(--accent)]/40 pb-1 text-sm uppercase tracking-[0.14em] text-[var(--accent)] transition-colors hover:border-[var(--accent)]"
    >
      {children}
    </button>
  )
}
