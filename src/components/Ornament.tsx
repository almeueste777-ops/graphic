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

export const EcclesiasticalDivider: React.FC<{ className?: string; label?: string }> = ({ 
  className = "my-4",
  label 
}) => (
  <div className={`flex items-center justify-center space-x-3 text-amber-500/60 ${className}`}>
    <div className="h-px bg-gradient-to-r from-transparent via-amber-500/40 to-amber-500/80 flex-1 max-w-xs" />
    <div className="flex items-center space-x-1.5 px-2">
      <span className="text-xs text-amber-500/70">❖</span>
      {label && (
        <span className="font-cinzel text-xs uppercase tracking-widest text-amber-300 font-semibold px-2">
          {label}
        </span>
      )}
      <span className="text-xs text-amber-500/70">❖</span>
    </div>
    <div className="h-px bg-gradient-to-l from-transparent via-amber-500/40 to-amber-500/80 flex-1 max-w-xs" />
  </div>
);
