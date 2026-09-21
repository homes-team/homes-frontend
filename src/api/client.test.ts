import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestMock, postMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
  postMock: vi.fn(),
}));

vi.mock('axios', () => ({
  default: {
    create: () => ({ request: requestMock }),
    post: postMock,
    isCancel: () => false,
    isAxiosError: (error: unknown) => Boolean(
      error && typeof error === 'object' && 'isAxiosError' in error,
    ),
  },
}));

import {
  ACCESS_TOKEN_KEY,
  apiGet,
  REFRESH_TOKEN_KEY,
} from './client';

describe('API client optional authentication', () => {
  beforeEach(() => {
    requestMock.mockReset();
    postMock.mockReset();
    localStorage.clear();
  });

  it('retries a public request anonymously when token refresh fails', async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, 'expired-access-token');
    localStorage.setItem(REFRESH_TOKEN_KEY, 'expired-refresh-token');

    requestMock
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 401,
          data: { isSuccess: false, code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
        },
      })
      .mockResolvedValueOnce({
        data: { isSuccess: true, code: 'COMMON_200', message: '성공', result: ['property'] },
      });
    postMock.mockRejectedValueOnce({ isAxiosError: true, response: { status: 401 } });

    await expect(apiGet<string[]>('/properties/map', {
      auth: true,
      allowAnonymousFallback: true,
    })).resolves.toEqual(['property']);

    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    expect(requestMock).toHaveBeenCalledTimes(2);
    expect(requestMock.mock.calls[0][0].headers).toEqual({
      Authorization: 'Bearer expired-access-token',
    });
    expect(requestMock.mock.calls[1][0].headers).toEqual({});
  });
});
