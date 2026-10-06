import { apiPatch, apiPost } from '../client';
import { uploadFileToS3 } from '../upload/presignedUpload';
import { PropertyDirection, PropertyOption, PropertyType, TradeType } from '../../types/property';

/** PropertyCreateReqDto(백엔드) 대응. 백엔드 필드명/타입과 1:1로 맞춰뒀다. */
export interface CreatePropertyPayload {
  tradeType: TradeType;
  propertyType: PropertyType;
  /** 만원 단위 */
  deposit: number;
  /** 만원 단위. 전세/매매는 0 */
  monthlyRent: number;
  /** 만원 단위 */
  maintenanceFee: number;
  address: string;
  detailAddress: string;
  currentFloor: number;
  totalFloors: number;
  direction: PropertyDirection;
  remodelingYear?: number;
  /** m² */
  area: number;
  description: string;
  /** 비율(%) 그대로 전송. 예: 0.5. DB NOT NULL이라 비우면 0으로 보낸다. */
  desiredBrokerageFee?: number;
  options: PropertyOption[];
  latitude: number;
  longitude: number;
  images: File[];
}

function buildPropertyRequest(payload: CreatePropertyPayload, imageUrls: string[]) {
  const { images: _images, ...request } = payload;
  return {
    ...request,
    remodelingYear: payload.remodelingYear ?? null,
    desiredBrokerageFee: payload.desiredBrokerageFee ?? 0,
    imageUrls,
  };
}

/**
 * 매물 등록 — POST /properties (application/json)
 * 이미지는 먼저 presigned URL로 S3에 올리고, 그 결과 URL들을 imageUrls로 담아 보낸다.
 * PropertyController.createProperty / PropertyCreateReqDto 대응.
 */
export async function createProperty(payload: CreatePropertyPayload): Promise<number> {
  const imageUrls = await Promise.all(payload.images.map((file) => uploadFileToS3(file, { auth: true })));
  return apiPost<number>('/properties', buildPropertyRequest(payload, imageUrls), { auth: true });
}

/**
 * 매물 수정 — PATCH /properties/{propertyId} (application/json)
 * ⚠️ 부분 수정이 아니다 — 안 보낸 필드는 null로 지워지므로 payload에 항상 전체 필드를 채워 보내야 한다.
 * newImageUrls를 보내면 기존 이미지는 전부 삭제되고 새 이미지로 교체된다. 새로 추가한 사진이 없으면
 * 아예 보내지 않아서(undefined) 기존 이미지를 그대로 유지한다.
 */
export async function updateProperty(propertyId: number, payload: CreatePropertyPayload): Promise<void> {
  const newImageUrls = await Promise.all(payload.images.map((file) => uploadFileToS3(file, { auth: true })));
  const { imageUrls: _imageUrls, ...request } = buildPropertyRequest(payload, []);
  return apiPatch<void>(
    `/properties/${propertyId}`,
    { ...request, ...(newImageUrls.length > 0 ? { newImageUrls } : {}) },
    { auth: true },
  );
}

/**
 * 주소 문자열 → 좌표 변환 (Kakao Geocoder, 이미 프로젝트에 있는 카카오맵 SDK 재사용).
 * 매칭되는 주소가 없으면 null을 반환한다.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const { loadKakaoMapSdk } = await import('../../utils/KakaoLoader');
  const maps = await loadKakaoMapSdk();

  return new Promise((resolve) => {
    const geocoder = new maps.services.Geocoder();
    geocoder.addressSearch(address, (result, status) => {
      if (status === maps.services.Status.OK && result[0]) {
        resolve({ lat: Number(result[0].y), lng: Number(result[0].x) });
      } else {
        resolve(null);
      }
    });
  });
}
