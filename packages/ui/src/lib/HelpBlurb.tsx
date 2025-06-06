import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface HelpBlurbProps {
  title: string;
  children: React.ReactNode;
}

export const HelpBlurb: React.FC<HelpBlurbProps> = ({ title, children }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-6">
      <button
        className="flex items-center gap-2 text-base-content/70 hover:text-base-content"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
        <span className="font-medium">{title}</span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[1000px] mt-4' : 'max-h-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
};
