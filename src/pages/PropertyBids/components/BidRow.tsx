import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { HelperText } from '../../../components/ui/Field';
import NegotiationThread from './NegotiationThread';
import { acceptBid, cancelBid, completeBid } from '../../../api/bid/bidApi';
import { ApiError } from '../../../api/client';
import { formatRelativeTime } from '../../../utils/format';
import { BID_STATUS_LABEL, BidListItem } from '../../../types/bid';

function BidRow({ propertyId, bid, onChanged }: { propertyId: number; bid: BidListItem; onChanged: () => void }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    setBusy(true);
    setActionMessage(null);
    try {
      await action();
      setActionMessage(successMessage);
      onChanged();
    } catch (err) {
      setActionMessage(err instanceof ApiError ? err.message : '처리에 실패했어요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/realtors/${bid.agentId}`)}
            className="text-[15px] font-bold text-gray-900 hover:text-primary"
          >
            {bid.officeName}
          </button>
          <p className="text-xs text-gray-500">
            제안 수수료 {bid.proposedFee.toLocaleString()}만원 · {formatRelativeTime(bid.createdAt)}
          </p>
          {bid.content && <p className="mt-1.5 text-[13px] text-gray-600">{bid.content}</p>}
        </div>
        <Badge>{BID_STATUS_LABEL[bid.status]}</Badge>
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant="secondary" onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? '협상 내역 닫기' : '협상 내역 보기'}
        </Button>
        {bid.status === 'PENDING' && (
          <Button disabled={busy} onClick={() => runAction(() => acceptBid(propertyId, bid.bidId), '매칭을 확정했어요.')}>
            수락하기
          </Button>
        )}
        {bid.status === 'ACCEPTED' && (
          <>
            <Button
              disabled={busy}
              onClick={() => runAction(() => completeBid(propertyId, bid.bidId), '거래를 완료 처리했어요.')}
            >
              거래 완료 처리
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => runAction(() => cancelBid(propertyId, bid.bidId), '매칭을 취소했어요.')}
            >
              매칭 취소
            </Button>
          </>
        )}
      </div>
      {actionMessage && <HelperText>{actionMessage}</HelperText>}

      {expanded && <NegotiationThread propertyId={propertyId} bidId={bid.bidId} />}
    </Card>
  );
}

export default BidRow;
