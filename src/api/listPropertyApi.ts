import { apiPatchMultipart, apiPostMultipart } from './client';
import { PropertyOption, PropertyType, TradeType } from '../types/property';

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

function buildPropertyForm(payload: CreatePropertyPayload): FormData {
  const form = new FormData();
  form.append('tradeType', payload.tradeType);
  form.append('propertyType', payload.propertyType);
  form.append('deposit', String(payload.deposit));
  form.append('monthlyRent', String(payload.monthlyRent));
  form.append('maintenanceFee', String(payload.maintenanceFee));
  form.append('address', payload.address);
  form.append('detailAddress', payload.detailAddress);
  form.append('currentFloor', String(payload.currentFloor));
  form.append('totalFloors', String(payload.totalFloors));
  form.append('area', String(payload.area));
  form.append('description', payload.description ?? '');
  if (payload.desiredBrokerageFee !== undefined && !Number.isNaN(payload.desiredBrokerageFee)) {
    form.append('desiredBrokerageFee', String(payload.desiredBrokerageFee));
  }
  // List<PropertyOption>은 같은 키를 반복 전송 (searchPropertiesOnMap과 동일 규칙)
  payload.options.forEach((option) => form.append('options', option));
  form.append('latitude', String(payload.latitude));
  form.append('longitude', String(payload.longitude));
  return form;
}

/**
 * 매물 등록 — POST /properties (multipart/form-data)
 * PropertyController.createProperty / PropertyCreateReqDto 대응.
 * 로그인 필요(UserPrincipal이 없으면 백엔드가 401을 던짐).
 */
export function createProperty(payload: CreatePropertyPayload): Promise<number> {
  const form = buildPropertyForm(payload);
  // @RequestPart(value = "images") List<MultipartFile>
  payload.images.forEach((file) => form.append('images', file));
  return apiPostMultipart<number>('/properties', form, { auth: true });
}

/**
 * 매물 수정 — PATCH /properties/{propertyId} (multipart/form-data)
 * ⚠️ 부분 수정이 아니다 — PropertyUpdateReqDto는 서버가 null 병합을 하지 않고 그대로
 * 덮어쓰므로, 안 보낸 필드는 null로 지워진다. payload에 항상 전체 필드를 채워 보내야 한다.
 * newImages를 보내면 기존 이미지는 전부 삭제되고 새 이미지로 교체된다(안 보내면 기존 유지).
 */
export function updateProperty(propertyId: number, payload: CreatePropertyPayload): Promise<void> {
  const form = buildPropertyForm(payload);
  // @RequestPart(value = "newImages") List<MultipartFile>
  payload.images.forEach((file) => form.append('newImages', file));
  return apiPatchMultipart<void>(`/properties/${propertyId}`, form, { auth: true });
}

/**
 * 주소 문자열 → 좌표 변환 (Kakao Geocoder, 이미 프로젝트에 있는 카카오맵 SDK 재사용).
 * 매칭되는 주소가 없으면 null을 반환한다.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const { loadKakaoMapSdk } = await import('../utils/KakaoLoader');
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
