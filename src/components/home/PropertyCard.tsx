import { PROPERTY_OPTION_LABEL, PropertyListItem, PROPERTY_TYPE_LABEL } from '../../types/property';
import {
  formatMeta,
  formatPrice,
  formatRelativeTime,
  pickCardOptions,
} from '../../utils/format';
import styles from './PropertyCard.module.css';

interface PropertyCardProps {
  property: PropertyListItem;
  /** 날짜 대신 표시할 커스텀 라벨 (예: 최근 본 방의 "오늘 봄") */
  dateLabel?: string;
}

function PropertyCard({ property, dateLabel }: PropertyCardProps) {
  const typeLabel = PROPERTY_TYPE_LABEL[property.propertyType];
  const cardOptions = pickCardOptions(property.options);

  return (
    <article className={styles.card}>
      <div className={styles.thumbnail}>
        {property.thumbnailUrl ? (
          <img
            className={styles.image}
            src={property.thumbnailUrl}
            alt={`${typeLabel} 매물 사진 - ${property.title}`}
            loading="lazy"
          />
        ) : (
          <span className={styles.noImage}>사진 준비 중</span>
        )}
        <span className={styles.typeBadge}>{typeLabel}</span>
        {property.status === 'MATCHED' && <span className={styles.matchedBadge}>중개 진행중</span>}
        {property.isSuspicious && <span className={styles.suspiciousBadge}>! 의심 매물</span>}
      </div>

      <div className={styles.body}>
        <div className={styles.priceRow}>
          <strong className={styles.price}>{formatPrice(property)}</strong>
        </div>
        <p className={styles.description}>{property.title}</p>
        <p className={styles.meta}>
          {typeLabel} · {formatMeta(property)}
        </p>
        {cardOptions.length > 0 && (
          <ul className={styles.tags}>
            {cardOptions.map((option) => (
              <li key={option} className={styles.tag}>
                {PROPERTY_OPTION_LABEL[option]}
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