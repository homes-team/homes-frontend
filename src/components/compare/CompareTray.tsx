import { useLocation, useNavigate } from 'react-router-dom';
import { MAX_COMPARE, useCompare } from '../../context/CompareContext';

/** 하단 고정 바가 이미 있거나 방해가 되는 화면에서는 트레이를 숨긴다 */
const HIDDEN_PATH_PREFIXES = ['/compare', '/list-property', '/login', '/signup', '/find-', '/oauth'];

/** 비교 목록에 담긴 매물을 보여주고 비교 화면으로 보내는 하단 트레이 */
function CompareTray() {
  const { items, remove, clear } = useCompare();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (items.length === 0 || HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 z-[60] flex w-[min(720px,calc(100vw-32px))] -translate-x-1/2 items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.22)]"
      role="region"
      aria-label="비교 목록"
    >
      <span className="shrink-0 text-sm font-bold text-gray-900">
        비교 {items.length}/{MAX_COMPARE}
      </span>

      <ul className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
        {items.map((item) => (
          <li
            key={item.propertyId}
            className="flex max-w-[180px] shrink-0 items-center gap-1 rounded-pill bg-primary-50 py-1 pr-1 pl-3 text-xs font-medium text-primary"
          >
            <span className="truncate">{item.title}</span>
            <button
              type="button"
              aria-label={`${item.title} 비교에서 빼기`}
              onClick={() => remove(item.propertyId)}
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full hover:bg-primary-100"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <button type="button" onClick={clear} className="shrink-0 text-xs text-gray-500 hover:text-gray-900">
        비우기
      </button>
      <button
        type="button"
        disabled={items.length < 2}
        onClick={() => navigate('/compare')}
        className="shrink-0 rounded-button bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {items.length < 2 ? '2개 이상 담아주세요' : '비교하기'}
      </button>
    </div>
  );
}

export default CompareTray;
