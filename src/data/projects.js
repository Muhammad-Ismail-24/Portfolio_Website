/**
 * Featured projects — shown as hub nodes in the project network,
 * in the "List" view, and in the hidden terminal (`ls projects`).
 *
 * The order here is the order of the network's spine: node 01 links to 02,
 * 02 to 03, and so on. ← / → in an open card hops along it.
 *
 * Sourced from the LinkedIn Projects section. `demo` / `source` are null until
 * a video or repo exists — the card buttons only render when a link is set.
 * `image` is optional: drop a screenshot into public/assets/projects/ and point
 * to it, otherwise the card shows "Preview coming soon".
 * The network view has layout slots for 8 hubs (see HUBS_WIDE / HUBS_TALL in
 * ProjectNetwork.jsx) — add a slot there before adding a ninth project.
 */
export const projects = [
  {
    id: 'hollywood-archive',
    title: 'Hollywood Archive',
    blurb: 'B+ Tree database engine · C++',
    description:
      'A custom database management system in C++ built around a self-balancing B+ Tree index, written without the STL using raw pointers and manual heap management. Handles node splitting and re-balancing, and chains the leaf nodes for fast forward and reverse range queries over Actor and Movie records.',
    tags: ['C++', 'B+ Tree', 'Data Structures', 'No STL'],
    image: '/assets/projects/hollywood-archive.png',
    demo: null,
    source: null,
  },
  {
    id: 'suparco-ascii-3d',
    title: 'SUPARCO ASCII 3D',
    blurb: '3D-to-2D projection · 200 FPS',
    description:
      'A 3D satellite visualisation for SUPARCO and the BeiDou navigation system, rendered in a plain Windows console at 200 FPS. Uses perspective projection, a from-scratch integer Bresenham line renderer, and an ASCII z-buffer that varies character density to fake depth.',
    tags: ['C++', 'Computer Graphics', 'Bresenham', 'Z-buffer'],
    image: '/assets/projects/suparco-ascii-3d.png',
    demo: null,
    source: null,
  },
  {
    id: 'aracanum-editor',
    title: 'Aracanum Editor',
    blurb: 'Win32 word processor · zero STL',
    description:
      'A real-time, multi-tabbed word processor built from scratch on the native Win32 GDI API. Features cascading pagination, pixel-accurate text justification, click-and-drag selection, clipboard support, search, and a rolling auto-save, all on manual memory management.',
    tags: ['C++', 'Win32 API', 'GDI', 'OOP'],
    image: '/assets/projects/aracanum-editor.png',
    demo: null,
    source: null,
  },
  {
    id: 'wav-dsp-engine',
    title: 'WAV DSP Engine',
    blurb: 'Audio DSP · FFT · filters',
    description:
      'A standalone digital signal processing engine for raw .wav files, with no STL or audio libraries. Parses the RIFF header, implements a Cooley-Tukey radix-2 FFT and its inverse, and applies low-pass, high-pass and band-pass filters through an 8-slot interactive CLI.',
    tags: ['C++', 'DSP', 'FFT', 'CLI'],
    image: '/assets/projects/wav-dsp-engine.png',
    demo: null,
    source: null,
  },
  {
    id: 'tumblepop',
    title: 'Tumblepop',
    blurb: '2D SFML physics arcade platformer',
    description:
      'A 2D arcade platformer in C++ and SFML with a custom game loop, AABB collision physics and sprite-sheet animation instead of a prebuilt engine. Includes four enemy classes with their own AI state machines, procedurally generated levels, and a combo and power-up progression system.',
    tags: ['C++', 'SFML', 'Game Dev', 'Physics', 'AI'],
    image: '/assets/projects/tumblepop.png',
    demo: null,
    source: null,
  },
  {
    id: 'g-loc-cryptosystem',
    title: 'G-LOC Cryptosystem',
    blurb: 'RSA-style keypairs · stream decryption',
    description:
      'An asymmetric public/private keypair cryptosystem in C++ inspired by RSA. Seeds primes from 64-bit entropy masks, computes Euler totients and modular inverses from scratch, and runs a vectorised encrypt/decrypt pipeline over raw byte streams.',
    tags: ['C++', 'Cryptography', 'Modular arithmetic'],
    image: '/assets/projects/g-loc-cryptosystem.png',
    demo: null,
    source: null,
  },
  {
    id: 'nasa-image-terminal',
    title: 'NASA Image Terminal',
    blurb: 'Convolution filters · TrueColor ANSI',
    description:
      'A terminal-based image processing engine that works on raw 64×64×3 pixel matrices. Implements Gaussian blur and Laplacian sharpening via 2D convolution, brightness and contrast clamping, rotation, and 24-bit ANSI TrueColor output straight to the console.',
    tags: ['C++', 'Image Processing', 'Convolution', 'ANSI'],
    image: '/assets/projects/nasa-image-terminal.png',
    demo: null,
    source: null,
  },
  {
    id: 'triple-b',
    title: 'Triple B',
    blurb: 'Bubble Bomber · terminal arcade',
    description:
      'A real-time arcade game that runs entirely in the Linux terminal using low-level C++ I/O (unistd.h, termios.h) and no graphics libraries. Features non-blocking input, flicker-free in-place rendering, ball-and-brick collision physics, and live score and ammo tracking.',
    tags: ['C++', 'Linux', 'termios', 'Game Dev'],
    image: '/assets/projects/triple-b.png',
    demo: null,
    source: null,
  },
];
