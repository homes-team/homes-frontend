import axios from 'axios';
import { apiGet, apiPatch, apiPost } from '../client';
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
  /** 비율(%) 그대로 전송. 예: 0.5 */
  desiredBrokerageFee?: number;
  options: PropertyOption[];
  latitude: number;
  longitude: number;
  images: File[];
}

interface PresignedUpload {
  uploadUrl: string;
  fileUrl: string;
}

const IMAGE_UPLOAD_TIMEOUT_MS = 30_000;

async function uploadPropertyImages(files: File[]): Promise<string[]> {
  return Promise.all(files.map(async (file) => {
    const issued = await apiGet<PresignedUpload>(
      `/properties/presigned-url?fileName=${encodeURIComponent(file.name)}`,
      { auth: true },
    );
    try {
      await axios.put(issued.uploadUrl, file, {
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        timeout: IMAGE_UPLOAD_TIMEOUT_MS,
      });
    } catch {
      throw new Error('매물 사진 업로드가 차단됐어요. S3 CORS 설정에서 현재 프론트 주소의 PUT 요청을 허용해주세요.');
    }
    return issued.fileUrl;
  }));
}

function buildPropertyRequest(payload: CreatePropertyPayload, imageUrls: string[]) {
  const { images: _images, ...request } = payload;
  return {
    ...request,
    remodelingYear: payload.remodelingYear ?? null,
    desiredBrokerageFee: payload.desiredBrokerageFee ?? null,
    imageUrls,
  };
}

/**
 * 매물 등록 — POST /properties (application/json)
 * PropertyController.createProperty / PropertyCreateReqDto 대응.
 * 로그인 필요(UserPrincipal이 없으면 백엔드가 401을 던짐).
 */
export async function createProperty(payload: CreatePropertyPayload): Promise<number> {
  const imageUrls = await uploadPropertyImages(payload.images);
  return apiPost<number>('/properties', buildPropertyRequest(payload, imageUrls), { auth: true });
}

/**
 * 매물 수정 — PATCH /properties/{propertyId} (application/json)
 * ⚠️ 부분 수정이 아니다 — PropertyUpdateReqDto는 서버가 null 병합을 하지 않고 그대로
 * 덮어쓰므로, 안 보낸 필드는 null로 지워진다. payload에 항상 전체 필드를 채워 보내야 한다.
 * newImageUrls를 보내면 기존 이미지는 전부 삭제되고 새 이미지로 교체된다.
 */
export async function updateProperty(propertyId: number, payload: CreatePropertyPayload): Promise<void> {
  const newImageUrls = await uploadPropertyImages(payload.images);
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
