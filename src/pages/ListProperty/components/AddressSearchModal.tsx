import { useEffect, useRef, useState } from 'react';
import { loadPostcodeScript, pickAddress, PostcodeResult } from '../../../utils/postcodeLoader';

interface AddressSearchModalProps {
  onSelect: (address: string) => void;
  onClose: () => void;
}

/**
 * 도로명·지번·건물명으로 주소를 검색하는 카카오(다음) 우편번호 화면을 팝업 대신 모달 안에 끼워 넣는다.
 * 팝업 차단 영향을 받지 않고, 선택한 표준 주소만 부모에 넘긴다.
 */
function AddressSearchModal({ onSelect, onClose }: AddressSearchModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadPostcodeScript()
      .then((daum) => {
        if (cancelled || !containerRef.current) return;
        new daum.Postcode({
          width: '100%',
          height: '100%',
          oncomplete: (data: PostcodeResult) => onSelect(pickAddress(data)),
        }).embed(containerRef.current);
      })
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
    // 모달이 열릴 때 한 번만 검색 화면을 만든다
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="주소 검색"
        className="flex h-[560px] max-h-full w-full max-w-lg flex-col overflow-hidden rounded-card bg-white"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-base font-bold text-gray-900">주소 검색</h2>
          <button type="button" aria-label="닫기" className="px-2 text-xl text-gray-500 hover:text-gray-900" onClick={onClose}>
            ×
          </button>
        </div>
        {error ? (
          <p className="p-6 text-center text-sm font-medium text-danger">{error}</p>
        ) : (
          <div ref={containerRef} className="min-h-0 flex-1" />
        )}
      </div>
    </div>
  );
}

export default AddressSearchModal;
