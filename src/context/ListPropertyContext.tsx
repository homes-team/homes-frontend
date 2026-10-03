import { createContext, ReactNode, useContext, useState } from 'react';
import { PropertyDirection, PropertyOption, PropertyType, TradeType } from '../types/property';

/**
 * "/list-property-*" 6단계 위저드 전체가 공유하는 입력 상태.
 * 각 단계는 이 값을 조금씩 채워나가다가 마지막 단계(수수료)에서
 * PropertyCreateReqDto 형태로 변환해 POST /properties 로 한 번에 제출한다.
 *
 * 숫자 필드를 string으로 들고 있는 이유: <input> 값과 1:1로 바인딩하기 위함.
 * 실제 제출 시점(listPropertyApi.createProperty)에서 Number로 변환한다.
 */
export interface ListPropertyFormState {
  tradeType: TradeType | null;
  propertyType: PropertyType | null;

  address: string;
  detailAddress: string;
  currentFloor: string;
  totalFloors: string;
  direction: PropertyDirection;
  remodelingYear: string;
  area: string;
  /** 주소를 좌표로 변환(geocode)해야 다음 단계로 넘어갈 수 있다 */
  latitude: number | null;
  longitude: number | null;

  options: PropertyOption[];

  images: File[];

  deposit: string;
  monthlyRent: string;
  maintenanceFee: string;
  description: string;

  desiredBrokerageFee: string;
}

export const INITIAL_LIST_PROPERTY_FORM: ListPropertyFormState = {
  tradeType: null,
  propertyType: null,
  address: '',
  detailAddress: '',
  currentFloor: '',
  totalFloors: '',
  direction: 'UNKNOWN',
  remodelingYear: '',
  area: '',
  latitude: null,
  longitude: null,
  options: [],
  images: [],
  deposit: '',
  monthlyRent: '',
  maintenanceFee: '',
  description: '',
  desiredBrokerageFee: '',
};

interface ListPropertyContextValue {
  form: ListPropertyFormState;
  updateForm: (patch: Partial<ListPropertyFormState>) => void;
  resetForm: () => void;
}

const ListPropertyContext = createContext<ListPropertyContextValue | null>(null);

export function ListPropertyProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<ListPropertyFormState>(INITIAL_LIST_PROPERTY_FORM);

  const updateForm = (patch: Partial<ListPropertyFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const resetForm = () => setForm(INITIAL_LIST_PROPERTY_FORM);

  return (
    <ListPropertyContext.Provider value={{ form, updateForm, resetForm }}>
      {children}
    </ListPropertyContext.Provider>
  );
}

/** 위저드 페이지 안에서만 사용. Provider 밖에서 쓰면 명확한 에러를 던진다. */
export function useListPropertyForm(): ListPropertyContextValue {
  const ctx = useContext(ListPropertyContext);
  if (!ctx) {
    throw new Error('useListPropertyForm은 <ListPropertyProvider> 내부에서만 사용할 수 있습니다.');
  }
  return ctx;
}
