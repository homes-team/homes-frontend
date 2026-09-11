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
