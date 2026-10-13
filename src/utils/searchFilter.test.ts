import { PropertyListItem } from '../types/property';
import { applyClientSideFilters, serverSupportedOptions } from './searchFilter';

function item(overrides: Partial<PropertyListItem>): PropertyListItem {
  return {
    propertyId: 1, thumbnailUrl: null, title: 't', address: 'a', latitude: 37, longitude: 127,
    propertyType: 'ONE_ROOM', tradeType: 'MONTHLY_RENT', deposit: 1000, monthlyRent: 50,
    maintenanceFee: 10, totalFloors: 5, currentFloor: 2, area: 20, description: '', createdAt: '2026-10-01T00:00:00',
    aiScore: null, options: [], nearestStation: null, walkingTime: null, favoriteCount: 0, isSuspicious: false,
    status: 'AVAILABLE', ...overrides,
  };
}

describe('applyClientSideFilters', () => {
  const items = [
    item({ propertyId: 1, maintenanceFee: 5 }),
    item({ propertyId: 2, maintenanceFee: 15 }),
    item({ propertyId: 3, maintenanceFee: null }),
    item({ propertyId: 4, maintenanceFee: 30, options: ['PET_ALLOWED'] }),
  ];

  it('keeps everything when no filter is set', () => {
    expect(applyClientSideFilters(items, {})).toHaveLength(4);
  });

  it('filters by maintenance fee range and treats a missing fee as 0', () => {
    expect(applyClientSideFilters(items, { maxMaintenanceFee: 10 }).map((p) => p.propertyId)).toEqual([1, 3]);
    expect(applyClientSideFilters(items, { minMaintenanceFee: 10, maxMaintenanceFee: 20 }).map((p) => p.propertyId)).toEqual([2]);
  });

  it('requires frontend-only options but ignores server-supported ones', () => {
    expect(applyClientSideFilters(items, { options: ['PET_ALLOWED'] }).map((p) => p.propertyId)).toEqual([4]);
    expect(applyClientSideFilters(items, { options: ['PARKING'] })).toHaveLength(4);
    expect(applyClientSideFilters(items, { options: ['JEONSE_LOAN'] })).toHaveLength(0);
  });
});

describe('serverSupportedOptions', () => {
  it('drops options the backend enum does not know yet', () => {
    expect(serverSupportedOptions(['PARKING', 'PET_ALLOWED', 'JEONSE_LOAN', 'ELEVATOR'])).toEqual(['PARKING', 'ELEVATOR']);
    expect(serverSupportedOptions(undefined)).toEqual([]);
  });
});
