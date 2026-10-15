import { act, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import { CompareProvider, loadCompareItems, MAX_COMPARE, useCompare } from './CompareContext';

const wrapper = ({ children }: { children: ReactNode }) => <CompareProvider>{children}</CompareProvider>;
const item = (id: number) => ({ propertyId: id, title: `매물 ${id}` });

beforeEach(() => localStorage.clear());

describe('CompareContext', () => {
  it('adds and removes properties and remembers them across reloads', () => {
    const { result } = renderHook(() => useCompare(), { wrapper });

    act(() => { result.current.toggle(item(1)); });
    act(() => { result.current.toggle(item(2)); });
    expect(result.current.items.map((i) => i.propertyId)).toEqual([1, 2]);
    expect(loadCompareItems().map((i) => i.propertyId)).toEqual([1, 2]);

    act(() => { result.current.toggle(item(1)); });
    expect(result.current.has(1)).toBe(false);
    expect(loadCompareItems().map((i) => i.propertyId)).toEqual([2]);
  });

  it(`refuses to add more than ${MAX_COMPARE} properties`, () => {
    const { result } = renderHook(() => useCompare(), { wrapper });

    for (let id = 1; id <= MAX_COMPARE + 1; id++) act(() => { result.current.toggle(item(id)); });

    expect(result.current.items).toHaveLength(MAX_COMPARE);
    expect(result.current.isFull).toBe(true);
    expect(result.current.has(MAX_COMPARE + 1)).toBe(false);
  });

  it('restores saved items and ignores corrupted storage', () => {
    localStorage.setItem('homes:compare', JSON.stringify([item(7), { bad: true }]));
    expect(loadCompareItems()).toEqual([item(7)]);

    localStorage.setItem('homes:compare', '{not json');
    expect(loadCompareItems()).toEqual([]);
  });

  it('clears everything', () => {
    const { result } = renderHook(() => useCompare(), { wrapper });
    act(() => { result.current.toggle(item(1)); });
    act(() => { result.current.clear(); });
    expect(result.current.items).toEqual([]);
    expect(loadCompareItems()).toEqual([]);
  });
});
