import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

/** 한 번에 비교할 수 있는 최대 매물 수 (표가 한눈에 보이는 한계) */
export const MAX_COMPARE = 3;

const STORAGE_KEY = 'homes:compare';

export interface CompareItem {
  propertyId: number;
  title: string;
}

interface CompareContextValue {
  items: CompareItem[];
  isFull: boolean;
  has: (propertyId: number) => boolean;
  /** 이미 담겨 있으면 빼고, 아니면 담는다(가득 찼으면 무시). 담긴 상태가 되면 true */
  toggle: (item: CompareItem) => boolean;
  remove: (propertyId: number) => void;
  clear: () => void;
}

function isCompareItem(value: unknown): value is CompareItem {
  const item = value as CompareItem;
  return typeof item?.propertyId === 'number' && typeof item?.title === 'string';
}

/** 새로고침해도 비교 목록이 남도록 localStorage에서 읽는다. 깨진 값/접근 불가는 빈 목록으로 본다. */
export function loadCompareItems(): CompareItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isCompareItem).slice(0, MAX_COMPARE) : [];
  } catch {
    return [];
  }
}

function saveCompareItems(items: CompareItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* 저장 실패(사생활 보호 모드 등)해도 이번 탭에서는 계속 동작한다 */
  }
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>(loadCompareItems);

  const update = useCallback((next: CompareItem[]) => {
    setItems(next);
    saveCompareItems(next);
  }, []);

  const value = useMemo<CompareContextValue>(() => {
    const has = (propertyId: number) => items.some((item) => item.propertyId === propertyId);
    return {
      items,
      isFull: items.length >= MAX_COMPARE,
      has,
      toggle: (item) => {
        if (has(item.propertyId)) {
          update(items.filter((existing) => existing.propertyId !== item.propertyId));
          return false;
        }
        if (items.length >= MAX_COMPARE) return false;
        update([...items, item]);
        return true;
      },
      remove: (propertyId) => update(items.filter((item) => item.propertyId !== propertyId)),
      clear: () => update([]),
    };
  }, [items, update]);

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare(): CompareContextValue {
  const context = useContext(CompareContext);
  if (!context) throw new Error('useCompare는 CompareProvider 안에서만 사용할 수 있어요.');
  return context;
}
