import { useCallback, useEffect, useRef, useState } from 'react';
import { MapSearchParams, searchPropertiesOnMap } from '../api/propertyApi';
import { PropertyListItem } from '../types/property';

interface PropertySearchState {
  items: PropertyListItem[];
  loading: boolean;
  error: string | null;
  /** 한 번이라도 검색을 실행했는지. 초기 화면과 "결과 없음"을 구분하는 데 쓴다. */
  searched: boolean;
}

interface UsePropertySearchResult extends PropertySearchState {
  search: (params: MapSearchParams) => void;
}

/**
 * 지도 검색 전용 페칭 훅.
 *
 * 공용 useFetch는 마운트 시 1회 호출용이라 여기에는 맞지 않는다.
 * 지도는 이동·필터 변경마다 같은 API를 다른 파라미터로 반복 호출해야 한다.
 *
 * 요청마다 일련번호를 매겨, 앞선 요청이 늦게 도착해도 최신 결과를 덮어쓰지 않게 한다.
 * 지도를 빠르게 움직이면 실제로 자주 발생하는 상황이다.
 */
export function usePropertySearch(): UsePropertySearchResult {
  const [state, setState] = useState<PropertySearchState>({
    items: [],
    loading: false,
    error: null,
    searched: false,
  });

  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const search = useCallback((params: MapSearchParams) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    searchPropertiesOnMap(params, controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        setState({ items, loading: false, error: null, searched: true });
      })
      .catch((err: Error) => {
        if (controller.signal.aborted) return;
        setState({ items: [], loading: false, error: err.message, searched: true });
      });
  }, []);

  return { ...state, search };
}
