/* ════════════════════════════════════════════════════════════════════════════
   ONYX-16 — the built-in programs. Each one exists in both dialects; the two
   compile to the same machine code (only the printed text differs).
   String.raw keeps the \n and \0 escapes for the assembler.
   ════════════════════════════════════════════════════════════════════════════ */

const HELLO_URDU = String.raw`// Salaam Duniya — ONYX-16 (Urdu dialect)
.MAWAAD
paigham: "SALAAM DUNIYA!\n\0"

.HIDAYAT
BHARO R1, paigham        // pointer to the string
BHARO R2, 0x0FF1         // display character port
BHARO R3, 0              // zero, to detect the terminator
BHARO R4, 1              // step
BHARO R5, loop
BHARO R6, khatam
loop:
PARHO R0, R1             // R0 = memory[R1]
MUWAZANA R0, R3
AGAR_SIFAR R6            // end of string -> stop
RAKHO R0, R2             // print the character
JAMA R1, R4              // next byte
CHHALANG R5
khatam:
AARAM
`

const HELLO_ENGLISH = String.raw`// Hello World — ONYX-16 (English dialect)
.DATA
message: "HELLO WORLD!\n\0"

.CODE
LDR_IMM R1, message      // pointer to the string
LDR_IMM R2, 0x0FF1       // display character port
LDR_IMM R3, 0            // zero, to detect the terminator
LDR_IMM R4, 1            // step
LDR_IMM R5, loop
LDR_IMM R6, done
loop:
LDR R0, R1               // R0 = memory[R1]
CMP R0, R3
JZ R6                    // end of string -> stop
STR R0, R2               // print the character
ADD R1, R4               // next byte
JMP R5
done:
NOP
`

// Reads: int, operator char, int  (so "12 + 5" works on one line).
// R2 = a, R3 = operator, R4 = b; R5/R6 = compare value / branch target; R7 = port address.
const CALC_URDU = String.raw`// Hisaab — ONYX-16 calculator (Urdu dialect)
// Type e.g.  12 + 5   Operators: + - * /   (results are shown as uint8, like the hardware)
.MAWAAD
jawab: "JAWAB: \0"

.HIDAYAT
BHARO R7, 0x0FF3         // keyboard integer port
PARHO R2, R7             // R2 = pehla adad
BHARO R7, 0x0FF0         // keyboard character port
PARHO R3, R7             // R3 = operator
BHARO R7, 0x0FF3
PARHO R4, R7             // R4 = doosra adad

BHARO R5, 43             // '+'
BHARO R6, jama_raah
MUWAZANA R3, R5
AGAR_SIFAR R6
BHARO R5, 45             // '-'
BHARO R6, tafreek_raah
MUWAZANA R3, R5
AGAR_SIFAR R6
BHARO R5, 42             // '*'
BHARO R6, zarab_raah
MUWAZANA R3, R5
AGAR_SIFAR R6
BHARO R5, 47             // '/'
BHARO R6, taqseem_raah
MUWAZANA R3, R5
AGAR_SIFAR R6
BHARO R6, khatam         // unknown operator: stop
CHHALANG R6

jama_raah:
JAMA R2, R4
BHARO R6, dikhao
CHHALANG R6
tafreek_raah:
TAFREEK R2, R4
BHARO R6, dikhao
CHHALANG R6
zarab_raah:
ZARAB R2, R4
BHARO R6, dikhao
CHHALANG R6
taqseem_raah:
TAQSEEM R2, R4

dikhao:
BHARO R1, jawab
BHARO R3, 0x0FF1         // display character port
BHARO R4, 0
BHARO R5, 1
BHARO R6, chhaap
BHARO R7, chhaap_khatam
chhaap:
PARHO R0, R1
MUWAZANA R0, R4
AGAR_SIFAR R7
RAKHO R0, R3
JAMA R1, R5
CHHALANG R6
chhaap_khatam:
BHARO R3, 0x0FF2         // display integer port
RAKHO R2, R3
AARAM
khatam:
AARAM
`

const CALC_ENGLISH = String.raw`// Calculator — ONYX-16 (English dialect)
// Type e.g.  12 + 5   Operators: + - * /   (results are shown as uint8, like the hardware)
.DATA
answer: "ANSWER: \0"

.CODE
LDR_IMM R7, 0x0FF3       // keyboard integer port
LDR R2, R7               // R2 = first number
LDR_IMM R7, 0x0FF0       // keyboard character port
LDR R3, R7               // R3 = operator
LDR_IMM R7, 0x0FF3
LDR R4, R7               // R4 = second number

LDR_IMM R5, 43           // '+'
LDR_IMM R6, add_path
CMP R3, R5
JZ R6
LDR_IMM R5, 45           // '-'
LDR_IMM R6, sub_path
CMP R3, R5
JZ R6
LDR_IMM R5, 42           // '*'
LDR_IMM R6, mul_path
CMP R3, R5
JZ R6
LDR_IMM R5, 47           // '/'
LDR_IMM R6, div_path
CMP R3, R5
JZ R6
LDR_IMM R6, done         // unknown operator: stop
JMP R6

add_path:
ADD R2, R4
LDR_IMM R6, show
JMP R6
sub_path:
SUB R2, R4
LDR_IMM R6, show
JMP R6
mul_path:
MUL R2, R4
LDR_IMM R6, show
JMP R6
div_path:
DIV R2, R4

show:
LDR_IMM R1, answer
LDR_IMM R3, 0x0FF1       // display character port
LDR_IMM R4, 0
LDR_IMM R5, 1
LDR_IMM R6, print_loop
LDR_IMM R7, print_done
print_loop:
LDR R0, R1
CMP R0, R4
JZ R7
STR R0, R3
ADD R1, R5
JMP R6
print_done:
LDR_IMM R3, 0x0FF2       // display integer port
STR R2, R3
NOP
done:
NOP
`

export const PROGRAMS = {
  calculator: { title: 'Calculator', urduTitle: 'Hisaab', english: CALC_ENGLISH, urdu: CALC_URDU, file: 'calculator.txt' },
  hello: { title: 'Hello World printer', urduTitle: 'Salaam Duniya', english: HELLO_ENGLISH, urdu: HELLO_URDU, file: 'hello.txt' },
}
