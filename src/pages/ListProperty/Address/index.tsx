import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardShell from '../components/WizardShell';
import Button from '../../../components/ui/Button';
import { Field, Label, Input, HelperText, ErrorText } from '../../../components/ui/Field';
import { useListPropertyForm } from '../../../context/ListPropertyContext';
import { geocodeAddress } from '../../../api/listPropertyApi';

function ListPropertyAddressPage() {
  const navigate = useNavigate();
  const { form, updateForm } = useListPropertyForm();
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const addressConfirmed = form.latitude !== null && form.longitude !== null;

  async function handleCheckAddress() {
    const trimmed = form.address.trim();
    if (!trimmed) return;
    setChecking(true);
    setCheckError(null);
    try {
      const coord = await geocodeAddress(trimmed);
      if (!coord) {
        setCheckError('입력하신 주소를 찾을 수 없어요. 조금 더 자세히 입력해주세요.');
        updateForm({ latitude: null, longitude: null });
        return;
      }
      updateForm({ latitude: coord.lat, longitude: coord.lng });
    } catch {
      setCheckError('주소 확인 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setChecking(false);
    }
  }

  const canProceed =
    addressConfirmed && form.currentFloor.trim() !== '' && form.totalFloors.trim() !== '' && form.area.trim() !== '';

  return (
    <WizardShell
      step={2}
      totalSteps={6}
      title="매물 주소를 입력해주세요"
      description="정확한 주소를 입력하면 더 많은 관심을 받아요"
      footer={
        <Button fullWidth disabled={!canProceed} onClick={() => navigate('/list-property/options')}>
          다음
        </Button>
      }
    >
      <Field>
        <Label htmlFor="address">주소 *</Label>
        <div className="flex gap-3">
          <Input
            id="address"
            className="flex-1"
            placeholder="예) 서울시 강남구 역삼동 123-45"
            value={form.address}
            onChange={(e) => {
              updateForm({ address: e.target.value, latitude: null, longitude: null });
              setCheckError(null);
            }}
          />
          <button
            type="button"
            className="shrink-0 whitespace-nowrap rounded-button border border-gray-200 px-4 py-[13px] text-sm font-semibold text-gray-900 hover:border-primary hover:text-primary disabled:opacity-50"
            onClick={handleCheckAddress}
            disabled={checking || !form.address.trim()}
          >
            {checking ? '확인 중...' : '주소 확인'}
          </button>
        </div>
        {checkError && <ErrorText>{checkError}</ErrorText>}
        {addressConfirmed && !checkError && (
          <HelperText>
            ✓ 주소가 확인되었어요 (위도 {form.latitude?.toFixed(5)}, 경도 {form.longitude?.toFixed(5)})
          </HelperText>
        )}
      </Field>

      <Field>
        <Label htmlFor="detailAddress">
          상세 주소 <span className="font-normal text-gray-500">(선택)</span>
        </Label>
        <Input
          id="detailAddress"
          placeholder="예) 101동 502호"
          value={form.detailAddress}
          onChange={(e) => updateForm({ detailAddress: e.target.value })}
        />
      </Field>

      <div className="flex gap-3">
        <div className="flex-1">
          <Field>
            <Label htmlFor="currentFloor">해당층 *</Label>
            <Input
              id="currentFloor"
              type="number"
              placeholder="예) 5"
              value={form.currentFloor}
              onChange={(e) => updateForm({ currentFloor: e.target.value })}
            />
          </Field>
        </div>
        <div className="flex-1">
          <Field>
            <Label htmlFor="totalFloors">건물층 *</Label>
            <Input
              id="totalFloors"
              type="number"
              placeholder="예) 12"
              value={form.totalFloors}
              onChange={(e) => updateForm({ totalFloors: e.target.value })}
            />
          </Field>
        </div>
      </div>

      <Field>
        <Label htmlFor="area">전용면적 *</Label>
        <div className="relative flex items-center">
          <Input
            id="area"
            type="number"
            className="pr-10"
            placeholder="예) 33"
            value={form.area}
            onChange={(e) => updateForm({ area: e.target.value })}
          />
          <span className="absolute right-4 text-sm text-gray-500">m²</span>
        </div>
      </Field>
    </WizardShell>
  );
}

export default ListPropertyAddressPage;
