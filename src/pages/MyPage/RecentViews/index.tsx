import PageShell from '../../../components/layout/PageShell';
import MyPageNav from '../components/MyPageNav';
import PropertyCard from '../../../components/property/PropertyCard';
import { fetchMyRecentViews } from '../../../api/user/userApi';
import { useFetch } from '../../../hooks/useFetch';

function RecentViewsPage() {
  const { data, loading, error } = useFetch(fetchMyRecentViews);

  return (
    <PageShell>
      <h1 className="mb-4 text-xl font-bold text-gray-900">마이페이지</h1>
      <MyPageNav />

      {loading && <p className="py-12 text-center text-sm text-gray-500">불러오는 중...</p>}
      {!loading && error && <p className="rounded-button bg-red-50 p-4 text-sm font-medium text-danger">{error}</p>}
      {!loading && !error && (data?.length ?? 0) === 0 && (
        <p className="py-12 text-center text-sm text-gray-500">최근에 본 방이 없어요.</p>
      )}
      {!loading && !error && (data?.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {data!.map((property) => (
            <PropertyCard key={property.propertyId} property={property} />
          ))}
        </div>
      )}
    </PageShell>
  );
}

export default RecentViewsPage;
