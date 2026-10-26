/**
 * "What I offer" — the four offerings, and the "How I work" steps.
 *
 * `title` and `description` are the text from the previous Services section.
 * `tools` are the technologies named in those descriptions.
 * `proofId` is the id of a project (projects.js) or product (products.js) that
 * the "See it in →" link opens. `null` means no project in the data fits yet:
 * the link then points at this site instead (`proofSelf`).
 *
 * Lines marked `// DRAFT — review` were written for this section from the
 * existing copy (the descriptions above, the About and Contact text). Edit freely.
 */

// DRAFT — review (adapted from the Contact section's previous paragraph)
export const servicesIntro = 'Autonomous multi-agent pipelines or a robust full-stack application — I’m ready to bring your technical vision to life.'

export const services = [
  {
    id: 'agents',
    title: 'Multi-Agent AI Systems',
    description:
      'Architecting autonomous LLM workflows using LangGraph and vector retrieval to orchestrate complex, collaborative problem-solving and autonomous B2B pipelines.',
    // DRAFT — review
    deliverables: [
      'Autonomous LLM workflows',
      'Vector retrieval',
      'Collaborative problem-solving between agents',
      'Autonomous B2B pipelines',
    ],
    tools: ['LangGraph', 'Vector retrieval'],
    proofId: 'neurachat', // DRAFT — review: closest existing project (NLP pipeline); none is multi-agent yet
    art: 'agents',
  },
  {
    id: 'web',
    title: 'Full-Stack Web Applications',
    description:
      'Building scalable, high-performance web applications using modern frameworks like React, Node.js, and FastAPI with robust database management.',
    // DRAFT — review
    deliverables: [
      'Scalable, high-performance web apps',
      'Frontend and backend',
      'RESTful APIs',
      'Database management',
    ],
    tools: ['React', 'Node.js', 'FastAPI'],
    proofId: 'shifa', // DRAFT — review
    art: 'web',
  },
  {
    id: 'automation',
    title: 'Autonomous Automations',
    description:
      'Designing end-to-end automation scripts and CI/CD pipelines to streamline data ingestion, ETL processes, and repetitive corporate workflows.',
    // DRAFT — review
    deliverables: [
      'End-to-end automation scripts',
      'CI/CD pipelines',
      'Data ingestion and ETL',
      'Repetitive workflows, automated',
    ],
    tools: ['CI/CD', 'ETL'],
    proofId: 'gitsync', // DRAFT — review
    art: 'automation',
  },
  {
    id: 'sites',
    title: 'Corporate & Portfolio Sites',
    description:
      'Crafting premium, responsive, and highly interactive digital experiences with Framer Motion, Three.js, and pixel-perfect Tailwind CSS styling.',
    // DRAFT — review
    deliverables: [
      'Premium, responsive layouts',
      'Highly interactive experiences',
      'Pixel-perfect styling',
    ],
    tools: ['Framer Motion', 'Three.js', 'Tailwind CSS'],
    proofId: null, // no corporate or portfolio site in the data yet — "See it in" points at this site
    proofSelf: true,
    art: 'sites',
  },
]

// DRAFT — review (each line is adapted from the About and Contact copy)
export const workSteps = [
  { title: 'Understand', line: 'Get to the technical vision behind the project.' },
  { title: 'Design', line: 'Shape the system architecture before writing code.' },
  { title: 'Build', line: 'Write clean, efficient code with modern technologies.' },
  { title: 'Ship', line: 'Deliver scalable, robust applications.' },
]
