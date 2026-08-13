import { useEffect, useRef, useState } from 'react';
import { loadKakaoMapSdk } from '../../utils/KakaoLoader';
import styles from './SearchBar.module.css';

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
    <div className={styles.wrapper} ref={wrapperRef}>
      <div className={styles.inputBox}>
        <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="7" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11.2 11.2 L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          className={styles.input}
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
        />
        {value && (
          <button
            type="button"
            className={styles.clear}
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
        <ul id="property-search-suggestions" className={styles.suggestions} role="listbox">
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.id}>
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={`${styles.suggestion} ${index === activeIndex ? styles.suggestionActive : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => select(suggestion)}
              >
                <span className={styles.suggestionName}>{suggestion.name}</span>
                <span className={styles.suggestionAddress}>{suggestion.address}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchBar;
