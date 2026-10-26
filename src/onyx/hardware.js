/* ════════════════════════════════════════════════════════════════════════════
   ONYX-16 — the passive hardware: memory, registers, ALU, keyboard, display,
   graphics adapter, power supply. A line-by-line port of the C++ classes of
   the same names. Every class reports through `out(text)`, which receives the
   exact text the C++ would have sent to cout (including its escape codes).
   ════════════════════════════════════════════════════════════════════════════ */

/** std::hex on an integer: lowercase, no padding, negative ints as 32-bit two's complement */
export const hex = (n) => (n >>> 0).toString(16)

/** a C++ `cout << float` (precision 6, %g-style) */
export function fmtFloat(x) {
  if (x === 0) return '0'
  let s = x.toPrecision(6)
  if (s.includes('.') && !s.includes('e')) s = s.replace(/0+$/, '').replace(/\.$/, '')
  return s
}

/** UTF-8 bytes of a JS string — the C++ works on std::string bytes */
export const toBytes = (s) => Array.from(new TextEncoder().encode(s))

/* ── Memory Module ─────────────────────────────────────────────────────────── */
export class MemoryModule {
  constructor(out) {
    this.out = out
    this.memory = new Uint8Array(3840)
  }

  read(address) {
    if (address >= 0x0000 && address <= 0x0EFF) return this.memory[address]
    this.out('[HARDWARE FAULT] Segmentation Fault : Read Out of Bounds\n')
    return 0xFF
  }

  write(address, data) {
    if (address >= 0x0000 && address <= 0x0EFF) {
      this.memory[address] = data & 0xFF
      return
    }
    this.out('[HARDWARE FAULT] Segmentation Fault : Write Out of Bounds\n') // the data is discarded
  }

  loadRawBinary(address, word) {
    if (address + 1 <= 0x0EFF) {
      this.memory[address] = (word >> 8) & 0xFF
      this.memory[address + 1] = word & 0xFF
    }
  }
}

/* ── Register Bank ─────────────────────────────────────────────────────────── */
export class RegisterBank {
  constructor() {
    this.R = new Uint16Array(8)
    this.PC = 0
    this.IR = 0
    this.FLAGS = 0
  }

  readR(index) { return index >= 0 && index <= 7 ? this.R[index] : 0 }
  writeR(index, data) { if (index >= 0 && index <= 7) this.R[index] = data & 0xFFFF }
  readPC() { return this.PC }
  writePC(data) { this.PC = data & 0xFFFF }
  readIR() { return this.IR }
  writeIR(data) { this.IR = data & 0xFFFF }
  readFLAGS() { return this.FLAGS }

  // ZF / NF / PF are mutually exclusive; HF (0x80) is never touched by them
  setZF() { this.FLAGS = (this.FLAGS | 0x01) & ~0x02 & ~0x04 & 0xFF }
  clearZF() { this.FLAGS = this.FLAGS & ~0x01 & 0xFF }
  setNF() { this.FLAGS = (this.FLAGS | 0x02) & ~0x01 & ~0x04 & 0xFF }
  setPF() { this.FLAGS = (this.FLAGS | 0x04) & ~0x01 & ~0x02 & 0xFF }
  setHF() { this.FLAGS = (this.FLAGS | 0x80) & 0xFF }
}

/* ── Arithmetic Logic Unit ─────────────────────────────────────────────────── */
export const OP = { ADD: 0x01, SUB: 0x02, MUL: 0x03, DIV: 0x04, CMP: 0x0A, NONE: 0xFF }

export class ArithmeticLogicUnit {
  invoke(opcode, A, B, rBank) {
    let result = 0x0000

    if (opcode === 0x01) result = (A + B) & 0xFFFF
    else if (opcode === 0x02) result = (A - B) & 0xFFFF
    else if (opcode === 0x03) result = Math.imul(A, B) & 0xFFFF // uint16 * uint16 promotes to int in C++
    else if (opcode === 0x04) result = B === 0x0000 ? 0x0000 : Math.floor(A / B)
    else if (opcode === 0x0A) {
      if (A === B) rBank.setZF()
      else if (A < B) rBank.setNF()
      else if (A > B) rBank.setPF()
      return 0x0000 // CMP: no numeric result, ZF only changes through the flags above
    }

    if (result === 0x0000) rBank.setZF()
    else rBank.clearZF()
    return result
  }
}

/* ── Keyboard ──────────────────────────────────────────────────────────────── */
/**
 * A FIFO of input bytes. When it runs dry it raises a [Hardware Interrupt] and
 * *suspends* until the host hands over the visitor's next line (`readLine`
 * returns a promise). Typed input is enqueued followed by a space delimiter.
 */
export class Keyboard {
  constructor(out, readLine) {
    this.out = out
    this.readLine = readLine
    this.buffer = []
  }

  pendingInput() { return this.buffer.length > 0 }

  /** block until the buffer starts with a non-space byte */
  async fill() {
    while (true) {
      if (!this.pendingInput()) {
        this.out('[Hardware Interrupt] Awaiting Keyboard Input: ')
        const line = await this.readLine()
        const bytes = toBytes(String(line ?? '')).slice(0, 499) // char buffer[500]
        const nul = bytes.indexOf(0)
        this.buffer = (nul >= 0 ? bytes.slice(0, nul) : bytes).concat(0x20)
      }
      while (this.buffer.length > 0 && this.buffer[0] === 0x20) this.buffer.shift() // discard leading spaces
      if (this.buffer.length > 0) break
    }
  }

  async readChar() {
    await this.fill()
    return this.buffer.shift()
  }

  async readInt() {
    await this.fill()
    let num = 0
    let count = 0
    for (let k = 0; k < this.buffer.length && count < 19; k++) {
      const c = this.buffer[k]
      if (!(c >= 0x30 && c <= 0x39)) break
      num = (Math.imul(num, 10) + (c - 0x30)) | 0 // stringToInt() into a 32-bit int
      count++
    }
    this.buffer.splice(0, count)
    return num & 0xFF // uint8_t
  }
}

/* ── Phosphorus Display (16 rows × 32 columns) ─────────────────────────────── */
export class PhosphorusDisplay {
  constructor() {
    this.screen = Array.from({ length: 16 }, () => Array(32).fill(' '))
    this.currCol = 0
    this.currRow = 0
  }

  receiveChar(code) {
    if (this.currRow >= 16) return // rows beyond 16 are clipped
    if (code === 0x0A) {
      this.currRow++
      this.currCol = 0
      return
    }
    this.screen[this.currRow][this.currCol] = String.fromCharCode(code)
    this.currCol++
    if (this.currCol >= 32) { // lines wrap
      this.currRow++
      this.currCol = 0
    }
  }

  /** the 16 rows as 32-character strings */
  rows() { return this.screen.map((r) => r.join('')) }

  /** exactly what PhosphorusDisplay::render() prints (ANSI green included) */
  renderText() {
    let s = '\x1b[32m'
    s += '==================================\n'
    s += '| PHOSPHOR CRT DISPLAY RENDER    |\n'
    s += '|================================|\n'
    for (const r of this.rows()) s += `|${r}|\n`
    s += '==================================\n'
    s += '\x1b[0m'
    return s
  }
}

/* ── Graphics Adapter ──────────────────────────────────────────────────────── */
export class GraphicsAdapter {
  constructor(display) { this.display = display }

  receiveChar(c) {
    if (!this.display) return
    this.display.receiveChar(c & 0xFF)
  }

  receiveInt(c) {
    if (!this.display) return
    for (const ch of String(c & 0xFF)) this.display.receiveChar(ch.charCodeAt(0))
  }
}

/* ── Power Supply Unit ─────────────────────────────────────────────────────── */
export class PowerSupplyUnit {
  constructor(maxWattage, mainboard, out) {
    this.maxWattage = maxWattage
    this.backReference = mainboard
    this.out = out
    this.currentWattage = 0
  }

  checkPowerDraw(memoryDraw, graphicsDraw) {
    this.currentWattage = memoryDraw + graphicsDraw
    if (this.currentWattage > this.maxWattage) {
      this.out('[CRITICAL WARNING] Power Draw exceeded PSU Capacity \n')
      this.backReference.killPower()
    }
  }
}
