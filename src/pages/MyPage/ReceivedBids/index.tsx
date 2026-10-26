import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../../components/layout/PageShell';
import MyPageNav from '../components/MyPageNav';
import BidRow from '../../PropertyBids/components/BidRow';
import { useRealtorRatings } from '../../PropertyBids/useRealtorRatings';
import { fetchMyReceivedBids } from '../../../api/user/userApi';
import { ReceivedBidListItem } from '../../../types/bid';
import {
  RECEIVED_BID_FILTER_LABEL,
  ReceivedBidFilter,
  filterReceivedBids,
  groupByProperty,
} from '../../../utils/receivedBids';

const FILTERS = Object.keys(RECEIVED_BID_FILTER_LABEL) as ReceivedBidFilter[];

/** 마이페이지 > 받은 입찰 — 내 모든 매물에 들어온 중개사 제안서를 매물별로 모아 본다 */
function MyReceivedBidsPage() {
  const navigate = useNavigate();
  const [bids, setBids] = useState<ReceivedBidListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReceivedBidFilter>('ALL');

  const load = () => {
    fetchMyReceivedBids()
      .then((data) => {
        setBids(data);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const ratings = useRealtorRatings(bids);
  const groups = useMemo(() => groupByProperty(filterReceivedBids(bids, filter)), [bids, filter]);
  const pendingCount = bids.filter((bid) => bid.status === 'PENDING').length;

  return (
    <PageShell>
      <h1 className="mb-4 text-xl font-bold text-gray-900">마이페이지</h1>
      <MyPageNav />

      {loading && <p className="py-12 text-center text-sm text-gray-500">불러오는 중...</p>}
      {!loading && error && <p className="rounded-button bg-red-50 p-4 text-sm font-medium text-danger">{error}</p>}
      {!loading && !error && bids.length === 0 && (
        <p className="py-12 text-center text-sm text-gray-500">아직 받은 입찰 제안서가 없어요.</p>
      )}

      {!loading && !error && bids.length > 0 && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              전체 {bids.length}건 · 답변을 기다리는 제안 <span className="font-bold text-primary">{pendingCount}건</span>
            </p>
            <div className="flex gap-1.5" role="group" aria-label="상태 필터">
              {FILTERS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={option === filter}
                  onClick={() => setFilter(option)}
                  className={`rounded-pill border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                    option === filter
                      ? 'border-primary bg-primary-50 text-primary'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {RECEIVED_BID_FILTER_LABEL[option]}
                </button>
              ))}
            </div>
          </div>

          {groups.length === 0 && (
            <p className="py-12 text-center text-sm text-gray-500">이 상태의 제안서가 없어요.</p>
          )}

          <div className="flex flex-col gap-8">
            {groups.map((group) => (
              <section key={group.propertyId} aria-label={group.propertyTitle}>
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => navigate(`/properties/${group.propertyId}`)}
                      className="truncate text-left text-[17px] font-bold text-gray-900 hover:text-primary"
                    >
                      {group.propertyTitle}
                    </button>
                    <p className="truncate text-[13px] text-gray-500">{group.propertyAddress}</p>
                  </div>
                  <span className="shrink-0 text-[13px] text-gray-500">{group.bids.length}건</span>
                </div>
                <div className="flex flex-col gap-3">
                  {group.bids.map((bid) => (
                    <BidRow
                      key={bid.bidId}
                      propertyId={bid.propertyId}
                      bid={bid}
                      onChanged={load}
                      rating={ratings[bid.agentId]}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}

export default MyReceivedBidsPage;
