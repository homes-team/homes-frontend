import { useEffect, useRef, useState } from 'react';
import { loadKakaoMapSdk } from '../../../utils/KakaoLoader';

export interface PlaceSuggestion {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  /** 엔터 또는 자동완성 선택. place가 있으면 해당 좌표로 지도를 옮긴다. */
  onSubmit: (keyword: string, place?: PlaceSuggestion) => void;
}

const SUGGESTION_DEBOUNCE_MS = 250;
const MAX_SUGGESTIONS = 5;

function SearchBar({ value, onChange, onSubmit }: SearchBarProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  /* 바깥 클릭 시 자동완성 닫기 */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* 입력 디바운스 후 카카오 장소 검색 */
  useEffect(() => {
    const keyword = value.trim();
    if (keyword.length < 2) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      loadKakaoMapSdk()
        .then((maps) => {
          const places = new maps.services.Places();
          places.keywordSearch(
            keyword,
            (result, status) => {
              if (cancelled) return;
              if (status !== maps.services.Status.OK) {
                setSuggestions([]);
                return;
              }
              setSuggestions(
                result.slice(0, MAX_SUGGESTIONS).map((place) => ({
                  id: place.id,
                  name: place.place_name,
                  address: place.road_address_name || place.address_name,
                  lat: Number(place.y),
                  lng: Number(place.x),
                })),
              );
              setActiveIndex(-1);
            },
            { size: MAX_SUGGESTIONS },
          );
        })
        .catch(() => setSuggestions([]));
    }, SUGGESTION_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value]);

  const select = (suggestion: PlaceSuggestion) => {
    onChange(suggestion.name);
    onSubmit(suggestion.name, suggestion);
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) {
      if (event.key === 'Enter') onSubmit(value.trim());
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex >= 0) select(suggestions[activeIndex]);
      else {
        onSubmit(value.trim());
        setOpen(false);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="flex items-center gap-2.5 rounded-lg border-[1.5px] border-transparent bg-gray-100 px-3.5 py-3.5 focus-within:border-primary focus-within:bg-white">
        <svg className="h-4 w-4 shrink-0 text-gray-400" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11.2 11.2 L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          className="min-w-0 flex-1 border-none bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 [&::-webkit-search-cancel-button]:hidden"
          type="search"
          value={value}
          placeholder="지역, 지하철역, 학교 검색"
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          aria-label="매물 검색"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && suggestions.length > 0}
          aria-controls="property-search-suggestions"
          aria-activedescendant={activeIndex >= 0 ? `suggestion-${suggestions[activeIndex]?.id}` : undefined}
        />
        {value && (
          <button
            type="button"
            className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-pill bg-gray-200 text-[9px] text-gray-600 hover:bg-gray-400 hover:text-white"
            onClick={() => {
              onChange('');
              onSubmit('');
            }}
            aria-label="검색어 지우기"
          >
            ✕
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          id="property-search-suggestions"
          className="absolute top-[calc(100%+8px)] right-0 left-0 z-20 max-h-80 overflow-y-auto rounded-[10px] border border-gray-200 bg-white py-1.5 shadow-[0_6px_18px_rgba(0,0,0,0.14)]"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.id}>
              <button
                type="button"
                role="option"
                id={`suggestion-${suggestion.id}`}
                aria-selected={index === activeIndex}
                className={`flex w-full flex-col gap-0.5 px-4 py-2 text-left ${
                  index === activeIndex ? 'bg-primary-50' : ''
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => select(suggestion)}
              >
                <span className="text-sm font-medium text-gray-900">{suggestion.name}</span>
                <span className="text-xs text-gray-500">{suggestion.address}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchBar;
