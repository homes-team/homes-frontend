import { useNavigate } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import { formatMoney } from '../../../utils/format';
import { TRADE_TYPE_LABEL } from '../../../types/property';
import { NearbyProperty } from '../../../types/realtor';

function NearbyPropertyRow({ property }: { property: NearbyProperty }) {
  const navigate = useNavigate();

  return (
    <button type="button" onClick={() => navigate(`/properties/${property.propertyId}`)} className="w-full text-left">
      <Card className="flex items-center justify-between">
        <div>
          <p className="font-bold">
            {TRADE_TYPE_LABEL[property.tradeType]} {formatMoney(property.deposit)}
            {property.tradeType === 'MONTHLY_RENT' ? `/${property.monthlyRent}` : ''}
          </p>
          <p className="text-[13px] text-gray-500">
            {property.address} {property.detailAddress}
          </p>
          <p className="mt-1 text-[13px] font-semibold text-primary">
            희망 중개수수료율 {property.desiredBrokerageFee == null ? '협의' : `${property.desiredBrokerageFee}%`}
          </p>
        </div>
        <span className="text-[13px] text-gray-400">{Math.round(property.distanceInMeters)}m</span>
      </Card>
    </button>
  );
}

export default NearbyPropertyRow;
