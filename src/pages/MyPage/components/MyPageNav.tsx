import { useLocation, useNavigate } from 'react-router-dom';

const TABS = [
  { to: '/mypage', label: '프로필' },
  { to: '/mypage/properties', label: '내 매물' },
  { to: '/mypage/favorites', label: '찜한 매물' },
  { to: '/mypage/recent-views', label: '최근 본 방' },
  { to: '/mypage/reports', label: '신고 내역' },
];

function MyPageNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200">
      {TABS.map((tab) => {
        const active = pathname === tab.to;
        return (
          <button
            key={tab.to}
            type="button"
            onClick={() => navigate(tab.to)}
            className={`shrink-0 border-b-2 px-1 py-3 text-sm font-medium ${
              active ? 'border-primary font-bold text-primary' : 'border-transparent text-gray-500'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export default MyPageNav;
