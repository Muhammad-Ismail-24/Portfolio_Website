import { ArithmeticLogicUnit, OP, RegisterBank, fmtFloat, hex } from './hardware.js'

/* ONYX-16 Processor — storage bank, ALU, 16-byte block cache, decode matrix. */

const CYAN = '\x1b[36m'
const RESET = '\x1b[0m'

/** The 256-entry Instruction Decode Matrix, burned in at construction time. */
function buildDecodeMatrix() {
  const blank = () => ({
    IS_VALID: false, USES_AEC: false, AEC_OPERATION: OP.NONE, IS_MEMORY_READ: false, IS_MEMORY_WRITE: false,
    IS_BRANCH: false, BRANCH_ON_ZERO: false, BRANCH_ON_NOT_ZERO: false, WRITES_TO_REGISTER: false,
    IS_4BIT_IMMEDIATE: false, IS_16BIT_IMMEDIATE: false,
  })
  const m = Array.from({ length: 256 }, blank)
  const set = (op, flags) => Object.assign(m[op], { IS_VALID: true }, flags)

  set(0x00, {})                                                                          // NOP
  set(0x01, { USES_AEC: true, AEC_OPERATION: OP.ADD, WRITES_TO_REGISTER: true })         // ADD / JAMA
  set(0x02, { USES_AEC: true, AEC_OPERATION: OP.SUB, WRITES_TO_REGISTER: true })         // SUB / TAFREEK
  set(0x03, { USES_AEC: true, AEC_OPERATION: OP.MUL, WRITES_TO_REGISTER: true })         // MUL / ZARAB
  set(0x04, { USES_AEC: true, AEC_OPERATION: OP.DIV, WRITES_TO_REGISTER: true })         // DIV / TAQSEEM
  set(0x0A, { USES_AEC: true, AEC_OPERATION: OP.CMP })                                   // CMP / MUWAZANA
  set(0x10, { IS_BRANCH: true })                                                         // JMP / CHHALANG
  set(0x11, { IS_BRANCH: true, BRANCH_ON_ZERO: true })                                   // JZ / AGAR_SIFAR
  set(0x12, { IS_BRANCH: true, BRANCH_ON_NOT_ZERO: true })                               // JNZ / AGAR_MAUJOOD
  set(0x1A, { IS_4BIT_IMMEDIATE: true, WRITES_TO_REGISTER: true })                       // LDR_IMM, Format B
  set(0x1B, { IS_16BIT_IMMEDIATE: true, WRITES_TO_REGISTER: true })                      // LDR_IMM, Format D
  set(0x20, { IS_MEMORY_READ: true, WRITES_TO_REGISTER: true })                          // LDR / PARHO
  set(0x21, { IS_MEMORY_WRITE: true })                                                   // STR / RAKHO
  return m
}

export class Processor {
  constructor(mainboard, out) {
    this.mainboard = mainboard
    this.out = out
    this.storageBank = new RegisterBank()
    this.AEC = new ArithmeticLogicUnit()
    this.cache = { data: new Uint8Array(16), baseAddress: 0, validBit: false }
    this.decodeMatrix = buildDecodeMatrix()
    this.temperature = Math.fround(25.0) // C++ float
    this.verbose = false
  }

  getVerbose() { return this.verbose }
  setVerbose(v) { this.verbose = !!v }

  async busWriteData(address, data) {
    const bus = { v: data & 0xFF }
    await this.mainboard.pulseClock(address & 0xFFFF, false, true, bus)

    // a write inside the cached block makes the cached copy stale
    if (this.cache.validBit && address >= this.cache.baseAddress && address < this.cache.baseAddress + 16) {
      this.cache.validBit = false
    }
  }

  async busReadData(address) {
    address &= 0xFFFF
    const c = this.cache
    if (c.validBit && address >= c.baseAddress && address < c.baseAddress + 16) {
      return c.data[address - c.baseAddress] // cache hit
    }
    // miss: refill the whole aligned 16-byte block over the bus
    const start = Math.floor(address / 16) * 16
    c.baseAddress = start
    for (let index = 0; index < 16; index++) {
      const bus = { v: c.data[index] }
      await this.mainboard.pulseClock((start + index) & 0xFFFF, true, false, bus)
      c.data[index] = bus.v
    }
    c.validBit = true
    return c.data[address - c.baseAddress]
  }

  checkHeat() {
    this.temperature = Math.fround(this.temperature + Math.fround(0.05))
    if (this.temperature >= 90.0) {
      this.out('[CRITICAL ERROR] Thermal threshold exceeded\n')
      this.storageBank.setHF()
    }
    return false
  }

  isHalted() { return (this.storageBank.readFLAGS() & 0x80) !== 0 }

  /** One full fetch → decode → execute → writeback cycle. */
  async excuteCycle() {
    const bank = this.storageBank
    if ((bank.readFLAGS() & 0x80) !== 0) return

    // FETCH: two byte reads
    const highByte = await this.busReadData(bank.readPC())
    const lowByte = await this.busReadData((bank.readPC() + 1) & 0xFFFF)
    const instruction = (highByte << 8) | lowByte

    // 0x0000 marks the end of the program
    if (instruction === 0x0000) {
      this.out(`\n[PROCESSOR] End-Of-File (0x0000) reached at PC 0x${hex(bank.readPC() - 2)}. Halting.\n\n`)
      bank.setHF()
      return
    }

    bank.writeIR(instruction)
    bank.writePC(bank.readPC() + 2) // before decode, so branches are relative to the next instruction

    // DECODE
    const opCode = instruction >> 8
    const destR = (instruction >> 4) & 0x0F
    const srcR = instruction & 0x0F
    const current = this.decodeMatrix[opCode]

    if (!current.IS_VALID) {
      this.out('[HARDWARE FAULT] Invalid Instruction\n')
      return
    }

    let payload16Bit = 0x0000
    if (current.IS_16BIT_IMMEDIATE) {
      const highB = await this.busReadData(bank.readPC())
      const lowB = await this.busReadData((bank.readPC() + 1) & 0xFFFF)
      payload16Bit = (highB << 8) | lowB
      bank.writePC(bank.readPC() + 2)
      if (this.verbose) this.out(`${CYAN}-> Decode: Format D (2-Word). Fetched Immediate: 0x${hex(payload16Bit)}${RESET}\n`)
    }

    // EXECUTE — follows the signal vector, never the opcode
    let finalResult = 0x0000

    if (current.USES_AEC) {
      const A = bank.readR(destR)
      const B = bank.readR(srcR)
      finalResult = this.AEC.invoke(current.AEC_OPERATION, A, B, bank)
      if (this.verbose) this.out(`${CYAN}-> Decode: ALU Op. R${destR}(${A}) and R${srcR}(${B})${RESET}\n`)
    } else if (current.IS_MEMORY_READ) {
      const address = bank.readR(srcR)
      if (address >= 0x0F00) {
        const bus = { v: 0x00 } // MMIO and the fault zone go straight to the mainboard
        await this.mainboard.pulseClock(address, true, false, bus)
        finalResult = bus.v
      } else {
        finalResult = await this.busReadData(address)
      }
      if (this.verbose) this.out(`${CYAN}-> Exec: Read 0x${hex(finalResult)} from Mem Address 0x${hex(address)}${RESET}\n`)
    } else if (current.IS_MEMORY_WRITE) {
      const targetAddress = bank.readR(srcR)
      const data = bank.readR(destR) & 0xFF
      await this.busWriteData(targetAddress, data)
      if (this.verbose) this.out(`${CYAN}-> Exec: Store 0x${hex(data)} to Mem Address 0x${hex(targetAddress)}${RESET}\n`)
    } else if (current.IS_BRANCH) {
      const targetAddress = bank.readR(srcR)
      const isZero = (bank.readFLAGS() & 0x01) !== 0
      let shouldJump = false
      if (current.BRANCH_ON_ZERO && isZero) shouldJump = true
      else if (current.BRANCH_ON_NOT_ZERO && !isZero) shouldJump = true
      else if (!current.BRANCH_ON_ZERO && !current.BRANCH_ON_NOT_ZERO) shouldJump = true
      if (shouldJump) bank.writePC(targetAddress)
    } else if (current.IS_4BIT_IMMEDIATE) {
      finalResult = srcR
    } else if (current.IS_16BIT_IMMEDIATE) {
      finalResult = payload16Bit
    }

    // WRITEBACK
    if (current.WRITES_TO_REGISTER) {
      bank.writeR(destR, finalResult)
      if (this.verbose) this.out(`${CYAN}-> Writeback: R${destR} = ${finalResult} (0x${hex(finalResult)})${RESET}\n`)
    }

    this.checkHeat()
  }

  printStateDump() {
    const b = this.storageBank
    let s = '==== PROCESSOR STATE DUMP ====\n'
    s += `Temperature: ${fmtFloat(this.temperature)} C (Max: 90 C)\n\n`
    s += '--- INTERNAL REGISTERS (16-bit) ---\n'
    for (let i = 0; i < 8; i++) s += `R${i}: 0x${hex(b.readR(i))}\n`
    s += `PC: 0x${hex(b.readPC())}\n`
    s += `IR: 0x${hex(b.readIR())}\n`
    s += `FLAGS: 0x${hex(b.readFLAGS())}\n`
    s += '============================================\n\n'
    this.out(s)
  }
}
