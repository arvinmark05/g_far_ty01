
import React, { useState, useEffect, useRef } from 'react';
import { DialogueLine } from '../types';
import { Play } from 'lucide-react';

interface DialogueOverlayProps {
  lines: DialogueLine[];
  onComplete: () => void;
}

export default function DialogueOverlay({ lines, onComplete }: DialogueOverlayProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const currentLine = lines[currentLineIndex];
  const typeSpeed = 30; // ms per char

  useEffect(() => {
    setImageError(false); // Reset image error state when line changes
    if (!currentLine) return;
    
    setDisplayedText('');
    setIsTyping(true);
    let charIndex = 0;
    
    const interval = setInterval(() => {
      charIndex++;
      setDisplayedText(currentLine.text.slice(0, charIndex));
      
      if (charIndex >= currentLine.text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, typeSpeed);

    return () => clearInterval(interval);
  }, [currentLineIndex, currentLine]);

  const handleNext = () => {
    if (isTyping) {
      // 如果正在打字，點擊則瞬間顯示全部文字
      setDisplayedText(currentLine.text);
      setIsTyping(false);
    } else {
      // 下一句或結束
      if (currentLineIndex < lines.length - 1) {
        setCurrentLineIndex(prev => prev + 1);
      } else {
        onComplete();
      }
    }
  };

  if (!currentLine) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col justify-end items-center pb-8 animate-in fade-in duration-300"
      onClick={handleNext}
    >
        {/* 立繪區域 (Center-Bottom) */}
        {/* Adjusted bottom position to create better overlap with dialogue box */}
        {currentLine.image && (
            <div className={`absolute bottom-[180px] md:bottom-[160px] left-1/2 -translate-x-1/2 z-0 transition-all duration-500 ease-out transform ${isTyping ? 'scale-105' : 'scale-100'} filter drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] pointer-events-none`}>
                 {!imageError ? (
                     <img 
                        src={currentLine.image} 
                        alt={currentLine.speakerName} 
                        className="max-h-[55vh] object-contain opacity-100"
                        onError={() => setImageError(true)}
                     />
                 ) : (
                     <div className="text-8xl animate-bounce mb-10">👤</div>
                 )}
            </div>
        )}

      {/* 對話框區域 */}
      <div className="w-full max-w-4xl px-4 relative z-10">
        <div className="bg-gray-900/95 border-2 border-white/20 rounded-xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.8)] min-h-[160px] flex flex-col relative overflow-hidden backdrop-blur-md">
            {/* 裝飾線 */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>

            {/* 名字標籤 */}
            <div className="absolute -top-4 left-6 bg-gradient-to-r from-purple-700 to-blue-700 px-6 py-1 rounded-full border border-purple-400 shadow-lg transform -skew-x-12 z-20">
                <span className="text-white font-bold text-lg tracking-wider not-italic block transform skew-x-12">{currentLine.speakerName}</span>
            </div>

            {/* 文字內容 */}
            <div className="mt-4 text-xl md:text-2xl text-white font-medium leading-relaxed drop-shadow-md font-serif tracking-wide z-10 relative">
                {displayedText}
                <span className="animate-pulse text-purple-400">|</span>
            </div>

            {/* 提示箭頭 */}
            {!isTyping && (
                <div className="absolute bottom-4 right-6 animate-bounce text-purple-400">
                    <Play fill="currentColor" size={24} className="transform rotate-90" />
                </div>
            )}
        </div>
        <div className="text-center mt-2 text-gray-500 text-xs shadow-black drop-shadow-md">點擊螢幕繼續</div>
      </div>
    </div>
  );
}
