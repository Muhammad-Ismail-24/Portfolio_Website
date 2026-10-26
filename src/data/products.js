/**
 * Products — web apps shown as icons on the portfolio-os desktop.
 * Clicking an icon opens a browser-style window with the product's page.
 *
 * Fields:
 *   id        used in the window's address bar and the terminal (`launch drivefetch`)
 *   word1/2   name split for the solid + hollow heading
 *   glyph     icon drawn on the desktop tile: 'search' | 'pulse' | 'sync'
 *   live/demo links for the buttons ('#' until you have them)
 *   image     screenshot shown in the window (a hatched placeholder until it exists)
 *   stack     optional list of tech shown as "Built with" (hidden when empty)
 *
 * NOTE: name, subtitle and description were carried over from the previous
 * Products section unchanged. Add your real links, screenshots and stack.
 */
export const products = [
  {
    id: 'drivefetch',
    word1: 'Drive',
    word2: 'Fetch',
    subtitle: 'Intelligent File Retrieval',
    description:
      'A blazing-fast cloud-storage aggregator that unifies Google Drive, Dropbox, and OneDrive under a single search interface. Leverages NLP-based intent parsing to surface the right file in under 200 ms.',
    glyph: 'search',
    image: '/assets/products/drivefetch.png',
    live: '#',
    demo: '#',
    stack: [],
  },
  {
    id: 'shifa',
    word1: 'Shi',
    word2: 'fa',
    subtitle: 'AI-Powered Health Assistant',
    description:
      'An end-to-end telemedicine platform that pairs patients with specialists via real-time symptom triage powered by a fine-tuned LLM. Supports multilingual voice input and HIPAA-compliant data handling.',
    glyph: 'pulse',
    image: '/assets/products/shifa.png',
    live: '#',
    demo: '#',
    stack: [],
  },
  {
    id: 'gitsync',
    word1: 'Git',
    word2: 'Sync',
    subtitle: 'Repository Orchestration',
    description:
      'A developer tool that keeps mono-repos, forks, and upstream mirrors perfectly synchronised. Runs conflict-free rebases on a cron and delivers Slack/Discord notifications when human intervention is required.',
    glyph: 'sync',
    image: '/assets/products/gitsync.png',
    live: '#',
    demo: '#',
    stack: [],
  },
];

export const SITE_HOST = 'muhammadismail.is-a.dev'
