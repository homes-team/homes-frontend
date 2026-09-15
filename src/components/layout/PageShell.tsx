import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

/** 대부분의 페이지가 공유하는 Header + 가운데 정렬 콘텐츠 + Footer 뼈대. */
function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-[1280px] px-20 py-8 max-md:px-6">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

export default PageShell;
