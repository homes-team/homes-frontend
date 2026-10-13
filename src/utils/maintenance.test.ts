import { MaintenanceItem } from '../types/property';
import { parseMaintenanceAmount, summarizeMaintenance } from './maintenance';

describe('summarizeMaintenance', () => {
  it('sorts items by display order and sums only the itemized amounts', () => {
    const items: MaintenanceItem[] = [
      { type: 'ELECTRICITY', amount: 3 },
      { type: 'INTERNET', amount: 2 },
      { type: 'WATER', amount: null },
    ];
    const summary = summarizeMaintenance(10, items);

    expect(summary.items.map((item) => item.type)).toEqual(['INTERNET', 'WATER', 'ELECTRICITY']);
    expect(summary.itemizedTotal).toBe(5);
    expect(summary.remainder).toBe(5);
    expect(summary.exceedsTotal).toBe(false);
  });

  it('avoids floating point drift', () => {
    const summary = summarizeMaintenance(1, [
      { type: 'INTERNET', amount: 0.1 },
      { type: 'WATER', amount: 0.2 },
    ]);
    expect(summary.itemizedTotal).toBe(0.3);
    expect(summary.remainder).toBe(0.7);
  });

  it('has no remainder when the itemized amounts add up to the total', () => {
    expect(summarizeMaintenance(5, [{ type: 'INTERNET', amount: 5 }]).remainder).toBeNull();
  });

  it('flags itemized amounts that exceed the total', () => {
    const summary = summarizeMaintenance(3, [{ type: 'INTERNET', amount: 2 }, { type: 'GAS', amount: 2 }]);
    expect(summary.exceedsTotal).toBe(true);
    expect(summary.remainder).toBeNull();
  });

  it('cannot compute a remainder without a total or without amounts', () => {
    expect(summarizeMaintenance(null, [{ type: 'INTERNET', amount: 2 }]).remainder).toBeNull();
    expect(summarizeMaintenance(10, [{ type: 'INTERNET', amount: null }]).remainder).toBeNull();
    expect(summarizeMaintenance(10, []).items).toEqual([]);
  });
});

describe('parseMaintenanceAmount', () => {
  it('treats blank or invalid input as "included, amount unknown" and clamps negatives', () => {
    expect(parseMaintenanceAmount('')).toBeNull();
    expect(parseMaintenanceAmount('  ')).toBeNull();
    expect(parseMaintenanceAmount('abc')).toBeNull();
    expect(parseMaintenanceAmount('2.5')).toBe(2.5);
    expect(parseMaintenanceAmount('-4')).toBe(0);
  });
});
