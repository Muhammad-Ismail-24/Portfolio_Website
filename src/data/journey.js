/**
 * Your story as a git history — rendered as `git log --graph` in the
 * "Commit History." section and printed by `git log` in the terminal.
 *
 * List commits OLDEST FIRST. Each commit:
 *   branch   'main' or any branch name (a new name forks a new lane off main)
 *   date     free text shown on the right ('Oct 2026', 'Fall 2026', …)
 *   message  one line, conventional-commit style reads well (feat:, ship:, …)
 *   detail   optional longer text shown when the row is opened
 *   tag      optional label chip, e.g. 'v2.0'
 *   merges   on a 'main' commit: the branch it merges back in
 *
 * DRAFT: built from what you've mentioned so far. Every line in [brackets]
 * is a placeholder — replace it with the real thing (or delete the commit).
 */
export const journey = [
  {
    branch: 'main',
    date: '[year]',
    message: 'init: started university — [your degree, your university]',
    detail: '[Where you study and what drew you to computer science.]',
    tag: 'v0.1',
  },
  {
    branch: 'projects',
    date: '[date]',
    message: 'feat: [your first real project]',
    detail: '[What it was, what you used, what you learned.]',
  },
  {
    branch: 'main',
    date: '[date]',
    message: 'merge: shipped [your first real project]',
    merges: 'projects',
  },
  {
    branch: 'coursework',
    date: 'Fall 2026',
    message: 'feat: Data Structures — stacks, queues, trees, BSTs',
    detail: 'Stacks and their applications, queues, binary trees and binary search trees.',
  },
  {
    branch: 'coursework',
    date: 'Fall 2026',
    message: 'feat: Digital Logic Design — K-maps through SR latches',
  },
  {
    branch: 'coursework',
    date: 'Fall 2026',
    message: 'feat: SDA group project — Business Leads Management System (CRM)',
    detail: 'Use cases, domain model and system sequence diagrams for a CRM, integrated with Java code.',
  },
  {
    branch: 'hackathons',
    date: 'Oct 2026',
    message: 'feat: HackerRank Orchestrate 26 — data-deletion audit agent',
    detail: 'Built an agent that audits whether deleted user data still exists anywhere, for the "Ghost Data Still Exists" problem: 518 cases.',
  },
  {
    branch: 'hackathons',
    date: 'Oct 2026',
    message: 'ship: deterministic audit pipeline submitted',
    detail: 'Chose a deterministic core over an LLM layer for the submission.',
  },
  {
    branch: 'main',
    date: 'Oct 2026',
    message: 'merge: Orchestrate 26 submission',
    merges: 'hackathons',
  },
  {
    branch: 'main',
    date: 'Oct 2026',
    message: 'release: portfolio v2 — project network, terminal, portfolio-os',
    detail: 'This site: projects as a live network, a hidden terminal, and products as apps on a tiny OS.',
    tag: 'v2.0',
  },
]

export const GITHUB_USER = 'Muhammad-Ismail-24'

/** Stable short "hash" for a commit message, so rows look like real commits. */
export function shortHash(text) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7)
}
