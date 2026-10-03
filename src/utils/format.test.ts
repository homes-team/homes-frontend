import { formatKoreanWon } from './format';

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
