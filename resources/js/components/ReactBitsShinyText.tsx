import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

const ReactBitsShinyText: React.FC<ShinyTextProps> = ({ 
  text, 
  disabled = false, 
  speed = 3, 
  className = '' 
}) => {
  if (disabled) {
    return <span className={className}>{text}</span>;
  }

  // Lapisan dasar teks (kontras tinggi), plus overlay shine sebagai dekorasi.
  return (
    <span className={`relative inline-block ${className}`}>
      {/* Base text for contrast (inherits parent color) */}
      <span className="relative z-10 text-current">{text}</span>
      {/* Shiny overlay */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-clip-text text-transparent animate-shine"
        style={{
          backgroundSize: '200% auto',
          animation: `shine ${speed}s linear infinite`,
          backgroundImage:
            'linear-gradient(110deg, rgba(255,255,255,0) 35%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0) 65%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          opacity: 0.9,
        }}
      >
        {text}
      </span>
    </span>
  );
};

export default ReactBitsShinyText;
