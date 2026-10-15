import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import Button from '../../components/ui/Button';
import { fetchPropertyDetail } from '../../api/property/propertyApi';
import { useCompare } from '../../context/CompareContext';
import { PropertyDetail } from '../../types/property';
import CompareTable, { CompareColumn } from './components/CompareTable';

/** 비교 목록에 담은 매물의 상세 정보를 나란히 보여주는 표 */
function ComparePage() {
  const navigate = useNavigate();
  const { items, remove, clear } = useCompare();
  const [details, setDetails] = useState<Record<number, PropertyDetail | null>>({});
  const [loading, setLoading] = useState(true);

  // 담긴 매물 ID가 바뀔 때만 다시 불러온다 (제목 등 다른 값 변화로는 재요청하지 않는다)
  const idKey = items.map((item) => item.propertyId).join(',');

  useEffect(() => {
    const controller = new AbortController();
    const ids = idKey === '' ? [] : idKey.split(',').map(Number);
    setLoading(true);

    Promise.allSettled(ids.map((id) => fetchPropertyDetail(id, controller.signal))).then((results) => {
      if (controller.signal.aborted) return;
      const next: Record<number, PropertyDetail | null> = {};
      results.forEach((result, index) => {
        next[ids[index]] = result.status === 'fulfilled' ? result.value : null;
      });
      setDetails(next);
      setLoading(false);
    });

    return () => controller.abort();
  }, [idKey]);

  const columns: CompareColumn[] = items.map((item) => ({
    propertyId: item.propertyId,
    title: item.title,
    detail: details[item.propertyId] ?? null,
  }));

  return (
    <PageShell>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">매물 비교</h1>
        {items.length > 0 && (
          <Button variant="secondary" onClick={clear}>
            전체 비우기
          </Button>
        )}
      </div>

      {items.length < 2 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-[15px] text-gray-500">
            {items.length === 0
              ? '비교할 매물이 아직 없어요.'
              : '비교하려면 매물이 2개 이상 필요해요. 하나 더 담아주세요.'}
          </p>
          <Button onClick={() => navigate('/search')}>매물 찾으러 가기</Button>
        </div>
      ) : loading ? (
        <p className="py-20 text-center text-sm text-gray-500">불러오는 중...</p>
      ) : (
        <>
          <CompareTable columns={columns} onRemove={remove} />
          <p className="mt-3 text-xs text-gray-500">
            파란 칸이 비교한 매물 중 가장 유리한 값이에요. 거래 유형이 서로 다르면 가격은 비교하지 않아요.
          </p>
        </>
      )}
    </PageShell>
  );
}

export default ComparePage;
