
import React from 'react';
import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  label: string;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, label }) => {
  // Determine color based on score
  const getColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Background circle */}
        <div className="absolute inset-0 rounded-full bg-gray-200"></div>
        
        {/* Progress circle using conic gradient */}
        <div 
          className="absolute inset-0 rounded-full" 
          style={{
            background: `conic-gradient(
              currentColor ${score}%, 
              transparent ${score}%
            )`,
          }}
        ></div>
        
        {/* Inner white circle to create donut effect */}
        <div className="absolute inset-[3px] rounded-full bg-background"></div>
        
        {/* Score text */}
        <span className={cn("relative text-sm font-semibold", getColor(score))}>
          {score}%
        </span>
      </div>
      <span className="mt-1 text-xs font-medium text-center">{label}</span>
    </div>
  );
};

export default ScoreGauge;
