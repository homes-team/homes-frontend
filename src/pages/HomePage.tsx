import { useMemo } from 'react';
import { isLoggedIn } from '../api/client';
import { fetchAllProperties, fetchSurgeRankings } from '../api/propertyApi';
import { fetchMyRecentViews } from '../api/userApi';
import { useFetch } from '../hooks/useFetch';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/home/HeroSection';
import AiBanner from '../components/home/AiBanner';
import PropertySection from '../components/home/PropertySection';
import styles from './HomePage.module.css';

const SECTION_CARD_COUNT = 4;

function HomePage() {
  const loggedIn = useMemo(() => isLoggedIn(), []);

  // 백엔드 보안 설정상 급상승 API는 인증이 필요하므로 비로그인 시 공개 목록을 사용한다.
  const popular = useFetch(loggedIn ? fetchSurgeRankings : fetchAllProperties);
  const recent = useFetch(fetchAllProperties);
  const recentViews = useFetch(fetchMyRecentViews, loggedIn);

  return (
    <div className={styles.page}>
      <Header />
      <main>
        <HeroSection />

        <div className={styles.content}>
          <PropertySection
            title="실시간 인기 매물"
            subtitle="지금 가장 조회수가 급상승 중인 방이에요"
            properties={(popular.data ?? []).slice(0, SECTION_CARD_COUNT)}
            loading={popular.loading}
            error={popular.error}
            emptyMessage="아직 급상승 중인 매물이 없어요."
          />

          <AiBanner />

          <PropertySection
            title="최근 등록 매물"
            subtitle="방금 올라온 따끈따끈한 새 매물이에요"
            properties={(recent.data ?? []).slice(0, SECTION_CARD_COUNT)}
            loading={recent.loading}
            error={recent.error}
            emptyMessage="등록된 매물이 없어요."
          />

          {loggedIn && (
            <PropertySection
              title="최근 본 방"
              moreLabel="전체 보기 >"
              properties={(recentViews.data ?? []).slice(0, SECTION_CARD_COUNT)}
              loading={recentViews.loading}
              error={recentViews.error}
              emptyMessage="최근에 본 방이 없어요. 마음에 드는 방을 둘러보세요!"
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default HomePage;
