import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageShell from '../../components/layout/PageShell';
import MyPageNav from './components/MyPageNav';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Field, Label, Input, HelperText, ErrorText } from '../../components/ui/Field';
import { deleteMyAccount, fetchMyProfile, updateMyPassword, updateMyProfile } from '../../api/user/userApi';
import { verifyIdentity } from '../../api/auth/authApi';
import { ApiError } from '../../api/client';
import { clearTokens, isGoogleLogin } from '../../utils/auth';
import { parseIdentityRedirect, requestIdentityVerification } from '../../utils/identityVerification';
import { UserProfile } from '../../types/auth';

function MyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nickname, setNickname] = useState('');
  const [usagePurpose, setUsagePurpose] = useState('');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const [identityBusy, setIdentityBusy] = useState(false);
  const [identityMessage, setIdentityMessage] = useState<string | null>(null);

  const [withdrawMessage, setWithdrawMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchMyProfile()
      .then((data) => {
        setProfile(data);
        setNickname(data.nickname ?? '');
        setUsagePurpose(data.usagePurpose ?? '');
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileMessage(null);
    try {
      await updateMyProfile({ nickname: nickname.trim() || undefined, usagePurpose: usagePurpose.trim() || undefined });
      setProfileMessage('프로필을 수정했어요.');
    } catch (err) {
      setProfileMessage(err instanceof ApiError ? err.message : '프로필 수정에 실패했어요.');
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordMessage(null);
    try {
      await updateMyPassword({ currentPassword, newPassword });
      setPasswordMessage('비밀번호를 변경했어요.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPasswordMessage(err instanceof ApiError ? err.message : '비밀번호 변경에 실패했어요.');
    }
  };

  const completeIdentity = async (identityVerificationId: string) => {
    const result = await verifyIdentity(identityVerificationId);
    setIdentityMessage(`본인인증이 완료됐어요. (${result.name ?? ''})`);
    setProfile((prev) => (prev ? { ...prev, isIdentityVerified: result.isIdentityVerified, name: result.name } : prev));
  };

  const runIdentity = async (start: () => Promise<string | null>) => {
    setIdentityBusy(true);
    setIdentityMessage(null);
    try {
      const identityVerificationId = await start();
      if (identityVerificationId) await completeIdentity(identityVerificationId);
    } catch (err) {
      setIdentityMessage(err instanceof Error ? err.message : '본인인증에 실패했어요.');
    } finally {
      setIdentityBusy(false);
    }
  };

  const handleIdentityStart = () => runIdentity(requestIdentityVerification);

  // 팝업이 막히는 환경(모바일 등)에서는 인증 후 이 페이지로 되돌아오므로 쿼리의 결과를 이어서 처리한다
  useEffect(() => {
    const redirected = parseIdentityRedirect(location.search);
    if (!redirected) return;
    navigate(location.pathname, { replace: true });
    void runIdentity(async () => {
      if (redirected.status === 'failure') throw new Error(redirected.message);
      return redirected.identityVerificationId;
    });
  }, []);

  const handleWithdraw = async () => {
    if (!window.confirm('정말 탈퇴하시겠어요? 등록된 매물이 있으면 탈퇴할 수 없어요.')) return;
    setWithdrawMessage(null);
    try {
      await deleteMyAccount();
      clearTokens();
      navigate('/');
    } catch (err) {
      setWithdrawMessage(err instanceof ApiError ? err.message : '탈퇴에 실패했어요.');
    }
  };

  // 소셜(구글) 계정은 비밀번호를 직접 정한 적이 없어서 변경할 수 없다
  const isSocialAccount = (profile?.provider !== undefined && profile.provider !== 'SELF') || isGoogleLogin();

  return (
    <PageShell>
      <h1 className="mb-4 text-xl font-bold text-gray-900">마이페이지</h1>
      <MyPageNav />

      {loading && <p className="py-12 text-center text-sm text-gray-500">불러오는 중...</p>}
      {!loading && error && <p className="rounded-button bg-red-50 p-4 text-sm font-medium text-danger">{error}</p>}

      {!loading && profile && (
        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex flex-col gap-3 rounded-[10px] bg-gray-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">이메일</span>
                <span className="font-bold text-gray-900">{profile.email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">실명</span>
                <span className="font-bold text-gray-900">{profile.name ?? '미인증'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">본인인증</span>
                <span className="font-bold text-gray-900">{profile.isIdentityVerified ? '완료' : '미완료'}</span>
              </div>
            </div>
            {!profile.isIdentityVerified && (
              <div className="mt-4 flex flex-col gap-3">
                <p className="text-xs text-gray-500">휴대폰으로 본인인증을 하면 실명이 등록되고 서비스 신뢰도가 올라가요.</p>
                <Button onClick={handleIdentityStart} disabled={identityBusy}>
                  {identityBusy ? '인증 확인 중...' : '본인인증 하기'}
                </Button>
              </div>
            )}
            {identityMessage && <HelperText>{identityMessage}</HelperText>}
          </Card>

          <Card>
            <form className="flex flex-col gap-5" onSubmit={handleProfileSubmit}>
              <h2 className="text-lg font-bold text-gray-900">닉네임 · 이용 목적</h2>
              <Field>
                <Label htmlFor="nickname">닉네임</Label>
                <Input id="nickname" value={nickname} onChange={(event) => setNickname(event.target.value)} />
              </Field>
              <Field>
                <Label htmlFor="usagePurpose">이용 목적</Label>
                <Input
                  id="usagePurpose"
                  placeholder="예: 전세, 투자"
                  value={usagePurpose}
                  onChange={(event) => setUsagePurpose(event.target.value)}
                />
              </Field>
              <Button type="submit">저장</Button>
              {profileMessage && <HelperText>{profileMessage}</HelperText>}
            </form>
          </Card>

          {!isSocialAccount && (
            <Card>
              <form className="flex flex-col gap-5" onSubmit={handlePasswordSubmit}>
                <h2 className="text-lg font-bold text-gray-900">비밀번호 변경</h2>
                <Field>
                  <Label htmlFor="currentPassword">현재 비밀번호</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <Label htmlFor="newPassword">새 비밀번호</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                  />
                </Field>
                <Button type="submit">비밀번호 변경</Button>
                {passwordMessage && <HelperText>{passwordMessage}</HelperText>}
              </form>
            </Card>
          )}

          <Card>
            <h2 className="text-lg font-bold text-gray-900">회원 탈퇴</h2>
            <p className="mt-1 mb-4 text-xs text-gray-500">
              등록된 매물이 있으면 탈퇴할 수 없어요. 먼저 매물을 삭제해주세요.
            </p>
            <Button variant="secondary" onClick={handleWithdraw}>
              탈퇴하기
            </Button>
            {withdrawMessage && <ErrorText>{withdrawMessage}</ErrorText>}
          </Card>
        </div>
      )}
    </PageShell>
  );
}

export default MyPage;
