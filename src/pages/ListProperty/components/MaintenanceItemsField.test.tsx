import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { MaintenanceItem } from '../../../types/property';
import MaintenanceItemsField from './MaintenanceItemsField';

function Harness({ totalFee, onChange }: { totalFee: number | null; onChange: (items: MaintenanceItem[]) => void }) {
  const [items, setItems] = useState<MaintenanceItem[]>([]);
  return (
    <MaintenanceItemsField
      value={items}
      totalFee={totalFee}
      onChange={(next) => { setItems(next); onChange(next); }}
    />
  );
}

describe('MaintenanceItemsField', () => {
  it('reveals an amount input for a checked item and reports the amount', () => {
    const onChange = vi.fn();
    render(<Harness totalFee={10} onChange={onChange} />);

    expect(screen.queryByLabelText('인터넷 금액')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('인터넷'));
    expect(onChange).toHaveBeenLastCalledWith([{ type: 'INTERNET', amount: null }]);

    fireEvent.change(screen.getByLabelText('인터넷 금액'), { target: { value: '2.5' } });
    expect(onChange).toHaveBeenLastCalledWith([{ type: 'INTERNET', amount: 2.5 }]);

    fireEvent.click(screen.getByLabelText('인터넷'));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('warns when the itemized amounts exceed the monthly fee', () => {
    render(<Harness totalFee={3} onChange={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('수도'));
    fireEvent.change(screen.getByLabelText('수도 금액'), { target: { value: '5' } });

    expect(screen.getByText(/월 관리비보다 커요/)).toBeInTheDocument();
  });
});
