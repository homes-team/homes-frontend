import { ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Field, Label, Select, Textarea, Input, HelperText } from '../../components/ui/Field';
import {
  deleteProperty,
  fetchAiEvaluation,
  fetchBuildingInformation,
  fetchPricePrediction,
  fetchPropertyDetail,
  reportProperty,
  resolveBuildingInformation,
  toggleFavorite,
} from '../../api/property/propertyApi';
import { fetchMyProperties } from '../../api/user/userApi';
import { createBid } from '../../api/bid/bidApi';
import { ApiError, isLoggedIn } from '../../api/client';
import { getCurrentUser } from '../../utils/auth';
import { formatMoney } from '../../utils/format';
import {
  PROPERTY_OPTION_LABEL,
  PROPERTY_STATUS_LABEL,
  PROPERTY_TYPE_LABEL,
  AiEvaluation,
  BuildingInformation,
  BuildingInformationStatus,
  PropertyDetail,
  PropertyPricePrediction,
  REPORT_REASON_LABEL,
  ReportReason,
  TRADE_TYPE_LABEL,
} from '../../types/property';
import AiEvaluationSummaryCard from './components/AiEvaluationSummaryCard';
import PricePredictionCard from './components/PricePredictionCard';
import RealtorContactCard from './components/RealtorContactCard';
import CompareToggleButton from '../../components/compare/CompareToggleButton';
import InfrastructureCard from './components/InfrastructureCard';
import MaintenanceFeeCard from './components/MaintenanceFeeCard';
import PropertyStatusManager from './components/PropertyStatusManager';
import LegalFeeCapCard from './components/LegalFeeCapCard';
import PropertyOverview from './components/PropertyOverview';
import SectionNav from './components/SectionNav';
import { checkProposedRate, commissionCalculatorPath, legalFeeCap } from '../../utils/legalFeeCap';
import { PROPERTY_STATUS_VARIANT } from '../../utils/statusStyle';

/** 입찰 수수료(%)로 받아들이는 최댓값. 만원 단위 숫자를 잘못 넣는 실수를 걸러낸다 */
const MAX_BID_RATE = 10;

const REPORT_REASONS: ReportReason[] = ['FAKE_PROPERTY', 'SOLD_OUT', 'PRICE_MISMATCH', 'INFO_MISMATCH', 'OTHER'];

const BUILDING_STATUS: Record<
  BuildingInformationStatus,
  { label: string; description: string; badge: 'default' | 'primary' | 'danger' }
> = {
  NOT_COLLECTED: {
    label: '수집 대기',
    description: '아직 건축물 정보를 수집하지 않았어요.',
    badge: 'default',
  },
  PENDING: {
    label: '수집 대기',
    description: '건축물 정보 자동 수집을 기다리고 있어요.',
    badge: 'primary',
  },
  PROCESSING: {
    label: '수집 중',
    description: '공공데이터에서 건축물 정보를 확인하고 있어요.',
    badge: 'primary',
  },
  PARTIAL: {
    label: '일부 정보 수집',
    description: '확인 가능한 건축물 정보를 먼저 반영했어요.',
    badge: 'default',
  },
  RESOLVED: {
    label: '수집 완료',
    description: '건축물 정보 수집을 완료했어요.',
    badge: 'primary',
  },
  FAILED: {
    label: '수집 실패',
    description: '건축물 정보를 불러오지 못했어요.',
    badge: 'danger',
  },
};

function displayValue(value: string | number | null, suffix = '') {
  return value === null || value === '' ? '-' : `${value}${suffix}`;
}

interface DetailSectionProps {
  id: string;
  title: string;
  /** 제목 옆에 붙는 요소 (상태 뱃지 등) */
  extra?: ReactNode;
  /** 내용이 자동으로 바뀌는 섹션(스크린리더에 변경을 알린다) */
  live?: boolean;
  /** 맨 위 섹션은 위 구분선이 필요 없다 */
  first?: boolean;
  children: ReactNode;
}

/** 상세 페이지의 섹션 한 덩어리. 섹션 탭(SectionNav)이 id로 찾아 스크롤한다 */
function DetailSection({ id, title, extra, live, first, children }: DetailSectionProps) {
  return (
    <section
      id={id}
      aria-live={live ? 'polite' : undefined}
      className={`scroll-mt-16 pb-10 ${first ? 'pt-8' : 'border-t border-gray-200 pt-10'}`}
    >
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}

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
  const [buildingInformation, setBuildingInformation] = useState<BuildingInformation | null>(null);
  const [buildingInformationError, setBuildingInformationError] = useState<string | null>(null);
  const [buildingInformationRetrying, setBuildingInformationRetrying] = useState(false);
  const [buildingInformationPollingVersion, setBuildingInformationPollingVersion] = useState(0);
  const [aiEvaluation, setAiEvaluation] = useState<AiEvaluation | null>(null);
  const [aiEvaluationLoading, setAiEvaluationLoading] = useState(true);
  const [aiEvaluationError, setAiEvaluationError] = useState<string | null>(null);
  const [aiEvaluationVersion, setAiEvaluationVersion] = useState(0);
  const [pricePrediction, setPricePrediction] = useState<PropertyPricePrediction | null>(null);
  const [pricePredictionLoading, setPricePredictionLoading] = useState(true);
  const [pricePredictionError, setPricePredictionError] = useState<string | null>(null);
  const [pricePredictionVersion, setPricePredictionVersion] = useState(0);
  const buildingInformationResolveRequestId = useRef(0);
  const buildingInformationResolveController = useRef<AbortController | null>(null);
  const buildingInformationPropertyId = useRef(id);
  buildingInformationPropertyId.current = id;

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
    setBuildingInformation(null);
    setBuildingInformationError(null);
    setBuildingInformationRetrying(false);

    return () => {
      buildingInformationResolveRequestId.current += 1;
      buildingInformationResolveController.current?.abort();
      buildingInformationResolveController.current = null;
    };
  }, [id]);

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

  useEffect(() => {
    if (!Number.isFinite(id)) return;

    let cancelled = false;
    let pollingTimer: number | undefined;
    let controller: AbortController | undefined;

    const loadBuildingInformation = async () => {
      controller = new AbortController();
      try {
        const data = await fetchBuildingInformation(id, controller.signal);
        if (cancelled) return;

        setBuildingInformation(data);
        setBuildingInformationError(null);

        if (data.status === 'PENDING' || data.status === 'PROCESSING') {
          pollingTimer = window.setTimeout(loadBuildingInformation, 2000);
        }
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return;
        setBuildingInformationError(
          err instanceof ApiError ? err.message : '건축물 정보 상태를 확인하지 못했어요.',
        );
      }
    };

    void loadBuildingInformation();

    return () => {
      cancelled = true;
      controller?.abort();
      if (pollingTimer !== undefined) window.clearTimeout(pollingTimer);
    };
  }, [id, buildingInformationPollingVersion]);

  useEffect(() => {
    if (!Number.isFinite(id)) return;

    const controller = new AbortController();
    setAiEvaluationLoading(true);
    setAiEvaluationError(null);

    fetchAiEvaluation(id, controller.signal)
      .then(setAiEvaluation)
      .catch((err) => {
        if (controller.signal.aborted) return;
        setAiEvaluationError(err instanceof ApiError ? err.message : 'AI 다면평가를 불러오지 못했어요.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setAiEvaluationLoading(false);
      });

    return () => controller.abort();
  }, [id, aiEvaluationVersion]);

  useEffect(() => {
    if (!Number.isFinite(id)) return;

    const controller = new AbortController();
    setPricePrediction(null);
    setPricePredictionLoading(true);
    setPricePredictionError(null);

    fetchPricePrediction(id, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setPricePrediction(result);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setPricePredictionError(err instanceof ApiError ? err.message : '가격 예측 정보를 불러오지 못했어요.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setPricePredictionLoading(false);
      });

    return () => controller.abort();
  }, [id, pricePredictionVersion]);

  const handleResolveBuildingInformation = async () => {
    buildingInformationResolveController.current?.abort();
    const controller = new AbortController();
    const requestId = ++buildingInformationResolveRequestId.current;
    buildingInformationResolveController.current = controller;
    const isCurrentRequest = () => (
      buildingInformationResolveRequestId.current === requestId && buildingInformationPropertyId.current === id
    );

    setBuildingInformationRetrying(true);
    setBuildingInformationError(null);
    try {
      const result = await resolveBuildingInformation(id, controller.signal);
      if (!isCurrentRequest()) return;

      setBuildingInformation(result);
      if (result.status === 'PENDING' || result.status === 'PROCESSING') {
        setBuildingInformationPollingVersion((version) => version + 1);
      }
    } catch (err) {
      if (!isCurrentRequest() || controller.signal.aborted) return;

      setBuildingInformationError(
        err instanceof ApiError ? err.message : '건축물 정보 재수집에 실패했어요.',
      );
    } finally {
      if (isCurrentRequest()) {
        buildingInformationResolveController.current = null;
        setBuildingInformationRetrying(false);
      }
    }
  };

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
    if (!fee || fee <= 0 || fee > MAX_BID_RATE) {
      setBidMessage('희망 수수료는 % 단위로 입력해주세요. 예: 0.4');
      return;
    }
    const cap = property ? legalFeeCap(property) : null;
    if (cap && checkProposedRate(cap, fee).exceeds) {
      const proceed = window.confirm(
        '입력한 수수료가 법정 상한을 넘어요. 상한을 넘는 금액은 받을 수 없어요. 그래도 제출할까요?',
      );
      if (!proceed) return;
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

  const isAgentViewer = isLoggedIn() && user?.role === 'AGENT' && !isOwner;
  const showMaintenance = (property.maintenanceFee ?? 0) > 0 || (property.maintenanceItems?.length ?? 0) > 0;
  const sections = [
    { id: 'overview', label: '매물 정보' },
    { id: 'analysis', label: 'AI 분석·시세' },
    { id: 'building', label: '건축물 정보' },
    { id: 'infra', label: '주변 인프라' },
    ...(showMaintenance ? [{ id: 'maintenance', label: '관리비' }] : []),
  ];

  return (
    <PageShell>
      <button type="button" onClick={() => navigate('/search')} className="mb-4 text-[13px] font-medium text-gray-500 hover:text-primary">
        ← 목록으로
      </button>

      <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-3">
          {property.imageUrls.length > 0 ? (
            <>
              <img
                className="aspect-16/10 w-full rounded-card bg-gray-100 object-cover"
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
            <div className="flex aspect-16/10 items-center justify-center rounded-card bg-gray-100 text-sm text-gray-400">
              사진 준비 중
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4 lg:row-span-2 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto lg:[scrollbar-width:thin]">
          <Card className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {property.isSuspicious && <Badge variant="danger">! 의심 매물</Badge>}
                <Badge>{PROPERTY_TYPE_LABEL[property.propertyType]}</Badge>
                {property.status !== 'AVAILABLE' && (
                  <Badge variant={PROPERTY_STATUS_VARIANT[property.status]}>{PROPERTY_STATUS_LABEL[property.status]}</Badge>
                )}
              </div>
              <h1 className="text-[28px] leading-tight font-bold text-gray-900">{priceLabel}</h1>
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
              <p className="text-[13px] text-gray-500">찜 {property.favoriteCount}</p>
            </div>

            <div className="flex flex-col gap-2">
              {isOwner && (
                <Button fullWidth onClick={() => navigate(`/properties/${id}/bids`)}>
                  받은 입찰 보기
                </Button>
              )}
              {isAgentViewer && (
                <Button fullWidth onClick={() => setShowBidForm((prev) => !prev)}>
                  입찰하기
                </Button>
              )}
              <div className="flex gap-2 [&>*]:flex-1">
                {isLoggedIn() && (
                  <Button variant="secondary" onClick={handleToggleFavorite}>
                    {favorited ? '♥ 찜 취소' : '♡ 찜하기'}
                  </Button>
                )}
                <CompareToggleButton item={{ propertyId: id, title: property.title }} />
              </div>
              {isOwner && (
                <div className="flex gap-2 [&>*]:flex-1">
                  <Button variant="secondary" onClick={() => navigate(`/properties/${id}/edit`)}>
                    매물 수정
                  </Button>
                  <Button variant="secondary" onClick={handleDelete}>
                    매물 삭제
                  </Button>
                </div>
              )}
            </div>
            {favoriteMessage && <HelperText>{favoriteMessage}</HelperText>}

            <div className="border-t border-gray-100 pt-4">
              <p className="mb-2 text-xs font-medium text-gray-500">이 매물로 계산해보기</p>
              <div className="flex flex-wrap gap-2">
                {property.tradeType !== 'SALE' && (
                  <Button
                    variant="secondary"
                    className="!px-3 !py-2 !text-[13px]"
                    onClick={() =>
                      navigate(
                        property.tradeType === 'JEONSE'
                          ? `/calculator?tab=compare&jeonse=${property.deposit}`
                          : `/calculator?tab=compare&deposit=${property.deposit}&rent=${property.monthlyRent}`,
                      )
                    }
                  >
                    🧮 전세·월세 계산
                  </Button>
                )}
                <Button
                  variant="secondary"
                  className="!px-3 !py-2 !text-[13px]"
                  onClick={() => navigate(commissionCalculatorPath(property))}
                >
                  🧾 중개보수 계산
                </Button>
                {property.tradeType === 'SALE' && (
                  <Button
                    variant="secondary"
                    className="!px-3 !py-2 !text-[13px]"
                    onClick={() => navigate(`/calculator?tab=acquisition&price=${property.deposit}`)}
                  >
                    🏛 취득세 계산
                  </Button>
                )}
              </div>
            </div>

            {isLoggedIn() && (
              <button
                type="button"
                onClick={() => setShowReportForm((prev) => !prev)}
                className="self-start text-xs text-gray-500 underline hover:text-danger"
              >
                이 매물 신고하기
              </button>
            )}
          </Card>

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

          {isAgentViewer && (
            <LegalFeeCapCard property={property} proposedRate={showBidForm ? Number(proposedFee) : undefined} />
          )}

          {showBidForm && (
            <Card className="flex flex-col gap-4">
              <Field>
                <Label>희망 중개 수수료 (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={proposedFee}
                  onChange={(event) => setProposedFee(event.target.value)}
                  placeholder="예: 0.4"
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

          <RealtorContactCard propertyId={id} />
          {isOwner && (
            <PropertyStatusManager
              propertyId={id}
              status={property.status}
              onChanged={(status) => setProperty((prev) => (prev ? { ...prev, status } : prev))}
            />
          )}
        </aside>

        <div className="min-w-0">
          <SectionNav items={sections} />

          <DetailSection id="overview" title="매물 정보" first>
            <PropertyOverview property={property} />

            {property.description && (
              <>
                <h3 className="mt-8 mb-3 text-[17px] font-bold text-gray-900">상세 설명</h3>
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-gray-900">{property.description}</p>
              </>
            )}

            {property.options.length > 0 && (
              <>
                <h3 className="mt-8 mb-3 text-[17px] font-bold text-gray-900">옵션</h3>
                <ul className="flex flex-wrap gap-2">
                  {property.options.map((option) => (
                    <li key={option}>
                      <Badge>{PROPERTY_OPTION_LABEL[option]}</Badge>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </DetailSection>

          <DetailSection id="analysis" title="AI 분석 · 시세">
            <div className="flex flex-col gap-4">
              <AiEvaluationSummaryCard
                evaluation={property.propertyId === id && aiEvaluation?.propertyId === id ? aiEvaluation : null}
                loading={aiEvaluationLoading}
                error={aiEvaluationError}
                onRetry={() => setAiEvaluationVersion((version) => version + 1)}
                onDetails={() => navigate(`/properties/${id}/ai-report`)}
              />
              <PricePredictionCard
                prediction={property.propertyId === id && pricePrediction?.propertyId === id ? pricePrediction : null}
                loading={pricePredictionLoading}
                error={pricePredictionError}
                onRetry={() => setPricePredictionVersion((version) => version + 1)}
              />
            </div>
          </DetailSection>

          <DetailSection
            id="building"
            title="건축물 정보"
            live
            extra={
              buildingInformation && (
                <Badge variant={BUILDING_STATUS[buildingInformation.status].badge}>
                  {BUILDING_STATUS[buildingInformation.status].label}
                </Badge>
              )
            }
          >
            {!buildingInformation && !buildingInformationError && (
              <p className="text-sm text-gray-500">건축물 정보 상태를 확인하는 중...</p>
            )}

            {buildingInformation && (
              <Card className="flex flex-col gap-5">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {BUILDING_STATUS[buildingInformation.status].description}
                  </p>
                  {(buildingInformation.status === 'PENDING' || buildingInformation.status === 'PROCESSING') && (
                    <p className="mt-1 text-xs text-gray-500">완료될 때까지 이 화면에서 자동으로 상태를 갱신합니다.</p>
                  )}
                  {buildingInformation.status === 'FAILED' && buildingInformation.lastErrorMessage && (
                    <p className="mt-1 text-sm text-danger">{buildingInformation.lastErrorMessage}</p>
                  )}
                </div>

                {(buildingInformation.status === 'RESOLVED' || buildingInformation.status === 'PARTIAL') && (
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                    {[
                      ['건축연도', displayValue(buildingInformation.buildingYear, '년')],
                      ['사용승인일', displayValue(buildingInformation.approvalDate)],
                      ['세대 수', displayValue(buildingInformation.householdCount, '세대')],
                      ['건물 동 수', displayValue(buildingInformation.buildingCount, '동')],
                      ['지상/지하층', `${displayValue(buildingInformation.groundFloorCount, '층')} / ${displayValue(buildingInformation.undergroundFloorCount, '층')}`],
                      ['엘리베이터', displayValue(buildingInformation.elevatorCount, '대')],
                      ['주차', displayValue(buildingInformation.parkingCount, '대')],
                      ['난방/복도', `${displayValue(buildingInformation.heatingType)} / ${displayValue(buildingInformation.corridorType)}`],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs text-gray-500">{label}</dt>
                        <dd className="mt-1 text-sm font-medium text-gray-900">{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {isOwner && (buildingInformation.status === 'FAILED' || buildingInformation.status === 'NOT_COLLECTED') && (
                  <div>
                    <Button
                      variant="secondary"
                      onClick={handleResolveBuildingInformation}
                      disabled={buildingInformationRetrying}
                    >
                      {buildingInformationRetrying ? '다시 수집 중...' : '건축물 정보 다시 수집'}
                    </Button>
                    {buildingInformation.retryCount !== null && buildingInformation.retryCount > 0 && (
                      <p className="mt-2 text-xs text-gray-500">현재 주소에서 {buildingInformation.retryCount}회 시도했어요.</p>
                    )}
                  </div>
                )}
              </Card>
            )}

            {buildingInformationError && (
              <p className="mt-3 rounded-button bg-red-50 p-3 text-sm font-medium text-danger">
                {buildingInformationError}
              </p>
            )}
          </DetailSection>

          <DetailSection id="infra" title="주변 인프라">
            <InfrastructureCard latitude={property.latitude} longitude={property.longitude} />
          </DetailSection>

          {showMaintenance && (
            <DetailSection id="maintenance" title="관리비 상세">
              <MaintenanceFeeCard maintenanceFee={property.maintenanceFee} items={property.maintenanceItems} />
            </DetailSection>
          )}
        </div>
      </div>
    </PageShell>
  );
}

export default PropertyDetailPage;
