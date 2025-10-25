import { useState, useRef, useEffect } from 'react';
import { MoveHorizontal } from 'lucide-react';

interface ImageComparerProps {
  beforeImage: string;
  afterImage: string;
}

export default function ImageComparer({ beforeImage, afterImage }: ImageComparerProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    
    // Calculate percentage and clamp strictly within image bounds
    // Handle is 56px wide, so we need at least 28px margin on each side
    const handleRadius = 28; // Half of 56px handle width
    const minX = handleRadius;
    const maxX = rect.width - handleRadius;
    
    const clampedX = Math.max(minX, Math.min(maxX, x));
    const percentage = (clampedX / rect.width) * 100;
    
    setSliderPosition(percentage);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        handleMove(e.clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        e.preventDefault();
        handleMove(e.touches[0].clientX);
      }
    };

    const stopDragging = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('mouseup', stopDragging);
      document.addEventListener('touchend', stopDragging);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', stopDragging);
      document.removeEventListener('touchend', stopDragging);
    };
  }, [isDragging]);

  const startDragging = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#0C0C0F] rounded-xl overflow-hidden">
      <div 
        ref={containerRef}
        style={{
          position: 'relative',
          display: 'inline-block',
          maxWidth: '100%',
          maxHeight: '100%',
          lineHeight: 0
        }}
      >
        {/* Invisible Image - Defines Container Size */}
        <img
          src={afterImage}
          alt="After"
          style={{
            display: 'block',
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            visibility: 'hidden'
          }}
          draggable={false}
        />
        
        {/* AFTER Image - Background Layer */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url("${afterImage}")`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        
        {/* BEFORE Image - Background Layer (Clipped) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url("${beforeImage}")`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
          }}
        />
        
        {/* Slider Line */}
        <div 
          style={{ 
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: 'white',
            left: `${sliderPosition}%`,
            transform: 'translateX(-50%)',
            boxShadow: '0 0 10px rgba(255,255,255,0.8)',
            pointerEvents: 'none',
            zIndex: 10
          }}
        />
        
        {/* Slider Handle */}
        <div
          style={{ 
            position: 'absolute',
            top: '50%',
            left: `${sliderPosition}%`,
            transform: 'translate(-50%, -50%)',
            width: '56px',
            height: '56px',
            background: 'linear-gradient(135deg, #A97FFF, #7C5DFF)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDragging ? 'grabbing' : 'grab',
            boxShadow: '0 0 20px rgba(169, 127, 255, 0.8)',
            transition: isDragging ? 'none' : 'transform 0.2s',
            zIndex: 20
          }}
          onMouseDown={startDragging}
          onTouchStart={startDragging}
          className="hover:scale-110"
        >
          <MoveHorizontal className="w-7 h-7 text-white pointer-events-none" />
        </div>
        
        {/* Labels */}
        <div 
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            padding: '12px 20px',
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.3)',
            pointerEvents: 'none',
            zIndex: 15,
            userSelect: 'none'
          }}
        >
          <span style={{ 
            color: 'white', 
            fontSize: '14px', 
            fontWeight: 'bold', 
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            BEFORE
          </span>
        </div>
        
        <div 
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.3)',
            pointerEvents: 'none',
            zIndex: 15,
            userSelect: 'none'
          }}
        >
          <span style={{ 
            color: 'white', 
            fontSize: '14px', 
            fontWeight: 'bold', 
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            AFTER
          </span>
        </div>
      </div>
    </div>
  );
}