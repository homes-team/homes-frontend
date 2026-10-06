# API 요청: 중개사 본인 입찰 제안서 목록 조회

## 배경

역경매 협상 MVP 시나리오(매물 등록 → 제안서 → 1차 매칭 → 재협상 → 채팅 → 매칭 확정/취소)를 중개사 쪽
화면에서 완성하려면, 중개사가 "내가 제출한 제안서들이 지금 어떤 상태인지" 확인할 진입점이 필요합니다.

현재 `BidController`의 `GET /properties/{propertyId}/bids`는 집주인 전용(`hasRole('USER')`)이라
중개사는 호출할 수 없고, `RealtorMyPageController`에도 "내 입찰 목록"에 해당하는 API가 없습니다.
`existsByPropertyIdAndAgentIdAndStatusIn`, `countByAgentId` 등 존재/개수 확인용 쿼리만 있고,
실제 목록(+ 매물 정보)을 내려주는 기능이 없습니다.

프론트엔드는 이 API가 있다고 가정하고 화면을 먼저 완성했습니다
(`src/api/realtor/realtorApi.ts`의 `fetchMyBids()`, `src/pages/RealtorMyBids/`).
백엔드 구현 전까지는 해당 화면에서 호출이 실패합니다.

## 요청 API

```
GET /realtors/me/bids
Authorization: Bearer {accessToken}
```

- 권한: `hasRole('AGENT')`
- 정렬: 최신순(`createdAt desc`) 권장
- 필터링 없이 전체 상태(PENDING/ACCEPTED/REJECTED/CANCELLED) 포함 — 프론트에서 상태별로 다른 액션을 보여줍니다.

### 응답 예시

```json
{
  "isSuccess": true,
  "code": "COMMON200",
  "message": "성공입니다.",
  "result": [
    {
      "bidId": 12,
      "propertyId": 34,
      "propertyTitle": "강남구 역삼동 신축 원룸",
      "propertyAddress": "서울 강남구 역삼동 123-45",
      "tradeType": "MONTHLY_RENT",
      "deposit": 1000,
      "monthlyRent": 80,
      "proposedFee": 0.5,
      "finalFee": null,
      "status": "PENDING",
      "createdAt": "2026-10-05T10:00:00"
    }
  ]
}
```

### 제안 DTO

```java
public record AgentBidListRespDto(
        Long bidId,
        Long propertyId,
        String propertyTitle,
        String propertyAddress,
        TradeType tradeType,
        Long deposit,
        Long monthlyRent,
        Double proposedFee,
        Double finalFee,      // 확정 전이면 null (Bid.finalFee)
        BidStatus status,
        LocalDateTime createdAt
) {
    public static AgentBidListRespDto from(Bid bid) {
        Property property = bid.getProperty();
        return new AgentBidListRespDto(
                bid.getId(),
                property.getId(),
                property.getTitle(),
                property.getAddress(),
                property.getTradeType(),
                property.getDeposit(),
                property.getMonthlyRent(),
                bid.getProposedFee(),
                bid.getFinalFee(),
                bid.getStatus(),
                bid.getCreatedAt()
        );
    }
}
```

### 참고 구현 메모

- `BidRepository`에 `findAllByAgentIdOrderByCreatedAtDesc(Long agentId)` 같은 메서드 추가 필요
  (기존 `findAllByPropertyIdAndStatusInOrderByCreatedAtDesc`와 동일한 패턴).
- `RealtorMyPageController`/`RealtorMyPageControllerDocs`에 엔드포인트 추가, `RealtorService`(또는
  `BidService`)에 조회 로직 추가.
- 이 목록에서 각 bid에 대해 프론트가 이미 사용 중인 기존 API들을 그대로 호출합니다 (추가 변경 불필요):
  - 역제안 조회/전송: `GET/POST /properties/{propertyId}/bids/{bidId}/negotiations`
  - 매칭 취소(ACCEPTED 상태, 중개사도 가능): `POST /properties/{propertyId}/bids/{bidId}/cancel`
  - 채팅방: 매칭 확정(`accept`) 시 이미 자동 생성되므로, 프론트는 `GET /chats`에서
    `propertyId`로 필터링해 찾습니다.
