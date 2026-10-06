import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { HelperText } from '../../../components/ui/Field';
import NegotiationThread from '../../PropertyBids/components/NegotiationThread';
import { cancelBid } from '../../../api/bid/bidApi';
import { fetchChatRooms } from '../../../api/chat/chatApi';
import { ApiError } from '../../../api/client';
import { formatMoney, formatRelativeTime } from '../../../utils/format';
import { BID_STATUS_LABEL, MyBidListItem } from '../../../types/bid';
import { TRADE_TYPE_LABEL } from '../../../types/property';

function MyBidRow({ bid, onChanged }: { bid: MyBidListItem; onChanged: () => void }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const priceLabel =
    bid.tradeType === 'MONTHLY_RENT'
      ? `${TRADE_TYPE_LABEL[bid.tradeType]} ${formatMoney(bid.deposit)}/${bid.monthlyRent}`
      : `${TRADE_TYPE_LABEL[bid.tradeType]} ${formatMoney(bid.deposit)}`;

  const handleCancel = async () => {
    setBusy(true);
    setActionMessage(null);
    try {
      await cancelBid(bid.propertyId, bid.bidId);
      setActionMessage('매칭을 취소했어요.');
      onChanged();
    } catch (err) {
      setActionMessage(err instanceof ApiError ? err.message : '매칭 취소에 실패했어요.');
    } finally {
      setBusy(false);
    }
  };

  const handleOpenChat = async () => {
    setBusy(true);
    setActionMessage(null);
    try {
      const rooms = await fetchChatRooms();
      const room = rooms.find((r) => r.propertyId === bid.propertyId);
      if (!room) {
        setActionMessage('채팅방을 찾지 못했어요. 채팅 목록에서 확인해주세요.');
        return;
      }
      navigate(`/chats/${room.chatId}`);
    } catch (err) {
      setActionMessage(err instanceof ApiError ? err.message : '채팅방을 여는 데 실패했어요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(`/properties/${bid.propertyId}`)}
          className="text-left text-[15px] font-bold text-gray-900 hover:text-primary"
        >
          {bid.propertyTitle}
          <p className="mt-0.5 text-xs font-normal text-gray-500">{priceLabel} · {bid.propertyAddress}</p>
        </button>
        <Badge>{BID_STATUS_LABEL[bid.status]}</Badge>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        내가 제안한 수수료 {bid.proposedFee.toLocaleString()}%
        {bid.finalFee !== null ? ` · 확정 수수료 ${bid.finalFee.toLocaleString()}%` : ''} · {formatRelativeTime(bid.createdAt)}
      </p>

      <div className="mt-3 flex gap-2">
        {bid.status === 'PENDING' && (
          <Button variant="secondary" onClick={() => setExpanded((prev) => !prev)}>
            {expanded ? '협상 내역 닫기' : '재협상 보기'}
          </Button>
        )}
        {bid.status === 'ACCEPTED' && (
          <>
            <Button disabled={busy} onClick={handleOpenChat}>
              채팅하기
            </Button>
            <Button variant="secondary" disabled={busy} onClick={handleCancel}>
              매칭 취소
            </Button>
          </>
        )}
      </div>
      {actionMessage && <HelperText>{actionMessage}</HelperText>}

      {expanded && <NegotiationThread propertyId={bid.propertyId} bidId={bid.bidId} />}
    </Card>
  );
}

export default MyBidRow;
