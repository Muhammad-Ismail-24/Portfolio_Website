/**
 * The site's signature heading: one solid word, one hollow (outlined) word.
 */
export default function SplitHeading({ solid, hollow, as: Tag = 'h2', className = '' }) {
  return (
    <Tag className={`flex flex-row flex-wrap gap-x-[0.25em] font-black tracking-tighter leading-[0.9] text-ink m-0 ${className}`}>
      <span>{solid}</span>
      <span className="text-hollow">{hollow}</span>
    </Tag>
  )
}
