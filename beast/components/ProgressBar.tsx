import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full bg-slate-800 h-2 fixed top-0 left-0 z-50">
      <div 
        className="h-full bg-amber-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};