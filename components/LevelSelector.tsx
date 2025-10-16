
import React from 'react';
import { LanguageLevel } from '../types';

interface LevelSelectorProps {
  selectedLevel: LanguageLevel;
  onLevelChange: (level: LanguageLevel) => void;
  disabled?: boolean;
}

const LevelSelector: React.FC<LevelSelectorProps> = ({ selectedLevel, onLevelChange, disabled = false }) => {
  const levels = Object.values(LanguageLevel);

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {levels.map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => onLevelChange(level)}
          disabled={disabled}
          className={`
            px-5 py-2 text-sm font-medium rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500
            ${selectedLevel === level
              ? 'bg-cyan-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }
            disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-70
          `}
        >
          {level}
        </button>
      ))}
    </div>
  );
};

export default LevelSelector;
