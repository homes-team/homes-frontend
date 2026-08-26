import { PresignedUploadRequest, PresignedUploadResult } from '../types/auth';
import { apiPost } from './client';

/**
 * 이미지 업로드용 Presigned URL 발급 요청.
 * TODO: 백엔드가 실제 엔드포인트를 확정하면 경로/필드명을 맞춰 교체.
 * (백엔드 팀 확인 필요 — 잠정: POST /images/presigned-url, 로그인 필요 가정)
 */
export function requestPresignedUploadUrl(request: PresignedUploadRequest): Promise<PresignedUploadResult> {
  return apiPost<PresignedUploadResult>('/images/presigned-url', request, { auth: true });
}

/** 발급받은 Presigned URL로 S3에 파일을 직접 PUT 업로드 */
async function putFileToS3(file: File, uploadUrl: string): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!response.ok) {
    throw new Error('이미지 업로드에 실패했어요. 다시 시도해주세요.');
  }
}

/**
 * 파일 하나를 "Presigned URL 발급 → S3 직접 업로드"까지 한 번에 처리하고,
 * DB에 저장할 최종 이미지 URL을 반환한다.
 * @param file 업로드할 파일
 * @param directory S3 상의 디렉터리 구분 (예: 'agent-certs', 'agent-profiles')
 */
export async function uploadImage(file: File, directory: string): Promise<string> {
  const { uploadUrl, fileUrl } = await requestPresignedUploadUrl({
    fileName: file.name,
    contentType: file.type,
    directory,
  });
  await putFileToS3(file, uploadUrl);
  return fileUrl;
}
