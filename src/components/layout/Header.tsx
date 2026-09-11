import styles from "./Header.module.css";
import { Link } from "react-router-dom";

const NAV_ITEMS = [
  { label: "원룸·투룸", to: "/search" },
  { label: "오피스텔", to: "/search?propertyType=OFFICETEL" },
  { label: "아파트", to: "/search?propertyType=APARTMENT" },
] as const;

/**
 * 애플리케이션의 헤더 컴포넌트입니다.
 * 로고, 주요 메뉴 네비게이션, 검색 버튼, 로그인 링크, 방 내놓기 버튼을 포함합니다.
 *
 * @returns 헤더 컴포넌트
 */
function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <a href="/" className={styles.logo}>
          <span className={styles.logoMark} aria-hidden="true" />
          <span className={styles.logoText}>홈즈</span>
        </a>
        <nav className={styles.nav} aria-label="주요 메뉴">
          {NAV_ITEMS.map((item) => (
            <Link key={item.label} to={item.to} className={styles.navItem}>
              {item.label}
            </Link>
          ))}
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
