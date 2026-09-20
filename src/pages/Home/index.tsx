import { useMemo } from 'react';
import { isLoggedIn } from '../../api/client';
import { fetchAllProperties, fetchRecommendedProperties, fetchSurgeRankings } from '../../api/property/propertyApi';
import { fetchMyRecentViews } from '../../api/user/userApi';
import { useFetch } from '../../hooks/useFetch';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import HeroSection from './components/HeroSection';
import AiBanner from './components/AiBanner';
import PropertySection from '../../components/property/PropertySection';

const SECTION_CARD_COUNT = 4;

function HomePage() {
  const loggedIn = useMemo(() => isLoggedIn(), []);

  const popular = useFetch(fetchSurgeRankings);
  const recent = useFetch(fetchAllProperties);
  const recentViews = useFetch(fetchMyRecentViews, loggedIn);
  const recommended = useFetch(() => fetchRecommendedProperties(), loggedIn);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />

        <div className="px-20 pb-20 max-md:px-6 max-md:pb-12">
          <PropertySection
            title="실시간 인기 매물"
            subtitle="지금 가장 조회수가 급상승 중인 방이에요"
            moreTo="/search"
            properties={(popular.data ?? []).slice(0, SECTION_CARD_COUNT)}
            loading={popular.loading}
            error={popular.error}
            emptyMessage="아직 급상승 중인 매물이 없어요."
          />

          <AiBanner />

          <PropertySection
            title="최근 등록 매물"
            subtitle="방금 올라온 따끈따끈한 새 매물이에요"
            moreTo="/search"
            properties={(recent.data ?? []).slice(0, SECTION_CARD_COUNT)}
            loading={recent.loading}
            error={recent.error}
            emptyMessage="등록된 매물이 없어요."
          />

          {loggedIn && (
            <PropertySection
              title="최근 본 방"
              moreLabel="전체 보기 >"
              moreTo="/mypage/recent-views"
              properties={(recentViews.data ?? []).slice(0, SECTION_CARD_COUNT)}
              loading={recentViews.loading}
              error={recentViews.error}
              emptyMessage="최근에 본 방이 없어요. 마음에 드는 방을 둘러보세요!"
            />
          )}

          {loggedIn && (
            <PropertySection
              title="AI 맞춤 추천"
              subtitle="관심사와 최근 활동을 바탕으로 골라봤어요"
              moreTo="/search"
              properties={(recommended.data ?? []).slice(0, SECTION_CARD_COUNT)}
              loading={recommended.loading}
              error={recommended.error}
              emptyMessage="아직 추천할 매물이 없어요."
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default HomePage;
