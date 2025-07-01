import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X, ChevronDown, Plus } from 'lucide-react';

type MultiSelectProps = {
  value: string[];
  onChange: (value: string[]) => void;
  options: readonly string[];
  placeholder?: string;
  maxItems?: number;
  className?: string;
  creatable?: boolean;
  disabled?: boolean;
};

export const MultiSelect = ({
  value = [],
  onChange,
  options = [],
  placeholder = 'Select...',
  maxItems = 10,
  className = '',
  creatable = true,
  disabled = false,
}: MultiSelectProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const isDisabled = disabled || false;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset highlighted index when dropdown opens/closes or input changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [isOpen, inputValue]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const showAddButton = creatable && 
    inputValue.trim() && 
    !options.includes(inputValue) && 
    !value.includes(inputValue);

  const filteredOptions = options
    .filter(option => 
      option.toLowerCase().includes(inputValue.toLowerCase()) && 
      !value.includes(option)
    )
    .slice(0, 5); // Limit suggestions to 5 items

  const allOptions = [
    ...(showAddButton ? [{ type: 'add', value: inputValue }] : []),
    ...filteredOptions.map(option => ({ type: 'option' as const, value: option }))
  ];

  const handleAddItem = (item: string) => {
    if (value.length >= maxItems) return;
    if (item.trim() && !value.includes(item)) {
      onChange([...value, item.trim()]);
    }
    setInputValue('');
  };

  const handleRemoveItem = (itemToRemove: string) => {
    onChange(value.filter(item => item !== itemToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < allOptions.length) {
          const item = allOptions[highlightedIndex];
          if (item.type === 'add' || item.type === 'option') {
            handleAddItem(item.value);
          }
        } else if (inputValue.trim()) {
          handleAddItem(inputValue);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < allOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : -1
        );
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'Backspace':
        if (!inputValue && value.length > 0) {
          // Remove last item on backspace when input is empty
          e.preventDefault();
          handleRemoveItem(value[value.length - 1]);
        }
        break;
      default:
        break;
    }
  };

  const handleAddClick = (item: string) => {
    handleAddItem(item);
    setInputValue('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div 
        className={`flex flex-wrap items-center gap-2 p-2 border rounded-md min-h-10 bg-white ${
          isOpen ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300 hover:border-gray-400'
        } transition-colors`}
        onClick={() => !isOpen && setIsOpen(true)}
      >
        {value.map((item) => (
          <div 
            key={item} 
            className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-100 rounded-full text-blue-800"
          >
            <span className="max-w-[200px] truncate">{item}</span>
            <button 
              type="button" 
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveItem(item);
              }}
              className="text-blue-500 hover:text-blue-700 flex-shrink-0"
              aria-label={`Remove ${item}`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => !isDisabled && setInputValue(e.target.value)}
          onFocus={() => !isDisabled && setIsOpen(true)}
          onKeyDown={isDisabled ? undefined : handleKeyDown}
          className={`flex-1 min-w-[100px] outline-none bg-transparent ${
            isDisabled ? 'cursor-not-allowed' : ''
          }`}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={isDisabled}
        />
        <button 
          type="button" 
          className={`text-gray-500 hover:text-gray-700 flex-shrink-0 ${
            isDisabled ? 'cursor-not-allowed' : ''
          }`}
          onClick={() => !isDisabled && setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close dropdown' : 'Open dropdown'}
        >
          <ChevronDown 
            size={18} 
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>
      </div>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden"
        >
          {allOptions.length > 0 ? (
            <ul className="py-1 max-h-60 overflow-auto">
              {allOptions.map((item, index) => (
                <li key={item.type === 'add' ? `add-${item.value}` : item.value}>
                  <button
                    type="button"
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${
                      highlightedIndex === index 
                        ? 'bg-blue-50 text-blue-800' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleAddClick(item.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {item.type === 'add' && (
                      <Plus size={14} className="text-green-600 flex-shrink-0" />
                    )}
                    <span className="truncate">
                      {item.type === 'add' ? (
                        <span>Add <strong>"{item.value}"</strong></span>
                      ) : (
                        item.value
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : inputValue.trim() ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              No matches found. {creatable ? 'Type to add a new item.' : ''}
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500">
              Start typing to see suggestions
            </div>
          )}
          
          {value.length >= maxItems && (
            <div className="px-4 py-2 text-xs text-amber-700 bg-amber-50 border-t border-amber-100">
              Maximum {maxItems} items reached
            </div>
          )}
        </div>
      )}
    </div>
  );
};
