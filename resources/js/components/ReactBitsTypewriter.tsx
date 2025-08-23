// 1. PERBAIKAN TYPEWRITER COMPONENT
import React, { useState, useEffect, useCallback } from 'react';

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
  delaySpeed = 1000,
  deleteSpeed = 30,
  typeSpeed = 60,
  className = ''
}) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  const typeNext = useCallback(() => {
    if (!words.length || isWaiting) return;
    
    const currentWord = words[currentWordIndex];
    
    if (!isDeleting) {
      // Typing
      if (currentText.length < currentWord.length) {
        setCurrentText(currentWord.slice(0, currentText.length + 1));
      } else {
        // Finished typing, wait then start deleting
        setIsWaiting(true);
        setTimeout(() => {
          setIsWaiting(false);
          setIsDeleting(true);
        }, delaySpeed);
      }
    } else {
      // Deleting
      if (currentText.length > 0) {
        setCurrentText(currentText.slice(0, -1));
      } else {
        // Finished deleting, move to next word
        setIsDeleting(false);
        if (loop) {
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }
  }, [currentText, currentWordIndex, isDeleting, words, loop, delaySpeed, isWaiting]);

  useEffect(() => {
    if (!words.length || isWaiting) return;

    const interval = setInterval(() => {
      typeNext();
    }, isDeleting ? deleteSpeed : typeSpeed);

    return () => clearInterval(interval);
  }, [typeNext, isDeleting, deleteSpeed, typeSpeed, isWaiting]);

  // Initialize with first character
  useEffect(() => {
    if (words.length > 0 && currentText === '') {
      setCurrentText('');
      // Start typing after a small delay
      setTimeout(() => {
        setCurrentText(words[0].charAt(0) || '');
      }, 100);
    }
  }, [words]);

  return (
    <span className={`${className} inline-flex items-center min-h-[1.5em]`}>
      <span className="mr-1">{currentText || '\u00A0'}</span>
      <span className="w-0.5 h-4 bg-current animate-pulse" />
    </span>
  );
};

export default ReactBitsTypewriter;