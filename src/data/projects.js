/**
 * Featured projects — shown as hub nodes in the project network,
 * in the "List" view, and in the hidden terminal (`ls projects`).
 *
 * The order here is the order of the network's spine: node 01 links to 02,
 * 02 to 03, and so on. ← / → in an open card hops along it.
 *
 * NOTE: these five entries were carried over unchanged from the previous
 * carousel. Swap in your real projects, screenshots and links before shipping.
 * `tags` only lists tech named in each description.
 */
export const projects = [
  {
    id: 'sfml-engine',
    title: 'SFML Game Engine',
    blurb: '2D engine · ECS · level editor',
    description:
      'A lightweight 2D game engine built on top of SFML with an entity-component system, sprite batching, and a built-in level editor. Supports tilemaps, physics collisions, and particle effects out of the box.',
    tags: ['C++', 'SFML', 'ECS'],
    image: '/assets/projects/sfml-engine.png',
    demo: '#',
    source: '#',
  },
  {
    id: 'neurachat',
    title: 'NeuraChat',
    blurb: 'Real-time chat · NLP pipeline',
    description:
      'A real-time chat application powered by WebSockets and a custom NLP pipeline that auto-summarises conversations, extracts action items, and provides sentiment analysis on the fly.',
    tags: ['WebSockets', 'NLP'],
    image: '/assets/projects/neurachat.png',
    demo: '#',
    source: '#',
  },
  {
    id: 'cloudforge',
    title: 'CloudForge CLI',
    blurb: 'Multi-cloud provisioning CLI',
    description:
      'A developer-first CLI tool for provisioning and tearing down cloud infrastructure across AWS, GCP, and Azure with a single declarative YAML config. Includes drift detection and cost estimation.',
    tags: ['CLI', 'AWS', 'GCP', 'Azure', 'YAML'],
    image: '/assets/projects/cloudforge.png',
    demo: '#',
    source: '#',
  },
  {
    id: 'pixelboard',
    title: 'PixelBoard',
    blurb: 'Collaborative pixel canvas · CRDTs',
    description:
      'A collaborative, real-time pixel art canvas inspired by r/place. Supports up to 10 000 concurrent users via CRDTs, with a replay timeline that lets you scrub through the entire canvas history.',
    tags: ['CRDTs', 'Real-time'],
    image: '/assets/projects/pixelboard.png',
    demo: '#',
    source: '#',
  },
  {
    id: 'medvault',
    title: 'MedVault',
    blurb: 'Encrypted records vault · AI search',
    description:
      'A HIPAA-compliant medical records vault with end-to-end encryption, role-based access control, and an AI-assisted search that surfaces relevant patient history across millions of documents.',
    tags: ['E2E encryption', 'RBAC', 'AI search'],
    image: '/assets/projects/medvault.png',
    demo: '#',
    source: '#',
  },
];
