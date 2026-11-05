import { renderHook, waitFor } from '@testing-library/react';
import { fetchVerificationStatus } from '../api/verification/verificationApi';
import { usePropertyVerification } from './usePropertyVerification';

vi.mock('../api/verification/verificationApi', () => ({ fetchVerificationStatus: vi.fn() }));

beforeEach(() => vi.resetAllMocks());

describe('usePropertyVerification', () => {
  it('uses the values that came with the property without another request', () => {
    const { result } = renderHook(() => usePropertyVerification(1, { isOwnerVerified: true, isRealtorVerified: false }));

    expect(result.current).toEqual({ isOwnerVerified: true, isRealtorVerified: false });
    expect(fetchVerificationStatus).not.toHaveBeenCalled();
  });

  it('looks the status up when the property response has no verification values', async () => {
    vi.mocked(fetchVerificationStatus).mockResolvedValue({
      isOwnerVerified: true, ownerStatus: 'APPROVED', isRealtorVerified: false, realtorStatus: null,
    });
    const { result } = renderHook(() => usePropertyVerification(1, {}));

    expect(result.current).toEqual({ isOwnerVerified: null, isRealtorVerified: null });
    await waitFor(() => expect(result.current).toEqual({ isOwnerVerified: true, isRealtorVerified: false }));
    expect(fetchVerificationStatus).toHaveBeenCalledWith(1);
  });

  it('does not look anything up before the property is loaded', () => {
    renderHook(() => usePropertyVerification(1, null));

    expect(fetchVerificationStatus).not.toHaveBeenCalled();
  });

  it('stays unknown when the lookup fails', async () => {
    vi.mocked(fetchVerificationStatus).mockRejectedValue(new Error('실패'));
    const { result } = renderHook(() => usePropertyVerification(1, {}));

    await waitFor(() => expect(fetchVerificationStatus).toHaveBeenCalled());
    expect(result.current).toEqual({ isOwnerVerified: null, isRealtorVerified: null });
  });
});
