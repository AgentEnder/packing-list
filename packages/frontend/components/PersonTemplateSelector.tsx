// PersonTemplateSelector Component - Sprint 3
// Provides autocomplete suggestions for person templates

import { useState, useRef, useEffect } from 'react';
import { UserPerson, getTemplateSuggestions } from '@packing-list/model';
import { useAppSelector } from '@packing-list/state';
import { selectUserPeople } from '@packing-list/state';
import { User, Search, Plus } from 'lucide-react';

interface PersonTemplateSelectorProps {
  onSelectTemplate: (template: UserPerson) => void;
  onCreateNew: (name: string) => void;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function PersonTemplateSelector({
  onSelectTemplate,
  onCreateNew,
  placeholder = 'Type a name or select from templates...',
  value = '',
  onChange,
  className = '',
  disabled = false,
}: PersonTemplateSelectorProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const userPeople = useAppSelector(selectUserPeople);
  const suggestions = getTemplateSuggestions(userPeople, inputValue, 5);
  const hasExactMatch = suggestions.some(
    (s) => s.name.toLowerCase() === inputValue.toLowerCase()
  );

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange?.(newValue);
    setIsOpen(newValue.length > 0);
    setHighlightedIndex(-1);
  };

  const handleSelectTemplate = (template: UserPerson) => {
    setInputValue(template.name);
    setIsOpen(false);
    onSelectTemplate(template);
  };

  const handleCreateNew = () => {
    setIsOpen(false);
    onCreateNew(inputValue.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        if (inputValue.trim()) {
          setIsOpen(true);
        }
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const maxIndex = suggestions.length + (hasExactMatch ? 0 : 1) - 1;
          return prev < maxIndex ? prev + 1 : 0;
        });
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const maxIndex = suggestions.length + (hasExactMatch ? 0 : 1) - 1;
          return prev > 0 ? prev - 1 : maxIndex;
        });
        break;

      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          if (highlightedIndex < suggestions.length) {
            handleSelectTemplate(suggestions[highlightedIndex]);
          } else {
            handleCreateNew();
          }
        } else if (inputValue.trim()) {
          handleCreateNew();
        }
        break;

      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleBlur = (_e: React.FocusEvent) => {
    // Delay closing to allow clicks on suggestions
    setTimeout(() => {
      if (!listRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }, 200);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => {
            if (inputValue.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      {isOpen &&
        (suggestions.length > 0 || (!hasExactMatch && inputValue.trim())) && (
          <ul
            ref={listRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
          >
            {suggestions.map((template, index) => (
              <li key={template.id}>
                <button
                  type="button"
                  onClick={() => handleSelectTemplate(template)}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100 ${
                    index === highlightedIndex
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700'
                  }`}
                >
                  <User className="w-4 h-4 text-gray-400" />
                  <div className="flex-1">
                    <div className="font-medium">{template.name}</div>
                    {(template.age || template.gender) && (
                      <div className="text-sm text-gray-500">
                        {[
                          template.age ? `Age ${template.age}` : null,
                          template.gender,
                        ]
                          .filter(Boolean)
                          .join(' • ')}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      template.isUserProfile
                        ? 'text-green-600 bg-green-100'
                        : 'text-blue-600 bg-blue-100'
                    }`}
                  >
                    {template.isUserProfile ? 'You' : 'Template'}
                  </span>
                </button>
              </li>
            ))}

            {!hasExactMatch && inputValue.trim() && (
              <li>
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100 border-t border-gray-200 ${
                    highlightedIndex === suggestions.length
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-700'
                  }`}
                >
                  <Plus className="w-4 h-4 text-green-500" />
                  <div className="flex-1">
                    <div className="font-medium">
                      Create &ldquo;{inputValue.trim()}&rdquo;
                    </div>
                    <div className="text-sm text-gray-500">
                      Add as new person
                    </div>
                  </div>
                </button>
              </li>
            )}
          </ul>
        )}
    </div>
  );
}
