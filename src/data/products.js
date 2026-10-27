/**
 * Products — web apps shown as icons on the portfolio-os desktop.
 * Clicking an icon opens a browser-style window with the product's page.
 *
 * Fields:
 *   id        used in the window's address bar and the terminal (`launch drivefetch`)
 *   word1/2   name split for the solid + hollow heading
 *   subtitle  one-line tagline
 *   glyph     icon drawn on the desktop tile: 'car' | 'pulse' | 'agent'
 *   live      the deployed site (opens in a new tab)
 *   demo      optional external video link — adds a "Video Demo" button (null = hidden)
 *   video     optional demo video played inside the window as the first slide:
 *             YouTube / Vimeo / Google Drive link or a direct .mp4 (null = none)
 *   images    screenshots, in display order: shot('file-name', 'caption'). Files live
 *             in public/assets/products/ (.webp). More than one gets arrows + dots.
 *   stack     optional "Built with" tags (only where the site itself states them)
 */
const shot = (file, caption) => ({ src: `/assets/products/${file}.webp`, caption })

export const products = [
  {
    id: 'drivefetch',
    word1: 'Drive',
    word2: 'Fetch',
    subtitle: 'AI Used-Car Search · Pakistan',
    description:
      'A used-car search engine for Pakistan. Type what you want like a sentence and it searches seven listing sites at once (PakWheels, OLX, Gari.pk, Drive.pk and more), reading every ad to flag suspicious claims, check the asking price against similar live ads and catch risks like duplicate files and pressure tactics. An AI Matchmaker turns your budget, family and commute into three models with live ads, backed by an assistant chat and ownership-cost calculators.',
    glyph: 'car',
    live: 'https://drivefetch.vercel.app/',
    demo: null,
    video: null,
    images: [
      shot('drivefetch', 'Search the way you would say it'),
      shot('drivefetch-2', 'Condition scanner flagging a risky ad'),
      shot('drivefetch-3', 'AI Matchmaker: three models that fit your brief'),
      shot('drivefetch-4', 'Assistant chat for buying questions'),
    ],
    stack: [],
  },
  {
    id: 'shifa',
    word1: 'Shi',
    word2: 'fa',
    subtitle: 'Urdu AI Health Assistant',
    description:
      'A voice-first health assistant for Urdu speakers. Describe how you feel in your own words, by voice or text, and Shifa checks the symptoms against a curated medical knowledge base, explains a preliminary assessment in plain Urdu, suggests basic over-the-counter options for common conditions and finds the nearest hospitals and clinics from your location. Built as a hackathon project: it gives informational guidance, not a diagnosis, and is not for emergencies.',
    glyph: 'pulse',
    live: 'https://shifa-nine-gilt.vercel.app/',
    demo: null,
    video: null,
    images: [
      shot('shifa', 'Voice-first home screen in Urdu'),
      shot('shifa-2', 'Speak your symptoms in natural Urdu'),
      shot('shifa-3', 'Safety notice and call to action'),
    ],
    stack: [],
  },
  {
    id: 'agenthack',
    word1: 'Agent',
    word2: 'Hack',
    subtitle: 'Autonomous AI Sales Agent',
    description:
      'An autonomous AI sales team. Give it your company and your ideal customer and nine AI agents run the pipeline: they find matching leads, research and score each one from 0 to 100 with a written rationale, draft and send personalised outreach, classify replies, book meetings and chase the silent ones. A live dashboard shows every lead moving through the funnel.',
    glyph: 'agent',
    live: 'https://agent-hack-ai-sales-agent.vercel.app/',
    demo: null,
    video: null,
    images: [
      shot('agenthack', 'Landing page with the live pipeline'),
      shot('agenthack-2', 'Nine agents, one workflow'),
      shot('agenthack-3', 'Dashboard: score, next step and inbox'),
      shot('agenthack-4', 'Pricing tiers'),
    ],
    stack: ['Gemini', 'LangGraph', 'Firestore'],
  },
];

export const SITE_HOST = 'muhammadismail.is-a.dev'
