import React from 'react';

export const ByzantineCross: React.FC<{ className?: string; color?: string }> = ({ 
  className = "w-6 h-6", 
  color = "currentColor" 
}) => (
  <svg 
    viewBox="0 0 100 100" 
    className={className} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Central Cross Staff */}
    <rect x="46" y="8" width="8" height="84" rx="2" fill={color} />
    {/* Main Horizontal Bar */}
    <rect x="20" y="28" width="60" height="8" rx="2" fill={color} />
    {/* Upper Title Titulus Bar */}
    <rect x="34" y="16" width="32" height="5" rx="1.5" fill={color} />
    {/* Lower Slanted Footrest Suppedaneum */}
    <line x1="30" y1="80" x2="70" y2="68" stroke={color} strokeWidth="6" strokeLinecap="round" />
    {/* Decorative Finials / Trefoils */}
    <circle cx="50" cy="8" r="4" fill={color} />
    <circle cx="20" cy="32" r="4" fill={color} />
    <circle cx="80" cy="32" r="4" fill={color} />
    <circle cx="50" cy="92" r="4" fill={color} />
  </svg>
);

export const ByzantineCorner: React.FC<{ 
  className?: string; 
  color?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}> = ({ 
  className = "w-10 h-10", 
  color = "#78141c",
  position = 'top-left'
}) => {
  const rotation = {
    'top-left': '',
    'top-right': 'scale-x-[-1]',
    'bottom-left': 'scale-y-[-1]',
    'bottom-right': 'scale-[-1]',
  }[position];

  return (
    <svg 
      viewBox="0 0 80 80" 
      className={`${className} ${rotation}`} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer corner framing */}
      <path d="M4 76 L4 4 L76 4" stroke={color} strokeWidth="3" fill="none" />
      <path d="M10 70 L10 10 L70 10" stroke={color} strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
      
      {/* Byzantine Palmette / Acanthus leaf flourish */}
      <path d="M14 14 C26 14 36 24 36 36 C36 26 46 16 58 16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M14 14 C14 26 24 36 36 36 C26 36 16 46 16 58" stroke={color} strokeWidth="2" strokeLinecap="round" />
      
      {/* Inner Knotwork Loops */}
      <circle cx="26" cy="26" r="6" stroke={color} strokeWidth="2" fill="none" />
      <path d="M26 20 C26 14 20 14 20 20 C20 26 26 26 32 26" stroke={color} strokeWidth="1.5" />
      <path d="M20 26 C14 26 14 20 20 20 C26 20 26 26 26 32" stroke={color} strokeWidth="1.5" />

      {/* Central Trefoil in corner */}
      <circle cx="10" cy="10" r="3" fill={color} />
      <circle cx="4" cy="4" r="2" fill={color} />
      <circle cx="20" cy="4" r="2.5" fill={color} />
      <circle cx="4" cy="20" r="2.5" fill={color} />
      <circle cx="44" cy="10" r="2" fill={color} />
      <circle cx="10" cy="44" r="2" fill={color} />
      <circle cx="36" cy="36" r="3" fill={color} />
    </svg>
  );
};

export const ByzantineHeadpiece: React.FC<{ 
  className?: string; 
  color?: string;
  crossColor?: string;
}> = ({ 
  className = "w-full h-8", 
  color = "#78141c",
  crossColor = "#78141c"
}) => (
  <svg 
    viewBox="0 0 600 40" 
    className={className} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid meet"
  >
    {/* Central Cross Medallion */}
    <circle cx="300" cy="20" r="14" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="300" cy="20" r="11" stroke={color} strokeWidth="1" strokeDasharray="2 2" fill="none" />
    {/* Greek Cross inside Medallion */}
    <rect x="298" y="11" width="4" height="18" rx="1" fill={crossColor} />
    <rect x="291" y="18" width="18" height="4" rx="1" fill={crossColor} />
    <circle cx="300" cy="20" r="2" fill="#fff" />

    {/* Left Side Intricate Byzantine Scrollwork */}
    <path 
      d="M284 20 C270 20 262 10 248 10 C234 10 226 30 212 30 C198 30 190 10 176 10 C162 10 154 30 140 30 C126 30 118 10 104 10 C90 10 82 20 60 20 L20 20" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
    />
    <path 
      d="M284 20 C270 20 262 30 248 30 C234 30 226 10 212 10 C198 10 190 30 176 30 C162 30 154 10 140 10 C126 10 118 30 104 30 C90 30 82 20 60 20" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
    />

    {/* Left Palmette / Trefoil Finials */}
    <circle cx="248" cy="20" r="2.5" fill={color} />
    <circle cx="212" cy="20" r="2.5" fill={color} />
    <circle cx="176" cy="20" r="2.5" fill={color} />
    <circle cx="140" cy="20" r="2.5" fill={color} />
    <circle cx="104" cy="20" r="2.5" fill={color} />
    <circle cx="60" cy="20" r="3" fill={color} />
    <circle cx="20" cy="20" r="4" fill={color} />

    {/* Right Side Intricate Byzantine Scrollwork (Mirrored) */}
    <path 
      d="M316 20 C330 20 338 10 352 10 C366 10 374 30 388 30 C402 30 410 10 424 10 C438 10 446 30 460 30 C474 30 482 10 496 10 C510 10 518 20 540 20 L580 20" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
    />
    <path 
      d="M316 20 C330 20 338 30 352 30 C366 30 374 10 388 10 C402 10 410 30 424 30 C438 30 446 10 460 10 C474 10 482 30 496 30 C510 30 518 20 540 20" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
    />

    {/* Right Palmette / Trefoil Finials */}
    <circle cx="352" cy="20" r="2.5" fill={color} />
    <circle cx="388" cy="20" r="2.5" fill={color} />
    <circle cx="424" cy="20" r="2.5" fill={color} />
    <circle cx="460" cy="20" r="2.5" fill={color} />
    <circle cx="496" cy="20" r="2.5" fill={color} />
    <circle cx="540" cy="20" r="3" fill={color} />
    <circle cx="580" cy="20" r="4" fill={color} />
  </svg>
);

export const ByzantineDivider: React.FC<{ 
  className?: string; 
  color?: string;
  label?: string;
}> = ({ 
  className = "my-3",
  color = "#78141c",
  label 
}) => (
  <div className={`flex items-center justify-center space-x-3 ${className}`}>
    <div className="h-[2px] flex-1 max-w-sm" style={{ backgroundColor: color }} />
    <div className="flex items-center space-x-2 px-2">
      <span className="text-xs" style={{ color }}>❖</span>
      <ByzantineCross className="w-4 h-4 inline-block" color={color} />
      {label && (
        <span className="font-cinzel text-xs uppercase tracking-widest font-bold px-1" style={{ color }}>
          {label}
        </span>
      )}
      <ByzantineCross className="w-4 h-4 inline-block" color={color} />
      <span className="text-xs" style={{ color }}>❖</span>
    </div>
    <div className="h-[2px] flex-1 max-w-sm" style={{ backgroundColor: color }} />
  </div>
);

export const EcclesiasticalDivider: React.FC<{ className?: string; label?: string }> = ({ 
  className = "my-4",
  label 
}) => (
  <ByzantineDivider className={className} label={label} />
);

