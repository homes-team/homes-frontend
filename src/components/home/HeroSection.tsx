import { FormEvent, useState } from 'react';
import styles from './HeroSection.module.css';

function HeroSection() {
  const [keyword, setKeyword] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: 검색 페이지 라우팅 연결 (예: /search?keyword=...)
  };

  return (
    <section className={styles.hero}>
      <span className={styles.badge}>2030을 위한 AI 집값 예측 서비스, 홈즈</span>
      <h1 className={styles.headline}>
        어떤 동네,
        <br />
        어떤 방을 구하세요?
      </h1>
      <form className={styles.searchBar} onSubmit={handleSubmit} role="search">
        <svg
          className={styles.searchIcon}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="10.5" cy="10.5" r="7" />
          <line x1="16" y1="16" x2="21" y2="21" />
        </svg>
        <input
          className={styles.input}
          type="text"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="원하는 지역명, 지하철역, 단지명을 입력해주세요"
          aria-label="매물 검색어"
        />
        <button type="submit" className={styles.submit}>
          방 찾기
        </button>
      </form>
    </section>
  );
}

export default HeroSection;
