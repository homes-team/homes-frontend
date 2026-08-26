import { Link } from 'react-router-dom';
import styles from './Header.module.css';

const NAV_ITEMS = ['원룸·투룸', '오피스텔', '아파트', '대출계산기'] as const;

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoMark} aria-hidden="true" />
          <span className={styles.logoText}>홈즈</span>
        </Link>
        <nav className={styles.nav} aria-label="주요 메뉴">
          {NAV_ITEMS.map((item) => (
            <Link key={item} to="/" className={styles.navItem}>
              {item}
            </Link>
          ))}
          <Link to="/" className={`${styles.navItem} ${styles.navItemAccent}`}>
            AI 집값 예측
          </Link>
        </nav>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.searchMini}>
          어떤 동네, 어떤 방을 찾으세요?
        </button>
        <Link to="/login" className={styles.login}>
          로그인
        </Link>
        <button type="button" className={styles.listButton}>
          방 내놓기
        </button>
      </div>
    </header>
  );
}

export default Header;
