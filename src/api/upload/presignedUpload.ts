import axios from 'axios';
import { apiGet } from '../client';

interface PresignedUpload {
  uploadUrl: string;
  fileUrl: string;
}

const UPLOAD_TIMEOUT_MS = 30_000;

/**
 * presigned URL 발급 → S3에 PUT 업로드 → 최종 공개 URL 반환.
 * - 로그인 상태(auth:true): GET /properties/presigned-url — 매물 사진 전용, 토큰 필수. S3 properties/ 폴더에 저장된다.
 * - 중개사 회원가입 전(email): GET /realtors/presigned-url — 사전 인증된 이메일로 식별하며,
 *   서류·프로필 사진이 S3 agents/ 폴더에 저장된다. email은 최종 가입 폼의 email과 같아야 한다.
 */
export async function uploadFileToS3(file: File, identity: { auth?: boolean; email?: string }): Promise<string> {
  const params = new URLSearchParams({ fileName: file.name });
  if (identity.email) params.set('email', identity.email);

  const issued = identity.email
    ? await apiGet<PresignedUpload>(`/realtors/presigned-url?${params.toString()}`)
    : await apiGet<PresignedUpload>(`/properties/presigned-url?${params.toString()}`, { auth: true });

  try {
    await axios.put(issued.uploadUrl, file, {
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      timeout: UPLOAD_TIMEOUT_MS,
    });
  } catch {
    throw new Error('파일 업로드가 차단됐어요. 잠시 후 다시 시도해주세요.');
  }

  return issued.fileUrl;
}
