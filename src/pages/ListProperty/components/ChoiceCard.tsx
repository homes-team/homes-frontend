import { ReactNode } from 'react';

function ChoiceCard({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon?: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border-[1.5px] px-3 py-6 text-[15px] font-semibold transition-colors ${
        active ? 'border-primary bg-primary-50 text-primary' : 'border-gray-200 bg-white text-gray-900 hover:border-primary-100'
      }`}
    >
      {icon && <span className="text-2xl">{icon}</span>}
      {label}
    </button>
  );
}

export default ChoiceCard;
