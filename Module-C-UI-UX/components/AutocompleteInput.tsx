'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (item: string) => void;
  items: string[];
  placeholder: string;
  suggestions: string[];
}

export default function AutocompleteInput({
  value,
  onChange,
  onAdd,
  onRemove,
  items,
  placeholder,
  suggestions,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim()) {
      const filtered = suggestions
        .filter(suggestion =>
          suggestion.toLowerCase().includes(value.toLowerCase()) &&
          !items.includes(suggestion)
        )
        .slice(0, 10); // Limit to 10 suggestions
      setFilteredSuggestions(filtered);
      setIsOpen(filtered.length > 0);
    } else {
      setIsOpen(false);
    }
  }, [value, suggestions, items]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAdd();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => {
              if (value.trim() && filteredSuggestions.length > 0) {
                setIsOpen(true);
              }
            }}
            placeholder={placeholder}
            className="bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          type="button"
          onClick={onAdd}
          disabled={!value.trim() || items.includes(value.trim())}
          className="bg-blue-600 hover:bg-blue-700 text-white border-0 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Dropdown Suggestions */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              <span className="text-slate-900 font-medium">{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      {/* Selected Items */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-4">
          {items.map((item, index) => (
            <Badge
              key={index}
              className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors duration-200 flex items-center gap-2 px-3 py-2"
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="hover:text-blue-800 transition-colors duration-200"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
