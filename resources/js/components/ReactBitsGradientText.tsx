import React from 'react';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  animate?: boolean;
}

const ReactBitsGradientText: React.FC<GradientTextProps> = ({ 
  children, 
  className = '',
  colors = ['#3b82f6', '#8b5cf6', '#06b6d4'],
  animate = true
}) => {
  const gradientColors = colors.join(', ');
  
  return (
    <span 
      className={`bg-gradient-to-r bg-clip-text text-transparent font-bold ${animate ? 'animate-gradient-x' : ''} ${className}`}
      style={{
        backgroundImage: `linear-gradient(45deg, ${gradientColors})`,
        backgroundSize: animate ? '400% 400%' : '100% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}
    >
      {children}
    </span>
  );
};

export default ReactBitsGradientText;
