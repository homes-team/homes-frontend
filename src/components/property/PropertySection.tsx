import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { PropertyListItem } from '../../types/property';
import PropertyCard from './PropertyCard';

interface PropertySectionProps {
  title: string;
  subtitle?: string;
  /** 타이틀 옆에 붙는 칩 (예: "로그인 시 노출") */
  titleChip?: ReactNode;
  moreLabel?: string;
  /** "더보기" 클릭 시 이동할 경로 */
  moreTo?: string;
  properties: PropertyListItem[];
  loading: boolean;
  error: string | null;
  emptyMessage?: string;
  dateLabel?: (property: PropertyListItem) => string;
}

const SKELETON_COUNT = 4;

function PropertySection({
  title,
  subtitle,
  titleChip,
  moreLabel = '더보기 >',
  moreTo = '/',
  properties,
  loading,
  error,
  emptyMessage = '표시할 매물이 없어요.',
  dateLabel,
}: PropertySectionProps) {
  const navigate = useNavigate();

  return (
    <section className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 py-14 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-[26px] font-bold text-gray-900">{title}</h2>
            {titleChip}
          </div>
          {subtitle && <p className="mt-1 text-[15px] text-gray-500">{subtitle}</p>}
        </div>
        <button type="button" onClick={() => navigate(moreTo)} className="text-sm font-medium text-primary">
          {moreLabel}
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <div key={index} className="h-[360px] animate-pulse rounded-card bg-gray-100" aria-hidden="true" />
          ))}
        </div>
      )}

      {!loading && error && <p className="py-12 text-center text-[15px] text-gray-500">{error}</p>}

      {!loading && !error && properties.length === 0 && (
        <p className="py-12 text-center text-[15px] text-gray-500">{emptyMessage}</p>
      )}

      {!loading && !error && properties.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {properties.map((property) => (
            <PropertyCard key={property.propertyId} property={property} dateLabel={dateLabel?.(property)} />
          ))}
        </div>
      )}
    </section>
  );
}

export default PropertySection;
