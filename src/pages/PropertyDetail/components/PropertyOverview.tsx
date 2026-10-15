import { formatMoney } from '../../../utils/format';
import {
  PROPERTY_DIRECTION_LABEL,
  PROPERTY_TYPE_LABEL,
  PropertyDetail,
  TRADE_TYPE_LABEL,
} from '../../../types/property';

type OverviewSource = Pick<
  PropertyDetail,
  | 'tradeType'
  | 'propertyType'
  | 'area'
  | 'currentFloor'
  | 'totalFloors'
  | 'direction'
  | 'maintenanceFee'
  | 'remodelingYear'
  | 'nearestStation'
  | 'walkingTime'
  | 'desiredBrokerageFee'
>;

/** 매물 정보를 라벨/값 표로 한눈에 보여준다 (상세 페이지 "매물 정보" 섹션) */
function PropertyOverview({ property }: { property: OverviewSource }) {
  const rows: [string, string][] = [
    ['거래 유형', TRADE_TYPE_LABEL[property.tradeType]],
    ['매물 종류', PROPERTY_TYPE_LABEL[property.propertyType]],
    ['전용 면적', `${property.area}m²`],
    ['층', `${property.currentFloor}/${property.totalFloors}층`],
    ['방향', PROPERTY_DIRECTION_LABEL[property.direction]],
    ['관리비', property.maintenanceFee === null ? '-' : property.maintenanceFee === 0 ? '없음' : `${formatMoney(property.maintenanceFee)}만원`],
    ['리모델링', property.remodelingYear ? `${property.remodelingYear}년` : '-'],
    ['가까운 역', property.nearestStation ? `${property.nearestStation} 도보 ${property.walkingTime}분` : '-'],
    ['희망 중개수수료율', property.desiredBrokerageFee === null ? '-' : `${property.desiredBrokerageFee}%`],
  ];

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-gray-200 bg-gray-200 sm:grid-cols-3">
      {rows.map(([label, value]) => (
        <div key={label} className="bg-white px-4 py-3.5">
          <dt className="text-xs text-gray-500">{label}</dt>
          <dd className="mt-1 text-[15px] font-medium text-gray-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default PropertyOverview;
