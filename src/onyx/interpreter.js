import { toBytes } from './hardware.js'

/* ════════════════════════════════════════════════════════════════════════════
   ONYX-16 Interpreter — the two-pass assembler. A faithful port of the C++
   Interpreter: same two passes, same quirks (case-sensitive mnemonics, labels
   always Format D, `std::stoi(…, 0)` number parsing, getline-style splitting)
   and the same [COMPILER ERROR] messages.
   ════════════════════════════════════════════════════════════════════════════ */

class StoiError extends Error {}

/** std::stoi(str, nullptr, 0) — base auto-detected (0x… hex, 0… octal, else decimal), prefix parsing */
function stoi(str) {
  let i = 0
  while (i < str.length && /\s/.test(str[i])) i++
  let neg = false
  if (str[i] === '+' || str[i] === '-') { neg = str[i] === '-'; i++ }

  let base = 10
  if (str[i] === '0' && (str[i + 1] === 'x' || str[i + 1] === 'X')) {
    // the Windows CRT (where this was built and tested) fails "0x" with no hex digit after it
    if (!/[0-9a-fA-F]/.test(str[i + 2] ?? '')) throw new StoiError('invalid_argument')
    base = 16
    i += 2
  } else if (str[i] === '0') {
    base = 8
  }
  const digits = base === 16 ? /[0-9a-fA-F]/ : base === 8 ? /[0-7]/ : /[0-9]/
  const start = i
  let value = 0
  while (i < str.length && digits.test(str[i])) {
    value = value * base + parseInt(str[i], base)
    i++
    if (value > 2147483648) throw new StoiError('out_of_range')
  }
  if (i === start) {
    // "0" followed by something that is not an octal digit still parses as 0 (base 8 with zero digits consumed)
    if (base === 8) return 0
    throw new StoiError('invalid_argument')
  }
  if (neg) value = -value
  if (value > 2147483647 || value < -2147483648) throw new StoiError('out_of_range')
  return value
}

const isDigit = (ch) => ch >= '0' && ch <= '9'
const trimStart = (s, set) => { let i = 0; while (i < s.length && set.includes(s[i])) i++; return s.slice(i) }
const trimEnd = (s, set) => { let i = s.length; while (i > 0 && set.includes(s[i - 1])) i--; return s.slice(0, i) }

/** `while (ss >> token)` with one trailing comma stripped */
function tokenize(line) {
  return line.split(/\s+/).filter(Boolean).map((t) => (t.endsWith(',') ? t.slice(0, -1) : t))
}

function parseRegister(regStr) {
  let r = regStr ?? ''
  if (r[0] === '[') r = r.slice(1)
  if (r[r.length - 1] === ']') r = r.slice(0, -1)
  if (r.length >= 2 && r[0] === 'R') {
    const n = r.charCodeAt(1) - 48
    if (n >= 0 && n < 8) return n
  }
  return 0
}

/** the first string-literal byte count of Pass 1: an escape counts as one char */
function literalChars(valueStr) {
  let chars = 0
  for (let i = 1; i < valueStr.length && valueStr[i] !== '"'; ++i) {
    if (valueStr[i] === '\\' && i + 1 < valueStr.length) i++
    chars++
  }
  return chars
}

/** `getline(vss, token, ',')` — a trailing comma yields no extra empty token */
function getlineSplit(s) {
  if (s === '') return []
  const parts = s.split(',')
  if (parts[parts.length - 1] === '') parts.pop()
  return parts
}

const SECTION_DATA = /^\.(mawaad|data)$/i
const SECTION_CODE = /^\.(hidayat|code)$/i

export class Interpreter {
  constructor(out) {
    this.out = out
    this.labelMap = new Map()
  }

  parseLine(line) {
    const commentPos = line.indexOf('//')
    const cleanLine = commentPos !== -1 ? line.slice(0, commentPos) : line

    const tokens = tokenize(cleanLine)
    if (tokens.length === 0) return [0x0000]

    const mnemonic = tokens[0]
    const payload = []
    const two = (op) => {
      const dest = parseRegister(tokens[1])
      const src = parseRegister(tokens[2])
      payload.push((op << 8) | ((dest & 0x0F) << 4) | (src & 0x0F))
    }
    const one = (op) => payload.push((op << 8) | (parseRegister(tokens[1]) & 0x0F))

    // operands the C++ would read past the end of the token vector for (undefined behaviour there)
    const needs = { AARAM: 0, NOP: 0, CHHALANG: 1, JMP: 1, AGAR_SIFAR: 1, JZ: 1, AGAR_MAUJOOD: 1, JNZ: 1 }
    const need = mnemonic in needs ? needs[mnemonic] : 2
    const known = /^(AARAM|NOP|JAMA|ADD|TAFREEK|SUB|ZARAB|MUL|TAQSEEM|DIV|MUWAZANA|CMP|CHHALANG|JMP|AGAR_SIFAR|JZ|AGAR_MAUJOOD|JNZ|BHARO|DAALO|LDR_IMM|PARHO|LDR|RAKHO|STR)$/.test(mnemonic)
    if (known && tokens.length < need + 1) {
      this.out(`[COMPILER ERROR] Missing operand for: ${mnemonic}\n`)
      return payload
    }

    if (mnemonic === 'AARAM' || mnemonic === 'NOP') payload.push(0x0000)
    else if (mnemonic === 'JAMA' || mnemonic === 'ADD') two(0x01)
    else if (mnemonic === 'TAFREEK' || mnemonic === 'SUB') two(0x02)
    else if (mnemonic === 'ZARAB' || mnemonic === 'MUL') two(0x03)
    else if (mnemonic === 'TAQSEEM' || mnemonic === 'DIV') two(0x04)
    else if (mnemonic === 'MUWAZANA' || mnemonic === 'CMP') two(0x0A)
    else if (mnemonic === 'CHHALANG' || mnemonic === 'JMP') one(0x10)
    else if (mnemonic === 'AGAR_SIFAR' || mnemonic === 'JZ') one(0x11)
    else if (mnemonic === 'AGAR_MAUJOOD' || mnemonic === 'JNZ') one(0x12)
    else if (mnemonic === 'BHARO' || mnemonic === 'DAALO' || mnemonic === 'LDR_IMM') {
      const dest = parseRegister(tokens[1])
      let immFull = 0

      const isNumber = isDigit(tokens[2][0]) || (tokens[2].length > 1 && tokens[2][1] === 'x')
      if (isNumber) {
        try {
          immFull = stoi(tokens[2]) & 0xFFFF
        } catch {
          this.out(`[COMPILER ERROR] Invalid immediate format: ${tokens[2]}\n`)
        }
      } else if (this.labelMap.has(tokens[2])) {
        immFull = this.labelMap.get(tokens[2])
      } else {
        this.out(`[COMPILER ERROR] Unresolved Label: ${tokens[2]}\n`)
      }

      // labels were tracked as 4 bytes in Pass 1, so they are always Format D
      if (!isNumber || immFull > 0x0F) {
        payload.push((0x1B << 8) | ((dest & 0x0F) << 4)) // header word
        payload.push(immFull)                             // payload word
      } else {
        payload.push((0x1A << 8) | ((dest & 0x0F) << 4) | (immFull & 0x0F)) // Format B
      }
    } else if (mnemonic === 'PARHO' || mnemonic === 'LDR') two(0x20)
    else if (mnemonic === 'RAKHO' || mnemonic === 'STR') two(0x21)
    else this.out(`[COMPILER ERROR] Unrecognized Mnemonic: ${mnemonic}\n`)

    return payload
  }

  compile(sourceCodeText) {
    // the C++ works on bytes of a std::string; so do we
    const source = String.fromCharCode(...toBytes(sourceCodeText))
    const result = { codeSegment: [], dataSegment: [] }
    const processLines = [] // { type: 0 code | 1 data, text }

    this.labelMap.clear()
    let currentCodePC = 0
    let currentDataPC = 0x0800
    let inDataSection = false

    // ── Pass 1: PC tracking and label mapping ──
    for (let line of source.split('\n')) {
      line = trimStart(line, ' \t\r\n')
      if (line === '' || line.indexOf('//') === 0) continue

      const commentPos = line.indexOf('//')
      let cleanLine = commentPos !== -1 ? line.slice(0, commentPos) : line
      cleanLine = trimEnd(cleanLine, ' \t\r\n')

      if (SECTION_DATA.test(cleanLine)) { inDataSection = true; continue }
      if (SECTION_CODE.test(cleanLine)) { inDataSection = false; continue }

      if (inDataSection) {
        const colonPos = cleanLine.indexOf(':')
        if (colonPos !== -1) {
          const labelName = trimEnd(cleanLine.slice(0, colonPos), ' \t')
          this.labelMap.set(labelName, currentDataPC)

          const valueStr = trimStart(cleanLine.slice(colonPos + 1), ' \t')
          processLines.push({ type: 1, text: valueStr })

          if (valueStr !== '' && valueStr[0] === '"') {
            const words = Math.floor((literalChars(valueStr) + 1) / 2)
            currentDataPC += words * 2
          } else {
            const commas = (valueStr.match(/,/g) || []).length
            currentDataPC += (commas + 1) * 2
          }
        }
      } else {
        if (cleanLine[cleanLine.length - 1] === ':') {
          this.labelMap.set(cleanLine.slice(0, -1), currentCodePC)
          continue // a label takes 0 bytes
        }

        processLines.push({ type: 0, text: cleanLine })

        const tokens = tokenize(cleanLine)
        if (tokens.length === 0) continue

        const mnemonic = tokens[0]
        if (mnemonic === 'BHARO' || mnemonic === 'DAALO' || mnemonic === 'LDR_IMM') {
          if (tokens.length > 2) {
            const isNumber = isDigit(tokens[2][0]) || (tokens[2].length > 1 && tokens[2][1] === 'x')
            if (isNumber) {
              try {
                const immFull = stoi(tokens[2]) & 0xFFFF
                currentCodePC += immFull <= 0x0F ? 2 : 4
              } catch {
                currentCodePC += 4 // fallback
              }
            } else {
              currentCodePC += 4 // labels are unconditionally 2 words
            }
          } else {
            currentCodePC += 2
          }
        } else {
          currentCodePC += 2
        }
      }
    }

    // ── Pass 2: instruction generation ──
    for (const item of processLines) {
      if (item.type === 1) {
        const valueStr = item.text
        if (valueStr !== '' && valueStr[0] === '"') {
          const bytes = []
          for (let i = 1; i < valueStr.length && valueStr[i] !== '"'; ++i) {
            if (valueStr[i] === '\\' && i + 1 < valueStr.length) {
              i++
              if (valueStr[i] === '0') bytes.push(0)
              else if (valueStr[i] === 'n') bytes.push(0x0A)
              else bytes.push(valueStr.charCodeAt(i))
            } else {
              bytes.push(valueStr.charCodeAt(i))
            }
          }
          if (bytes.length % 2 !== 0) bytes.push(0) // word alignment
          for (let i = 0; i < bytes.length; i += 2) result.dataSegment.push((bytes[i] << 8) | bytes[i + 1])
        } else {
          for (let token of getlineSplit(valueStr)) {
            token = trimEnd(trimStart(token, ' \t'), ' \t')
            try {
              result.dataSegment.push(stoi(token) & 0xFFFF)
            } catch {
              result.dataSegment.push(0)
            }
          }
        }
      } else {
        for (const word of this.parseLine(item.text)) result.codeSegment.push(word & 0xFFFF)
      }
    }

    return result
  }

  /** compile and flash into RAM; prints exactly the C++ BIOS / bootloader lines */
  loadProgramAndFlash(sourceText, ram) {
    const compiledOS = this.compile(sourceText)
    this.out(`[BIOS] Compiled OS script into ${compiledOS.codeSegment.length} native 16-bit instruction words.\n`)

    this.out('[BOOTLOADER] Flashing Code Execution block to RAM Address 0x0000...\n')
    let codeAddress = 0x0000
    for (const word of compiledOS.codeSegment) {
      ram.loadRawBinary(codeAddress, word)
      codeAddress = (codeAddress + 2) & 0xFFFF
    }

    this.out('[BOOTLOADER] Flashing Data Variables (.MAWAAD) to RAM Address 0x0800...\n')
    let dataAddress = 0x0800
    for (const word of compiledOS.dataSegment) {
      ram.loadRawBinary(dataAddress, word)
      dataAddress = (dataAddress + 2) & 0xFFFF
    }

    this.out('[BOOTLOADER] Flash Complete.\n')
    this.out('------------------------------------------------------------\n\n')
  }
}
