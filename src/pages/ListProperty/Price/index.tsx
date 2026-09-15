import { useNavigate } from 'react-router-dom';
import WizardShell from '../components/WizardShell';
import Button from '../../../components/ui/Button';
import { Field, Label, Input, Textarea } from '../../../components/ui/Field';
import { useListPropertyForm } from '../../../context/ListPropertyContext';

/** 거래 유형별로 "보증금/전세금/매매가" 입력란 라벨과 안내 문구가 달라진다 */
const DEPOSIT_LABEL: Record<string, string> = {
  MONTHLY_RENT: '보증금 *',
  JEONSE: '전세금 *',
  SALE: '매매가 *',
};

function ListPropertyPricePage() {
  const navigate = useNavigate();
  const { form, updateForm } = useListPropertyForm();

  const tradeType = form.tradeType ?? 'MONTHLY_RENT';
  const isMonthlyRent = tradeType === 'MONTHLY_RENT';

  const canProceed = form.deposit.trim() !== '' && (!isMonthlyRent || form.monthlyRent.trim() !== '');

  return (
    <WizardShell
      step={5}
      totalSteps={6}
      title="희망 거래 가격을 입력해주세요"
      description="실제 거래를 원하는 가격을 입력하세요"
      footer={
        <Button fullWidth disabled={!canProceed} onClick={() => navigate('/list-property/fee')}>
          다음
        </Button>
      }
    >
      <Field>
        <Label htmlFor="deposit">{DEPOSIT_LABEL[tradeType]}</Label>
        <div className="relative flex items-center">
          <Input
            id="deposit"
            type="number"
            className="pr-14"
            placeholder="예) 1000"
            value={form.deposit}
            onChange={(e) => updateForm({ deposit: e.target.value })}
          />
          <span className="absolute right-4 text-sm text-gray-500">만원</span>
        </div>
      </Field>

      {isMonthlyRent && (
        <Field>
          <Label htmlFor="monthlyRent">월세 *</Label>
          <div className="relative flex items-center">
            <Input
              id="monthlyRent"
              type="number"
              className="pr-14"
              placeholder="예) 80"
              value={form.monthlyRent}
              onChange={(e) => updateForm({ monthlyRent: e.target.value })}
            />
            <span className="absolute right-4 text-sm text-gray-500">만원</span>
          </div>
        </Field>
      )}

      <Field>
        <Label htmlFor="maintenanceFee">
          관리비 <span className="font-normal text-gray-500">(선택)</span>
        </Label>
        <div className="relative flex items-center">
          <Input
            id="maintenanceFee"
            type="number"
            className="pr-14"
            placeholder="예) 10"
            value={form.maintenanceFee}
            onChange={(e) => updateForm({ maintenanceFee: e.target.value })}
          />
          <span className="absolute right-4 text-sm text-gray-500">만원</span>
        </div>
      </Field>

      <Field>
        <Label htmlFor="description">
          매물 소개 <span className="font-normal text-gray-500">(선택)</span>
        </Label>
        <Textarea
          id="description"
          className="min-h-24"
          placeholder="예) 채광 좋고 깨끗한 남향 방입니다!"
          maxLength={500}
          value={form.description}
          onChange={(e) => updateForm({ description: e.target.value })}
        />
      </Field>
    </WizardShell>
  );
}

export default ListPropertyPricePage;
