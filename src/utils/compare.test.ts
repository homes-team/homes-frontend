import { allSame, bestIndexes } from './compare';

describe('bestIndexes', () => {
  it('returns the cheapest/largest columns, including ties', () => {
    expect([...bestIndexes([500, 300, 300], 'min')]).toEqual([1, 2]);
    expect([...bestIndexes([30, 45, 20], 'max')]).toEqual([1]);
  });

  it('ignores columns without a value', () => {
    expect([...bestIndexes([null, 50, 40, undefined], 'min')]).toEqual([2]);
  });

  it('highlights nothing when there is nothing to compare', () => {
    expect(bestIndexes([10, 10, 10], 'min').size).toBe(0);
    expect(bestIndexes([10, null, null], 'min').size).toBe(0);
    expect(bestIndexes([], 'max').size).toBe(0);
  });
});

describe('allSame', () => {
  it('is true only when every value matches', () => {
    expect(allSame(['SALE', 'SALE'])).toBe(true);
    expect(allSame(['SALE', 'JEONSE'])).toBe(false);
    expect(allSame([])).toBe(true);
  });
});
