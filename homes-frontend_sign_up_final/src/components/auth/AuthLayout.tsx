import { ReactNode } from 'react';
import styles from './AuthLayout.module.css';

export interface AuthStep {
  label: string;
  status: 'done' | 'active' | 'upcoming';
}

interface AuthLayoutProps {
  /** 모달 상단바에 표시할 제목 (예: "로그인", "아이디 찾기") */
  title: string;
  /** 우측 상단 "회원가입" 링크 노출 여부 (로그인 화면에서만 true) */
  showSignupLink?: boolean;
  /** 회원가입 마법사에서만 사용하는 단계 인디케이터 (1-2-3-4) */
  steps?: AuthStep[];
  children: ReactNode;
}

/**
 * 로그인 / 아이디 찾기 / 비밀번호 찾기 / 회원가입 화면이 공유하는 모달형 레이아웃.
 * Figma WireFrame 페이지의 `/login`, `/sign_up` AuthModal 컨벤션을 그대로 따른다.
 */
function AuthLayout({ title, showSignupLink = false, steps, children }: AuthLayoutProps) {
  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <a href="/" className={styles.logo}>
          <span className={styles.logoMark} aria-hidden="true" />
          <span className={styles.logoText}>홈즈</span>
        </a>
      </header>

      <main className={styles.center}>
        <div className={styles.modal}>
          <div className={styles.topBar}>
            <h1 className={styles.topBarTitle}>{title}</h1>
            <div className={styles.topBarActions}>
              {showSignupLink && (
                <a href="/signup" className={styles.signupLinkSmall}>
                  회원가입
                </a>
              )}
              <a href="/" className={styles.closeButton} aria-label="닫기">
                ✕
              </a>
            </div>
          </div>

          {steps && (
            <div className={styles.stepper}>
              {steps.map((step, index) => (
                <div key={step.label} className={styles.stepItem}>
                  <div className={styles.stepRow}>
                    <span
                      className={`${styles.stepDot} ${
                        step.status === 'done'
                          ? styles.stepDotDone
                          : step.status === 'active'
                            ? styles.stepDotActive
                            : styles.stepDotUpcoming
                      }`}
                    >
                      {step.status === 'done' ? '✓' : index + 1}
                    </span>
                    {index < steps.length - 1 && (
                      <span
                        className={`${styles.stepLine} ${
                          step.status === 'done' ? styles.stepLineDone : ''
                        }`}
                      />
                    )}
                  </div>
                  {step.status === 'active' && <span className={styles.stepLabel}>{step.label}</span>}
                </div>
              ))}
            </div>
          )}

          <div className={styles.topBarDivider} />

          {children}
        </div>
      </main>
    </div>
  );
}

export default AuthLayout;
