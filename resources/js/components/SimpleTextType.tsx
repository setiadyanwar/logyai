import React, { useState, useEffect } from 'react';

type SimpleTextTypeProps = {
  texts: string[];
  speed?: number;
  className?: string;
};

export default function SimpleTextType({ texts, speed = 100, className = '' }: SimpleTextTypeProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    console.log('SimpleTextType render:', { currentTextIndex, currentCharIndex, displayText }); // Debug
    
    const currentText = texts[currentTextIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentCharIndex < currentText.length) {
          const newText = currentText.slice(0, currentCharIndex + 1);
          setDisplayText(newText);
          setCurrentCharIndex(prev => prev + 1);
          console.log('Typing:', newText); // Debug
        } else {
          setTimeout(() => setIsDeleting(true), 1000);
        }
      } else {
        if (currentCharIndex > 0) {
          const newText = currentText.slice(0, currentCharIndex - 1);
          setDisplayText(newText);
          setCurrentCharIndex(prev => prev - 1);
          console.log('Deleting:', newText); // Debug
        } else {
          setIsDeleting(false);
          setCurrentTextIndex(prev => (prev + 1) % texts.length);
        }
      }
    }, isDeleting ? speed / 2 : speed);

    return () => clearTimeout(timeout);
  }, [currentCharIndex, currentTextIndex, isDeleting, texts, speed]);

  return (
    <span className={`${className} font-bold`} style={{ color: '#374151', minHeight: '20px', display: 'inline-block' }}>
      {displayText || 'Loading...'}
      <span className="animate-pulse text-indigo-600 ml-1" style={{ fontSize: '1.2em' }}>|</span>
    </span>
  );
}
