import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { allSame, bestIndexes } from '../../../utils/compare';
import { formatManwon, toPyeong } from '../../../utils/format';
import {
  PROPERTY_DIRECTION_LABEL,
  PROPERTY_OPTION_LABEL,
  PROPERTY_OPTION_ORDER,
  PROPERTY_TYPE_LABEL,
  PropertyDetail,
  PropertyOption,
  TRADE_TYPE_LABEL,
} from '../../../types/property';

/** 한 칸. 불러오지 못한 매물(detail이 null)은 모든 행에서 "-"로 보여준다. */
export interface CompareColumn {
  propertyId: number;
  title: string;
  detail: PropertyDetail | null;
}

interface CompareTableProps {
  columns: CompareColumn[];
  onRemove: (propertyId: number) => void;
}

const DEPOSIT_LABEL = { MONTHLY_RENT: '보증금', JEONSE: '전세금', SALE: '매매가' } as const;

function priceLabel(detail: PropertyDetail): string {
  const deposit = formatManwon(detail.deposit);
  return detail.tradeType === 'MONTHLY_RENT' ? `${deposit} / 월 ${detail.monthlyRent}만원` : deposit;
}

function Cell({ children, best = false }: { children: ReactNode; best?: boolean }) {
  return (
    <td className={`border-b border-gray-100 px-4 py-3 text-center text-[15px] ${best ? 'bg-primary-50 font-bold text-primary' : 'text-gray-900'}`}>
      {children}
    </td>
  );
}

function Row({ label, cells, best }: { label: string; cells: ReactNode[]; best?: Set<number> }) {
  return (
    <tr>
      <th
        scope="row"
        className="sticky left-0 z-[1] border-b border-gray-100 bg-white px-4 py-3 text-left text-[13px] font-medium whitespace-nowrap text-gray-500"
      >
        {label}
      </th>
      {cells.map((cell, index) => (
        <Cell key={index} best={best?.has(index)}>
          {cell}
        </Cell>
      ))}
    </tr>
  );
}

function CompareTable({ columns, onRemove }: CompareTableProps) {
  const navigate = useNavigate();
  const details = columns.map((column) => column.detail);
  const loaded = details.filter((detail): detail is PropertyDetail => detail !== null);

  /** 불러온 매물에만 값을 계산하고, 나머지는 "-" */
  const map = <T,>(pick: (detail: PropertyDetail) => T): Array<T | null> => details.map((detail) => (detail ? pick(detail) : null));
  const text = (values: Array<string | null>): ReactNode[] => values.map((value) => value ?? '-');

  // 거래 유형이 다르면(월세 vs 매매) 가격의 우열을 가릴 수 없다
  const sameTrade = allSame(loaded.map((detail) => detail.tradeType));
  const depositLabel = sameTrade && loaded[0] ? DEPOSIT_LABEL[loaded[0].tradeType] : '보증금 / 전세금 / 매매가';

  const rent = map((detail) => (detail.tradeType === 'MONTHLY_RENT' ? detail.monthlyRent : null));
  const showRent = rent.some((value) => value !== null);

  const optionsInUse = new Set<PropertyOption>(loaded.flatMap((detail) => detail.options));
  const optionRows = [
    ...PROPERTY_OPTION_ORDER.filter((option) => optionsInUse.has(option)),
    ...[...optionsInUse].filter((option) => !PROPERTY_OPTION_ORDER.includes(option)),
  ];

  const walking = map((detail) => detail.walkingTime);

  return (
    <div className="overflow-x-auto rounded-card border border-gray-200 bg-white">
      <table className="w-full min-w-[640px] table-fixed border-collapse">
        <colgroup>
          <col className="w-32" />
          {columns.map((column) => (
            <col key={column.propertyId} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="sticky left-0 z-[1] border-b border-gray-200 bg-white" />
            {columns.map((column) => {
              const { detail } = column;
              return (
                <th key={column.propertyId} className="border-b border-gray-200 p-4 align-top font-normal">
                  <div className="relative flex flex-col gap-2 text-left">
                    <button
                      type="button"
                      aria-label={`${column.title} 비교에서 빼기`}
                      onClick={() => onRemove(column.propertyId)}
                      className="absolute top-1 right-1 z-[1] grid h-7 w-7 place-items-center rounded-full bg-gray-900/70 text-white hover:bg-gray-900"
                    >
                      ×
                    </button>
                    {detail && detail.imageUrls.length > 0 ? (
                      <img src={detail.imageUrls[0]} alt={column.title} className="aspect-4/3 w-full rounded-lg bg-gray-100 object-cover" />
                    ) : (
                      <div className="flex aspect-4/3 w-full items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                        {detail ? '사진 준비 중' : '불러오지 못했어요'}
                      </div>
                    )}
                    <p className="truncate text-[15px] font-bold text-gray-900">{column.title}</p>
                    {detail && <p className="text-sm font-bold text-primary">{priceLabel(detail)}</p>}
                    <button
                      type="button"
                      onClick={() => navigate(`/properties/${column.propertyId}`)}
                      className="self-start text-xs text-gray-500 underline hover:text-primary"
                    >
                      상세 보기
                    </button>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <Row
            label="거래 / 종류"
            cells={text(map((detail) => `${TRADE_TYPE_LABEL[detail.tradeType]} · ${PROPERTY_TYPE_LABEL[detail.propertyType]}`))}
          />
          <Row
            label={depositLabel}
            cells={text(map((detail) => formatManwon(detail.deposit)))}
            best={sameTrade ? bestIndexes(map((detail) => detail.deposit), 'min') : undefined}
          />
          {showRent && (
            <Row
              label="월세"
              cells={text(rent.map((value) => (value === null ? null : `${value}만원`)))}
              best={bestIndexes(rent, 'min')}
            />
          )}
          <Row
            label="관리비"
            cells={text(map((detail) => (detail.maintenanceFee === null ? null : detail.maintenanceFee > 0 ? `${detail.maintenanceFee}만원` : '없음')))}
            best={bestIndexes(map((detail) => detail.maintenanceFee), 'min')}
          />
          <Row
            label="면적"
            cells={text(map((detail) => `${detail.area}㎡ (${toPyeong(detail.area)}평)`))}
            best={bestIndexes(map((detail) => detail.area), 'max')}
          />
          <Row label="층" cells={text(map((detail) => `${detail.currentFloor}/${detail.totalFloors}층`))} />
          <Row label="방향" cells={text(map((detail) => PROPERTY_DIRECTION_LABEL[detail.direction]))} />
          <Row label="리모델링" cells={text(map((detail) => (detail.remodelingYear ? `${detail.remodelingYear}년` : null)))} />
          <Row
            label="가까운 역"
            cells={text(map((detail) => (detail.nearestStation ? `${detail.nearestStation} 도보 ${detail.walkingTime ?? '-'}분` : null)))}
            best={bestIndexes(walking, 'min')}
          />
          <Row
            label="AI 평점"
            cells={text(map((detail) => (detail.aiScore === null ? null : `${detail.aiScore}점`)))}
            best={bestIndexes(map((detail) => detail.aiScore), 'max')}
          />
          <Row
            label="희망 중개수수료"
            cells={text(map((detail) => (detail.desiredBrokerageFee === null ? null : `${detail.desiredBrokerageFee}%`)))}
          />
          {optionRows.map((option) => (
            <Row
              key={option}
              label={PROPERTY_OPTION_LABEL[option]}
              cells={details.map((detail) => (detail === null ? '-' : detail.options.includes(option) ? '✓' : '—'))}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CompareTable;
