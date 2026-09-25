export default function StaticNeuromesh() {
  // ── Deterministic node coordinates ──────────────────────────
  // 30 fixed nodes distributed strictly across the diagonal axis.
  // Zones: Top-Right Hub, Diagonal Bridge, Bottom-Left Hub.
  // Negative space enforced: no nodes in top-left or bottom-right.
  const nodes = [
    // Top-Right Hub (12 nodes: X 900–1400, Y -50–400)
    { id: 1,  x: 1380, y: -20  },
    { id: 2,  x: 1270, y: 30   },
    { id: 3,  x: 1170, y: -40  },
    { id: 4,  x: 1400, y: 130  },
    { id: 5,  x: 1300, y: 110  },
    { id: 6,  x: 1190, y: 80   },
    { id: 7,  x: 1090, y: 150  },
    { id: 8,  x: 990,  y: 70   },
    { id: 9,  x: 1340, y: 250  },
    { id: 10, x: 1230, y: 210  },
    { id: 11, x: 1120, y: 290  },
    { id: 12, x: 1010, y: 240  },

    // Diagonal Bridge (6 nodes: connecting the two hubs)
    { id: 13, x: 930,  y: 340  },
    { id: 14, x: 840,  y: 380  },
    { id: 15, x: 770,  y: 310  },
    { id: 16, x: 690,  y: 410  },
    { id: 17, x: 610,  y: 470  },
    { id: 18, x: 530,  y: 530  },

    // Bottom-Left Hub (12 nodes: X -50–500, Y 600–1000)
    { id: 19, x: 470,  y: 630  },
    { id: 20, x: 380,  y: 670  },
    { id: 21, x: 300,  y: 620  },
    { id: 22, x: 420,  y: 750  },
    { id: 23, x: 330,  y: 740  },
    { id: 24, x: 240,  y: 700  },
    { id: 25, x: 150,  y: 660  },
    { id: 26, x: 60,   y: 730  },
    { id: 27, x: -30,  y: 680  },
    { id: 28, x: 270,  y: 830  },
    { id: 29, x: 160,  y: 810  },
    { id: 30, x: 70,   y: 870  },
  ];

  // ── Distance-based connections ──────────────────────────────
  // Draw a line between every pair of nodes within 350px.
  // Fully deterministic — no randomness, no hydration issues.
  const connections = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      if (Math.sqrt(dx * dx + dy * dy) < 350) {
        connections.push({
          key: `${nodes[i].id}-${nodes[j].id}`,
          x1: nodes[i].x,
          y1: nodes[i].y,
          x2: nodes[j].x,
          y2: nodes[j].y,
        });
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[-10] pointer-events-none overflow-hidden">
      <svg
        className="w-full h-full object-cover text-[#1A1A1A] dark:text-white opacity-[0.18] dark:opacity-[0.08]"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        stroke="currentColor"
      >
        {/* Web connections — auto-generated from distance threshold */}
        <g strokeWidth="1.25">
          {connections.map((c) => (
            <line key={c.key} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} />
          ))}
        </g>

        {/* Structural joint nodes */}
        <g strokeWidth="1.5">
          {nodes.map((n) => (
            <circle
              key={n.id}
              cx={n.x}
              cy={n.y}
              r={3.5}
              fill="#F5F3EC"
              stroke="currentColor"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
