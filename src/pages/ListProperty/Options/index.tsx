import { useNavigate } from 'react-router-dom';
import WizardShell from '../components/WizardShell';
import OptionButton from '../components/OptionButton';
import TipBox from '../components/TipBox';
import Button from '../../../components/ui/Button';
import { useListPropertyForm } from '../../../context/ListPropertyContext';
import { PROPERTY_OPTION_LABEL, PROPERTY_OPTION_ORDER } from '../../../types/property';

function ListPropertyOptionsPage() {
  const navigate = useNavigate();
  const { form, updateForm } = useListPropertyForm();

  function toggleOption(option: (typeof PROPERTY_OPTION_ORDER)[number]) {
    const has = form.options.includes(option);
    updateForm({
      options: has ? form.options.filter((o) => o !== option) : [...form.options, option],
    });
  }

  return (
    <WizardShell
      step={3}
      totalSteps={6}
      title="매물의 옵션을 선택해주세요"
      description="있는 옵션을 모두 선택하면 더 많은 관심을 받아요"
      footer={<Button fullWidth onClick={() => navigate('/list-property/photo')}>다음</Button>}
    >
      <div className="grid grid-cols-3 gap-3">
        {PROPERTY_OPTION_ORDER.map((option) => (
          <OptionButton
            key={option}
            active={form.options.includes(option)}
            label={PROPERTY_OPTION_LABEL[option]}
            onClick={() => toggleOption(option)}
          />
        ))}
      </div>

      <TipBox>💡 팁: 옵션이 많을수록 임차인의 관심이 높아집니다. 정확하게 입력해주세요!</TipBox>
    </WizardShell>
  );
}

export default ListPropertyOptionsPage;
