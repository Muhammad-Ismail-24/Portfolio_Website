/**
 * Layout — Global layout shell.
 * Background is now handled by StaticNeuromesh as a self-contained fixed div.
 */
export default function Layout({ children }) {
  return (
    <div className="relative z-10 w-full max-w-[1920px] mx-auto">
      {children}
    </div>
  )
}
