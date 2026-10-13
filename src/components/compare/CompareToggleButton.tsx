import { MouseEvent } from 'react';
import { CompareItem, MAX_COMPARE, useCompare } from '../../context/CompareContext';

interface CompareToggleButtonProps {
  item: CompareItem;
  /** 'row': 검색 결과 행 안의 작은 버튼 / 'default': 상세 페이지의 일반 버튼 */
  size?: 'row' | 'default';
}

/** 매물을 비교 목록에 담거나 뺀다. 클릭이 부모(행 선택 등)로 번지지 않게 막는다. */
function CompareToggleButton({ item, size = 'default' }: CompareToggleButtonProps) {
  const { has, toggle, isFull } = useCompare();
  const added = has(item.propertyId);
  const blocked = isFull && !added;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    toggle(item);
  };

  const sizeClass =
    size === 'row'
      ? 'rounded px-2 py-0.5 text-[11px] font-medium'
      : 'rounded-button px-4 py-[15px] text-[15px] font-medium';
  const colorClass = added
    ? 'border-primary bg-primary-50 text-primary'
    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50';

  return (
    <button
      type="button"
      aria-pressed={added}
      disabled={blocked}
      title={blocked ? `최대 ${MAX_COMPARE}개까지 비교할 수 있어요` : undefined}
      onClick={handleClick}
      onKeyDown={(event) => event.stopPropagation()}
      className={`border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${sizeClass} ${colorClass}`}
    >
      {added ? '✓ 비교 담김' : '＋ 비교 담기'}
    </button>
  );
}

export default CompareToggleButton;
