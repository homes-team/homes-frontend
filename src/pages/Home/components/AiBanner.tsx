const BAR_HEIGHTS = [44, 52, 48, 62, 74, 92] as const;

function AiBanner() {
  return (
    <section className="mx-auto w-full max-w-[1280px] px-0 py-10 pb-2">
      <div className="flex flex-row items-center justify-between gap-12 rounded-3xl bg-dark px-14 py-12 max-[900px]:flex-col max-[900px]:items-start">
        <div className="flex flex-col items-start gap-4">
          <span className="text-[13px] font-bold tracking-[0.08em] text-accent">AI PRICE PREDICTION</span>
          <h2 className="text-[32px] leading-[1.4] font-bold text-white">
            이 집, 내년엔 얼마일까?
            <br />
            <span className="text-accent">데이터가 알려주는 미래 가격</span>
          </h2>
          <p className="text-[15px] leading-relaxed text-on-dark-muted">
            수십만 건의 실거래가와 주변 인프라 데이터를 분석해
            <br />
            2030 세대의 합리적인 선택을 돕습니다.
          </p>
          <button type="button" className="rounded-button bg-primary px-6 py-3.5 text-[15px] font-bold text-white hover:bg-primary-dark">
            AI 예측 모델 체험하기
          </button>
        </div>

        <div className="flex shrink-0 flex-col gap-4 rounded-2xl bg-dark-2 px-7 py-6" aria-hidden="true">
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-bold text-white">마포구 연남동 투룸</span>
            <span className="rounded-md bg-success-dark px-2 py-0.5 text-[11px] font-bold text-success-light">상승 예측</span>
          </div>
          <div className="flex items-end gap-2.5">
            {BAR_HEIGHTS.map((height, index) => (
              <span
                key={index}
                className="w-7 rounded bg-primary"
                style={{ height, opacity: 0.45 + index * 0.11 }}
              />
            ))}
          </div>
          <div className="flex justify-between">
            <span className="text-[13px] text-on-dark-subtle">현재 전세가</span>
            <span className="text-[15px] font-bold text-white">2억 5천</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AiBanner;
