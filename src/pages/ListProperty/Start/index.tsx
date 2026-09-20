import { useNavigate } from 'react-router-dom';
import WizardShell from '../components/WizardShell';
import ChoiceCard from '../components/ChoiceCard';
import Button from '../../../components/ui/Button';
import { useListPropertyForm } from '../../../context/ListPropertyContext';
import { PROPERTY_TYPE_LABEL, PropertyType, TRADE_TYPE_LABEL, TradeType } from '../../../types/property';

const TRADE_TYPES: TradeType[] = ['JEONSE', 'SALE', 'MONTHLY_RENT'];
const PROPERTY_TYPES: PropertyType[] = ['APARTMENT', 'VILLA', 'HOUSE', 'OFFICETEL', 'ONE_ROOM', 'TWO_ROOM', 'PRESALE'];

function ListPropertyStartPage() {
  const navigate = useNavigate();
  const { form, updateForm } = useListPropertyForm();

  const canProceed = Boolean(form.tradeType && form.propertyType);

  return (
    <WizardShell
      step={1}
      totalSteps={6}
      title="어떤 거래 방식인가요?"
      description="매물의 거래 유형과 부동산 종류를 선택해주세요"
      onBack={() => navigate('/')}
      footer={
        <Button fullWidth disabled={!canProceed} onClick={() => navigate('/list-property/address')}>
          다음
        </Button>
      }
    >
      <section>
        <div className="grid grid-cols-3 gap-3">
          {TRADE_TYPES.map((type) => (
            <ChoiceCard
              key={type}
              active={form.tradeType === type}
              label={TRADE_TYPE_LABEL[type]}
              onClick={() => updateForm({ tradeType: type })}
            />
          ))}
        </div>
      </section>

      <section>
        <p className="mb-3 text-sm font-medium text-gray-900">어떤 종류의 부동산인가요?</p>
        <div className="grid grid-cols-4 gap-3">
          {PROPERTY_TYPES.map((type) => (
            <ChoiceCard
              key={type}
              active={form.propertyType === type}
              label={PROPERTY_TYPE_LABEL[type]}
              onClick={() => updateForm({ propertyType: type })}
            />
          ))}
        </div>
      </section>
    </WizardShell>
  );
}

export default ListPropertyStartPage;
