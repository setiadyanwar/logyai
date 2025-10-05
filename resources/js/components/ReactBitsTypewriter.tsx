import React, { useState, useEffect, useRef } from 'react';

interface TypewriterProps {
  words: string[];
  loop?: boolean;
  delaySpeed?: number;
  deleteSpeed?: number;
  typeSpeed?: number;
  className?: string;
}

const ReactBitsTypewriter: React.FC<TypewriterProps> = ({
  words,
  loop = true,
  delaySpeed = 2000,
  deleteSpeed = 50,
  typeSpeed = 100,
  className = ''
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!words || words.length === 0) return;

    const currentWord = words[currentWordIndex];

    const animate = () => {
      if (!isDeleting) {
        // Typing
        if (charIndex < currentWord.length) {
          setDisplayText(currentWord.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
          timeoutRef.current = setTimeout(animate, typeSpeed);
        } else {
          // Finished typing, wait then start deleting
          timeoutRef.current = setTimeout(() => {
            setIsDeleting(true);
          }, delaySpeed);
        }
      } else {
        // Deleting
        if (charIndex > 0) {
          setDisplayText(currentWord.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
          timeoutRef.current = setTimeout(animate, deleteSpeed);
        } else {
          // Finished deleting, move to next word
          setIsDeleting(false);
          setCurrentWordIndex((currentWordIndex + 1) % words.length);
        }
      }
    };

    timeoutRef.current = setTimeout(animate, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [charIndex, currentWordIndex, isDeleting, words, delaySpeed, deleteSpeed, typeSpeed]);

  return (
    <span className={`${className} inline-flex items-center min-h-[1.5em]`}>
      <span className="mr-1">{displayText || '\u00A0'}</span>
      <span className="w-0.5 h-4 bg-current animate-pulse" />
    </span>
  );
};

export default ReactBitsTypewriter;