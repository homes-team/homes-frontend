import { formatCostManwon, formatRate, formatWon, parseCalcNumber } from './calcFormat';

describe('parseCalcNumber', () => {
  it('treats blanks and garbage as the minimum and clamps to the range', () => {
    expect(parseCalcNumber('', 0, 100)).toBe(0);
    expect(parseCalcNumber('abc', 1, 100)).toBe(1);
    expect(parseCalcNumber('150', 0, 100)).toBe(100);
    expect(parseCalcNumber('-5', 0, 100)).toBe(0);
    expect(parseCalcNumber('4.5', 0, 100)).toBe(4.5);
  });
});

describe('formatCostManwon', () => {
  it.each([
    [92.5, '92.5만원'],
    [3, '3만원'],
    [92.54, '92.5만원'],
    [12345, '1억 2,345만원'],
    [20000, '2억'],
    [-4.2, '-4.2만원'],
  ])('formats %f as %s', (value, expected) => {
    expect(formatCostManwon(value)).toBe(expected);
  });
});

describe('formatWon / formatRate', () => {
  it('formats won with thousands separators and trims rates', () => {
    expect(formatWon(1234000)).toBe('1,234,000원');
    expect(formatWon(0)).toBe('0원');
    expect(formatRate(0.4)).toBe('0.4');
    expect(formatRate(4.5)).toBe('4.5');
    expect(formatRate(3)).toBe('3');
    expect(formatRate(0.333333)).toBe('0.33');
  });
});
