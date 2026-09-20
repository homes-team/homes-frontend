import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Field, Label, Input, Textarea, HelperText } from '../../components/ui/Field';
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

  const [score, setScore] = useState('5');
  const [content, setContent] = useState('');
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);

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
    setReviewMessage(null);
    try {
      await createRealtorReview(id, { score: Number(score), content: content.trim() || undefined });
      const updated = await fetchRealtorReviews(id);
      setReviews(updated);
      setContent('');
      setReviewMessage('리뷰를 등록했어요.');
    } catch (err) {
      setReviewMessage(err instanceof ApiError ? err.message : '리뷰 등록에 실패했어요.');
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
              <Badge>
                평균 평점 {profile.averageReviewScore?.toFixed(1) ?? '-'} ({profile.reviewCount}건)
              </Badge>
              {profile.isVerified && <Badge variant="primary">인증된 중개사</Badge>}
            </div>
          </Card>

          {user?.role === 'USER' && (
            <Card>
              <form className="flex flex-col gap-5" onSubmit={handleSubmitReview}>
                <h2 className="text-lg font-bold text-gray-900">리뷰 작성</h2>
                <Field>
                  <Label>평점 (0~5)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={5}
                    step={0.5}
                    value={score}
                    onChange={(event) => setScore(event.target.value)}
                  />
                </Field>
                <Field>
                  <Label>내용 (선택)</Label>
                  <Textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={500} />
                </Field>
                <Button type="submit">리뷰 등록</Button>
                {reviewMessage && <HelperText>{reviewMessage}</HelperText>}
              </form>
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
                      <span className="font-bold">★ {review.score.toFixed(1)}</span>
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
