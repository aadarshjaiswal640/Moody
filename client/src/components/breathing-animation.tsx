import { useEffect, useState } from "react";

interface BreathingAnimationProps {
  isActive: boolean;
  phase: number; // 0: inhale, 1: hold, 2: exhale, 3: hold
}

export default function BreathingAnimation({ isActive, phase }: BreathingAnimationProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!isActive) {
      setScale(1);
      return;
    }

    switch (phase) {
      case 0: // Inhale - expand
        setScale(1.3);
        break;
      case 1: // Hold inhale - maintain expanded
        setScale(1.3);
        break;
      case 2: // Exhale - contract
        setScale(0.8);
        break;
      case 3: // Hold exhale - maintain contracted
        setScale(0.8);
        break;
      default:
        setScale(1);
    }
  }, [isActive, phase]);

  return (
    <div 
      className="breathing-circle w-48 h-48"
      style={{
        transform: `scale(${scale})`,
        transition: 'transform 1s ease-in-out',
      }}
    />
  );
}
