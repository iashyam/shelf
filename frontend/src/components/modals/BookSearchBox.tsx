'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useBookSearch } from '@/lib/queries';
import { BookSearchResult } from '@/types/models';

const DEBOUNCE_MS = 300;

interface BookSearchBoxProps {
  onSelect: (result: BookSearchResult) => void;
}

export function BookSearchBox({ onSelect }: BookSearchBoxProps) {
  const [input, setInput] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(input), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input]);

  const { data: results = [], isFetching, isError } = useBookSearch(debounced);
  const showDropdown = open && input.trim().length >= 2;

  const select = (result: BookSearchResult) => {
    onSelect(result);
    setInput('');
    setDebounced('');
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && showDropdown && activeIndex >= 0 && results[activeIndex]) {
      // Keep Enter from submitting the surrounding form
      e.preventDefault();
      select(results[activeIndex]);
    } else if (e.key === 'Escape' && showDropdown) {
      // Close the dropdown only, not the whole modal
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-foreground/80 mb-1.5">
        Find a book
      </label>
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search by title or author..."
          autoComplete="off"
          autoFocus
          className="w-full pl-10 pr-3.5 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-shadow"
        />
      </div>

      {showDropdown && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 w-full max-h-72 overflow-y-auto bg-surface border border-border rounded-xl shadow-lg"
        >
          {isFetching && results.length === 0 && (
            <li className="px-3.5 py-3 text-sm text-muted">Searching...</li>
          )}
          {isError && (
            <li className="px-3.5 py-3 text-sm text-red-600 dark:text-red-400">
              Search unavailable. Enter details manually below.
            </li>
          )}
          {!isFetching && !isError && results.length === 0 && debounced.trim().length >= 2 && (
            <li className="px-3.5 py-3 text-sm text-muted">No matches. Enter details manually below.</li>
          )}
          {results.map((result, index) => (
            <li
              key={result.externalId}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(e) => {
                // mousedown (not click) so selection lands before the input blurs
                e.preventDefault();
                select(result);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer ${
                index === activeIndex ? 'bg-background' : ''
              }`}
            >
              {result.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote cover thumbnails, no optimization needed
                <img
                  src={result.coverUrl}
                  alt=""
                  loading="lazy"
                  className="w-8 h-12 object-cover rounded bg-background shrink-0"
                />
              ) : (
                <div className="w-8 h-12 rounded bg-background shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                <p className="text-xs text-muted truncate">
                  {[result.author, result.year || null].filter(Boolean).join(' · ')}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
