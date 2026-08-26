import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PropertyListItem } from '../../types/property';
import PropertyCard from './PropertyCard';
import styles from './PropertySection.module.css';

interface PropertySectionProps {
  title: string;
  subtitle?: string;
  titleChip?: ReactNode;
  moreLabel?: string;
  properties: PropertyListItem[];
  loading: boolean;
  error: string | null;
  emptyMessage?: string;
  dateLabel?: (property: PropertyListItem) => string;
}

const SKELETON_COUNT = 4;

/** 매물 섹션 컴포넌트 — 제목, 부제, 매물 카드 그리드, 로딩/에러/빈 상태 처리 */
function PropertySection({
  title,
  subtitle,
  titleChip,
  moreLabel = '더보기 >',
  properties,
  loading,
  error,
  emptyMessage = '표시할 매물이 없어요.',
  dateLabel,
}: PropertySectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{title}</h2>
            {titleChip}
          </div>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <Link to="/" className={styles.more}>
          {moreLabel}
        </Link>
      </div>

      {loading && (
        <div className={styles.grid}>
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <div key={index} className={styles.skeleton} aria-hidden="true" />
          ))}
        </div>
      )}

      {!loading && error && <p className={styles.message}>{error}</p>}

      {!loading && !error && properties.length === 0 && (
        <p className={styles.message}>{emptyMessage}</p>
      )}

      {!loading && !error && properties.length > 0 && (
        <div className={styles.grid}>
          {properties.map((property) => (
            <PropertyCard
              key={property.propertyId}
              property={property}
              dateLabel={dateLabel?.(property)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default PropertySection;
