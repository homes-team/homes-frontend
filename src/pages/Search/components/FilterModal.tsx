import { FormEvent, useEffect, useRef, useState } from 'react';
import { PropertyFilter } from '../../../api/propertyApi';
import { PROPERTY_OPTION_LABEL, PROPERTY_OPTION_ORDER, PropertyOption } from '../../../types/property';

export type DetailFilter = Pick<
  PropertyFilter,
  'minDeposit' | 'maxDeposit' | 'minMonthlyRent' | 'maxMonthlyRent' | 'minArea' | 'maxArea' | 'options'
>;

interface FilterModalProps {
  open: boolean;
  value: DetailFilter;
  onClose: () => void;
  onApply: (value: DetailFilter) => void;
}

const NUMBER_FIELDS = [
  ['minDeposit', '최소 보증금', '만원'],
  ['maxDeposit', '최대 보증금', '만원'],
  ['minMonthlyRent', '최소 월세', '만원'],
  ['maxMonthlyRent', '최대 월세', '만원'],
  ['minArea', '최소 면적', '㎡'],
  ['maxArea', '최대 면적', '㎡'],
] as const;

function FilterModal({ open, value, onClose, onApply }: FilterModalProps) {
  const [draft, setDraft] = useState<DetailFilter>(value);
  const [error, setError] = useState('');
  const modalRef = useRef<HTMLFormElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(value);
      setError('');
      previouslyFocusedRef.current = document.activeElement as HTMLElement;
      requestAnimationFrame(() => {
        const closeButton = modalRef.current?.querySelector('button[type="button"]') as HTMLButtonElement | null;
        const firstInput = modalRef.current?.querySelector('input') as HTMLInputElement | null;
        (closeButton ?? firstInput)?.focus();
      });
    } else {
      previouslyFocusedRef.current?.focus();
      previouslyFocusedRef.current = null;
    }
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const pairs: Array<[number | undefined, number | undefined, string]> = [
      [draft.minDeposit, draft.maxDeposit, '보증금'],
      [draft.minMonthlyRent, draft.maxMonthlyRent, '월세'],
      [draft.minArea, draft.maxArea, '면적'],
    ];
    const invalid = pairs.find(([min, max]) => min !== undefined && max !== undefined && min > max);
    if (invalid) {
      setError(`${invalid[2]}의 최소값은 최대값보다 클 수 없습니다.`);
      return;
    }
    onApply(draft);
  };

  const toggleOption = (option: PropertyOption) => {
    const options = new Set(draft.options ?? []);
    options.has(option) ? options.delete(option) : options.add(option);
    setDraft({ ...draft, options: [...options] });
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-gray-900/45 p-5" role="presentation" onMouseDown={onClose}>
      <form
        ref={modalRef}
        className="max-h-[calc(100vh-40px)] w-[min(620px,100%)] overflow-auto rounded-2xl bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-title"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={submit}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="filter-title" className="text-xl">
            상세 필터
          </h2>
          <button type="button" className="border-0 bg-none text-2xl" onClick={onClose} aria-label="필터 닫기">
            ×
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3.5 max-[560px]:grid-cols-1">
          {NUMBER_FIELDS.map(([key, label, unit]) => (
            <label key={key} className="grid gap-1.5 text-[13px] font-semibold">
              <span>{label}</span>
              <div className="flex items-center rounded-lg border border-gray-200">
                <input
                  className="min-w-0 flex-1 border-0 p-2.5 outline-0"
                  type="number"
                  min="0"
                  step={key.includes('Area') ? '0.1' : '1'}
                  value={draft[key] ?? ''}
                  onChange={(event) =>
                    setDraft({ ...draft, [key]: event.target.value === '' ? undefined : Number(event.target.value) })
                  }
                />
                <small className="pr-2.5 text-gray-500">{unit}</small>
              </div>
            </label>
          ))}
        </div>
        <fieldset className="mt-5.5 border-0 p-0">
          <legend className="mb-2.5 text-sm font-bold">옵션 (선택한 조건을 모두 만족)</legend>
          <div className="grid grid-cols-3 gap-2.5 max-[560px]:grid-cols-1">
            {PROPERTY_OPTION_ORDER.map((option) => (
              <label key={option} className="flex items-center gap-1.5 text-[13px]">
                <input
                  type="checkbox"
                  checked={draft.options?.includes(option) ?? false}
                  onChange={() => toggleOption(option)}
                />
                {PROPERTY_OPTION_LABEL[option]}
              </label>
            ))}
          </div>
        </fieldset>
        {error && (
          <p className="mt-3.5 text-[13px] text-danger" role="alert">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-gray-200 bg-white px-4.5 py-2.5 font-bold"
            onClick={() => setDraft({})}
          >
            초기화
          </button>
          <button type="submit" className="rounded-lg border border-primary bg-primary px-4.5 py-2.5 font-bold text-white">
            필터 적용
          </button>
        </div>
      </form>
    </div>
  );
}

export default FilterModal;
