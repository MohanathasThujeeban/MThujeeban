import React, { useMemo } from 'react';

interface OdometerProps {
  value: number;
  decimals?: number;
  progress: number; // 0..1 driving the roll
  className?: string;
  snapLowest?: boolean;
}

function smoothstep(min: number, max: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

export const Odometer: React.FC<OdometerProps> = ({
  value,
  decimals = 0,
  progress,
  className = '',
  snapLowest = true,
}) => {
  // Target value scaled by progress
  const currentVal = value * progress;
  const str = currentVal.toFixed(decimals);

  const digits = useMemo(() => str.split(''), [str]);

  return (
    <div className={`odometer ${className}`}>
      {digits.map((char, index) => {
        if (char === '.' || char === ',') {
          return (
            <span key={index} className="odometer-separator">
              {char}
            </span>
          );
        }

        const digitVal = parseInt(char, 10) || 0;
        const isLowest = index === digits.length - 1;

        // If lowest digit, apply smoothstep snapping if desired
        let offset = digitVal;
        if (isLowest && snapLowest) {
          const rawFrac = (currentVal * Math.pow(10, decimals)) % 1;
          const snappedFrac = smoothstep(0.55, 1.0, rawFrac);
          offset = Math.floor(digitVal) + snappedFrac;
        }

        const translateY = -(offset % 10) * 10; // 10% per digit in a 10-digit column

        return (
          <div key={index} className="odometer-column-wrapper">
            <div
              className="odometer-column"
              style={{
                transform: `translate3d(0, ${translateY}%, 0)`,
                transition: 'transform 0.08s cubic-bezier(0.2, 0.9, 0.3, 1)',
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num, i) => (
                <span key={i} className="odometer-digit">
                  {num}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
