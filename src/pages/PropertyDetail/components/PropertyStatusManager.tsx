import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { HelperText } from '../../../components/ui/Field';
import { updatePropertyStatus } from '../../../api/property/propertyApi';
import { ApiError } from '../../../api/client';
import { PROPERTY_STATUS_VARIANT } from '../../../utils/statusStyle';
import { ManagedPropertyStatus, PROPERTY_STATUS_LABEL, PropertyStatus } from '../../../types/property';

const MANAGED_STATUSES: ManagedPropertyStatus[] = ['AVAILABLE', 'COMPLETED', 'HIDDEN'];

const STATUS_HINT: Record<ManagedPropertyStatus, string> = {
  AVAILABLE: '검색 결과에 노출되고 중개사의 제안서를 받아요.',
  COMPLETED: '거래가 끝난 매물이에요. 더 이상 제안서를 받지 않아요.',
  HIDDEN: '검색 결과에서 숨겨요. 언제든 다시 광고할 수 있어요.',
};

interface PropertyStatusManagerProps {
  propertyId: number;
  status: PropertyStatus;
  onChanged: (status: ManagedPropertyStatus) => void;
}

/** 집주인이 매물 상태(광고 중 / 거래 완료 / 숨김)를 직접 바꾸는 카드 */
function PropertyStatusManager({ propertyId, status, onChanged }: PropertyStatusManagerProps) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // MATCHED는 제안서 수락/취소/완료 흐름이 관리하고, DELETED는 되돌릴 수 없다 → 직접 바꿀 수 있는 상태가 아니다.
  const managed = MANAGED_STATUSES.find((value) => value === status) ?? null;
  const locked = managed === null;

  const handleChange = async (next: ManagedPropertyStatus) => {
    if (busy || locked || next === status) return;
    if (next === 'COMPLETED' && !window.confirm('거래 완료로 바꾸면 더 이상 제안서를 받을 수 없어요. 계속할까요?')) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await updatePropertyStatus(propertyId, next);
      onChanged(next);
      setMessage(`'${PROPERTY_STATUS_LABEL[next]}' 상태로 바꿨어요.`);
    } catch (err) {
      setMessage(`상태를 바꾸지 못했어요. ${err instanceof ApiError ? err.message : '잠시 후 다시 시도해주세요.'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mt-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-gray-900">매물 상태 관리</h2>
        <Badge variant={PROPERTY_STATUS_VARIANT[status]}>{PROPERTY_STATUS_LABEL[status]}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-2" role="group" aria-label="매물 상태">
        {MANAGED_STATUSES.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={status === value}
            disabled={busy || locked}
            onClick={() => handleChange(value)}
            className={`rounded-button border py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed ${
              status === value
                ? 'border-primary bg-primary-50 text-primary'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50'
            }`}
          >
            {PROPERTY_STATUS_LABEL[value]}
          </button>
        ))}
      </div>

      {managed && <p className="text-[13px] text-gray-500">{STATUS_HINT[managed]}</p>}
      {status === 'MATCHED' && (
        <p className="text-[13px] text-gray-500">
          중개사와 매칭이 진행 중이에요. 거래 완료나 매칭 취소는{' '}
          <button
            type="button"
            className="font-bold text-primary underline"
            onClick={() => navigate(`/properties/${propertyId}/bids`)}
          >
            받은 입찰
          </button>
          에서 처리해주세요.
        </p>
      )}
      {message && <HelperText>{message}</HelperText>}
    </Card>
  );
}

export default PropertyStatusManager;
