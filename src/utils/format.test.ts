import { formatKoreanWon, formatManwon } from './format';

describe('formatKoreanWon', () => {
  it.each([
    [41900, '4억 1,900만 원'],
    [40000, '4억 원'],
    [9000, '9,000만 원'],
    [0, '0만 원'],
  ])('formats %i ten-thousand won as %s', (value, expected) => {
    expect(formatKoreanWon(value)).toBe(expected);
  });
});

describe('formatManwon', () => {
  it.each([
    [1000, '1,000만원'],
    [9, '9만원'],
    [42000, '4.2억'],
    [50000, '5억'],
    [55555, '5억 5,555만원'],
  ])('formats %i as %s without doubling the unit', (value, expected) => {
    expect(formatManwon(value)).toBe(expected);
  });
});
