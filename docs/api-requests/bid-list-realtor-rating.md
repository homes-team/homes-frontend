# 입찰 목록의 중개사 평점 · 법정 상한 표시용 필드 요청

프론트는 아래 두 가지를 이미 화면에 연결해 두었고, 백엔드 응답에 필드가 없는 동안은 우회 방법으로 동작합니다.
필드가 내려오면 프론트는 코드 수정 없이 응답 값을 먼저 사용합니다.

## 1. 집주인 입찰 목록에 중개사 평점 추가

```http
GET /properties/{propertyId}/bids
Authorization: Bearer {accessToken}
```

집주인이 입찰자를 비교할 수 있도록 입찰 카드에 별점과 리뷰 수를 보여주고, 정렬 기준(평점 높은 순)으로도 씁니다.

`BidListRespDto`에 추가를 요청하는 필드:

| 필드 | 타입 | 설명 |
|---|---|---|
| `averageReviewScore` | `Double` (nullable) | 중개사 평균 평점 0.0~5.0. 리뷰가 없으면 `null` |
| `reviewCount` | `long` | 받은 리뷰 수 |

값은 `GET /realtors/{realtorId}`의 `RealtorPublicProfileResDto.averageReviewScore` / `reviewCount`와 같아야 합니다.

```json
{
  "bidId": 12,
  "agentId": 3,
  "officeName": "홈즈부동산",
  "profileImageUrl": null,
  "proposedFee": 0.4,
  "content": "빠르게 진행하겠습니다.",
  "status": "PENDING",
  "createdAt": "2026-10-05T10:00:00",
  "averageReviewScore": 4.5,
  "reviewCount": 12
}
```

### 현재 프론트의 우회 방식

필드가 없으면 입찰자마다 `GET /realtors/{agentId}`를 호출해 평점을 채웁니다(같은 중개사는 1번만).
입찰이 N건이면 목록 조회 1번 + 프로필 조회 최대 N번이 나가므로, 필드를 추가해 주시면 추가 호출이 사라집니다.
프로필 조회가 실패한 입찰자는 평점 없이 표시합니다.

## 2. 중개사 목록에서 법정 중개보수 상한을 보여주기 위한 필드

중개사는 현재 **매물 상세 화면**에서만 법정 상한을 봅니다(상한 요율, 한도액, 이 매물의 최대 중개보수, 입력한 수수료의 초과 여부).
상한 계산에는 거래 유형 · 매물 유형 · 보증금 · 월세가 필요한데, 중개사용 목록 응답에는 일부가 없어 목록 화면에서는 보여주지 않습니다.

| API | 응답 DTO | 추가 요청 필드 |
|---|---|---|
| `GET /realtors/me/properties/nearby` | `NearbyPropertyResDto` | `propertyType` |
| `GET /realtors/me/bids/available` | `NearbyPropertyResDto` | `propertyType` |
| `GET /realtors/me/bids` | `MyBidListRespDto` | `tradeType`, `propertyType`, `deposit`, `monthlyRent` |

`propertyType`을 모르면 주택 요율표와 오피스텔 요율이 달라 잘못된 상한을 보여줄 수 있어서, 프론트는 추측하지 않고 표시를 미룹니다.

## 3. (선택) 입찰 수수료 법정 상한 서버 검증

`POST /properties/{propertyId}/bids`, `POST .../negotiations`의 수수료(`proposedFee`, `suggestedFee`, 모두 **%**)에 대해
서버에서도 상한을 확인하는 것을 제안합니다. 프론트는 서울 요율표 기준으로 경고만 하고(확인 창 후 제출 가능),
지역 조례 차이가 있어 막지는 않습니다.

## 참고: 수수료 단위

`proposedFee`, `suggestedFee`, `currentFee`, `desiredBrokerageFee`는 모두 % 단위입니다(예: `0.4` = 0.4%).
프론트의 입찰 폼, 집주인 입찰 목록, 협상 내역 표기를 % 로 통일했습니다.
