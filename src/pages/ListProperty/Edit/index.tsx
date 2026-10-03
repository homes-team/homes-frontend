import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchPropertyDetail } from '../../../api/property/propertyApi';
import { useListPropertyForm } from '../../../context/ListPropertyContext';
import { ApiError } from '../../../api/client';

/**
 * "/properties/:propertyId/edit" 진입점.
 * 기존 매물 정보를 불러와 위저드 공용 폼 상태를 채워넣고, editingPropertyId를
 * 세팅한 뒤 1단계(Start)로 보낸다 — 6단계 위저드 자체는 등록/수정 양쪽에 재사용한다.
 */
function ListPropertyEditLoader() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const id = Number(propertyId);
  const navigate = useNavigate();
  const { updateForm, setEditingPropertyId } = useListPropertyForm();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    let cancelled = false;

    fetchPropertyDetail(id)
      .then((detail) => {
        if (cancelled) return;
        updateForm({
          tradeType: detail.tradeType,
          propertyType: detail.propertyType,
          address: detail.address,
          detailAddress: detail.detailAddress,
          currentFloor: String(detail.currentFloor),
          totalFloors: String(detail.totalFloors),
          direction: detail.direction,
          remodelingYear: detail.remodelingYear !== null ? String(detail.remodelingYear) : '',
          area: String(detail.area),
          latitude: detail.latitude,
          longitude: detail.longitude,
          options: detail.options,
          images: [],
          deposit: String(detail.deposit),
          monthlyRent: String(detail.monthlyRent),
          maintenanceFee: detail.maintenanceFee !== null ? String(detail.maintenanceFee) : '0',
          description: detail.description,
          desiredBrokerageFee: detail.desiredBrokerageFee !== null ? String(detail.desiredBrokerageFee) : '',
        });
        setEditingPropertyId(id);
        navigate('/list-property/start', { replace: true });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : '매물 정보를 불러오지 못했어요.');
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm font-medium text-danger">{error}</p>
        <button type="button" onClick={() => navigate(`/properties/${id}`)} className="text-sm text-primary underline">
          매물로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-500">매물 정보를 불러오는 중...</p>
    </div>
  );
}

export default ListPropertyEditLoader;
