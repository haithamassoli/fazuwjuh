type SealProps = {
  code: string;
  size?: number;
  filled?: boolean;
};

/**
 * الختم — rub-el-hizb (۞) octagram badge with the form shortCode centered.
 * Outline seal-red by default; `filled` = solid seal with paper text
 * (matched/closed states).
 */
export function Seal({ code, size = 64, filled = false }: SealProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={`رمز الاستمارة ${code}`}
    >
      <g
        fill={filled ? "var(--color-seal)" : "none"}
        stroke="var(--color-seal)"
        strokeWidth="2.5"
      >
        <rect x="16" y="16" width="68" height="68" />
        <rect x="16" y="16" width="68" height="68" transform="rotate(45 50 50)" />
      </g>
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        direction="ltr"
        fontFamily="var(--font-mono)"
        fontSize="17"
        letterSpacing="1"
        fill={filled ? "var(--color-paper)" : "var(--color-seal)"}
      >
        {code}
      </text>
    </svg>
  );
}
