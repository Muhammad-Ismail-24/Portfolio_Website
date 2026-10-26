/* ONYX-16 Mainboard — the only thing that routes bus transactions. */

export class Mainboard {
  constructor(out) {
    this.out = out
    this.cpu = null
    this.ram = null
    this.gfx = null
    this.psu = null
    this.kbd = null
    this.systemPower = true
  }

  addComponents(p, m, g, s, k) {
    this.cpu = p
    this.ram = m
    this.gfx = g
    this.psu = s
    this.kbd = k
  }

  killPower() { this.systemPower = false }
  checkSystemPower() { return this.systemPower }

  /**
   * One bus transaction. `bus` is the data pathway: { v } (a byte), read from
   * on writes and written to on reads. Async because the keyboard ports may
   * have to wait for the visitor.
   */
  async pulseClock(addressBus, readEnable, writeEnable, bus) {
    if (this.psu === null) return // no PSU → no power → no clock

    // power draw of the active parts this tick
    let memoryPowerDraw = 0
    let graphicsPowerDraw = 0
    if ((readEnable || writeEnable) && addressBus >= 0x0000 && addressBus <= 0x0EFF) memoryPowerDraw += 0.5
    else memoryPowerDraw += 0.1
    if ((addressBus === 0x0FF1 || addressBus === 0x0FF2) && writeEnable) graphicsPowerDraw += 15.0
    else graphicsPowerDraw += 2.0
    this.psu.checkPowerDraw(memoryPowerDraw, graphicsPowerDraw)

    if (!this.systemPower) return

    // floating pins on empty sockets
    if ((addressBus === 0x0FF0 || addressBus === 0x0FF3) && this.kbd === null) {
      if (readEnable) bus.v = 0x00
      return
    }
    if ((addressBus === 0x0FF1 || addressBus === 0x0FF2) && this.gfx === null) return
    if (addressBus >= 0x0000 && addressBus <= 0x0EFF && this.ram === null) {
      if (readEnable) bus.v = 0x00
      return
    }

    // MMIO ports
    if (addressBus >= 0x0FF0 && addressBus <= 0x0FF3) {
      if (addressBus === 0x0FF0 && readEnable) bus.v = await this.kbd.readChar()
      else if (addressBus === 0x0FF1 && writeEnable) this.gfx.receiveChar(bus.v)
      else if (addressBus === 0x0FF2 && writeEnable) this.gfx.receiveInt(bus.v)
      else if (addressBus === 0x0FF3 && readEnable) bus.v = await this.kbd.readInt()
      return
    }

    // unmapped addresses
    if (addressBus > 0x0FF3) {
      if (readEnable) {
        this.out('[MOTHERBOARD FAULT] Invalid Read Address\n')
        bus.v = 0x00
      } else if (writeEnable) {
        this.out('[MOTHERBOARD FAULT] Invalid Write Address\n')
      }
      return
    }

    // everything else goes to the memory module, which raises its own segmentation fault
    if (readEnable) bus.v = this.ram.read(addressBus)
    else if (writeEnable) this.ram.write(addressBus, bus.v)
  }
}
