# API 요청: 중개사 프로필 사진 수정

## 프론트가 만든 것

중개사 마이페이지(`/realtor/mypage`) 맨 위에 프로필 카드를 추가했습니다.

- 프로필 사진 (없으면 사무소명 첫 글자 아바타), 사무소명, 승인 상태, **사업자등록번호** 표시
- **"사진 변경"** 버튼 → 이미지 선택(10MB 이하 이미지만) → 아래 순서로 처리
  1. `GET /properties/presigned-url?fileName=...` (로그인 상태) 로 업로드 URL 발급
  2. S3에 `PUT` 업로드
  3. `PATCH /realtors/me` 에 `{ "profileImageUrl": "<S3 최종 URL>" }` 전송
  4. 응답의 `profileImageUrl`이 방금 보낸 URL과 같으면 "프로필 사진을 바꿨어요."
     다르면(= 서버가 아직 저장을 안 함) "서버가 아직 프로필 사진 저장을 지원하지 않아요."라고 안내

현재 백엔드는 `AgentUpdateProfileReqDto`에 `profileImageUrl`이 없어서 값을 무시하고(Jackson이 모르는 필드를 버림)
200을 돌려주기 때문에, 프론트는 위 4번의 비교로 "저장 안 됨"을 감지해 안내합니다.

## 1. 요청/응답 DTO 수정

```java
// AgentUpdateProfileReqDto — 부분 수정(안 보낸 필드는 유지)이므로 선택값
@Schema(description = "프로필 사진 URL (Presigned URL로 미리 업로드 후 전달)")
@Pattern(regexp = "^https://homes-duksung-images\\.s3\\.ap-northeast-2\\.amazonaws\\.com/.+$",
        message = "허용된 S3 저장소의 URL만 사용할 수 있습니다.")
String profileImageUrl

// AgentProfileResDto — GET/PATCH /realtors/me 응답에 추가
String profileImageUrl   // Agent.profileImageUrl (이미 엔티티에 있음: BidListRespDto가 사용 중)
```

## 2. 저장 시 업로드 검증

회원가입(`RealtorService.signUp`)과 동일하게 `S3PresignedUrlService.validateAndConsumeUploadedFile(url, "user:" + userId)`로
(용량 10MB 이하 + 발급받은 본인이 맞는지) 검증하고 소비해주세요. 프론트는 로그인 상태에서 발급받으므로 identity가 `user:{userId}`입니다.

```java
if (request.profileImageUrl() != null) {
    s3PresignedUrlService.validateAndConsumeUploadedFile(request.profileImageUrl(), "user:" + userId);
    agent.updateProfileImage(request.profileImageUrl());
}
```

## 3. (선택) 공개 프로필에도 사진 노출

`RealtorPublicProfileResDto`(`GET /realtors/{id}`)에 `profileImageUrl`을 추가하면 유저가 보는
중개사 프로필 페이지에서도 사진을 보여줄 수 있습니다. 프론트는 필드가 내려오면 바로 쓸 수 있게
`src/types/realtor.ts`를 맞춰두면 됩니다.
