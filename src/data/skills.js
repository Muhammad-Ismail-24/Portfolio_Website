/**
 * Core Capabilities — the "Stack" section and the terminal's `stack` command.
 * The key order here is the order everywhere.
 *
 *   items      a slash-separated list (or `text`, a sentence, for `ai`)
 *   highlight  words set in ink at weight 600; everything else is muted
 */
export const skills = {
  languages: {
    title: 'Languages',
    items: ['C++', 'Java', 'Python', 'JavaScript'],
  },
  tools: {
    title: 'Tools & deploy',
    items: ['Git & GitHub', 'Docker', 'Vercel', 'Netlify'],
    highlight: ['Git & GitHub'],
  },
  ai: {
    title: 'AI Agents',
    text: 'LLM agents and retrieval-augmented generation, built with LangGraph and RAG pipelines.',
    highlight: ['LangGraph', 'RAG'],
  },
  frontend: {
    title: 'Frontend',
    items: ['React', 'Tailwind CSS', 'Framer Motion', 'Three.js', 'Vite'],
    highlight: ['React'],
  },
  backend: {
    title: 'Backend & Data',
    items: ['Node.js', 'FastAPI', 'REST API design', 'MongoDB', 'Firebase', 'Supabase'],
    highlight: ['Node.js', 'FastAPI'],
  },
  pipelines: {
    title: 'Autonomous Pipelines',
    items: ['Workflow orchestration', 'ETL & data ingestion', 'CI/CD integration'],
    highlight: ['CI/CD'],
  },
}
