import { PropertyType } from '../../types/property';
import styles from './CategoryChips.module.css';

/**
 * 칩과 PropertyType은 1:1로 대응한다.
 * 백엔드 propertyType 파라미터가 단일 값이라 "투·쓰리룸"처럼 여러 enum을 묶는 칩은 쓸 수 없다.
 */
const CATEGORIES: { label: string; value: PropertyType | null }[] = [
  { label: '전체', value: null },
  { label: '원룸', value: 'ONE_ROOM' },
  { label: '투룸', value: 'TWO_ROOM' },
  { label: '오피스텔', value: 'OFFICETEL' },
  { label: '아파트', value: 'APARTMENT' },
];

interface CategoryChipsProps {
  value: PropertyType | null;
  onChange: (value: PropertyType | null) => void;
}

function CategoryChips({ value, onChange }: CategoryChipsProps) {
  return (
    <div className={styles.chips} role="group" aria-label="방 종류">
      {CATEGORIES.map((category) => {
        const active = category.value === value;
        return (
          <button
            key={category.label}
            type="button"
            className={`${styles.chip} ${active ? styles.chipActive : ''}`}
            aria-pressed={active}
            onClick={() => onChange(category.value)}
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}

export default CategoryChips;
