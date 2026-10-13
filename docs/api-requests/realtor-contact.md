# API 요청: 중개사 전화번호 + 임차인 문의 채팅

매물 상세 페이지에 "담당 중개사" 카드(`RealtorContactCard`)를 추가했습니다.
`GET /properties/{id}/realtors`(기존 API)로 담당 중개사를 가져와 **전화 걸기**와 **채팅 문의** 버튼을 보여줍니다.
(담당 중개사는 집주인이 제안서를 수락해 매칭이 확정된 뒤에 생기므로, 매칭 전 매물에서는 카드가 보이지 않습니다.)

## 1. 중개사 전화번호 내려주기

**현재**: `PropertyRealtorInfoResDto.AgentSummaryResDto`가 `agentId, officeName, officeAddress, isVerified`만 내려줍니다.
**프론트 현재 동작**: `phone`이 없으면 "📞 전화번호 준비 중" 비활성 버튼, 있으면 `tel:` 링크로 바로 전화 연결.

```java
public record AgentSummaryResDto(
        Long agentId,
        String officeName,
        String officeAddress,
        boolean isVerified,
        String phone          // 추가: 중개사 대표 연락처 (RealtorSignupReqDto.phone 으로 가입 시 받은 값)
) {
    public static AgentSummaryResDto from(Agent agent) {
        return new AgentSummaryResDto(
                agent.getId(), agent.getOfficeName(), agent.getOfficeAddress(),
                agent.isVerified(), agent.getUser().getPhone());
    }
}
```

- 프론트는 숫자와 `+`만 남겨 `tel:` 링크를 만들기 때문에 `010-1234-5678` 같은 하이픈 형식 그대로 내려줘도 됩니다.
- 이 API는 **비로그인으로도 호출 가능**(`SecurityConfig`의 permitAll)하므로, 전화번호를 공개해도 되는지(승인된 중개사만 노출 등) 정책 확인이 필요합니다.

## 2. 임차인(집주인이 아닌 일반 회원) → 중개사 문의 채팅

**현재**: `POST /chats`(`ChatService.createChatRoom`)가 `property.getUser().getId().equals(callerId)`를 검사해서
**매물 집주인 본인만** 중개사와 채팅방을 열 수 있습니다. 임차인이 "채팅 문의"를 누르면 `PROP403_1`
("해당 매물을 수정/삭제 권한이 없습니다.")이 내려갑니다.
**프론트 현재 동작**: 이 코드를 받으면 "지금은 집주인만 중개사와 채팅을 시작할 수 있어요. 임차인 문의 채팅은 서버 준비 중이에요."
라고 안내합니다. 비로그인이면 로그인 화면으로 보냅니다. 중개사/관리자 계정에는 버튼을 숨깁니다.

### 제안
`ChatRoom`은 이미 `(property, user, agentUser)` 조합으로 유니크하므로, 방의 `user`를 "집주인"이 아니라
"요청한 일반 회원"으로 바꿔주면 구조 변경 없이 임차인 문의 방을 만들 수 있습니다.

```java
@Transactional
public ChatRoomResDto createChatRoom(Long propertyId, Long realtorId, Long callerId) {
    Property property = ...;
    Agent agent = ...;
    User caller = userRepository.findById(callerId).orElseThrow(...);

    // 기존: caller가 집주인이 아니면 UNAUTHORIZED_ACCESS
    // 변경: 집주인이든 임차인이든 caller 본인을 채팅방의 user로 둔다
    ChatRoom room = createOrReopenRoom(property, caller, agent.getUser());
    return ChatRoomResDto.from(room);
}
```

확인이 필요한 점:
- 집주인이 만든 방과 임차인이 만든 방이 **같은 중개사·같은 매물**에서 공존해도 되는지 (유니크 키가 user까지 포함하므로 가능)
- `ChatChannelInterceptor`의 `room.isMember(userId)`, 알림, "집주인 계정의 User.id"라는 `ChatRoom.user` 주석/의미 변경 영향
- 임차인이 자기 매물이 아닌 곳에 스팸으로 방을 여는 것을 막을 정책 (매물당 중개사당 1방은 유니크로 이미 제한됨)
- 응답 DTO `ChatRoomResDto.userId`를 프론트가 "집주인"이라고 가정하는 곳은 없으나, 라벨을 쓰게 되면 "회원"으로 바꿔 부르면 됩니다
