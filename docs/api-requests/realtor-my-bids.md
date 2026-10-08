# 중개사 본인 입찰 제안서 목록 API

프론트의 `내가 제출한 제안서` 화면은 다음 API를 사용합니다.

```http
GET /realtors/me/bids
Authorization: Bearer {accessToken}
```

- 권한: `AGENT`
- 정렬: 제안서 생성일 최신순
- 범위: `PENDING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`, `CANCELLED` 전체
- `currentFee`: 가장 최근 역제안 수수료이며, 협상 내역이 없으면 `proposedFee`와 같습니다.

## 현재 응답 계약

```json
{
  "isSuccess": true,
  "code": "COMMON_200",
  "message": "요청에 성공하였습니다.",
  "result": [
    {
      "bidId": 12,
      "propertyId": 34,
      "propertyTitle": "강남구 역삼동 신축 원룸",
      "propertyAddress": "서울 강남구 역삼동 123-45",
      "proposedFee": 0.5,
      "currentFee": 0.4,
      "status": "PENDING",
      "createdAt": "2026-10-05T10:00:00"
    }
  ]
}
```

목록 응답에 포함되지 않은 거래 유형·매물 가격·최초 제안 본문은 화면에서 임의로 사용하지 않습니다.
매물 정보는 제목을 눌러 상세 페이지에서 확인하며, 협상 메시지는 기존 협상 내역 API로 조회합니다.

```http
GET /properties/{propertyId}/bids/{bidId}/negotiations
POST /properties/{propertyId}/bids/{bidId}/negotiations
```

종료된 제안서도 협상 내역은 조회할 수 있지만, 새 역제안 입력은 `PENDING` 상태에서만 표시합니다.
