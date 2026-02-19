import React, { ReactNode } from 'react';

interface StepContainerProps {
  title: string;
  description: string;
  children: ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  canNext: boolean;
  isLastStep?: boolean;
  isLoading?: boolean;
}

export const StepContainer: React.FC<StepContainerProps> = ({
  title,
  description,
  children,
  onNext,
  onBack,
  canNext,
  isLastStep = false,
  isLoading = false,
}) => {
  return (
    <div className="flex flex-col h-full min-h-[80vh] max-w-2xl mx-auto p-6 relative">
      <div className="flex-1">
        <h2 className="text-3xl font-bold text-amber-400 mb-2 text-center drop-shadow-md">{title}</h2>
        <p className="text-slate-400 text-center mb-8">{description}</p>
        
        <div className="animate-fade-in-up">
          {children}
        </div>
      </div>

      <div className="sticky bottom-0 bg-[#0f172a]/90 backdrop-blur-sm p-4 mt-8 border-t border-slate-800 flex justify-between items-center gap-4 rounded-t-xl z-10">
        {onBack ? (
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors font-bold disabled:opacity-50"
            disabled={isLoading}
          >
            返回
          </button>
        ) : (
          <div /> /* Spacer */
        )}

        {onNext && (
          <button
            onClick={onNext}
            disabled={!canNext || isLoading}
            className={`
              flex-1 px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-all
              ${!canNext || isLoading
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-400 hover:to-orange-500 hover:scale-[1.02]'}
            `}
          >
            {isLoading ? '召唤中...' : isLastStep ? '召唤守护兽' : '下一步'}
          </button>
        )}
      </div>
    </div>
  );
};