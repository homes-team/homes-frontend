import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Field, Label, Select, Textarea, Input, HelperText } from '../../components/ui/Field';
import { deleteProperty, fetchPropertyDetail, reportProperty, toggleFavorite } from '../../api/propertyApi';
import { fetchMyProperties } from '../../api/userApi';
import { createBid } from '../../api/bidApi';
import { ApiError, isLoggedIn } from '../../api/client';
import { getCurrentUser } from '../../utils/auth';
import { formatMoney } from '../../utils/format';
import {
  PROPERTY_OPTION_LABEL,
  PROPERTY_TYPE_LABEL,
  PropertyDetail,
  REPORT_REASON_LABEL,
  ReportReason,
  TRADE_TYPE_LABEL,
} from '../../types/property';

const REPORT_REASONS: ReportReason[] = ['FAKE_PROPERTY', 'SOLD_OUT', 'PRICE_MISMATCH', 'INFO_MISMATCH', 'OTHER'];

function PropertyDetailPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const id = Number(propertyId);
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const [favoriteMessage, setFavoriteMessage] = useState<string | null>(null);
  const [favorited, setFavorited] = useState<boolean | null>(null);

  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('FAKE_PROPERTY');
  const [reportCustomReason, setReportCustomReason] = useState('');
  const [reportMessage, setReportMessage] = useState<string | null>(null);

  const [showBidForm, setShowBidForm] = useState(false);
  const [proposedFee, setProposedFee] = useState('');
  const [bidContent, setBidContent] = useState('');
  const [bidMessage, setBidMessage] = useState<string | null>(null);
  const [bidSubmitting, setBidSubmitting] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPropertyDetail(id)
      .then((data) => {
        if (cancelled) return;
        setProperty(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    if (isLoggedIn() && user?.role === 'USER') {
      fetchMyProperties()
        .then((mine) => {
          if (!cancelled) setIsOwner(mine.some((item) => item.propertyId === id));
        })
        .catch(() => {
          /* 소유 여부 확인 실패는 조용히 무시 — 소유자 전용 액션만 숨겨지는 정도 */
        });
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleToggleFavorite = async () => {
    setFavoriteMessage(null);
    try {
      const result = await toggleFavorite(id);
      setFavorited(result);
      setFavoriteMessage(result ? '찜 목록에 추가했어요.' : '찜을 취소했어요.');
    } catch (err) {
      setFavoriteMessage(err instanceof ApiError ? err.message : '찜하기에 실패했어요.');
    }
  };

  const handleSubmitReport = async () => {
    setReportMessage(null);
    try {
      await reportProperty(id, {
        reason: reportReason,
        customReason: reportReason === 'OTHER' ? reportCustomReason.trim() : undefined,
      });
      setReportMessage('신고가 접수됐어요.');
      setShowReportForm(false);
    } catch (err) {
      setReportMessage(err instanceof ApiError ? err.message : '신고 접수에 실패했어요.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('이 매물을 삭제할까요? 되돌릴 수 없어요.')) return;
    try {
      await deleteProperty(id);
      navigate('/mypage/properties');
    } catch (err) {
      setFavoriteMessage(err instanceof ApiError ? err.message : '삭제에 실패했어요.');
    }
  };

  const handleSubmitBid = async () => {
    const fee = Number(proposedFee);
    if (!fee || fee <= 0) {
      setBidMessage('희망 수수료를 올바르게 입력해주세요.');
      return;
    }
    setBidSubmitting(true);
    setBidMessage(null);
    try {
      await createBid(id, { proposedFee: fee, content: bidContent.trim() || undefined });
      setBidMessage('입찰서를 제출했어요. 집주인의 선택을 기다려주세요.');
      setShowBidForm(false);
    } catch (err) {
      setBidMessage(err instanceof ApiError ? err.message : '입찰서 제출에 실패했어요.');
    } finally {
      setBidSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <p className="py-12 text-center text-sm text-gray-500">불러오는 중...</p>
      </PageShell>
    );
  }

  if (error || !property) {
    return (
      <PageShell>
        <p className="rounded-button bg-red-50 p-4 text-sm font-medium text-danger">
          {error ?? '매물을 찾을 수 없어요.'}
        </p>
      </PageShell>
    );
  }

  const priceLabel =
    property.tradeType === 'MONTHLY_RENT'
      ? `${TRADE_TYPE_LABEL[property.tradeType]} ${formatMoney(property.deposit)}/${property.monthlyRent}`
      : `${TRADE_TYPE_LABEL[property.tradeType]} ${formatMoney(property.deposit)}`;

  return (
    <PageShell>
      <button type="button" onClick={() => navigate('/search')} className="mb-4 text-[13px] font-medium text-gray-500 hover:text-primary">
        ← 목록으로
      </button>

      <div className="grid grid-cols-1 gap-10 md:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-3">
          {property.imageUrls.length > 0 ? (
            <>
              <img
                className="aspect-4/3 w-full rounded-card bg-gray-100 object-cover"
                src={property.imageUrls[activeImage]}
                alt={property.title}
              />
              {property.imageUrls.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {property.imageUrls.map((url, index) => (
                    <button
                      key={url}
                      type="button"
                      className={`h-[54px] w-[72px] shrink-0 overflow-hidden rounded-lg border-2 opacity-70 ${
                        index === activeImage ? 'border-primary opacity-100' : 'border-transparent'
                      }`}
                      onClick={() => setActiveImage(index)}
                    >
                      <img src={url} alt={`사진 ${index + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex aspect-4/3 items-center justify-center rounded-card bg-gray-100 text-sm text-gray-400">
              사진 준비 중
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          {property.isSuspicious && <Badge variant="danger">! 의심 매물</Badge>}
          <Badge>{PROPERTY_TYPE_LABEL[property.propertyType]}</Badge>
          <h1 className="text-[26px] font-bold text-gray-900">{priceLabel}</h1>
          {property.maintenanceFee ? (
            <p className="text-sm text-gray-500">관리비 {formatMoney(property.maintenanceFee)}만원</p>
          ) : null}
          <p className="text-[15px] text-gray-900">
            {property.address} {property.detailAddress}
          </p>
          <p className="text-[13px] text-gray-500">
            {property.currentFloor}/{property.totalFloors}층 · {property.area}m²
            {property.nearestStation ? ` · ${property.nearestStation} 도보 ${property.walkingTime}분` : ''}
          </p>
          {property.desiredBrokerageFee !== null && (
            <p className="text-[13px] text-gray-500">희망 중개수수료율 {property.desiredBrokerageFee}%</p>
          )}
          <p className="text-[13px] text-gray-500">찜 {property.favoriteCount}</p>

          <div className="mt-2 flex flex-wrap gap-2">
            {isLoggedIn() && (
              <Button variant="secondary" onClick={handleToggleFavorite}>
                {favorited ? '♥ 찜 취소' : '♡ 찜하기'}
              </Button>
            )}
            {isLoggedIn() && (
              <Button variant="secondary" onClick={() => setShowReportForm((prev) => !prev)}>
                신고하기
              </Button>
            )}
            {isOwner && <Button onClick={() => navigate(`/properties/${id}/bids`)}>받은 입찰 보기</Button>}
            {isOwner && (
              <Button variant="secondary" onClick={handleDelete}>
                매물 삭제
              </Button>
            )}
            {isLoggedIn() && user?.role === 'AGENT' && !isOwner && (
              <Button onClick={() => setShowBidForm((prev) => !prev)}>입찰하기</Button>
            )}
          </div>
          {favoriteMessage && <HelperText>{favoriteMessage}</HelperText>}

          {showReportForm && (
            <Card className="flex flex-col gap-4">
              <Field>
                <Label>신고 사유</Label>
                <Select value={reportReason} onChange={(event) => setReportReason(event.target.value as ReportReason)}>
                  {REPORT_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {REPORT_REASON_LABEL[reason]}
                    </option>
                  ))}
                </Select>
              </Field>
              {reportReason === 'OTHER' && (
                <Field>
                  <Textarea
                    placeholder="신고 사유를 입력해주세요"
                    value={reportCustomReason}
                    onChange={(event) => setReportCustomReason(event.target.value)}
                  />
                </Field>
              )}
              <Button onClick={handleSubmitReport}>신고 제출</Button>
            </Card>
          )}
          {reportMessage && <HelperText>{reportMessage}</HelperText>}

          {showBidForm && (
            <Card className="flex flex-col gap-4">
              <Field>
                <Label>희망 중개 수수료 (만원)</Label>
                <Input
                  type="number"
                  value={proposedFee}
                  onChange={(event) => setProposedFee(event.target.value)}
                  placeholder="예: 50"
                />
              </Field>
              <Field>
                <Label>제안 메모 (선택)</Label>
                <Textarea
                  value={bidContent}
                  onChange={(event) => setBidContent(event.target.value)}
                  placeholder="집주인에게 전달할 메시지"
                />
              </Field>
              <Button onClick={handleSubmitBid} disabled={bidSubmitting}>
                {bidSubmitting ? '제출 중...' : '입찰서 제출'}
              </Button>
            </Card>
          )}
          {bidMessage && <HelperText>{bidMessage}</HelperText>}
        </div>
      </div>

      <section className="mt-12 border-t border-gray-200 pt-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900">상세 설명</h2>
        <p className="mb-4 text-[15px] leading-relaxed whitespace-pre-wrap text-gray-900">{property.description}</p>

        {property.options.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {property.options.map((option) => (
              <li key={option}>
                <Badge>{PROPERTY_OPTION_LABEL[option]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}

export default PropertyDetailPage;
