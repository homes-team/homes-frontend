import axios from 'axios';
import { apiGet } from '../client';

interface PresignedUpload {
  uploadUrl: string;
  fileUrl: string;
}

const UPLOAD_TIMEOUT_MS = 30_000;

/**
 * GET /properties/presigned-url 발급 → S3에 PUT 업로드 → 최종 공개 URL 반환.
 * 로그인 상태면 auth:true(토큰으로 식별), 회원가입 전이면 email(사전 인증된 이메일)로 식별한다.
 */
export async function uploadFileToS3(file: File, identity: { auth?: boolean; email?: string }): Promise<string> {
  const params = new URLSearchParams({ fileName: file.name });
  if (identity.email) params.set('email', identity.email);

  const issued = await apiGet<PresignedUpload>(`/properties/presigned-url?${params.toString()}`, {
    auth: identity.auth ?? false,
  });

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
