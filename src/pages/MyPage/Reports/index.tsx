import { useNavigate } from 'react-router-dom';
import PageShell from '../../../components/layout/PageShell';
import MyPageNav from '../components/MyPageNav';
import Card from '../../../components/ui/Card';
import { fetchMyReports } from '../../../api/userApi';
import { useFetch } from '../../../hooks/useFetch';
import { formatRelativeTime } from '../../../utils/format';

function MyReportsPage() {
  const navigate = useNavigate();
  const { data, loading, error } = useFetch(fetchMyReports);

  return (
    <PageShell>
      <h1 className="mb-4 text-xl font-bold text-gray-900">마이페이지</h1>
      <MyPageNav />

      {loading && <p className="py-12 text-center text-sm text-gray-500">불러오는 중...</p>}
      {!loading && error && <p className="rounded-button bg-red-50 p-4 text-sm font-medium text-danger">{error}</p>}
      {!loading && !error && (data?.length ?? 0) === 0 && (
        <p className="py-12 text-center text-sm text-gray-500">신고한 매물이 없어요.</p>
      )}
      {!loading && !error && (data?.length ?? 0) > 0 && (
        <div className="flex flex-col gap-3">
          {data!.map((report) => (
            <button key={report.reportId} type="button" onClick={() => navigate(`/properties/${report.propertyId}`)}>
              <Card className="flex items-center justify-between text-left">
                <div>
                  <p>{report.propertyTitle}</p>
                  <p className="text-[13px] text-gray-500">{report.reasonDescription}</p>
                </div>
                <span className="text-[13px] text-gray-400">{formatRelativeTime(report.reportedAt)}</span>
              </Card>
            </button>
          ))}
        </div>
      )}
    </PageShell>
  );
}

export default MyReportsPage;
