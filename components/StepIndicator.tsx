import React from 'react';
import { Check } from 'lucide-react';

interface Props {
  currentStep: number;
  steps: string[];
}

export const StepIndicator: React.FC<Props> = ({ currentStep, steps }) => {
  return (
    <div className="w-full py-6">
      <div className="flex justify-between items-center relative">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;

          return (
            <div key={index} className="flex flex-col items-center bg-slate-50 px-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors duration-200
                  ${isCompleted ? 'bg-brand-600 border-brand-600 text-white' : 
                    isActive ? 'bg-white border-brand-600 text-brand-600' : 
                    'bg-white border-gray-300 text-gray-400'}`}
              >
                {isCompleted ? <Check size={16} /> : stepNum}
              </div>
              <span className={`text-xs mt-2 font-medium hidden sm:block ${isActive ? 'text-brand-700' : 'text-gray-500'}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
      <div className="text-center mt-2 sm:hidden font-semibold text-brand-700">
        {steps[currentStep - 1]}
      </div>
    </div>
  );
};