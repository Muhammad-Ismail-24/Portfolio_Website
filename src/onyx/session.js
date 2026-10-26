import { createMachine, bootProgram } from './machine.js'
import { PROGRAMS } from './programs.js'

/* ════════════════════════════════════════════════════════════════════════════
   ONYX-16 session — the boot menu, the built-in programs and the line editor,
   as an async flow against a tiny `io` interface supplied by the terminal:

     io.print(lines)      append lines  ({ text, tone } | { kind: 'display', rows })
     io.ask(label)        show `label` as the prompt, resolve with the next line typed
                          (rejects with AbortSession when the visitor hits Ctrl+C)
     io.sleep(ms)         a pause (instant under prefers-reduced-motion)
     io.aborted()         true once the visitor aborted

   English first, Urdu alongside. Fault and compiler messages stay English,
   exactly as the C++ prints them.
   ════════════════════════════════════════════════════════════════════════════ */

export class AbortSession extends Error {
  constructor() { super('aborted'); this.name = 'AbortSession' }
}

let seq = 0
export const mkLine = (text, tone = 'out') => ({ text, tone, id: `ox${seq++}` })

const ANSI = /\x1b\[[0-9;]*m/g
const ERR_TAG = /^\[(COMPILER ERROR|HARDWARE FAULT|MOTHERBOARD FAULT|CRITICAL (ERROR|WARNING))\]/

/** machine stdout (with the C++'s escape codes) → terminal lines */
function toLine(raw) {
  const text = raw.replace(/\r/g, '')
  if (text.startsWith('\x1b[36m')) return mkLine(text.replace(ANSI, ''), 'dbg') // verbose cycle log
  if (ERR_TAG.test(text)) return mkLine(text, 'err')
  if (/^(\[BIOS\]|\[BOOTLOADER\]|-{20,})/.test(text)) return mkLine(text, 'dim')
  return mkLine(text.replace(ANSI, ''), 'out')
}

function createOut(io) {
  let pending = ''
  return {
    write(s) { pending += s },
    /** emit finished lines; with `partial`, also the unfinished one (the keyboard prompt) */
    flush(partial = false) {
      const out = []
      let i
      while ((i = pending.indexOf('\n')) >= 0) {
        out.push(toLine(pending.slice(0, i)))
        pending = pending.slice(i + 1)
      }
      if (partial && pending) { out.push(toLine(pending)); pending = '' }
      if (out.length) io.print(out)
    },
  }
}

/* ── help ──────────────────────────────────────────────────────────────────── */
const MNEMONICS = [
  ['AARAM', 'NOP', 'do nothing (a 0x0000 word ends the program)'],
  ['JAMA', 'ADD', 'Rd = Rd + Rs'],
  ['TAFREEK', 'SUB', 'Rd = Rd - Rs'],
  ['ZARAB', 'MUL', 'Rd = Rd * Rs'],
  ['TAQSEEM', 'DIV', 'Rd = Rd / Rs   (divide by zero gives 0)'],
  ['MUWAZANA', 'CMP', 'compare Rd with Rs, sets ZF / NF / PF'],
  ['CHHALANG', 'JMP', 'PC = Rs'],
  ['AGAR_SIFAR', 'JZ', 'if ZF is set: PC = Rs'],
  ['AGAR_MAUJOOD', 'JNZ', 'if ZF is clear: PC = Rs'],
  ['BHARO / DAALO', 'LDR_IMM', 'Rd = a number or a label'],
  ['PARHO', 'LDR', 'Rd = memory[Rs]'],
  ['RAKHO', 'STR', 'memory[Rs] = Rd'],
]

const EXAMPLE = [
  'LDR_IMM R1, 7',
  'LDR_IMM R2, 6',
  'MUL R1, R2          // R1 = 42',
  'LDR_IMM R3, 0x0FF2  // display-integer port',
  'STR R1, R3          // prints 42',
  'NOP                 // end',
]

function printHelp(io) {
  const col = (s, n) => s.padEnd(n)
  io.print([
    mkLine('ONYX-16 INSTRUCTIONS   (Urdu | English | what it does)', 'strong'),
    mkLine(`${col('URDU', 15)}${col('ENGLISH', 10)}WHAT IT DOES`, 'dim'),
    ...MNEMONICS.map(([u, e, d]) => mkLine(`${col(u, 15)}${col(e, 10)}${d}`)),
    mkLine(''),
    mkLine('REGISTERS   R0 … R7 (16-bit).  Rd = destination, Rs = source.', 'dim'),
    mkLine(''),
    mkLine('MEMORY MAP', 'strong'),
    mkLine('0x0000        code   (.HIDAYAT / .CODE)'),
    mkLine('0x0800        data   (.MAWAAD / .DATA)  e.g.  msg: "HI\\n\\0"   or   nums: 1, 2, 3'),
    mkLine('0x0FF0        read a character from the keyboard'),
    mkLine('0x0FF1        write a character to the display'),
    mkLine('0x0FF2        write a number (0-255) to the display'),
    mkLine('0x0FF3        read a number (0-255) from the keyboard'),
    mkLine('The ports carry one byte, so a value above 255 shows its low 8 bits, like the hardware.', 'dim'),
    mkLine(''),
    mkLine('EXAMPLE', 'strong'),
    ...EXAMPLE.map((l, i) => mkLine(`${String(i + 1).padStart(2, '0')} | ${l}`)),
    mkLine(''),
    mkLine('Labels end with ":".  Comments start with //.  Urdu and English mnemonics can be mixed.', 'dim'),
  ])
}

/* ── running a program ────────────────────────────────────────────────────── */
async function execute(io, source, verbose) {
  const out = createOut(io)
  const machine = createMachine({
    out: out.write,
    verbose,
    readLine: async () => {
      out.flush(true) // show "[Hardware Interrupt] Awaiting Keyboard Input:" before waiting
      return io.ask('onyx>')
    },
  })
  const { rows } = await bootProgram(machine, source, {
    shouldStop: () => io.aborted(),
    onYield: () => out.flush(),
  })
  out.flush(true)
  io.print([{ kind: 'display', rows, id: `ox${seq++}` }])
}

async function askDebug(io) {
  io.print([mkLine('Enable cycle-by-cycle debug log? (y/n)')])
  const a = (await io.ask('onyx>')).trim()
  return a[0] === 'y' || a[0] === 'Y'
}

async function askDialect(io) {
  while (true) {
    io.print([mkLine('Dialect: [e]nglish / [u]rdu')])
    const a = (await io.ask('onyx>')).trim().toLowerCase()
    if (a === 'e' || a === 'english') return 'english'
    if (a === 'u' || a === 'urdu') return 'urdu'
    io.print([mkLine('Please type e or u.', 'dim')])
  }
}

async function runBuiltin(io, key) {
  const verbose = await askDebug(io)
  const dialect = await askDialect(io)
  if (key === 'calculator') io.print([mkLine('tip: when the machine asks for input, type a sum like  12 + 5  (operators + - * /)', 'dim')])
  io.print([mkLine('')])
  await execute(io, PROGRAMS[key][dialect], verbose)
}

/* ── the line editor ──────────────────────────────────────────────────────── */
const KNOWN = new Set(['AARAM', 'NOP', 'JAMA', 'ADD', 'TAFREEK', 'SUB', 'ZARAB', 'MUL', 'TAQSEEM', 'DIV', 'MUWAZANA', 'CMP',
  'CHHALANG', 'JMP', 'AGAR_SIFAR', 'JZ', 'AGAR_MAUJOOD', 'JNZ', 'BHARO', 'DAALO', 'LDR_IMM', 'PARHO', 'LDR', 'RAKHO', 'STR'])

/** the assembler is case-sensitive; in the editor, fix the case of mnemonics and registers for the visitor */
function normalizeLine(raw) {
  const ci = raw.indexOf('//')
  const code = ci >= 0 ? raw.slice(0, ci) : raw
  const comment = ci >= 0 ? raw.slice(ci) : ''
  if (/^\s*\./.test(code) || code.includes(':')) return raw // directives, labels and data definitions stay as typed
  let first = true
  const fixed = code.replace(/\S+/g, (tok) => {
    if (first) { first = false; return KNOWN.has(tok.toUpperCase()) ? tok.toUpperCase() : tok }
    return /^\[?r[0-7]\]?,?$/i.test(tok) ? tok.toUpperCase() : tok
  })
  return fixed + comment
}

const EDITOR_CMDS = {
  run: 'run', chalao: 'run',
  list: 'list', dikhao: 'list',
  clear: 'clear', saaf: 'clear',
  undo: 'undo', wapas: 'undo',
  help: 'help', madad: 'help',
  exit: 'exit', bahar: 'exit',
  menu: 'menu',
}

const num = (n) => String(n).padStart(2, '0')

/** resolves true to leave ONYX mode, false to go back to the boot menu */
async function editor(io) {
  const buf = []
  io.print([
    mkLine(''),
    mkLine('WRITE YOUR OWN PROGRAM   (Apna program likho)', 'strong'),
    mkLine('One instruction per line. English and Urdu mnemonics can be mixed freely.', 'dim'),
    mkLine('run (chalao) · list (dikhao) · clear (saaf) · undo (wapas) · help (madad) · menu · exit (bahar)', 'dim'),
  ])
  while (true) {
    const raw = await io.ask(`${num(buf.length + 1)} |`)
    const cmd = EDITOR_CMDS[raw.trim().toLowerCase()]

    if (cmd === 'exit') return true
    if (cmd === 'menu') return false
    if (cmd === 'help') { printHelp(io); continue }
    if (cmd === 'list') {
      io.print(buf.length ? buf.map((l, i) => mkLine(`${num(i + 1)} | ${l}`)) : [mkLine('(empty program — type some instructions)', 'dim')])
      continue
    }
    if (cmd === 'clear') { buf.length = 0; io.print([mkLine('program cleared.', 'dim')]); continue }
    if (cmd === 'undo') {
      if (buf.length) { buf.pop(); io.print([mkLine(`removed line ${num(buf.length + 1)}.`, 'dim')]) } else io.print([mkLine('nothing to undo.', 'dim')])
      continue
    }
    if (cmd === 'run') {
      if (!buf.length) { io.print([mkLine('nothing to run yet — type some instructions first.', 'dim')]); continue }
      const verbose = await askDebug(io)
      io.print([mkLine('')])
      await execute(io, `${buf.join('\n')}\n`, verbose)
      io.print([mkLine('program kept — edit and run again, or exit (bahar).', 'dim')])
      continue
    }
    if (raw.trim() === '') continue
    buf.push(normalizeLine(raw))
  }
}

/* ── the whole thing ──────────────────────────────────────────────────────── */
export async function runOnyx(io) {
  const say = async (text, tone = 'out', ms = 90) => { io.print([mkLine(text, tone)]); await io.sleep(ms) }

  await say('')
  await say('L a z a r u s   M a c h i n a e', 'strong', 160)
  await say('O N Y X  -  1 6', 'strong', 160)
  await say('16-BIT Virtual Turing Architecture', 'out', 220)
  await say('')
  await say('=== BOOTING SILICON PROTOCOL ===', 'strong', 260)
  await say('[BIOS] Initializing Custom OS Interpreter...', 'dim', 220)

  while (true) {
    await say('')
    await say('=======================================', 'out', 40)
    await say('O N Y X   B O O T   M E N U', 'strong', 40)
    await say('=======================================', 'out', 40)
    await say('[1] Calculator (Hisaab)', 'out', 60)
    await say('[2] Hello World printer (Salaam Duniya)', 'out', 60)
    await say('[3] Write your own program (Apna program likho)', 'out', 60)
    await say('help (madad) shows the instruction set · exit (bahar) leaves · Ctrl+C aborts a running program', 'dim', 0)
    await say('')
    await say('Selection (1-3):', 'out', 0)

    const sel = (await io.ask('onyx>')).trim().toLowerCase()
    if (sel === 'exit' || sel === 'bahar' || sel === 'quit' || sel === 'q') break
    if (sel === 'help' || sel === 'madad' || sel === '?') { printHelp(io); continue }

    if (sel === '1') await runBuiltin(io, 'calculator')
    else if (sel === '2') await runBuiltin(io, 'hello')
    else if (sel === '3') { if (await editor(io)) break }
    else { await say('Invalid Selection. System halting', 'err'); break }
  }
  await say('')
  await say('[ONYX] powered down. Back to the shell.', 'dim', 0)
}
