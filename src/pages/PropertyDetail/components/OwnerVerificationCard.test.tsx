import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ApiError } from '../../../api/client';
import { uploadOwnerDocumentToS3 } from '../../../api/upload/presignedUpload';
import { fetchVerificationStatus, requestOwnerVerification } from '../../../api/verification/verificationApi';
import { VerificationStatus } from '../../../types/verification';
import OwnerVerificationCard from './OwnerVerificationCard';

vi.mock('../../../api/verification/verificationApi', () => ({
  fetchVerificationStatus: vi.fn(),
  requestOwnerVerification: vi.fn(),
}));
vi.mock('../../../api/upload/presignedUpload', () => ({ uploadOwnerDocumentToS3: vi.fn() }));

const status = (ownerStatus: VerificationStatus | null, isOwnerVerified = false) => ({
  isOwnerVerified, ownerStatus, isRealtorVerified: false, realtorStatus: null,
});

const renderCard = () => render(<MemoryRouter><OwnerVerificationCard propertyId={5} /></MemoryRouter>);
const photo = new File(['x'], 'registry.jpg', { type: 'image/jpeg' });
const pick = async () => fireEvent.change(await screen.findByLabelText('등기부등본 사진'), { target: { files: [photo] } });

beforeEach(() => vi.resetAllMocks());

describe('OwnerVerificationCard', () => {
  it('asks the owner to upload the registry when nothing was submitted yet', async () => {
    vi.mocked(fetchVerificationStatus).mockResolvedValue(status(null));
    renderCard();

    expect(await screen.findByLabelText('등기부등본 사진')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '등기부등본 등록' })).toBeDisabled();
  });

  it('uploads the photo to the owner presigned url and requests the verification', async () => {
    vi.mocked(fetchVerificationStatus).mockResolvedValue(status(null));
    vi.mocked(uploadOwnerDocumentToS3).mockResolvedValue('https://bucket/owner-documents/a.jpg');
    vi.mocked(requestOwnerVerification).mockResolvedValue('요청됨');
    renderCard();

    await pick();
    fireEvent.click(screen.getByRole('button', { name: '등기부등본 등록' }));

    expect(await screen.findByText(/등기부등본을 확인하고 있어요/)).toBeInTheDocument();
    expect(uploadOwnerDocumentToS3).toHaveBeenCalledWith(5, photo);
    expect(requestOwnerVerification).toHaveBeenCalledWith(5, 'https://bucket/owner-documents/a.jpg');
    expect(screen.queryByLabelText('등기부등본 사진')).not.toBeInTheDocument();
  });

  it('shows the completed state without the upload form', async () => {
    vi.mocked(fetchVerificationStatus).mockResolvedValue(status('APPROVED', true));
    renderCard();

    expect(await screen.findByText('✓ 집주인 인증이 완료됐어요.')).toBeInTheDocument();
    expect(screen.queryByLabelText('등기부등본 사진')).not.toBeInTheDocument();
  });

  it('lets the owner upload again after a rejection', async () => {
    vi.mocked(fetchVerificationStatus).mockResolvedValue(status('REJECTED'));
    renderCard();

    expect(await screen.findByText(/반려됐어요/)).toBeInTheDocument();
    expect(screen.getByLabelText('등기부등본 사진')).toBeInTheDocument();
  });

  it('tells the owner a manual review is under way', async () => {
    vi.mocked(fetchVerificationStatus).mockResolvedValue(status('MANUAL_REVIEW'));
    renderCard();

    expect(await screen.findByText(/담당자가 확인하고 있어요/)).toBeInTheDocument();
    expect(screen.queryByLabelText('등기부등본 사진')).not.toBeInTheDocument();
  });

  it('points to the my page when the real-name verification is missing', async () => {
    vi.mocked(fetchVerificationStatus).mockResolvedValue(status(null));
    vi.mocked(uploadOwnerDocumentToS3).mockResolvedValue('https://bucket/a.jpg');
    vi.mocked(requestOwnerVerification).mockRejectedValue(new ApiError('USER400_11', '본인인증이 완료되지 않았어요.'));
    renderCard();

    await pick();
    fireEvent.click(screen.getByRole('button', { name: '등기부등본 등록' }));

    expect(await screen.findByText('본인인증이 완료되지 않았어요.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '마이페이지에서 본인인증 하기' })).toHaveAttribute('href', '/mypage');
  });

  it('shows the failure message and keeps the form when the upload fails', async () => {
    vi.mocked(fetchVerificationStatus).mockResolvedValue(status(null));
    vi.mocked(uploadOwnerDocumentToS3).mockRejectedValue(new Error('파일 업로드가 차단됐어요.'));
    renderCard();

    await pick();
    fireEvent.click(screen.getByRole('button', { name: '등기부등본 등록' }));

    expect(await screen.findByText('파일 업로드가 차단됐어요.')).toBeInTheDocument();
    expect(requestOwnerVerification).not.toHaveBeenCalled();
    expect(screen.getByLabelText('등기부등본 사진')).toBeInTheDocument();
  });
});
