import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardShell from '../components/WizardShell';
import TipBox from '../components/TipBox';
import Button from '../../../components/ui/Button';
import { Field, Label, Input, HelperText, ErrorText } from '../../../components/ui/Field';
import { useListPropertyForm } from '../../../context/ListPropertyContext';
import { createProperty, updateProperty } from '../../../api/property/listPropertyApi';
import { isLoggedIn } from '../../../api/client';

function ListPropertyFeePage() {
  const navigate = useNavigate();
  const { form, updateForm, resetForm, editingPropertyId } = useListPropertyForm();
  const isEditing = editingPropertyId !== null;
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedId, setCompletedId] = useState<number | null>(null);

  async function handleSubmit() {
    if (submitting) return;

    if (!isLoggedIn()) {
      setSubmitError('로그인이 필요한 기능이에요. 로그인 후 다시 시도해주세요.');
      return;
    }
    if (!form.tradeType || !form.propertyType || form.latitude === null || form.longitude === null) {
      setSubmitError('입력하지 않은 필수 정보가 있어요. 이전 단계를 다시 확인해주세요.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        tradeType: form.tradeType,
        propertyType: form.propertyType,
        deposit: Number(form.deposit) || 0,
        monthlyRent: form.tradeType === 'MONTHLY_RENT' ? Number(form.monthlyRent) || 0 : 0,
        maintenanceFee: Number(form.maintenanceFee) || 0,
        address: form.address,
        detailAddress: form.detailAddress,
        currentFloor: Number(form.currentFloor) || 0,
        totalFloors: Number(form.totalFloors) || 0,
        direction: form.direction,
        remodelingYear: form.remodelingYear.trim() === '' ? undefined : Number(form.remodelingYear),
        area: Number(form.area) || 0,
        description: form.description,
        desiredBrokerageFee: form.desiredBrokerageFee.trim() === '' ? undefined : Number(form.desiredBrokerageFee),
        options: form.options,
        latitude: form.latitude,
        longitude: form.longitude,
        images: form.images,
      };

      if (isEditing) {
        await updateProperty(editingPropertyId, payload);
        setCompletedId(editingPropertyId);
      } else {
        const propertyId = await createProperty(payload);
        setCompletedId(propertyId);
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : `매물 ${isEditing ? '수정' : '등록'}에 실패했어요. 잠시 후 다시 시도해주세요.`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  // 등록 성공 화면. 7~9단계(AI 중개사 매칭/선택/방문 예약)는 아직 백엔드 API가 없어
  // 이번 작업 범위에서는 만들지 않고, 여기서 완료 안내만 보여준다.
  if (completedId !== null) {
    return (
      <WizardShell
        step={6}
        totalSteps={6}
        title={isEditing ? '매물 수정이 완료되었어요!' : '매물 등록이 완료되었어요!'}
        description={
          isEditing ? `매물 번호 #${completedId} 정보를 수정했습니다.` : `매물 번호 #${completedId} 로 등록되었습니다.`
        }
        footer={
          <Button
            fullWidth
            onClick={() => {
              const id = completedId;
              resetForm();
              navigate(isEditing ? `/properties/${id}` : '/');
            }}
          >
            {isEditing ? '매물로 돌아가기' : '홈으로 가기'}
          </Button>
        }
      >
        {!isEditing && (
          <TipBox>💡 AI 중개사 매칭·방문 예약 기능은 준비 중이에요. 곧 이어서 제공될 예정입니다.</TipBox>
        )}
      </WizardShell>
    );
  }

  return (
    <WizardShell
      step={6}
      totalSteps={6}
      title="희망 중개 수수료를 입력하세요"
      description="입력하지 않으면 법정 수수료가 적용됩니다"
      footer={
        <>
          {submitError && <ErrorText>{submitError}</ErrorText>}
          <Button fullWidth disabled={submitting} onClick={handleSubmit}>
            {submitting ? '처리 중...' : isEditing ? '수정 완료' : '매물 등록하기'}
          </Button>
        </>
      }
    >
      <TipBox title="💡 법정 중개 수수료 안내">
        <p>· 5천만원 미만: 0.6% 이하</p>
        <p>· 5천만~2억원: 0.5% 이하</p>
        <p>· 2억~6억원: 0.4% 이하</p>
        <p>· 6억~12억원: 0.5% 이하</p>
        <p>· 12억원 이상: 0.6% 이하</p>
      </TipBox>

      <Field>
        <Label htmlFor="desiredBrokerageFee">
          희망 수수료 <span className="font-normal text-gray-500">(선택, %)</span>
        </Label>
        <div className="relative flex items-center">
          <Input
            id="desiredBrokerageFee"
            type="number"
            step="0.01"
            className="pr-10"
            placeholder="예) 0.5"
            value={form.desiredBrokerageFee}
            onChange={(e) => updateForm({ desiredBrokerageFee: e.target.value })}
          />
          <span className="absolute right-4 text-sm text-gray-500">%</span>
        </div>
        <HelperText>중개인과의 협상을 통해 수수료를 조정할 수 있습니다</HelperText>
      </Field>
    </WizardShell>
  );
}

export default ListPropertyFeePage;
