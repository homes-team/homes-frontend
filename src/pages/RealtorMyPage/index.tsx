import { FormEvent, useEffect, useState } from 'react';
import PageShell from '../../components/layout/PageShell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Field, Label, Input, HelperText } from '../../components/ui/Field';
import NearbyPropertyRow from './components/NearbyPropertyRow';
import {
  fetchAgentDashboardStats,
  fetchAvailableBidProperties,
  fetchMyAgentProfile,
  fetchNearbyProperties,
  updateMyAgentProfile,
} from '../../api/realtor/realtorApi';
import { ApiError } from '../../api/client';
import { PROPERTY_TYPE_LABEL } from '../../types/property';
import { AgentDashboardStats, AgentProfile, NearbyProperty } from '../../types/realtor';

function RealtorMyPage() {
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [stats, setStats] = useState<AgentDashboardStats | null>(null);
  const [nearby, setNearby] = useState<NearbyProperty[]>([]);
  const [available, setAvailable] = useState<NearbyProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [officeName, setOfficeName] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchMyAgentProfile()
      .then((data) => {
        setProfile(data);
        setOfficeName(data.officeName);
        setOfficeAddress(data.officeAddress ?? '');
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));

    fetchAgentDashboardStats().then(setStats).catch(() => undefined);
    fetchNearbyProperties().then(setNearby).catch(() => undefined);
    fetchAvailableBidProperties().then(setAvailable).catch(() => undefined);
  }, []);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileMessage(null);
    try {
      const updated = await updateMyAgentProfile({
        officeName: officeName.trim() || undefined,
        officeAddress: officeAddress.trim() || undefined,
      });
      setProfile(updated);
      setProfileMessage('중개사무소 정보를 수정했어요.');
    } catch (err) {
      setProfileMessage(err instanceof ApiError ? err.message : '수정에 실패했어요.');
    }
  };

  return (
    <PageShell>
      <h1 className="mb-4 text-xl font-bold text-gray-900">중개사 마이페이지</h1>

      {loading && <p className="py-12 text-center text-sm text-gray-500">불러오는 중...</p>}
      {!loading && error && <p className="rounded-button bg-red-50 p-4 text-sm font-medium text-danger">{error}</p>}

      {!loading && profile && (
        <div className="flex flex-col gap-6">
          <Card>
            <div className="flex flex-col gap-3 rounded-[10px] bg-gray-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">이메일</span>
                <span className="font-bold text-gray-900">{profile.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">승인 상태</span>
                <span className="font-bold text-gray-900">{profile.isVerified ? '승인 완료' : '승인 대기 중'}</span>
              </div>
            </div>
          </Card>

          {stats && (
            <Card>
              <h2 className="mb-3 text-lg font-bold text-gray-900">이번 달 통계</h2>
              <p>이번 달 거래 완료 {stats.thisMonthCompletedDealsCount}건</p>
              {stats.averageFeesByPropertyType.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1">
                  {stats.averageFeesByPropertyType.map((row) => (
                    <li key={row.propertyType} className="text-[13px] text-gray-600">
                      {PROPERTY_TYPE_LABEL[row.propertyType]} 평균 확정 수수료 {row.averageFee.toLocaleString()}만원
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          <Card>
            <form className="flex flex-col gap-5" onSubmit={handleProfileSubmit}>
              <h2 className="text-lg font-bold text-gray-900">중개사무소 정보</h2>
              <Field>
                <Label htmlFor="officeName">사무소 상호</Label>
                <Input id="officeName" value={officeName} onChange={(event) => setOfficeName(event.target.value)} />
              </Field>
              <Field>
                <Label htmlFor="officeAddress">사무소 주소</Label>
                <Input
                  id="officeAddress"
                  value={officeAddress}
                  onChange={(event) => setOfficeAddress(event.target.value)}
                />
                <HelperText>좌표(위도/경도)를 등록해야 "근처 매물"·"입찰 가능 매물" 목록이 채워져요.</HelperText>
              </Field>
              <Button type="submit">저장</Button>
              {profileMessage && <HelperText>{profileMessage}</HelperText>}
            </form>
          </Card>

          <div>
            <h2 className="mb-4 text-xl font-bold text-gray-900">사무소 근처 매물</h2>
            {nearby.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-500">근처 매물이 없어요.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {nearby.map((property) => (
                  <NearbyPropertyRow key={property.propertyId} property={property} />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-4 text-xl font-bold text-gray-900">입찰 가능한 매물</h2>
            {available.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-500">아직 입찰하지 않은 근처 매물이 없어요.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {available.map((property) => (
                  <NearbyPropertyRow key={property.propertyId} property={property} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}

export default RealtorMyPage;
