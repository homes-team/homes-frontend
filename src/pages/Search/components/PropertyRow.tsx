import { PROPERTY_OPTION_LABEL, PropertyListItem, PROPERTY_TYPE_LABEL } from '../../../types/property';
import { formatPrice, formatRelativeTime, formatSearchMeta, formatWalking, pickCardOptions } from '../../../utils/format';

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
        className={`flex gap-3.5 border-b border-gray-100 bg-white p-4 outline-none transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ${
          selected ? 'bg-primary-50' : ''
        }`}
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
        <div className="relative h-[120px] w-[120px] shrink-0 overflow-hidden rounded-md bg-gray-200">
          {property.thumbnailUrl ? (
            <img
              className="block h-full w-full object-cover"
              src={property.thumbnailUrl}
              alt={`${typeLabel} 매물 사진 - ${property.title}`}
              loading="lazy"
            />
          ) : (
            <span className="absolute inset-0 grid place-items-center text-[11px] text-gray-500">사진 준비 중</span>
          )}
          <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
            <span className="rounded px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-white bg-gray-900">
              {typeLabel}
            </span>
            {property.status === 'MATCHED' && (
              <span className="rounded bg-warning px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-white">
                중개 진행중
              </span>
            )}
            {property.isSuspicious && (
              <span className="rounded bg-danger px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-white">
                ! 의심 매물
              </span>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <strong className="text-lg leading-[1.4] font-bold text-gray-900">{formatPrice(property)}</strong>
          <p className="truncate text-sm leading-[1.4] font-medium text-gray-900">{property.title}</p>
          <p className="truncate text-xs leading-[1.4] text-gray-500">{formatSearchMeta(property)}</p>

          {(walking || options.length > 0) && (
            <ul className="flex flex-wrap gap-1.5">
              {walking && (
                <li className="rounded px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-primary bg-primary-50">
                  {walking}
                </li>
              )}
              {options.map((option) => (
                <li key={option} className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] whitespace-nowrap text-gray-600">
                  {PROPERTY_OPTION_LABEL[option]}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-auto flex justify-between text-xs text-gray-500">
            <span>♡ {property.favoriteCount}</span>
            <span>{formatRelativeTime(property.createdAt)}</span>
          </div>
        </div>
      </article>
    </li>
  );
}

export default PropertyRow;
