import { ReactNode } from 'react';
import { Field, HelperText, Input, Label } from '../../../components/ui/Field';

interface NumberFieldProps {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  step?: string;
  placeholder?: string;
}

/** 단위가 오른쪽에 붙는 숫자 입력 */
export function NumberField({ id, label, unit, value, onChange, hint, step = '1', placeholder }: NumberFieldProps) {
  return (
    <Field>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative flex items-center">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min="0"
          step={step}
          className="pr-14"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="absolute right-4 text-sm text-gray-500">{unit}</span>
      </div>
      {hint && <HelperText>{hint}</HelperText>}
    </Field>
  );
}

interface ToggleGroupProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string; disabled?: boolean }>;
  onChange: (value: T) => void;
}

/** 한 가지만 고르는 버튼 묶음 (거래 종류, 물건 종류 등) */
export function ToggleGroup<T extends string>({ label, value, options, onChange }: ToggleGroupProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={`rounded-button border px-4 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              active ? 'border-primary bg-primary-50 text-primary' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function CheckField({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-[15px] text-gray-900">
      <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

/** 결과 카드 위쪽의 한 줄 요약 */
export function Verdict({ tone, children }: { tone: 'primary' | 'neutral' | 'warning'; children: ReactNode }) {
  const style = {
    primary: 'bg-primary-50 text-primary',
    neutral: 'bg-gray-100 text-gray-900',
    warning: 'bg-warning-50 text-warning-dark',
  }[tone];
  return (
    <div className={`rounded-xl p-4 text-center ${style}`} role="status">
      {children}
    </div>
  );
}

/** 라벨-값 한 줄 */
export function ResultLine({ label, value, strong = false }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-2.5 ${strong ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
      <dt className="text-[13px] font-medium text-gray-500">{label}</dt>
      <dd className={strong ? 'text-lg' : 'text-[15px]'}>{value}</dd>
    </div>
  );
}

export const CALC_DISCLAIMER =
  '이 계산기는 참고용이며 법적 효력이 없어요. 실제 금액은 지역 조례, 계약 조건, 금융기관 기준에 따라 달라질 수 있으니 계약 전에 전문가나 관계 기관에 확인해주세요.';
