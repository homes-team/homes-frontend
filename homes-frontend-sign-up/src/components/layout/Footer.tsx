import styles from './Footer.module.css';

/** 홈즈 페이지 하단 푸터 — 브랜드명, 약관 링크 등 */
function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.brand}>홈즈</p>
      <p className={styles.info}>
        수수료 걱정 없는 안전한 부동산 직거래 플랫폼 · 이용약관 · 개인정보처리방침 · 고객센터
      </p>
    </footer>
  );
}

export default Footer;
