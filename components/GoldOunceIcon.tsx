"use client";

type GoldOunceIconProps = {
  size?: string;
  className?: string;
};

/** Gold ingot/bar icon (أونصة ذهب / سبيكة) for dashboard ounce price cards */
const GoldOunceIcon = ({
  size = "1.5em",
  className = "",
}: GoldOunceIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 28 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{
      width: size,
      height: "auto",
      display: "inline-block",
      verticalAlign: "middle",
    }}
    aria-hidden
  >
    {/* سبيكة ذهب - شكل شريط مستطيل بزوايا مقطوعة (قالب سبيكة) */}
    <path d="M2 5.5C2 4 3.5 2.5 6 2.5h16c2.5 0 4 1.5 4 3v5c0 1.5-1.5 3-4 3H6c-2.5 0-4-1.5-4-3V5.5Z" />
    <path
      d="M6 2.5v11M22 2.5v11M14 2.5v11M10 2.5v11M18 2.5v11"
      strokeOpacity={0.4}
    />
  </svg>
);

export { GoldOunceIcon };
