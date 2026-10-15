import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { createRealtorReview, fetchRealtorPublicProfile, fetchRealtorReviews } from '../../api/realtor/realtorApi';
import { getCurrentUser } from '../../utils/auth';
import { RealtorPublicProfile } from '../../types/realtor';
import RealtorProfilePage from './index';

vi.mock('../../api/realtor/realtorApi', () => ({
  createRealtorReview: vi.fn(),
  fetchRealtorPublicProfile: vi.fn(),
  fetchRealtorReviews: vi.fn(),
}));
vi.mock('../../utils/auth', () => ({ getCurrentUser: vi.fn() }));
vi.mock('../../components/layout/PageShell', () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));

const profile = (averageReviewScore: number | null, reviewCount: number): RealtorPublicProfile => ({
  agentId: 5, officeName: '홈즈부동산', officeAddress: '서울', businessNum: '123', isVerified: true,
  successRate: 0.8, averageReviewScore, reviewCount,
});

const asUser = (role: 'USER' | 'AGENT' | null) =>
  vi.mocked(getCurrentUser).mockReturnValue(role ? { sub: '1', email: 'a@b.c', role, exp: 0 } : null);

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/realtors/5']}>
      <Routes><Route path="/realtors/:realtorId" element={<RealtorProfilePage />} /></Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.resetAllMocks();
  asUser('USER');
  vi.mocked(fetchRealtorPublicProfile).mockResolvedValue(profile(4.5, 2));
  vi.mocked(fetchRealtorReviews).mockResolvedValue([
    { reviewId: 1, score: 5, content: '친절해요', reviewerNickname: '집주인A', createdAt: '2026-10-01T00:00:00' },
  ]);
  vi.mocked(createRealtorReview).mockResolvedValue();
});

describe('RealtorProfilePage rating', () => {
  it('shows the average rating as stars with the review count', async () => {
    renderPage();

    expect(await screen.findByRole('img', { name: '평점 4.5점 (2건)' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '평점 5.0점' })).toBeInTheDocument();
  });

  it('says so when there is no rating yet', async () => {
    vi.mocked(fetchRealtorPublicProfile).mockResolvedValue(profile(null, 0));
    renderPage();

    expect(await screen.findByText('아직 받은 평점이 없어요')).toBeInTheDocument();
  });
});

describe('RealtorProfilePage review form', () => {
  it('is offered to a homeowner', async () => {
    renderPage();

    expect(await screen.findByRole('button', { name: '리뷰 등록' })).toBeInTheDocument();
  });

  it.each([['a realtor', 'AGENT' as const], ['a visitor', null]])('is not offered to %s', async (_who, role) => {
    asUser(role);
    renderPage();

    await screen.findByText('홈즈부동산');
    expect(screen.queryByRole('button', { name: '리뷰 등록' })).not.toBeInTheDocument();
  });

  it('asks for a star before it sends anything', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: '리뷰 등록' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('별을 눌러 평점을 골라주세요.');
    expect(createRealtorReview).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('radio', { name: '4점' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('sends the chosen stars and content, then refreshes the average and closes the form', async () => {
    vi.mocked(fetchRealtorPublicProfile).mockResolvedValueOnce(profile(4.5, 2)).mockResolvedValueOnce(profile(4.7, 3));
    renderPage();

    fireEvent.click(await screen.findByRole('radio', { name: '4점' }));
    fireEvent.change(screen.getByLabelText('내용 (선택)'), { target: { value: ' 응대가 빨랐어요 ' } });
    fireEvent.click(screen.getByRole('button', { name: '리뷰 등록' }));

    expect(await screen.findByText(/리뷰를 등록했어요/)).toBeInTheDocument();
    expect(createRealtorReview).toHaveBeenCalledWith(5, { score: 4, content: '응대가 빨랐어요' });
    expect(await screen.findByRole('img', { name: '평점 4.7점 (3건)' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '리뷰 등록' })).not.toBeInTheDocument();
  });

  it('still reports success when only the refresh afterwards fails', async () => {
    vi.mocked(fetchRealtorPublicProfile).mockResolvedValueOnce(profile(4.5, 2)).mockRejectedValueOnce(new Error('boom'));
    renderPage();

    fireEvent.click(await screen.findByRole('radio', { name: '5점' }));
    fireEvent.click(screen.getByRole('button', { name: '리뷰 등록' }));

    expect(await screen.findByText(/리뷰를 등록했어요/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps the form and shows the server reason when the review is rejected', async () => {
    vi.mocked(createRealtorReview).mockRejectedValue(new ApiError('REVIEW_403', '매칭된 적이 있는 중개사만 리뷰할 수 있어요.'));
    renderPage();

    fireEvent.click(await screen.findByRole('radio', { name: '3점' }));
    fireEvent.click(screen.getByRole('button', { name: '리뷰 등록' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('매칭된 적이 있는 중개사만 리뷰할 수 있어요.');
    expect(screen.getByRole('button', { name: '리뷰 등록' })).toBeEnabled();
  });
});
