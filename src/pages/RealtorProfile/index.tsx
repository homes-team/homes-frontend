import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Field, Label, Textarea, HelperText } from '../../components/ui/Field';
import { StarRating, StarRatingInput } from '../../components/ui/StarRating';
import { createRealtorReview, fetchRealtorPublicProfile, fetchRealtorReviews } from '../../api/realtor/realtorApi';
import { ApiError } from '../../api/client';
import { getCurrentUser } from '../../utils/auth';
import { formatRelativeTime } from '../../utils/format';
import { RealtorPublicProfile, ReviewListItem } from '../../types/realtor';

function RealtorProfilePage() {
  const { realtorId } = useParams<{ realtorId: string }>();
  const id = Number(realtorId);
  const user = getCurrentUser();

  const [profile, setProfile] = useState<RealtorPublicProfile | null>(null);
  const [reviews, setReviews] = useState<ReviewListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [score, setScore] = useState<number | null>(null);
  const [content, setContent] = useState('');
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  /** 이번에 리뷰를 남겼으면 폼을 닫는다 (중개사당 한 번만 쓸 수 있다) */
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    Promise.all([fetchRealtorPublicProfile(id), fetchRealtorReviews(id)])
      .then(([profileData, reviewsData]) => {
        setProfile(profileData);
        setReviews(reviewsData);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (score === null) {
      setReviewMessage('별을 눌러 평점을 골라주세요.');
      return;
    }
    setReviewMessage(null);
    setReviewSubmitting(true);
    try {
      await createRealtorReview(id, { score, content: content.trim() || undefined });
    } catch (err) {
      setReviewMessage(err instanceof ApiError ? err.message : '리뷰 등록에 실패했어요.');
      setReviewSubmitting(false);
      return;
    }

    setReviewed(true);
    setReviewSubmitting(false);
    // 리뷰는 이미 저장됐다. 평균 평점도 바뀌었으니 다시 불러오되, 실패해도 등록 실패로 보이지 않게 한다
    try {
      const [updatedProfile, updatedReviews] = await Promise.all([fetchRealtorPublicProfile(id), fetchRealtorReviews(id)]);
      setProfile(updatedProfile);
      setReviews(updatedReviews);
    } catch {
      // 새로고침하면 반영된다
    }
  };

  return (
    <PageShell>
      {loading && <p className="py-12 text-center text-sm text-gray-500">불러오는 중...</p>}
      {!loading && error && <p className="rounded-button bg-red-50 p-4 text-sm font-medium text-danger">{error}</p>}

      {!loading && profile && (
        <div className="flex flex-col gap-6">
          <Card>
            <h1 className="mb-2 text-xl font-bold text-gray-900">{profile.officeName}</h1>
            <p className="mb-2 text-gray-500">{profile.officeAddress ?? '주소 미등록'}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>성사율 {profile.successRate !== null ? `${Math.round(profile.successRate * 100)}%` : '-'}</Badge>
              {profile.averageReviewScore !== null ? (
                <StarRating score={profile.averageReviewScore} count={profile.reviewCount} />
              ) : (
                <Badge>아직 받은 평점이 없어요</Badge>
              )}
              {profile.isVerified && <Badge variant="primary">인증된 중개사</Badge>}
            </div>
          </Card>

          {user?.role === 'USER' && (
            <Card>
              {reviewed ? (
                <p role="status" className="text-sm font-medium text-success-dark">
                  리뷰를 등록했어요. 소중한 평가 고마워요!
                </p>
              ) : (
                <form className="flex flex-col gap-5" onSubmit={handleSubmitReview}>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-bold text-gray-900">리뷰 작성</h2>
                    <HelperText>이 중개사와 매칭된 적이 있는 집주인만 남길 수 있고, 한 중개사에게 한 번만 쓸 수 있어요.</HelperText>
                  </div>
                  <Field>
                    <p className="text-[13px] font-medium text-gray-900">평점</p>
                    <StarRatingInput
                      value={score}
                      onChange={(point) => {
                        setScore(point);
                        setReviewMessage(null);
                      }}
                    />
                  </Field>
                  <Field>
                    <Label htmlFor="review-content">내용 (선택)</Label>
                    <Textarea
                      id="review-content"
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      maxLength={500}
                    />
                  </Field>
                  <Button type="submit" disabled={reviewSubmitting}>
                    {reviewSubmitting ? '등록 중...' : '리뷰 등록'}
                  </Button>
                  {reviewMessage && (
                    <p role="alert" className="text-[13px] font-medium text-danger">
                      {reviewMessage}
                    </p>
                  )}
                </form>
              )}
            </Card>
          )}

          <div>
            <h2 className="mb-4 text-xl font-bold text-gray-900">리뷰 ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-500">아직 리뷰가 없어요.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {reviews.map((review) => (
                  <Card key={review.reviewId}>
                    <div className="flex items-center justify-between">
                      <StarRating score={review.score} />
                      <span className="text-[13px] text-gray-400">{formatRelativeTime(review.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-[13px] text-gray-600">{review.reviewerNickname}</p>
                    {review.content && <p className="mt-2">{review.content}</p>}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}

export default RealtorProfilePage;
