import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { HelperText } from '../../../components/ui/Field';
import { fetchPropertyRealtorInfo } from '../../../api/property/propertyApi';
import { createChatRoom } from '../../../api/chat/chatApi';
import { ApiError, isLoggedIn } from '../../../api/client';
import { getCurrentUser } from '../../../utils/auth';
import { PropertyRealtor } from '../../../types/realtor';

/** PropertyErrorCode.UNAUTHORIZED_ACCESS — 백엔드 POST /chats는 매물 집주인 본인만 방을 열 수 있다 */
const NOT_PROPERTY_OWNER_CODE = 'PROP403_1';

const LINK_BUTTON =
  'inline-flex items-center justify-center rounded-button border border-gray-200 bg-white px-4 py-[15px] text-[15px] font-medium text-gray-900 hover:bg-gray-50';

export function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

/**
 * 매물 상세의 "담당 중개사" 카드 — 전화 걸기와 채팅 문의.
 * 아직 매칭된 중개사가 없는 매물이면 아무것도 그리지 않는다.
 */
function RealtorContactCard({ propertyId }: { propertyId: number }) {
  const navigate = useNavigate();
  const [agent, setAgent] = useState<PropertyRealtor | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const role = isLoggedIn() ? getCurrentUser()?.role : undefined;
  // 중개사/관리자는 채팅방을 열 수 없다(백엔드 hasRole('USER')). 비로그인은 눌렀을 때 로그인으로 보낸다.
  const canInquire = role === undefined || role === 'USER';

  useEffect(() => {
    const controller = new AbortController();
    setAgent(null);
    setMessage(null);
    fetchPropertyRealtorInfo(propertyId, controller.signal)
      .then((info) => setAgent(info.agent))
      .catch(() => undefined);
    return () => controller.abort();
  }, [propertyId]);

  if (!agent) return null;

  const handleInquiry = async () => {
    if (!isLoggedIn()) {
      navigate('/login');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const room = await createChatRoom({ propertyId, realtorId: agent.agentId });
      navigate(`/chats/${room.chatId}`);
    } catch (err) {
      if (err instanceof ApiError && err.code === NOT_PROPERTY_OWNER_CODE) {
        setMessage('지금은 집주인만 중개사와 채팅을 시작할 수 있어요. 임차인 문의 채팅은 서버 준비 중이에요.');
      } else {
        setMessage(err instanceof ApiError ? err.message : '채팅방을 여는 데 실패했어요.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mt-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-gray-900">담당 중개사</h2>
        {agent.isVerified && <Badge variant="primary">인증 중개사</Badge>}
      </div>

      <div>
        <button
          type="button"
          onClick={() => navigate(`/realtors/${agent.agentId}`)}
          className="text-[15px] font-bold text-gray-900 hover:text-primary"
        >
          {agent.officeName}
        </button>
        {agent.officeAddress && <p className="mt-0.5 text-[13px] text-gray-500">{agent.officeAddress}</p>}
      </div>

      <div className="flex gap-2">
        {agent.phone ? (
          <a href={toTelHref(agent.phone)} className={`${LINK_BUTTON} flex-1`}>
            📞 전화하기
          </a>
        ) : (
          <Button variant="secondary" className="flex-1" disabled title="중개사 전화번호가 아직 제공되지 않아요">
            📞 전화번호 준비 중
          </Button>
        )}
        {canInquire && (
          <Button className="flex-1" disabled={busy} onClick={handleInquiry}>
            {busy ? '여는 중...' : '💬 채팅 문의'}
          </Button>
        )}
      </div>
      {message && <HelperText>{message}</HelperText>}
    </Card>
  );
}

export default RealtorContactCard;
