import React from 'react';

type ShinyTextProps = {
  text: React.ReactNode;
  disabled?: boolean;
  speed?: number; // seconds
  className?: string;
};

export default function ShinyText({ text, disabled = false, speed = 5, className = '' }: ShinyTextProps) {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`inline-block bg-clip-text text-[#b5b5b5a4] ${disabled ? '' : 'animate-shine'} ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(120deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 60%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        animationDuration,
      }}
    >
      {text}
    </span>
  );
}


