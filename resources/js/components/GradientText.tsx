import React from 'react';

type GradientTextProps = {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  animationSpeed?: number; // seconds
  showBorder?: boolean;
};

export default function GradientText({
  children,
  className = '',
  colors = ['#ffaa40', '#9c40ff', '#ffaa40'],
  animationSpeed = 8,
  showBorder = false,
}: GradientTextProps) {
  const gradientStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(to right, ${colors.join(', ')})`,
    animationDuration: `${animationSpeed}s`,
  };

  return (
    <div
      className={`relative mx-auto flex max-w-fit flex-row items-center justify-center rounded-[1.25rem] font-semibold backdrop-blur transition-shadow duration-500 overflow-hidden ${className}`}
    >
      {showBorder && (
        <div
          className="absolute inset-0 z-0 pointer-events-none animate-gradient"
          style={{
            ...gradientStyle,
            backgroundSize: '300% 100%',
          }}
        >
          <div
            className="absolute inset-0 rounded-[1.25rem] bg-black"
            style={{
              width: 'calc(100% - 2px)',
              height: 'calc(100% - 2px)',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      )}
      <div
        className="relative z-10 inline-block bg-cover text-transparent animate-gradient"
        style={{
          ...gradientStyle,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          backgroundSize: '300% 100%',
        }}
      >
        {children}
      </div>
    </div>
  );
}


