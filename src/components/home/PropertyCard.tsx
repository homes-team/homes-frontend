import { PropertyListItem, PROPERTY_TYPE_LABEL } from '../../types/property';
import { formatMeta, formatPrice, formatRelativeTime } from '../../utils/format';
import styles from './PropertyCard.module.css';

interface PropertyCardProps {
  property: PropertyListItem;
  /** 날짜 대신 표시할 커스텀 라벨 (예: 최근 본 방의 "오늘 봄") */
  dateLabel?: string;
}

const MAX_VISIBLE_TAGS = 3;

function PropertyCard({ property, dateLabel }: PropertyCardProps) {
  const typeLabel = PROPERTY_TYPE_LABEL[property.propertyType];

  return (
    <article className={styles.card}>
      <div className={styles.thumbnail}>
        {property.thumbnailUrl ? (
          <img
            className={styles.image}
            src={property.thumbnailUrl}
            alt={`${typeLabel} 매물 사진 - ${property.description}`}
            loading="lazy"
          />
        ) : (
          <span className={styles.noImage}>사진 준비 중</span>
        )}
        <span className={styles.typeBadge}>{typeLabel}</span>
        {property.isSuspicious && <span className={styles.suspiciousBadge}>! 의심 매물</span>}
      </div>

      <div className={styles.body}>
        <div className={styles.priceRow}>
          <strong className={styles.price}>{formatPrice(property)}</strong>
          <span className={styles.aiBadge}>AI {property.aiScore}점</span>
        </div>
        <p className={styles.description}>{property.description}</p>
        <p className={styles.meta}>
          {typeLabel} · {formatMeta(property)}
        </p>
        {property.tags.length > 0 && (
          <ul className={styles.tags}>
            {property.tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
              <li key={tag} className={styles.tag}>
                {tag}
              </li>
            ))}
          </ul>
        )}
        <div className={styles.footer}>
          <span className={styles.favorite}>♡ {property.favoriteCount}</span>
          <span className={styles.date}>{dateLabel ?? formatRelativeTime(property.createdAt)}</span>
        </div>
      </div>
    </article>
  );
}

export default PropertyCard;
