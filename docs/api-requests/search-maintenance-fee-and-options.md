# API 요청: 관리비 범위 필터 + 반려동물/전세자금대출 옵션

## 프론트가 지금 하고 있는 것

| 항목 | 현재 처리 | 백엔드가 지원하면 |
|---|---|---|
| 관리비 범위 필터 | `minMaintenanceFee`/`maxMaintenanceFee`를 쿼리로 보내고, **응답을 프론트에서 한 번 더 거른다** (`src/utils/searchFilter.ts`). 관리비가 없는(null) 매물은 0원으로 본다 | 서버가 거른 결과를 다시 거르는 것이라 결과 변화 없음. 프론트 수정 불필요 |
| 반려동물/전세자금대출 옵션 | 필터 모달에 "(준비 중)"으로 노출. 서버가 모르는 값을 보내면 400이 나서 **요청에서는 빼고**, 응답의 `options`에 값이 있으면 프론트가 거른다 | 아래 3단계 후, 프론트의 `FRONTEND_ONLY_OPTIONS`를 비우고 `PROPERTY_OPTION_ORDER`로 옮기면 끝 |

## 1. 관리비 범위 검색 조건 (선택 — 안 해도 프론트에서 동작함)

`GET /properties/map` 의 `PropertyMapSearchReqDto`에 추가:

```java
@Schema(description = "최소 관리비 (단위: 만원)")
@Min(0) Integer minMaintenanceFee,

@Schema(description = "최대 관리비 (단위: 만원)")
@Min(0) Integer maxMaintenanceFee,
```

쿼리 조건: `maintenance_fee BETWEEN :min AND :max` (null/미입력은 조건에서 제외, 관리비 null 매물은 0으로 취급)

## 2. PropertyOption enum 추가

```java
PET_ALLOWED("반려동물 가능"),
JEONSE_LOAN("전세자금대출 가능")
```

프론트 라벨(`PROPERTY_OPTION_LABEL`)과 동일하게 유지해주세요.

## 3. ⚠️ DB CHECK 제약조건도 같이 바꿔야 합니다

`ddl-auto: update`는 기존 CHECK 제약조건을 갱신하지 않습니다. `property_options` 테이블에
`property_options_options_check`가 걸려 있어서, enum만 추가하면 옵션 저장 시 500이 납니다
(`notifications_type_check`, `bids_status_check` 때와 동일). 각자 DB에서 한 번씩 실행:

```sql
ALTER TABLE property_options DROP CONSTRAINT property_options_options_check;
ALTER TABLE property_options ADD CONSTRAINT property_options_options_check
  CHECK (options::text = ANY (ARRAY[
    'ELEVATOR','SECURITY_GUARD','PARKING','BED','DESK','AIR_CONDITIONER','REFRIGERATOR',
    'WASHING_MACHINE','MICROWAVE','INDUCTION','GAS_STOVE','SHOE_RACK','CLOSET','SINK',
    'VERANDA','FULL_OPTION','PET_ALLOWED','JEONSE_LOAN'
  ]::text[]));
```

## 4. 백엔드 반영 후 프론트 후속 작업 (프론트 담당)

1. `src/types/property.ts`: `FRONTEND_ONLY_OPTIONS`를 빈 배열로 비우고, `PET_ALLOWED`/`JEONSE_LOAN`을 `PROPERTY_OPTION_ORDER`에 추가
   (등록 마법사의 옵션 선택 화면이 이 목록을 쓰므로 그때부터 매물에 옵션을 저장할 수 있음)
2. 필터 모달의 "(준비 중)" 표시는 `FRONTEND_ONLY_OPTIONS` 기준이라 자동으로 사라짐
