import {
  PROPERTY_OPTION_LABEL,
  PropertyListItem,
  PROPERTY_TYPE_LABEL,
} from '../../types/property';
import {
  formatPrice,
  formatRelativeTime,
  formatSearchMeta,
  formatWalking,
  pickCardOptions,
} from '../../utils/format';
import styles from './PropertyRow.module.css';

interface PropertyRowProps {
  property: PropertyListItem;
  selected: boolean;
  onSelect: (propertyId: number) => void;
}

function PropertyRow({ property, selected, onSelect }: PropertyRowProps) {
  const typeLabel = PROPERTY_TYPE_LABEL[property.propertyType];
  const walking = formatWalking(property);
  const options = pickCardOptions(property.options, walking ? 2 : 3);

  return (
    <li>
      <article
        className={`${styles.row} ${selected ? styles.rowSelected : ''}`}
        onClick={() => onSelect(property.propertyId)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(property.propertyId);
          }
        }}
        role="button"
        tabIndex={0}
        aria-pressed={selected}
      >
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
          <div className={styles.badges}>
            <span className={styles.typeBadge}>{typeLabel}</span>
            {property.status === 'MATCHED' && (
              <span className={styles.matchedBadge}>중개 진행중</span>
            )}
            {property.isSuspicious && <span className={styles.suspiciousBadge}>! 의심 매물</span>}
          </div>
        </div>

        <div className={styles.body}>
          <strong className={styles.price}>{formatPrice(property)}</strong>
          <p className={styles.title}>{property.title}</p>
          <p className={styles.meta}>{formatSearchMeta(property)}</p>

          {(walking || options.length > 0) && (
            <ul className={styles.tags}>
              {walking && <li className={`${styles.tag} ${styles.tagStation}`}>{walking}</li>}
              {options.map((option) => (
                <li key={option} className={styles.tag}>
                  {PROPERTY_OPTION_LABEL[option]}
                </li>
              ))}
            </ul>
          )}

          <div className={styles.footer}>
            <span>♡ {property.favoriteCount}</span>
            <span>{formatRelativeTime(property.createdAt)}</span>
          </div>
        </div>
      </article>
    </li>
  );
}

export default PropertyRow;
