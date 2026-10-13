import Card from '../../../components/ui/Card';
import { summarizeMaintenance } from '../../../utils/maintenance';
import { MAINTENANCE_ITEM_LABEL, MaintenanceItem } from '../../../types/property';

interface MaintenanceFeeCardProps {
  /** 월 관리비 총액 (만원) */
  maintenanceFee: number | null;
  /** 관리비에 포함된 항목. 백엔드가 아직 내려주지 않으면 undefined */
  items?: MaintenanceItem[];
}

const won = (manwon: number) => `${manwon.toLocaleString()}만원`;

/** 매물 상세의 "관리비 상세" — 인터넷·수도·전기 등 포함 내역과 항목별 금액 */
function MaintenanceFeeCard({ maintenanceFee, items = [] }: MaintenanceFeeCardProps) {
  const hasFee = typeof maintenanceFee === 'number' && maintenanceFee > 0;
  if (!hasFee && items.length === 0) return null;

  const summary = summarizeMaintenance(maintenanceFee, items);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-gray-500">월 관리비</span>
        <span className="text-xl font-bold text-gray-900">{hasFee ? won(maintenanceFee) : '금액 미기재'}</span>
      </div>

      {summary.items.length > 0 ? (
        <ul className="flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200">
          {summary.items.map((item) => (
            <li key={item.type} className="flex items-center justify-between px-4 py-3 text-[15px]">
              <span className="text-gray-900">{MAINTENANCE_ITEM_LABEL[item.type]}</span>
              <span className={item.amount === null ? 'text-gray-500' : 'font-semibold text-gray-900'}>
                {item.amount === null ? '포함' : won(item.amount)}
              </span>
            </li>
          ))}
          {summary.remainder !== null && (
            <li className="flex items-center justify-between px-4 py-3 text-[15px]">
              <span className="text-gray-500">기타</span>
              <span className="font-semibold text-gray-900">{won(summary.remainder)}</span>
            </li>
          )}
        </ul>
      ) : (
        <p className="text-[13px] text-gray-500">관리비에 포함된 항목이 아직 등록되지 않았어요. 중개사나 집주인에게 문의해보세요.</p>
      )}

      {summary.items.some((item) => item.amount === null) && (
        <p className="text-xs text-gray-500">&apos;포함&apos;은 관리비에 들어 있지만 항목별 금액은 적지 않은 항목이에요.</p>
      )}
    </Card>
  );
}

export default MaintenanceFeeCard;
