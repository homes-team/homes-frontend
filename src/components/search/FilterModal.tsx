import { FormEvent, useEffect, useRef, useState } from 'react';
import { PropertyFilter } from '../../api/propertyApi';
import {
  PROPERTY_OPTION_LABEL,
  PROPERTY_OPTION_ORDER,
  PropertyOption,
} from '../../types/property';
import styles from './FilterModal.module.css';

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
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <form
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-title"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={submit}
      >
        <div className={styles.header}>
          <h2 id="filter-title">상세 필터</h2>
          <button type="button" onClick={onClose} aria-label="필터 닫기">×</button>
        </div>
        <div className={styles.fields}>
          {NUMBER_FIELDS.map(([key, label, unit]) => (
            <label key={key} className={styles.field}>
              <span>{label}</span>
              <div><input type="number" min="0" step={key.includes('Area') ? '0.1' : '1'} value={draft[key] ?? ''}
                onChange={(event) => setDraft({ ...draft, [key]: event.target.value === '' ? undefined : Number(event.target.value) })} />
                <small>{unit}</small></div>
            </label>
          ))}
        </div>
        <fieldset className={styles.options}>
          <legend>옵션 (선택한 조건을 모두 만족)</legend>
          <div className={styles.optionGrid}>
            {PROPERTY_OPTION_ORDER.map((option) => (
              <label key={option}><input type="checkbox" checked={draft.options?.includes(option) ?? false}
                onChange={() => toggleOption(option)} />{PROPERTY_OPTION_LABEL[option]}</label>
            ))}
          </div>
        </fieldset>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.actions}>
          <button type="button" className={styles.reset} onClick={() => setDraft({})}>초기화</button>
          <button type="submit" className={styles.apply}>필터 적용</button>
        </div>
      </form>
    </div>
  );
}

export default FilterModal;
