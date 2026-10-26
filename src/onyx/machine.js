import { GraphicsAdapter, Keyboard, MemoryModule, PhosphorusDisplay, PowerSupplyUnit } from './hardware.js'
import { Mainboard } from './mainboard.js'
import { Processor } from './processor.js'
import { Interpreter } from './interpreter.js'

/* ════════════════════════════════════════════════════════════════════════════
   ONYX-16 — the assembled machine (what main() of the C++ does).
   ════════════════════════════════════════════════════════════════════════════ */

/** wait for the browser to paint; falls back to a timer in hidden tabs / non-browser hosts */
export function yieldFrame() {
  return new Promise((resolve) => {
    let done = false
    const finish = () => { if (!done) { done = true; resolve() } }
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(finish)
    setTimeout(finish, 32)
  })
}

/**
 * @param out       (text) => void   — receives what the C++ would cout
 * @param readLine  () => Promise<string> — the visitor's next line (the keyboard suspends on it)
 */
export function createMachine({ out, readLine, verbose = false }) {
  const display = new PhosphorusDisplay()
  const keyboard = new Keyboard(out, readLine)
  const ram = new MemoryModule(out)
  const graphics = new GraphicsAdapter(display)
  const mainboard = new Mainboard(out)
  const processor = new Processor(mainboard, out)
  const supply = new PowerSupplyUnit(500.0, mainboard, out)
  mainboard.addComponents(processor, ram, graphics, supply, keyboard)
  processor.setVerbose(verbose)
  return { display, keyboard, ram, graphics, mainboard, processor, supply, interpreter: new Interpreter(out), out }
}

/**
 * Compile + flash + run + dump, exactly like main(). Cycles run in a loop that
 * hands control back to the browser every `yieldEvery` cycles.
 * Resolves with { cycles }.
 */
export async function bootProgram(machine, source, { yieldEvery = 200, onYield, shouldStop } = {}) {
  const { processor, mainboard, interpreter, ram, out, display } = machine
  interpreter.loadProgramAndFlash(source, ram)

  let cycles = 0
  while (!processor.isHalted() && mainboard.checkSystemPower()) {
    if (shouldStop?.()) break
    await processor.excuteCycle()
    cycles++
    if (cycles % yieldEvery === 0) {
      if (onYield) onYield()
      await yieldFrame()
    }
  }

  out('-------------------------------------------------------------\n\n')
  processor.printStateDump()
  return { cycles, rows: display.rows() }
}
