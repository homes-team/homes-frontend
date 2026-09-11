import styles from './AiBanner.module.css';

const BAR_HEIGHTS = [44, 52, 48, 62, 74, 92] as const;

function AiBanner() {
  return (
    <section className={styles.wrapper}>
      <div className={styles.banner}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>AI PRICE PREDICTION</span>
          <h2 className={styles.headline}>
            이 집, 내년엔 얼마일까?
            <br />
            <span className={styles.headlineAccent}>데이터가 알려주는 미래 가격</span>
          </h2>
          <p className={styles.body}>
            수십만 건의 실거래가와 주변 인프라 데이터를 분석해
            <br />
            2030 세대의 합리적인 선택을 돕습니다.
          </p>
          <button type="button" className={styles.cta}>
            AI 예측 모델 체험하기
          </button>
        </div>

        <div className={styles.chartCard} aria-hidden="true">
          <div className={styles.chartHeader}>
            <span className={styles.chartTitle}>마포구 연남동 투룸</span>
            <span className={styles.upBadge}>상승 예측</span>
          </div>
          <div className={styles.bars}>
            {BAR_HEIGHTS.map((height, index) => (
              <span
                key={index}
                className={styles.bar}
                style={{ height, opacity: 0.45 + index * 0.11 }}
              />
            ))}
          </div>
          <div className={styles.chartFooter}>
            <span className={styles.chartLabel}>현재 전세가</span>
            <span className={styles.chartValue}>2억 5천</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AiBanner;
