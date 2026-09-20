import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardShell from '../components/WizardShell';
import TipBox from '../components/TipBox';
import Button from '../../../components/ui/Button';
import { useListPropertyForm } from '../../../context/ListPropertyContext';

function ListPropertyPhotoPage() {
  const navigate = useNavigate();
  const { form, updateForm } = useListPropertyForm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const newFiles = Array.from(fileList);
    updateForm({ images: [...form.images, ...newFiles] });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeImage(index: number) {
    updateForm({ images: form.images.filter((_, i) => i !== index) });
  }

  const canProceed = form.images.length >= 1;

  return (
    <WizardShell
      step={4}
      totalSteps={6}
      title="매물 사진을 올려주세요"
      description="좋은 사진일수록 더 많은 관심을 받아요 (최소 1장)"
      footer={
        <Button fullWidth disabled={!canProceed} onClick={() => navigate('/list-property/price')}>
          다음
        </Button>
      }
    >
      <button
        type="button"
        className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-gray-200 bg-white px-4 py-12 text-center hover:border-primary hover:bg-primary-50"
        onClick={() => fileInputRef.current?.click()}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-primary-50 text-[22px] text-primary" aria-hidden="true">
          ＋
        </span>
        <span className="text-[15px] font-bold text-gray-900">사진 추가하기</span>
        <span className="text-[13px] text-gray-500">클릭하여 사진을 선택하세요</span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFilesSelected(e.target.files)}
      />

      {form.images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {form.images.map((file, index) => (
            <div key={`${file.name}-${index}`} className="relative aspect-4/3 overflow-hidden rounded-[10px] bg-gray-100">
              <img
                className="h-full w-full object-cover"
                src={URL.createObjectURL(file)}
                alt={`업로드한 매물 사진 ${index + 1}`}
              />
              {index === 0 && (
                <span className="absolute bottom-1.5 left-1.5 rounded-pill bg-primary px-2 py-0.5 text-[11px] font-bold text-white">
                  대표사진
                </span>
              )}
              <button
                type="button"
                className="absolute top-1.5 right-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-gray-900/60 text-xs text-white"
                onClick={() => removeImage(index)}
                aria-label="사진 삭제"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <TipBox title="💡 좋은 사진 찍는 법">
        <p>· 밝은 시간대에 촬영하세요</p>
        <p>· 방 전체가 보이도록 넓게 찍어주세요</p>
        <p>· 거실, 침실, 화장실, 주방 등을 골고루 촬영하세요</p>
      </TipBox>
    </WizardShell>
  );
}

export default ListPropertyPhotoPage;
