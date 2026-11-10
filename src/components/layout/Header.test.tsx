import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import Header from './Header';

vi.mock('../../api/auth/authApi', () => ({ logout: vi.fn() }));
vi.mock('../../api/notification/notificationApi', () => ({
  fetchNotifications: vi.fn().mockResolvedValue([]),
  markNotificationRead: vi.fn(),
  subscribeToNotifications: vi.fn().mockResolvedValue(() => undefined),
  NOTIFICATIONS_CHANGED_EVENT: 'homes:notifications-changed',
}));

function Where() {
  const { pathname, search } = useLocation();
  return <p data-testid="where">{pathname + search}</p>;
}

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Header />
      <Routes><Route path="*" element={<Where />} /></Routes>
    </MemoryRouter>,
  );

describe('Header search', () => {
  it('searches for the typed keyword on submit', () => {
    renderAt('/');

    fireEvent.change(screen.getByRole('searchbox', { name: '매물 검색어' }), { target: { value: '창동역' } });
    fireEvent.submit(screen.getByRole('search'));

    expect(screen.getByTestId('where')).toHaveTextContent('/search?keyword=%EC%B0%BD%EB%8F%99%EC%97%AD');
  });

  it('opens the plain search page when nothing was typed', () => {
    renderAt('/');

    fireEvent.submit(screen.getByRole('search'));

    expect(screen.getByTestId('where')).toHaveTextContent(/^\/search$/);
  });

  it('hides the box on the search page, which has its own search bar', () => {
    renderAt('/search');

    expect(screen.queryByRole('searchbox', { name: '매물 검색어' })).not.toBeInTheDocument();
  });
});
