import { projects } from './projects'
import { products } from './products'
import { skills, aliases } from './skills'

/**
 * Builds the skills × projects grid from the data files — nothing is typed in twice.
 *   columns  every project (kind 'project') and product (kind 'app'), in order
 *   groups   [{ category, rows: [{ tech, count, uses: Set<columnKey> }] }]
 *            only categories/technologies that some column uses; rows sorted by count
 *   techCount, usedColumns   for the summary line
 */

const CATEGORIES = Object.keys(skills)
const FALLBACK = 'Tools'

// "Node.js" / "node" / "NodeJS" → one key; the canonical spelling comes from skills.js
const squash = (s) => s.toLowerCase().replace(/[^a-z0-9+#]/g, '')
const canonical = new Map()
CATEGORIES.forEach((cat) => skills[cat].forEach((t) => {
  canonical.set(squash(t), { name: t, category: cat })
  canonical.set(squash(t).replace(/js$/, ''), { name: t, category: cat })
}))
Object.entries(aliases).forEach(([alias, name]) => {
  const hit = canonical.get(squash(name))
  if (hit) canonical.set(squash(alias), hit)
})

function resolve(raw) {
  const hit = canonical.get(squash(raw)) ?? canonical.get(squash(raw).replace(/js$/, ''))
  return hit ?? { name: raw.trim(), category: FALLBACK }
}

export function buildStackGrid() {
  const columns = [
    ...projects.map((p, i) => ({ key: `project:${p.id}`, kind: 'project', id: p.id, index: i, name: p.title, short: p.title.split(' ')[0], tech: p.tags ?? [] })),
    ...products.map((p) => ({ key: `app:${p.id}`, kind: 'app', id: p.id, name: `${p.word1}${p.word2}`, short: `${p.word1}${p.word2}`, tech: p.stack ?? [] })),
  ]

  const techs = new Map() // canonical name → { tech, category, uses }
  columns.forEach((col) => {
    col.tech.forEach((raw) => {
      const { name, category } = resolve(raw)
      if (!techs.has(name)) techs.set(name, { tech: name, category, uses: new Set() })
      techs.get(name).uses.add(col.key)
    })
  })

  const groups = CATEGORIES
    .map((category) => ({
      category,
      rows: [...techs.values()]
        .filter((t) => t.category === category)
        .map((t) => ({ ...t, count: t.uses.size }))
        .sort((a, b) => b.count - a.count || a.tech.localeCompare(b.tech)),
    }))
    .filter((g) => g.rows.length > 0)

  return {
    columns,
    groups,
    techCount: techs.size,
    usedColumns: columns.filter((c) => c.tech.length > 0).length,
    emptyColumns: columns.filter((c) => c.tech.length === 0),
  }
}
