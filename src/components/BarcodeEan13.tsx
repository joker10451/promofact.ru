import React from "react";

const L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
const G = ["0100111", "0110011", "0011011", "0100001", "0011101", "0110001", "0000101", "0010001", "0001001", "0010111"];
const R = ["1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100"];
const PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];

interface BarcodeEan13Props {
  code: string;
  className?: string;
  showText?: boolean;
}

export default function BarcodeEan13({
  code,
  className = "",
  showText = true,
}: BarcodeEan13Props) {
  const cleanCode = code.replace(/\D/g, "");
  const isEan13 = cleanCode.length === 13;

  if (!isEan13) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div className="barcode w-full h-11 bg-ink rounded-xs" />
        {showText && (
          <span className="mt-1 font-mono text-xs font-bold tracking-widest text-ink">
            {code}
          </span>
        )}
      </div>
    );
  }

  const first = parseInt(cleanCode[0], 10);
  const parity = PARITY[first];
  let bits = "101"; // start guard
  for (let i = 1; i <= 6; i++) {
    const d = parseInt(cleanCode[i], 10);
    bits += parity[i - 1] === "L" ? L[d] : G[d];
  }
  bits += "01010"; // center guard
  for (let i = 7; i <= 12; i++) {
    const d = parseInt(cleanCode[i], 10);
    bits += R[d];
  }
  bits += "101"; // stop guard

  const margin = 10;
  const barHeight = showText ? 38 : 46;
  const guardHeight = showText ? 44 : 46;

  const leftGroup = cleanCode.slice(1, 7);
  const rightGroup = cleanCode.slice(7, 13);

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox="0 0 115 54"
        className="w-full max-w-[240px] h-auto drop-shadow-2xs"
        shapeRendering="crispEdges"
        aria-label={`Штрихкод ${cleanCode}`}
        role="img"
      >
        <rect width="115" height="54" fill="#ffffff" rx="4" />
        {bits.split("").map((bit, idx) => {
          if (bit !== "1") return null;
          const isGuard = idx < 3 || (idx >= 45 && idx < 50) || idx >= 92;
          const h = isGuard ? guardHeight : barHeight;
          return (
            <rect
              key={idx}
              x={margin + idx}
              y={3}
              width={1}
              height={h}
              fill="#0b102b"
            />
          );
        })}
        {showText && (
          <g
            fill="#0b102b"
            fontSize="7.5"
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="middle"
          >
            <text x="5" y="49">
              {cleanCode[0]}
            </text>
            <text x="34" y="49" letterSpacing="0.4">
              {leftGroup}
            </text>
            <text x="81" y="49" letterSpacing="0.4">
              {rightGroup}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
