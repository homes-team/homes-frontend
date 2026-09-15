import { useEffect, useState } from 'react';
import Badge from '../../../components/ui/Badge';
import { Input, ErrorText, HelperText } from '../../../components/ui/Field';
import { createNegotiation, fetchNegotiations } from '../../../api/bid/bidApi';
import { ApiError } from '../../../api/client';
import { formatRelativeTime } from '../../../utils/format';
import { NegotiationListItem } from '../../../types/bid';

function NegotiationThread({ propertyId, bidId }: { propertyId: number; bidId: number }) {
  const [negotiations, setNegotiations] = useState<NegotiationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestedFee, setSuggestedFee] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNegotiations(propertyId, bidId)
      .then(setNegotiations)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [propertyId, bidId]);

  const handleSend = async () => {
    const fee = Number(suggestedFee);
    if (!fee || fee <= 0) {
      setError('제안 수수료를 올바르게 입력해주세요.');
      return;
    }
    setError(null);
    try {
      await createNegotiation(propertyId, bidId, { suggestedFee: fee, message: message.trim() || undefined });
      const updated = await fetchNegotiations(propertyId, bidId);
      setNegotiations(updated);
      setSuggestedFee('');
      setMessage('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '역제안 전송에 실패했어요.');
    }
  };

  if (loading) return <HelperText>협상 내역 불러오는 중...</HelperText>;

  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-gray-200 pt-4">
      {negotiations.length === 0 && <HelperText>아직 협상 내역이 없어요.</HelperText>}
      {negotiations.map((item) => (
        <div key={item.negotiationId} className="flex flex-wrap items-center gap-2 text-[13px]">
          <Badge>{item.senderRole === 'USER' ? '집주인' : '중개사'}</Badge>
          <span className="font-bold text-gray-900">{item.suggestedFee.toLocaleString()}만원</span>
          {item.message && <span className="text-gray-600">{item.message}</span>}
          <span className="ml-auto text-gray-400">{formatRelativeTime(item.createdAt)}</span>
        </div>
      ))}

      <div className="mt-2 flex gap-2">
        <Input
          type="number"
          placeholder="제안 수수료 (만원)"
          value={suggestedFee}
          onChange={(event) => setSuggestedFee(event.target.value)}
        />
        <Input placeholder="메모 (선택)" value={message} onChange={(event) => setMessage(event.target.value)} />
        <button
          type="button"
          onClick={handleSend}
          className="shrink-0 whitespace-nowrap rounded-button bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-dark"
        >
          역제안 보내기
        </button>
      </div>
      {error && <ErrorText>{error}</ErrorText>}
    </div>
  );
}

export default NegotiationThread;
