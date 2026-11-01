export default function BrandMark({ size = 34, circleOnly = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <circle cx="32" cy="32" r="30" fill="#66AFE1" />
      {!circleOnly && (
        <>
          <circle cx="32" cy="25" r="18" fill="#7EBEE8" opacity="0.7" />

          <line x1="25" y1="10.5" x2="15.2" y2="2.8" stroke="#F2F5FA" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="34.2" y1="10.8" x2="41.7" y2="1.8" stroke="#F2F5FA" strokeWidth="2.2" strokeLinecap="round" />

          <g transform="rotate(-7 25 18)">
            <rect x="13.4" y="10.8" width="27.4" height="14.8" rx="3.2" fill="#FF4D61" />
            <rect x="17" y="14" width="18.2" height="9.4" rx="2.6" fill="#515468" />
            <circle cx="36.4" cy="16.7" r="2.2" fill="#4A4D63" />
            <circle cx="37.1" cy="22.2" r="2.2" fill="#4A4D63" />
          </g>

          <g transform="rotate(18 46 19)">
            <rect x="40.5" y="9.5" width="11.8" height="19.8" rx="3.1" fill="#4C4F66" />
            <rect x="42.1" y="12.5" width="8.2" height="13.2" rx="1.8" fill="#62667F" />
            <rect x="44.3" y="10.8" width="4" height="1.2" rx="0.6" fill="#767A94" />
          </g>

          <rect x="9" y="23.2" width="46" height="7.4" rx="2.6" fill="#57C999" />
          <path
            d="M17 28.2H47L45.1 49.4C44.8 52.3 42.5 54.5 39.6 54.5H24.4C21.5 54.5 19.2 52.3 18.9 49.4L17 28.2Z"
            fill="url(#bucketShade)"
          />
          <path d="M22.5 30H41.5L40.4 52.6H23.6L22.5 30Z" fill="#6DD0A6" opacity="0.35" />
          <text
            x="32"
            y="42.8"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="17"
            fontWeight="700"
            fill="#FFFFFF"
            fontFamily='Inter, "Segoe UI Symbol", sans-serif'
          >
            ♻
          </text>

        </>
      )}
      <defs>
        <linearGradient id="bucketShade" x1="18.2" y1="28" x2="45.8" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#58CE9F" />
          <stop offset="0.52" stopColor="#49BE8D" />
          <stop offset="1" stopColor="#43B080" />
        </linearGradient>
      </defs>
    </svg>
  );
}
