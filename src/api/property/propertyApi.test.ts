import { buildSearchQuery } from './propertyApi';

describe('buildSearchQuery', () => {
  it('serializes map bounds and repeated option filters', () => {
    const query = new URLSearchParams(buildSearchQuery({
      swLat: 37.4, swLng: 126.9, neLat: 37.6, neLng: 127.1,
      keyword: ' 강남 ', minDeposit: 500, options: ['PARKING', 'ELEVATOR'],
    }));

    expect(query.get('keyword')).toBe('강남');
    expect(query.get('sortBy')).toBe('LATEST');
    expect(query.getAll('options')).toEqual(['PARKING', 'ELEVATOR']);
    expect(query.get('minDeposit')).toBe('500');
  });

  it('omits empty optional values', () => {
    const query = new URLSearchParams(buildSearchQuery({
      swLat: 37.4, swLng: 126.9, neLat: 37.6, neLng: 127.1, keyword: '  ',
    }));
    expect(query.has('keyword')).toBe(false);
  });
});

describe('buildSearchQuery - 관리비/신규 옵션', () => {
  it('sends the maintenance fee range but never sends options the server does not know', () => {
    const query = new URLSearchParams(buildSearchQuery({
      swLat: 37.4, swLng: 126.9, neLat: 37.6, neLng: 127.1,
      minMaintenanceFee: 5, maxMaintenanceFee: 20, options: ['PARKING', 'PET_ALLOWED', 'JEONSE_LOAN'],
    }));

    expect(query.get('minMaintenanceFee')).toBe('5');
    expect(query.get('maxMaintenanceFee')).toBe('20');
    expect(query.getAll('options')).toEqual(['PARKING']);
  });
});
