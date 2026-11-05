import { pickAddress } from './postcodeLoader';

const result = { zonecode: '01234', address: '서울 노원구 석계로 49', roadAddress: '서울 노원구 석계로 49', jibunAddress: '서울 노원구 월계동 1', userSelectedType: 'J' as const };

describe('pickAddress', () => {
  it('prefers the standard road address even when the jibun address was selected', () => {
    expect(pickAddress(result)).toBe('서울 노원구 석계로 49');
  });

  it('falls back to the jibun address when there is no road address', () => {
    expect(pickAddress({ ...result, roadAddress: '' })).toBe('서울 노원구 월계동 1');
  });
});
