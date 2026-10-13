import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ApiError } from '../../../api/client';
import { AgentProfile } from '../../../types/realtor';
import ProfilePhotoCard, { validateProfilePhoto } from './ProfilePhotoCard';

const uploadFileToS3 = vi.hoisted(() => vi.fn());
const updateMyAgentProfile = vi.hoisted(() => vi.fn());

vi.mock('../../../api/upload/presignedUpload', () => ({ uploadFileToS3 }));
vi.mock('../../../api/realtor/realtorApi', () => ({ updateMyAgentProfile }));

const profile: AgentProfile = {
  agentId: 1, userId: 2, email: 'a@a.com', officeName: '홈즈부동산', officeAddress: null,
  businessNum: '123-45-67890', isVerified: true,
};

function pickFile(file: File) {
  fireEvent.change(screen.getByLabelText('프로필 사진 선택'), { target: { files: [file] } });
}

const photo = () => new File(['x'], 'me.png', { type: 'image/png' });

beforeEach(() => vi.clearAllMocks());

describe('validateProfilePhoto', () => {
  it('accepts images and rejects other files or files over 10MB', () => {
    expect(validateProfilePhoto(photo())).toBeNull();
    expect(validateProfilePhoto(new File(['x'], 'a.pdf', { type: 'application/pdf' }))).toMatch(/이미지 파일/);
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' });
    expect(validateProfilePhoto(big)).toMatch(/10MB/);
  });
});

describe('ProfilePhotoCard', () => {
  it('shows the office initial, business number and approval status when there is no photo', () => {
    render(<ProfilePhotoCard profile={profile} onProfileUpdated={vi.fn()} />);
    expect(screen.getByLabelText('기본 프로필 이미지')).toHaveTextContent('홈');
    expect(screen.getByText('사업자등록번호 123-45-67890')).toBeInTheDocument();
    expect(screen.getByText('승인 완료')).toBeInTheDocument();
  });

  it('uploads the photo and saves its URL on the profile', async () => {
    uploadFileToS3.mockResolvedValue('https://bucket/properties/me.png');
    updateMyAgentProfile.mockResolvedValue({ ...profile, profileImageUrl: 'https://bucket/properties/me.png' });
    const onProfileUpdated = vi.fn();
    render(<ProfilePhotoCard profile={profile} onProfileUpdated={onProfileUpdated} />);

    pickFile(photo());

    expect(await screen.findByText('프로필 사진을 바꿨어요.')).toBeInTheDocument();
    expect(uploadFileToS3).toHaveBeenCalledWith(expect.any(File), { auth: true });
    expect(updateMyAgentProfile).toHaveBeenCalledWith({ profileImageUrl: 'https://bucket/properties/me.png' });
    expect(onProfileUpdated).toHaveBeenCalledWith(expect.objectContaining({ profileImageUrl: 'https://bucket/properties/me.png' }));
  });

  it('says so when the server accepts the request but does not store the photo', async () => {
    uploadFileToS3.mockResolvedValue('https://bucket/properties/me.png');
    updateMyAgentProfile.mockResolvedValue(profile);
    render(<ProfilePhotoCard profile={profile} onProfileUpdated={vi.fn()} />);

    pickFile(photo());

    expect(await screen.findByText(/서버가 아직 프로필 사진 저장을 지원하지 않아요/)).toBeInTheDocument();
  });

  it('does not call the server for an invalid file', async () => {
    render(<ProfilePhotoCard profile={profile} onProfileUpdated={vi.fn()} />);

    pickFile(new File(['x'], 'a.pdf', { type: 'application/pdf' }));

    expect(await screen.findByText(/이미지 파일/)).toBeInTheDocument();
    expect(uploadFileToS3).not.toHaveBeenCalled();
  });

  it('shows the server error when the profile update fails', async () => {
    uploadFileToS3.mockResolvedValue('https://bucket/properties/me.png');
    updateMyAgentProfile.mockRejectedValue(new ApiError('INVALID', '허용된 S3 저장소의 URL만 사용할 수 있습니다.'));
    render(<ProfilePhotoCard profile={profile} onProfileUpdated={vi.fn()} />);

    pickFile(photo());

    await waitFor(() => expect(screen.getByText('허용된 S3 저장소의 URL만 사용할 수 있습니다.')).toBeInTheDocument());
  });
});
