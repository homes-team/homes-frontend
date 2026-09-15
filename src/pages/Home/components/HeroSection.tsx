import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function HeroSection() {
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = new URLSearchParams();
    if (keyword.trim()) query.set('keyword', keyword.trim());
    navigate(`/search${query.size ? `?${query}` : ''}`);
  };

  return (
    <section className="flex flex-col items-center gap-6 bg-primary-hero px-30 py-22 max-md:px-6 max-md:py-16">
      <span className="rounded-pill bg-white/16 px-4.5 py-2 text-sm font-medium text-white">
        2030을 위한 AI 집값 예측 서비스, 홈즈
      </span>
      <h1 className="text-center text-[46px] leading-[1.38] font-black text-white max-md:text-[32px]">
        어떤 동네,
        <br />
        어떤 방을 구하세요?
      </h1>
      <form className="flex w-[min(620px,100%)] items-center gap-3 rounded-pill bg-white py-2 pr-2 pl-6" onSubmit={handleSubmit} role="search">
        <svg
          className="shrink-0 text-gray-400"
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
          className="min-w-0 flex-1 border-none text-base text-gray-900 outline-none placeholder:text-gray-400"
          type="text"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="원하는 지역명, 지하철역, 단지명을 입력해주세요"
          aria-label="매물 검색어"
        />
        <button type="submit" className="shrink-0 rounded-pill bg-primary px-7 py-3 text-base font-bold text-white hover:bg-primary-dark">
          방 찾기
        </button>
      </form>
    </section>
  );
}

export default HeroSection;
