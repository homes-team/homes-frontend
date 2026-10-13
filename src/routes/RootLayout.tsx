import { Outlet } from 'react-router-dom';
import CompareTray from '../components/compare/CompareTray';

/** 모든 라우트를 감싸는 최상위 레이아웃 — 화면이 바뀌어도 유지되는 요소(비교 트레이)를 둔다. */
function RootLayout() {
  return (
    <>
      <Outlet />
      <CompareTray />
    </>
  );
}

export default RootLayout;
