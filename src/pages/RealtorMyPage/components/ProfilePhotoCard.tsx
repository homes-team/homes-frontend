import { ChangeEvent, useRef, useState } from 'react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { HelperText } from '../../../components/ui/Field';
import { updateMyAgentProfile } from '../../../api/realtor/realtorApi';
import { uploadFileToS3 } from '../../../api/upload/presignedUpload';
import { ApiError } from '../../../api/client';
import { AgentProfile } from '../../../types/realtor';

/** 백엔드 S3PresignedUrlService.MAX_UPLOAD_SIZE_BYTES(10MB)와 동일 */
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export function validateProfilePhoto(file: File): string | null {
  if (!file.type.startsWith('image/')) return '이미지 파일(JPG, PNG 등)만 올릴 수 있어요.';
  if (file.size > MAX_PHOTO_BYTES) return '사진은 10MB 이하만 올릴 수 있어요.';
  return null;
}

interface ProfilePhotoCardProps {
  profile: AgentProfile;
  onProfileUpdated: (profile: AgentProfile) => void;
}

/** 중개사 마이페이지 상단 — 프로필 사진, 사무소명, 사업자등록번호 */
function ProfilePhotoCard({ profile, onProfileUpdated }: ProfilePhotoCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // 같은 파일을 다시 골라도 change가 일어나도록 초기화
    if (!file) return;

    const invalid = validateProfilePhoto(file);
    if (invalid) {
      setMessage(invalid);
      return;
    }

    setUploading(true);
    setMessage(null);
    try {
      const url = await uploadFileToS3(file, { auth: true });
      const updated = await updateMyAgentProfile({ profileImageUrl: url });
      onProfileUpdated(updated);
      setMessage(
        updated.profileImageUrl === url
          ? '프로필 사진을 바꿨어요.'
          : '사진은 업로드했지만 서버가 아직 프로필 사진 저장을 지원하지 않아요. (백엔드 준비 중)',
      );
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : err instanceof Error ? err.message : '사진을 바꾸지 못했어요.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-4">
        {profile.profileImageUrl ? (
          <img
            src={profile.profileImageUrl}
            alt={`${profile.officeName} 프로필 사진`}
            className="h-20 w-20 shrink-0 rounded-full border border-gray-200 object-cover"
          />
        ) : (
          <span
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-50 text-2xl font-bold text-primary"
            aria-label="기본 프로필 이미지"
          >
            {profile.officeName.charAt(0)}
          </span>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-lg font-bold text-gray-900">{profile.officeName}</p>
            <Badge variant={profile.isVerified ? 'primary' : 'default'}>{profile.isVerified ? '승인 완료' : '승인 대기'}</Badge>
          </div>
          <p className="text-[13px] text-gray-500">사업자등록번호 {profile.businessNum}</p>
          <div>
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="rounded-button border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? '업로드 중...' : '사진 변경'}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-label="프로필 사진 선택"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>
      {message && <HelperText>{message}</HelperText>}
    </Card>
  );
}

export default ProfilePhotoCard;
