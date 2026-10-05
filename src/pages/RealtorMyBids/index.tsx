import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import MyBidRow from './components/MyBidRow';
import { fetchMyBids } from '../../api/realtor/realtorApi';
import { MyBidListItem } from '../../types/bid';

/**
 * 중개사가 제출한 입찰 제안서 현황 — GET /realtors/me/bids
 * ⚠️ 이 API는 백엔드에 아직 없다. 필요한 스펙은
 * docs/api-requests/realtor-my-bids.md 에 정리해 백엔드팀에 전달했다.
 */
function RealtorMyBidsPage() {
  const navigate = useNavigate();
  const [bids, setBids] = useState<MyBidListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchMyBids()
      .then(setBids)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <PageShell>
      <button
        type="button"
        onClick={() => navigate('/realtor/mypage')}
        className="mb-4 text-[13px] font-medium text-gray-500 hover:text-primary"
      >
        ← 마이페이지로 돌아가기
      </button>
      <h1 className="mb-4 text-xl font-bold text-gray-900">내가 제출한 제안서</h1>

      {loading && <p className="py-12 text-center text-sm text-gray-500">불러오는 중...</p>}
      {!loading && error && <p className="rounded-button bg-red-50 p-4 text-sm font-medium text-danger">{error}</p>}
      {!loading && !error && bids.length === 0 && (
        <p className="py-12 text-center text-sm text-gray-500">아직 제출한 제안서가 없어요.</p>
      )}

      {!loading && !error && bids.length > 0 && (
        <div className="flex flex-col gap-3">
          {bids.map((bid) => (
            <MyBidRow key={bid.bidId} bid={bid} onChanged={load} />
          ))}
        </div>
      )}
    </PageShell>
  );
}

export default RealtorMyBidsPage;
