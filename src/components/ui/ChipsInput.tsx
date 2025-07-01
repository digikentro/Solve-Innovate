import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

type ChipsInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: readonly string[];
  placeholder?: string;
  maxItems?: number;
  className?: string;
  disabled?: boolean;
};

export const ChipsInput = ({
  value = [],
  onChange,
  suggestions = [],
  placeholder = 'Type and press Enter...',
  maxItems = 10,
  className = '',
  disabled = false,
}: ChipsInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      !value.includes(suggestion) &&
      suggestion.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleAddChip = (chip: string) => {
    if (!chip.trim() || value.length >= maxItems) return;
    
    const newChip = chip.trim();
    if (!value.includes(newChip)) {
      onChange([...value, newChip]);
    }
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleRemoveChip = (chipToRemove: string) => {
    onChange(value.filter((chip) => chip !== chipToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        handleAddChip(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      handleRemoveChip(value[value.length - 1]);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className={`flex flex-wrap gap-2 p-2 min-h-12 border rounded-md ${
          disabled ? 'bg-gray-50' : 'bg-white'
        } ${disabled ? 'border-gray-200' : 'border-gray-300 hover:border-blue-500'} ${
          disabled ? '' : 'focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500'
        } transition-colors`}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((chip) => (
          <div
            key={chip}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
              disabled ? 'bg-gray-100' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {chip}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveChip(chip);
                }}
                className="text-blue-500 hover:text-blue-700 focus:outline-none"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        {!disabled && value.length < maxItems && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[100px] bg-transparent border-none focus:outline-none focus:ring-0 text-sm"
            disabled={disabled}
          />
        )}
      </div>

      {!disabled && showSuggestions && filteredSuggestions.length > 0 && (
        <div className="mt-1 border rounded-md bg-white shadow-lg max-h-60 overflow-auto z-10">
          {filteredSuggestions.map((suggestion) => (
            <div
              key={suggestion}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer"
              onMouseDown={(e) => {
                e.preventDefault();
                handleAddChip(suggestion);
              }}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}

      {maxItems && (
        <p className="text-xs text-gray-500">
          {value.length}/{maxItems} items
        </p>
      )}
    </div>
  );
};
