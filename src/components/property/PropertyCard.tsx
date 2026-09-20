import { useNavigate } from 'react-router-dom';
import { PROPERTY_OPTION_LABEL, PropertyListItem, PROPERTY_TYPE_LABEL } from '../../types/property';
import { formatMeta, formatPrice, formatRelativeTime, pickCardOptions } from '../../utils/format';

interface PropertyCardProps {
  property: PropertyListItem;
  /** 날짜 대신 표시할 커스텀 라벨 (예: 최근 본 방의 "오늘 봄") */
  dateLabel?: string;
}

function PropertyCard({ property, dateLabel }: PropertyCardProps) {
  const navigate = useNavigate();
  const typeLabel = PROPERTY_TYPE_LABEL[property.propertyType];
  const cardOptions = pickCardOptions(property.options);

  return (
    <button
      type="button"
      onClick={() => navigate(`/properties/${property.propertyId}`)}
      className="flex flex-col overflow-hidden rounded-card border border-gray-200 bg-white text-left transition-transform hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(17,24,39,0.08)]"
    >
      <div className="relative h-[190px] bg-gray-100">
        {property.thumbnailUrl ? (
          <img
            className="h-full w-full object-cover"
            src={property.thumbnailUrl}
            alt={`${typeLabel} 매물 사진 - ${property.title}`}
            loading="lazy"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-[13px] text-gray-400">사진 준비 중</span>
        )}
        <span className="absolute top-3 left-3 rounded-lg bg-gray-900/75 px-3 py-1.5 text-xs font-medium text-white">
          {typeLabel}
        </span>
        {property.status === 'MATCHED' && (
          <span className="absolute top-3 right-3 rounded-lg bg-warning px-3 py-1.5 text-xs font-bold text-white">
            중개 진행중
          </span>
        )}
        {property.isSuspicious && (
          <span className="absolute top-3 right-3 rounded-lg bg-danger px-3 py-1.5 text-xs font-bold text-white">
            ! 의심 매물
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <strong className="text-[19px] font-bold text-gray-900">{formatPrice(property)}</strong>
        </div>
        <p className="truncate text-[15px] font-medium text-gray-600">{property.title}</p>
        <p className="text-[13px] text-gray-500">
          {typeLabel} · {formatMeta(property)}
        </p>
        {cardOptions.length > 0 && (
          <ul className="flex gap-1.5">
            {cardOptions.map((option) => (
              <li key={option} className="rounded-md bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                {PROPERTY_OPTION_LABEL[option]}
              </li>
            ))}
          </ul>
        )}
        <div className="flex justify-between text-[13px] text-gray-500">
          <span>♡ {property.favoriteCount}</span>
          <span>{dateLabel ?? formatRelativeTime(property.createdAt)}</span>
        </div>
      </div>
    </button>
  );
}

export default PropertyCard;
