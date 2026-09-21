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
  AUTH_STATE_CHANGED_EVENT,
  REFRESH_TOKEN_KEY,
} from './client';

describe('API client optional authentication', () => {
  beforeEach(() => {
    requestMock.mockReset();
    postMock.mockReset();
    localStorage.clear();
  });

  it('clears auth state and retries a public request anonymously when refresh authentication fails', async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, 'expired-access-token');
    localStorage.setItem(REFRESH_TOKEN_KEY, 'expired-refresh-token');
    const authStateChanged = vi.fn();
    window.addEventListener(AUTH_STATE_CHANGED_EVENT, authStateChanged);

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
    expect(authStateChanged).toHaveBeenCalledOnce();
    expect(requestMock).toHaveBeenCalledTimes(2);
    expect(requestMock.mock.calls[0][0].headers).toEqual({
      Authorization: 'Bearer expired-access-token',
    });
    expect(requestMock.mock.calls[1][0].headers).toEqual({});

    window.removeEventListener(AUTH_STATE_CHANGED_EVENT, authStateChanged);
  });

  it.each([
    ['network error', { isAxiosError: true }],
    ['server error', { isAxiosError: true, response: { status: 503 } }],
  ])('preserves tokens and rethrows a refresh %s', async (_label, refreshError) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, 'expired-access-token');
    localStorage.setItem(REFRESH_TOKEN_KEY, 'existing-refresh-token');
    const authStateChanged = vi.fn();
    window.addEventListener(AUTH_STATE_CHANGED_EVENT, authStateChanged);

    requestMock.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 401,
        data: { isSuccess: false, code: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
      },
    });
    postMock.mockRejectedValueOnce(refreshError);

    await expect(apiGet<string[]>('/properties/map', {
      auth: true,
      allowAnonymousFallback: true,
    })).rejects.toBe(refreshError);

    expect(localStorage.getItem(ACCESS_TOKEN_KEY)).toBe('expired-access-token');
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('existing-refresh-token');
    expect(authStateChanged).not.toHaveBeenCalled();
    expect(requestMock).toHaveBeenCalledTimes(1);

    window.removeEventListener(AUTH_STATE_CHANGED_EVENT, authStateChanged);
  });
});
