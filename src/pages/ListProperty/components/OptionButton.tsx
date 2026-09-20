function OptionButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[10px] border-[1.5px] px-3 py-4 text-center text-sm font-semibold ${
        active ? 'border-primary bg-primary-50 text-primary' : 'border-gray-200 bg-white text-gray-900'
      }`}
    >
      {label}
    </button>
  );
}

export default OptionButton;
