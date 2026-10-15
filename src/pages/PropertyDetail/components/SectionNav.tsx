import { useEffect, useState } from 'react';

export interface SectionNavItem {
  id: string;
  label: string;
}

/** 긴 상세 페이지에서 섹션으로 바로 이동하는 탭. 스크롤 위치에 맞춰 현재 섹션을 강조한다 */
function SectionNav({ items }: { items: SectionNavItem[] }) {
  const [active, setActive] = useState(items[0]?.id);
  const ids = items.map((item) => item.id).join(',');

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    // 화면 위쪽 띠(탭 아래 ~ 화면 40% 지점)에 걸린 섹션 중 가장 위에 있는 것을 현재 섹션으로 본다
    const inBand = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) inBand.set(entry.target.id, entry.boundingClientRect.top);
          else inBand.delete(entry.target.id);
        });
        const first = [...inBand.entries()].sort((a, b) => a[1] - b[1])[0];
        if (first) setActive(first[0]);
      },
      { rootMargin: '-56px 0px -60% 0px' },
    );

    ids.split(',').forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, [ids]);

  const goTo = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav aria-label="매물 정보 섹션" className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-b border-gray-200 bg-white">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-current={item.id === active ? 'true' : undefined}
          onClick={() => goTo(item.id)}
          className={`shrink-0 border-b-2 px-4 py-3.5 text-[15px] transition-colors ${
            item.id === active
              ? 'border-primary font-bold text-primary'
              : 'border-transparent font-medium text-gray-500 hover:text-gray-900'
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

export default SectionNav;
