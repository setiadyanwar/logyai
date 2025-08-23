import React, { useState, useEffect } from 'react';

export default function BasicTextType() {
  const [text, setText] = useState('');
  const [charIndex, setCharIndex] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const texts = ["Selamat datang", "Tingkatkan produktivitas logbook", "Rapi, konsisten, otomatis"];
  
  useEffect(() => {
    console.log('BasicTextType state:', { textIndex, charIndex, isDeleting, currentText: texts[textIndex] });
    
    const currentText = texts[textIndex];
    
    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing forward
        if (charIndex < currentText.length) {
          setText(currentText.slice(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          // Finished typing, wait then start deleting
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        // Deleting backward
        if (charIndex > 0) {
          setText(currentText.slice(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        } else {
          // Finished deleting, move to next text
          setIsDeleting(false);
          setTextIndex((textIndex + 1) % texts.length);
        }
      }
    }, isDeleting ? 50 : 100);
    
    return () => clearTimeout(timer);
  }, [charIndex, textIndex, isDeleting]);
  
  return (
    <div style={{ 
      color: '#6366f1', 
      fontWeight: '500', 
      fontSize: '14px',
      minHeight: '20px'
    }}>
      {text}
      <span style={{ 
        animation: 'blink 1s infinite',
        marginLeft: '2px',
        color: '#6366f1'
      }}>|</span>
      
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
