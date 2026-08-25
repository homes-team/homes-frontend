# 홈즈 프론트엔드 — 홈 / 로그인 / 아이디·비밀번호 찾기 (TypeScript)

Figma `WireFrame` 페이지의 `/login`, `/find-id`, `/find-password` 디자인을 그대로 구현한 코드입니다.
CRA 프로젝트 루트에 그대로 덮어쓰면 됩니다.

## 1. 최초 세팅 (아직 안 하셨다면)

```bash
npm install --save typescript@4.9.5 @types/node @types/react @types/react-dom @types/jest
rm src/App.js src/index.js src/App.css src/index.css src/App.test.js src/logo.svg
```

⚠️ typescript는 반드시 `4.9.5`처럼 4.x로 버전을 고정하세요. react-scripts 5는 TypeScript
`^3.2.1 || ^4`만 지원해서, 최신 5.x/7.x가 깔리면 `Cannot find module 'typescript'`류
오류가 납니다.

이후 이 폴더의 `src/`, `tsconfig.json`, `.env.example`을 프로젝트 루트에 복사하고
`.env.example`을 `.env`로 복사한 뒤 백엔드 주소를 맞춰줍니다.

## 2. 폴더 구조

```
src/
├── api/
│   ├── client.ts        # ApiResponse 언래핑(apiGet/apiPost), JWT 헤더, ApiError
│   ├── propertyApi.ts   # GET /properties, /properties/surge-rankings
│   ├── userApi.ts       # GET /users/me/recent-views
│   └── authApi.ts       # 로그인·회원가입·이메일인증·실명인증(전부 실제 API) + 아이디/비번 찾기 스텁
├── types/
│   ├── api.ts             # ApiResponse<T>
│   ├── property.ts        # PropertyListItem, PropertyType, TradeType + 라벨
│   └── auth.ts             # LoginRequest, TokenDto, SignupRequest, SignupResult, IdentityVerificationResult
├── utils/
│   ├── format.ts            # 가격(만원→억), 층/면적, 상대시간 포맷
│   ├── auth.ts               # 토큰 저장/삭제 (localStorage)
│   └── authSteps.ts           # 회원가입 마법사 스테퍼 상태 계산 (buildAuthSteps)
├── hooks/
│   ├── useFetch.ts               # 로딩/에러 상태 포함 공용 데이터 훅
│   └── useEmailAccountStep.ts    # 회원가입 "계정 정보" 단계 공용 로직 (이메일 인증+비밀번호)
├── components/
│   ├── layout/                # Header, Footer (홈 화면용)
│   ├── home/                   # HeroSection, AiBanner, PropertySection, PropertyCard
│   └── auth/                    # AuthLayout(모달+스테퍼), AuthForm.module.css(공용 폼 스타일),
│                                   EmailAccountFields(계정 정보 단계 공용 UI, 아래 4-3 참고)
├── pages/
│   ├── HomePage.tsx
│   ├── LoginPage.tsx              # /login
│   ├── FindIdPage.tsx             # /find-id
│   ├── FindPasswordPage.tsx       # /find-password
│   ├── SignupPage.tsx             # /signup (가입 유형 선택)
│   ├── SignupWizardPage.tsx       # /signup/user (일반 사용자 가입 마법사)
│   └── SignupAgentWizardPage.tsx  # /signup/realtor (공인중개사 가입 마법사)
├── App.tsx    # pathname 기준 임시 라우팅
└── index.tsx
```

`LoginPage`, `FindIdPage`, `FindPasswordPage`, `SignupPage`, `SignupWizardPage`, `SignupAgentWizardPage`
모두 `AuthLayout` + `AuthForm.module.css`를 공유합니다. Figma `/login`, `/sign_up` 모달(헤더 로고 +
흰 카드 + 상단바 + 아이콘 원 + 폼 + 하단 링크, 회원가입은 여기에 스테퍼까지) 컨벤션을 그대로
컴포넌트화한 것입니다.

## 4. 회원가입 마법사 — Figma 와이어프레임과 다르게 조정한 부분

### 4-1. 일반 사용자 (`/signup/user`)

`POST /users/signup`(`UserCreateReqDto`)은 **email + password만** 받고, `User` 엔티티에는
"아이디(별도 username)", "생년월일", "성별" 컬럼 자체가 없습니다. `name`/`phone`도 자유 텍스트로
저장하는 게 아니라 오직 실명 인증(PortOne)을 통해서만 채워지도록 설계돼 있습니다
(`User.verifyIdentity(name, phone)`). 그래서 Figma의 `/sign_up/commonuser/step2~5`를 그대로
옮기면 절반 가까운 입력값이 저장될 곳이 없는 상태라, 아래처럼 조정해서 구현했습니다.

| Figma 와이어프레임 | 구현 방식 |
|---|---|
| step2 "아이디"(4~20자 영문/숫자) | 이메일로 통일. 로그인 자체가 email 기준이라 별도 아이디 개념이 없음. "중복확인" 버튼은 실제 `POST /users/check-email`에 연결 |
| step2 "이름" 직접 입력 | 제거. 저장할 컬럼이 없고, 이름은 오직 아래 실명 인증에서만 채워짐 |
| step3 "생년월일" · "성별" | 제거. `User` 엔티티에 대응 컬럼이 없음 |
| step3 "휴대폰 번호" + step5 "본인인증 OTP" | "휴대폰 본인인증" 한 단계로 통합. 다만 백엔드의 실제 인증 방식은 문자 OTP 자체 구현이 아니라 **PortOne SDK 연동**이라, 지금은 "PortOne 본인인증 시작하기" 버튼이 안내만 띄우는 스텁입니다. PortOne 스토어 ID/채널 키가 준비되면 SDK 팝업 완료 후 받는 `identityVerificationId`를 `verifyIdentity()`에 넘기도록 교체하면 됩니다 (해당 함수는 `POST /users/me/verification`에 이미 연결돼 있습니다) |
| (와이어프레임에 없음) 이메일 인증 | `POST /users/signup`은 사전 이메일 인증이 필수라서, 계정 정보 단계에 이메일 인증번호 발송/확인 UI를 추가했습니다 (`POST /users/emails/verification-requests`, `POST /users/emails/verifications`) |
| step4 "약관 동의" | UI와 필수 체크 검증(서비스 이용약관·개인정보 수집은 필수)까지는 구현했지만, 동의 이력을 저장하는 API/컬럼이 백엔드에 없어서 **서버에는 전송되지 않는 클라이언트 전용 게이트**입니다. 법적으로 동의 이력을 남겨야 한다면 백엔드에 저장 테이블이 필요합니다 |
| `/sign_up` "공인 중개사" 카드 | 이번 요청 범위(Figma의 `commonuser` 스텝들)에 중개사용 와이어프레임이 없어 "준비 중" 배지만 달아두고 비활성화했습니다. 실제로는 `RealtorService.signUp`이 사업자등록증 등 서류 이미지 업로드가 필요한 완전히 다른 멀티파트 플로우라 별도 작업이 필요합니다 |

실제 가입 흐름(계정 정보 → 약관 동의)은 다음 순서로 진짜 API를 호출합니다:
`POST /users/signup` → `POST /users/login`(가입 응답에는 토큰이 없어서 바로 이어서 로그인) →
`saveTokens()` → (선택) 실명 인증 → 완료 화면.

### 4-2. 공인중개사 (`/signup/realtor`)

Figma에 `step2~4`(계정정보/개인정보/중개사정보)까지만 있고 `step5`(서류 제출)·`step6`(완료)는
없어서, 백엔드 `RealtorSignupReqDto`가 실제로 요구하는 내용에 맞춰 새로 설계해 추가했습니다.

| Figma 와이어프레임 | 구현 방식 |
|---|---|
| step3 "생년월일" · "성별" | 제거. `RealtorSignupReqDto`/`Agent` 엔티티 어디에도 대응 컬럼이 없음. 대신 DTO가 필수로 요구하는 "대표자 실명"(`name`) 필드를 새로 추가 — 중개사는 일반 사용자와 달리 PortOne 인증 없이 실명을 신고 형태로 직접 입력받는 구조 |
| step4 "중개사 등록번호" (예시: `11350-2024-00001`) | 백엔드 `businessNum`은 사업자등록번호 형식(`123-45-67890`, 정규식 `\d{3}-\d{2}-\d{5}`)만 허용합니다. 라벨은 그대로 두고 예시/검증 규칙만 백엔드에 맞게 교체 |
| step4 "사무소 주소" + "주소 검색" 버튼 | Kakao/Daum 우편번호 API 연동이 필요한데 아직 키가 없어서, 지금은 그냥 직접 입력하는 텍스트 필드입니다. `officeLatitude`/`officeLongitude`는 지도 API 없이는 만들 수 없어 이번엔 전송하지 않습니다 (백엔드에서도 선택값이라 비워도 가입에는 문제없음) |
| (Figma에 없음) step5 서류 제출 | 새로 추가. `POST /users/realtors`가 `multipart/form-data`로 `businessCertImage`(필수)·`agentCertImage`(필수)·`profileImage`(선택) 세 파일을 요구해서, 드래그앤드롭 스타일 업로드 UI를 기존 톤에 맞춰 만들었습니다 |
| (Figma에 없음) step6 완료 | 새로 추가. 가입 직후 `Agent.isVerified`가 `false`(관리자 승인 대기)라서, "승인 대기 중" 상태를 명확히 안내하는 화면으로 구성했습니다 |

가입 흐름은 일반 사용자와 동일한 이메일 인증(`checkEmailDuplicate`/`sendSignupEmailCode`/
`verifySignupEmailCode`)을 그대로 재사용하고, 마지막에 `signupRealtor()`(멀티파트 전송) →
`login()` → `saveTokens()` 순서로 진짜 API를 호출합니다. 사업자등록번호가 중복이면
(`REALTOR400_1`) "이미 등록된 사업자등록번호예요"로 안내합니다.

이 흐름은 진행 중인 작업이니, 서류 제출/완료 화면 디자인이 마음에 안 드시면 Figma에서 직접
다시 그려주시면 그쪽 디자인으로 코드도 다시 맞추겠습니다.

### 4-3. 공용화 (일반 사용자 ↔ 공인중개사 중복 제거)

두 마법사의 "계정 정보" 단계(이메일 중복확인 → 이메일 인증번호 발송/확인 → 비밀번호 검증)는
완전히 동일한 로직이라 각 페이지에 복붙돼 있었습니다. `useEmailAccountStep` 훅(상태+API 호출)과
`EmailAccountFields` 컴포넌트(그 상태를 그리는 JSX)로 뽑아내서 두 페이지가 공유하도록
리팩터링했습니다. 스테퍼 상태 계산도 `utils/authSteps.ts`의 `buildAuthSteps()`로 공용화했습니다.

- `SignupWizardPage.tsx`: 484줄 → 238줄
- `SignupAgentWizardPage.tsx`: 613줄 → 394줄

계정 정보 단계 UI/검증 로직을 고칠 일이 생기면 이제 `EmailAccountFields.tsx`/
`useEmailAccountStep.ts` 한 곳만 고치면 두 마법사에 동시에 반영됩니다. 나머지 단계(약관동의·
본인인증 vs 개인정보·중개사정보·서류제출)는 두 가입 유형이 실제로 다른 내용이라 각자 페이지에
그대로 남겨뒀습니다.

## 5. 백엔드 연동 현황 요약

**로그인 · 회원가입은 실제로 동작합니다.**
- `POST /users/login` — body `{ email, password }` → `TokenDto`
- `USER400_3`(존재하지 않는 이메일)/`USER400_4`(비밀번호 틀림) 모두 "아이디 또는 비밀번호가
  올바르지 않습니다"로 동일하게 안내 (계정 존재 여부 노출 방지)
- 회원가입은 `POST /users/check-email` → `POST /users/emails/verification-requests` →
  `POST /users/emails/verifications` → `POST /users/signup` → `POST /users/login` 순서로
  전부 실제 엔드포인트에 연결돼 있습니다. 자세한 조정 내역은 위 4번 표를 참고해주세요.

**아이디 찾기 / 비밀번호 찾기는 화면과 흐름만 완성되어 있고, 아직 서버에 연결되지 않습니다.**
현재 `UserController`에는 이 두 기능에 대응하는 API가 없습니다. 둘 다 인증번호 왕복 절차 없이
"입력한 정보가 가입 정보와 일치하면 이메일로 정보를 보내준다"는 1단계 흐름으로 설계했습니다:
- 아이디 찾기: 이름+이메일 일치 확인 → 그 이메일로 아이디(=이메일) 발송
- 비밀번호 찾기: 이름+아이디(이메일)+이메일 일치 확인 → 서버가 생성한 임시 비밀번호를
  그 이메일로 발송 (사용자는 로그인 후 반드시 비밀번호를 변경해야 함)
- `PATCH /users/me/password`는 로그인 상태에서 현재 비밀번호를 아는 사람만 쓸 수 있는 별개
  API라 여기엔 재사용할 수 없습니다
- 기존 `POST /users/emails/verification-requests`는 "가입 안 된 이메일"만 통과시키는
  회원가입 전용 검증이라 이 두 기능에는 그대로 못 씁니다

그래서 `authApi.ts`의 `findId`, `sendTemporaryPassword` 2개 함수는 전부 스텁입니다. 호출하면
항상 "아직 백엔드에 준비되지 않았어요" 에러가 사용자에게 그대로 보이도록 만들어뒀습니다
(화면이 깨지거나 무한 로딩되지 않고, 명확한 안내가 뜹니다).

백엔드에 대응 API가 추가되면 **`authApi.ts` 안의 저 2개 함수 본문만** 실제 `apiPost` 호출로
바꾸면 되고, 화면(`FindIdPage`/`FindPasswordPage`)의 상태 관리·유효성 검사 로직은 그대로
재사용할 수 있게 설계했습니다. 백엔드 팀과 아래 API 스펙 정도를 미리 논의해두시는 걸
추천합니다.

| 함수 | 제안 엔드포인트 | 용도 |
|---|---|---|
| `findId` | `POST /users/find-id` | 이름+이메일 일치 확인 후, 그 이메일로 아이디 발송 |
| `sendTemporaryPassword` | `POST /users/find-password` | 이름+아이디+이메일 일치 확인 후, 임시 비밀번호를 이메일로 발송 |

⚠️ 임시 비밀번호 발송 방식은 이메일 계정이 뚫리면 비밀번호까지 같이 뚫리는 구조라, 백엔드
구현 시 임시 비밀번호의 유효시간을 짧게 두거나 최초 로그인 시 비밀번호 변경을 강제하는 등의
보완을 함께 고려하시는 걸 권장합니다.

## 4. 임시 라우팅 안내

`react-router-dom`이 아직 설치되어 있지 않아 `App.tsx`가 `window.location.pathname`만 보고
Home/Login/아이디찾기/비밀번호찾기를 나눕니다. 모든 내부 링크가 `<a href>`라 클릭 시 전체
새로고침이 일어나는데, 지금 구조에서는 정상 동작입니다. 페이지가 더 늘어나기 전에
`npm install react-router-dom` 후 `BrowserRouter`/`Routes`로 교체하는 걸 추천합니다.

## 5. TODO (다음 스텝)

- 백엔드에 아이디/비밀번호 찾기 API 3~4번 표대로 추가 → `authApi.ts` 5개 함수 연결
- react-router 도입 → 전체 새로고침 없는 client-side 라우팅으로 교체
- 회원가입 페이지 제작 (`POST /users/signup`, 이메일 인증 2단계 포함) — Figma에 `/sign_up`
  스텝 프레임들이 이미 있으니 다음 작업으로 이어가면 됩니다
- 구글 로그인 SDK 연동 후 `POST /users/oauth/google` 연결
- accessToken 만료 시 `POST /users/refresh` 자동 재발급 (axios interceptor 등)
