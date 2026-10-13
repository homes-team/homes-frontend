# API 요청: 매물 상태 직접 관리 (광고 중 / 거래 완료 / 숨김)

## 프론트가 만든 것

매물 상세 페이지에서 **집주인(소유자)** 에게만 "매물 상태 관리" 카드가 보입니다.
`광고 중 / 거래 완료 / 숨김` 3개 버튼으로 상태를 바꿉니다.

- `MATCHED`(매칭 진행 중)일 때는 버튼이 잠기고 "받은 입찰"로 안내합니다 (거래 완료/취소는 기존 입찰 흐름이 관리)
- `DELETED`일 때도 잠깁니다
- 거래 완료로 바꿀 때는 확인창을 띄웁니다
- 상세 상단과 목록 카드에 상태 뱃지(거래 완료 / 숨김)를 보여줍니다

> 이 서비스에서 매물을 올리는 쪽은 집주인(USER)이고 중개사(AGENT)는 제안서를 보내는 쪽이라,
> "매물 상태 관리"는 매물 소유자 기준으로 만들었습니다. 중개사가 거래 완료를 직접 바꾸면 성사율 통계를
> 조작할 수 있어서(`completeBid`가 집주인 전용인 이유와 동일) 중개사에게는 노출하지 않습니다.

현재 백엔드에는 이 기능에 필요한 것이 없어서, 아래가 구현되기 전까지 버튼을 누르면 서버 오류 메시지가 표시됩니다.
(상세 응답의 `status` 필드는 이미 있어서 상태 표시는 지금도 동작합니다.)

## 1. `PropertyStatus`에 `HIDDEN` 추가

```java
AVAILABLE("거래가능"),
MATCHED("매칭완료"),
COMPLETED("거래완료"),
HIDDEN("숨김"),      // 추가
DELETED("삭제됨");
```

## 2. 상태 변경 API

```
PATCH /properties/{propertyId}/status
Authorization: Bearer {accessToken}
Content-Type: application/json

{ "status": "HIDDEN" }        // AVAILABLE | COMPLETED | HIDDEN
```

- 권한: 매물 소유자만 (`PropertyErrorCode.UNAUTHORIZED_ACCESS`)
- 응답: `ApiResponse<Void>` (프론트는 성공 여부만 사용)
- 허용 전이 (프론트 버튼과 동일):

| 현재 → 변경 | 허용 |
|---|---|
| AVAILABLE ↔ HIDDEN | O |
| AVAILABLE / HIDDEN → COMPLETED | O |
| COMPLETED → AVAILABLE / HIDDEN | O (거래가 무산된 경우 다시 광고) |
| **MATCHED → 어떤 것이든** | **X** — 제안서 수락/취소/완료 흐름만 MATCHED를 바꿀 수 있음. 에러 코드 예: `PROPERTY_MATCHED_STATUS_LOCKED` |
| DELETED → 어떤 것이든 | X |

- 동시성: 입찰 수락(`acceptBid`)과 같은 매물 비관적 락(`findByIdWithPessimisticLock`)을 쓰면 수락과 상태 변경이 동시에 와도 안전합니다.

## 3. `HIDDEN`/`COMPLETED` 매물의 노출 정책

- `GET /properties`, `/properties/map`, `/properties/clusters`, 추천/급상승 목록, 중개사 근처 매물: **`HIDDEN`은 제외**
  (현재 지도 검색은 일반 유저에게 AVAILABLE+MATCHED, 중개사에게 AVAILABLE만 노출하므로 HIDDEN을 거기에 추가하지 않으면 됩니다)
- 소유자의 `GET /users/me/properties`에는 HIDDEN/COMPLETED도 포함 (프론트가 뱃지로 구분)
- `GET /properties/{id}` 상세: 소유자와 관리자는 HIDDEN도 조회 가능, 그 외에는 404 또는 숨김 처리 권장
- `createBid`: 이미 `status != AVAILABLE`이면 `PROPERTY_ALREADY_MATCHED`로 막고 있으므로 HIDDEN/COMPLETED는 자동으로 입찰 불가

## 4. ⚠️ DB CHECK 제약조건

`ddl-auto: update`는 기존 CHECK를 갱신하지 않습니다. 각자 DB에서 한 번씩 실행해주세요.

```sql
ALTER TABLE properties DROP CONSTRAINT properties_status_check;
ALTER TABLE properties ADD CONSTRAINT properties_status_check
  CHECK (status IN ('AVAILABLE','MATCHED','COMPLETED','HIDDEN','DELETED'));
```
