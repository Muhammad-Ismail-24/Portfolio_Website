import { EVENTS, emit, scrollToId } from '../../utils/bus'

// Copyright, the terminal hint, back to top
export default function Footer() {
  return (
    <footer className="relative z-10 w-full px-6 md:px-16 lg:px-24 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 border-t-2 border-ink">
        <p className="text-sm font-medium text-ink">© {new Date().getFullYear()} Muhammad Ismail</p>

        <button
          type="button"
          onClick={() => emit(EVENTS.openTerminal)}
          className="group inline-flex items-center gap-2 self-start md:self-auto min-h-[44px] font-mono text-xs tracking-[0.14em] uppercase text-muted hover:text-ink transition-colors"
        >
          <span className="hidden md:inline">Press</span>
          <kbd className="inline-flex items-center justify-center min-w-[26px] h-[26px] px-1.5 border-2 border-ink text-ink text-[12px] font-bold shadow-[2px_2px_0_0_var(--color-ink)] group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:shadow-[1px_1px_0_0_var(--color-ink)] transition-all">/</kbd>
          <span className="md:hidden">Open the terminal</span>
          <span className="hidden md:inline">to open the terminal</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToId('top')}
          className="self-start md:self-auto min-h-[44px] text-sm font-semibold text-ink hover:opacity-70"
        >
          Back to top ↑
        </button>
      </div>
    </footer>
  )
}
