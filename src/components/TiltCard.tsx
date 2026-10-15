import React, { useRef, useState } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // default 14
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = '',
  maxTilt = 14,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, glareX: 50, glareY: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const px = (x / rect.width) * 2 - 1; // -1 .. 1
    const py = (y / rect.height) * 2 - 1; // -1 .. 1

    // Tilt toward cursor:
    const ry = px * maxTilt;
    const rx = -py * maxTilt;

    setTilt({
      rx,
      ry,
      glareX: (x / rect.width) * 100,
      glareY: (y / rect.height) * 100,
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rx: 0, ry: 0, glareX: 50, glareY: 50 });
  };

  return (
    <div
      ref={cardRef}
      className={`glass-card-tilt-wrap ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.5s ease-out',
      }}
    >
      <div className="glass-card-inner">
        {/* Radial glare */}
        <div
          className="glass-card-glare"
          style={{
            background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.45) 0%, rgba(255,31,31,0.08) 40%, transparent 70%)`,
            opacity: isHovered ? 1 : 0.4,
          }}
        />
        {children}
      </div>
    </div>
  );
};
