import AuthLayout from '../components/auth/AuthLayout';
import formStyles from '../components/auth/AuthForm.module.css';
import styles from './SignupPage.module.css';

/**
 * 회원가입 유형 선택 화면 (Figma `/sign_up`).
 * "일반 사용자"는 실제 가입 마법사(/signup/user)로 연결된다.
 * "공인 중개사"는 /signup/realtor로 연결해뒀지만, 아직 해당 페이지와
 * RealtorService 연동 마법사가 구현되지 않아 현재는 라우팅이 홈으로 폴백된다.
 * (사업자 서류 업로드 등 별도의 멀티파트 플로우가 필요해 다음 작업으로 예정)
 */
function SignupPage() {
  return (
    <AuthLayout title="회원가입">
      <div className={formStyles.form}>
        <div className={formStyles.intro} style={{ marginBottom: 0 }}>
          <h2 className={formStyles.introTitle}>어떤 분이신가요?</h2>
          <p className={formStyles.introSubtitle}>서비스 유형을 선택하면 맞춤 가입 절차가 시작됩니다</p>
        </div>

        <div className={styles.cardRow}>
          <a href="/signup/user" className={styles.roleCard}>
            <span className={`${styles.roleIcon} ${styles.roleIconUser}`} aria-hidden="true">
              👤
            </span>
            <span className={styles.roleTitle}>일반 사용자</span>
            <span className={styles.roleDesc}>집을 찾거나 내놓고 싶어요</span>
          </a>

          <a href="/signup/realtor" className={styles.roleCard}>
            <span className={`${styles.roleIcon} ${styles.roleIconAgent}`} aria-hidden="true">
              🏢
            </span>
            <span className={styles.roleTitle}>공인 중개사</span>
            <span className={styles.roleDesc}>매물을 관리하고 중개하고 싶어요</span>
          </a>
        </div>
      </div>
    </AuthLayout>
  );
}

export default SignupPage;
