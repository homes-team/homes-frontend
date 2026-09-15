import { ReactNode } from 'react';

function TipBox({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-[10px] bg-primary-50 p-4 text-[13px] leading-relaxed text-gray-600">
      {title && <p className="mb-1.5 font-bold text-gray-900">{title}</p>}
      {children}
    </div>
  );
}

export default TipBox;
