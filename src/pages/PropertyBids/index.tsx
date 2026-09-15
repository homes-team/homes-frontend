import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import BidRow from './components/BidRow';
import { fetchBidsForProperty } from '../../api/bid/bidApi';
import { BidListItem } from '../../types/bid';

function PropertyBidsPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const id = Number(propertyId);
  const navigate = useNavigate();

  const [bids, setBids] = useState<BidListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetchBidsForProperty(id)
      .then(setBids)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <PageShell>
      <button
        type="button"
        onClick={() => navigate(`/properties/${id}`)}
        className="mb-4 text-[13px] font-medium text-gray-500 hover:text-primary"
      >
        ← 매물로 돌아가기
      </button>
      <h1 className="mb-4 text-xl font-bold text-gray-900">받은 입찰</h1>

      {loading && <p className="py-12 text-center text-sm text-gray-500">불러오는 중...</p>}
      {!loading && error && <p className="rounded-button bg-red-50 p-4 text-sm font-medium text-danger">{error}</p>}
      {!loading && !error && bids.length === 0 && (
        <p className="py-12 text-center text-sm text-gray-500">아직 들어온 입찰이 없어요.</p>
      )}

      {!loading && !error && bids.length > 0 && (
        <div className="flex flex-col gap-3">
          {bids.map((bid) => (
            <BidRow key={bid.bidId} propertyId={id} bid={bid} onChanged={load} />
          ))}
        </div>
      )}
    </PageShell>
  );
}

export default PropertyBidsPage;
