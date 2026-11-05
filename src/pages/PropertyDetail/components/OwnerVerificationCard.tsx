import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { ErrorText, HelperText } from '../../../components/ui/Field';
import { fetchVerificationStatus, requestOwnerVerification } from '../../../api/verification/verificationApi';
import { uploadOwnerDocumentToS3 } from '../../../api/upload/presignedUpload';
import { ApiError } from '../../../api/client';
import { VerificationStatus } from '../../../types/verification';

/** 서버 OCR 검증이 1~2분 걸려서, 검증 중에는 이 간격으로 결과를 다시 확인한다 */
const POLL_INTERVAL_MS = 5000;
/** UserErrorCode.IDENTITY_VERIFICATION_NOT_COMPLETED */
const IDENTITY_REQUIRED_CODE = 'USER400_11';

const STATUS_NOTICE: Record<VerificationStatus, { text: string; tone: string }> = {
  PENDING: { text: '등기부등본을 확인하고 있어요. 1~2분 뒤에 결과가 나와요.', tone: 'bg-primary-50 text-primary' },
  APPROVED: { text: '✓ 집주인 인증이 완료됐어요.', tone: 'bg-success-50 text-success' },
  MANUAL_REVIEW: {
    text: '자동으로 확인하지 못해 담당자가 확인하고 있어요. 결과가 나올 때까지 기다려주세요.',
    tone: 'bg-gray-50 text-gray-700',
  },
  REJECTED: { text: '인증이 반려됐어요. 등기부등본을 다시 등록해주세요.', tone: 'bg-red-50 text-danger' },
};

/** 매물을 등록한 본인이 등기부등본 사진을 올려 집주인 인증을 받는 카드 (등록자에게만 보여준다) */
function OwnerVerificationCard({ propertyId }: { propertyId: number }) {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; needsIdentity: boolean } | null>(null);

  const refresh = useCallback(
    () =>
      fetchVerificationStatus(propertyId)
        .then((info) => setStatus(info.isOwnerVerified ? 'APPROVED' : info.ownerStatus))
        .catch(() => {
          /* 현황 조회 실패는 조용히 무시 — 등록 자체는 계속 할 수 있다 */
        })
        .finally(() => setLoaded(true)),
    [propertyId],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (status !== 'PENDING') return;
    const timer = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [status, refresh]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const documentUrl = await uploadOwnerDocumentToS3(propertyId, file);
      await requestOwnerVerification(propertyId, documentUrl);
      setFile(null);
      setStatus('PENDING');
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : '등기부등본 등록에 실패했어요.',
        needsIdentity: err instanceof ApiError && err.code === IDENTITY_REQUIRED_CODE,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = status === null || status === 'REJECTED';
  const notice = status ? STATUS_NOTICE[status] : null;

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-[15px] font-bold text-gray-900">📄 등기부등본 등록</h2>

      {!loaded && <p className="text-sm text-gray-500">불러오는 중...</p>}

      {loaded && notice && (
        <p role="status" className={`rounded-button px-3 py-2.5 text-sm font-medium ${notice.tone}`}>
          {notice.text}
        </p>
      )}

      {loaded && canSubmit && (
        <>
          <p className="text-[13px] leading-relaxed text-gray-500">
            등기부등본 사진을 올리면 소유자 이름이 본인인증한 실명과 같은지 확인해 집주인 인증을 해드려요.
          </p>
          <input
            type="file"
            accept="image/*"
            aria-label="등기부등본 사진"
            onChange={handleFileChange}
            className="text-sm text-gray-600 file:mr-3 file:rounded-button file:border file:border-gray-200 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-gray-900"
          />
          <Button fullWidth onClick={handleSubmit} disabled={!file || submitting}>
            {submitting ? '등록 중...' : '등기부등본 등록'}
          </Button>
          {error && <ErrorText>{error.message}</ErrorText>}
          {error?.needsIdentity && (
            <HelperText>
              <Link to="/mypage" className="font-bold text-primary underline">
                마이페이지에서 본인인증 하기
              </Link>
            </HelperText>
          )}
        </>
      )}
    </Card>
  );
}

export default OwnerVerificationCard;
