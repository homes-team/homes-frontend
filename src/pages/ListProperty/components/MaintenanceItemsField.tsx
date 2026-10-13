import { Field, HelperText, Input, ErrorText } from '../../../components/ui/Field';
import { parseMaintenanceAmount, summarizeMaintenance } from '../../../utils/maintenance';
import {
  MAINTENANCE_ITEM_LABEL,
  MAINTENANCE_ITEM_ORDER,
  MaintenanceItem,
  MaintenanceItemType,
} from '../../../types/property';

interface MaintenanceItemsFieldProps {
  value: MaintenanceItem[];
  onChange: (items: MaintenanceItem[]) => void;
  /** 입력한 월 관리비 총액(만원). 항목 합계와 비교해 안내한다 */
  totalFee: number | null;
}

/** 관리비에 포함된 항목을 고르고, 원하면 항목별 금액을 적는 입력 영역 */
function MaintenanceItemsField({ value, onChange, totalFee }: MaintenanceItemsFieldProps) {
  const byType = new Map(value.map((item) => [item.type, item]));

  const toggle = (type: MaintenanceItemType) => {
    onChange(byType.has(type) ? value.filter((item) => item.type !== type) : [...value, { type, amount: null }]);
  };

  const setAmount = (type: MaintenanceItemType, raw: string) => {
    onChange(value.map((item) => (item.type === type ? { ...item, amount: parseMaintenanceAmount(raw) } : item)));
  };

  const summary = summarizeMaintenance(totalFee, value);

  return (
    <Field>
      <span className="text-sm font-medium text-gray-900">
        관리비 포함 내역 <span className="font-normal text-gray-500">(선택)</span>
      </span>
      <HelperText>관리비에 들어 있는 항목을 골라주세요. 항목별 금액을 알면 함께 적어주세요.</HelperText>

      <ul className="mt-1 flex flex-col gap-2">
        {MAINTENANCE_ITEM_ORDER.map((type) => {
          const item = byType.get(type);
          return (
            <li key={type} className="flex items-center gap-3">
              <label className="flex w-36 shrink-0 items-center gap-2 text-[15px] text-gray-900">
                <input type="checkbox" checked={Boolean(item)} onChange={() => toggle(type)} />
                {MAINTENANCE_ITEM_LABEL[type]}
              </label>
              {item && (
                <div className="relative flex flex-1 items-center">
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    className="pr-14"
                    aria-label={`${MAINTENANCE_ITEM_LABEL[type]} 금액`}
                    placeholder="금액 (비워도 돼요)"
                    value={item.amount ?? ''}
                    onChange={(event) => setAmount(type, event.target.value)}
                  />
                  <span className="absolute right-4 text-sm text-gray-500">만원</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {summary.exceedsTotal && (
        <div className="mt-2">
          <ErrorText>항목별 금액의 합({summary.itemizedTotal}만원)이 월 관리비보다 커요. 금액을 다시 확인해주세요.</ErrorText>
        </div>
      )}
    </Field>
  );
}

export default MaintenanceItemsField;
