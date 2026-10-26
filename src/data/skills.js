/**
 * Skills, grouped by category (the order here is the order everywhere:
 * the "Built with." grid and the terminal's `stack` command).
 *
 * The grid is generated from projects.js (`tags`) and products.js (`stack`):
 * a technology only shows up when some project or product uses it, and its
 * category is looked up here. A tag that is not listed below falls into "Tools".
 *
 * Everything below is named in existing project tags or in the previous
 * Capabilities / Services copy; nothing new has been added.
 */
export const skills = {
  Languages: ['C++', 'Python', 'Java', 'JavaScript', 'YAML'],
  Frontend: ['React', 'Framer Motion', 'Three.js', 'Tailwind CSS'],
  Backend: ['Node.js', 'FastAPI', 'WebSockets', 'Real-time', 'CRDTs', 'RBAC', 'E2E encryption', 'ECS'],
  'AI & Data': ['LangGraph', 'NLP', 'AI search'],
  Tools: ['Git', 'SFML', 'CLI', 'AWS', 'GCP', 'Azure'],
};

/** Alternative spellings → the name used above (lower-case keys). */
export const aliases = {
  node: 'Node.js',
  nodejs: 'Node.js',
  js: 'JavaScript',
  cpp: 'C++',
  'c plus plus': 'C++',
  reactjs: 'React',
  threejs: 'Three.js',
  tailwind: 'Tailwind CSS',
  'framer-motion': 'Framer Motion',
  'real time': 'Real-time',
  realtime: 'Real-time',
  websocket: 'WebSockets',
};
