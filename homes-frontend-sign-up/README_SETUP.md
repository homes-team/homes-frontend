# 홈즈 프론트엔드 — 홈/로그인/회원가입 (TypeScript + react-router)

Figma `WireFrame` 페이지 디자인을 그대로 구현한 코드입니다. CRA 프로젝트 루트에 덮어쓰면 됩니다.

## 1. 최초 세팅

```bash
npm install --save typescript@4.9.5 @types/node @types/react @types/react-dom @types/jest
npm install react-router-dom
rm src/App.js src/index.js src/App.css src/index.css src/App.test.js src/logo.svg
```

⚠️ typescript는 반드시 `4.9.5`처럼 4.x로 버전을 고정하세요 (react-scripts 5 호환 문제).
이번에 **`react-router-dom`을 새로 설치**해야 합니다 — 지금까지는 `window.location.pathname`을
직접 보는 임시 라우팅이었는데, 이번 요청으로 정식 `BrowserRouter`/`Routes`로 교체했습니다.

이후 이 폴더의 `src/`, `tsconfig.json`, `.env.example`을 프로젝트 루트에 복사하고
`.env.example`을 `.env`로 복사한 뒤 백엔드 주소를 맞춰줍니다.

## 2. 이번에 바뀐 것 — 라우터

- `App.tsx`가 `BrowserRouter` + `Routes` + `Route`로 완전히 바뀌었습니다. 더 이상 페이지 이동 시
  전체 새로고침이 일어나지 않습니다.
- 모든 내부 링크(`Header`, `AuthLayout`, `LoginPage`, `FindIdPage`, `FindPasswordPage`,
  `SignupPage`, `SignupWizardPage`, `SignupAgentWizardPage`, `EmailAccountFields`,
  `PropertySection`)를 `<a href>` → `react-router-dom`의 `<Link to>`로 교체했습니다.
- 로그인/회원가입 성공 후 리다이렉트도 `window.location.href = '/'` → `useNavigate()`의
  `navigate('/')`로 교체했습니다 (역시 새로고침 없이 이동).
- 정의되지 않은 경로는 `<Route path="*">`로 홈에 매핑해뒀습니다.

라우트 목록: `/`, `/login`, `/find-id`, `/find-password`, `/signup`, `/signup/user`,
`/signup/realtor`.

## 3. 중개사 이미지 업로드 — Presigned URL 방식으로 전환했습니다

백엔드도 지금 Presigned URL 발급 API를 새로 만드는 중이라고 확인해주셔서, 프론트를 먼저
그 방식에 맞춰 구현해뒀습니다.

**흐름**: 서류 제출 단계에서 "제출하고 가입 완료"를 누르면 —
1. `api/uploadApi.ts`의 `uploadImage(file, directory)`가 각 파일(사업자등록증 → 중개사무소
   등록증 → 프로필 사진 순서)마다 Presigned URL을 발급받아 S3에 직접 PUT 업로드하고, 최종
   공개 URL을 돌려받습니다. 버튼에 "사업자등록증 업로드 중...", "중개사무소 등록증 업로드
   중..." 처럼 진행 상태가 그대로 표시됩니다.
2. 업로드가 끝나면 원본 파일이 아니라 **URL 문자열만** `signupRealtor()`에 담아 JSON으로
   전송합니다 (더 이상 멀티파트 전송이 아닙니다).

**⚠️ 백엔드와 반드시 맞춰야 할 잠정 스펙 2가지**

아직 백엔드 API가 나오기 전이라, 아래 두 부분은 제가 합리적으로 추정한 값입니다. 백엔드
엔드포인트가 확정되면 이 두 곳만 고치면 전체가 맞아떨어지도록 설계해뒀습니다.

1. **Presigned URL 발급 API** (`api/uploadApi.ts`의 `requestPresignedUploadUrl`)
   - 잠정 경로: `POST /images/presigned-url` (로그인 필요 가정)
   - 잠정 요청: `{ fileName, contentType, directory }`
   - 잠정 응답: `{ uploadUrl, fileUrl }` — `uploadUrl`은 S3에 PUT할 임시 URL, `fileUrl`은 업로드 후 DB에 저장할 최종 URL
2. **중개사 회원가입 DTO 필드명** (`types/auth.ts`의 `RealtorSignupRequest`)
   - 잠정: `businessCertImageUrl`, `agentCertImageUrl`, `profileImageUrl` (문자열)
   - 실제 `RealtorSignupReqDto`가 이 이름 그대로 가는지, 아니면 다른 이름을 쓰는지 확인 필요

백엔드 API 명세가 나오면 알려주세요 — 두 파일만 맞춰서 바로 반영하겠습니다.

## 4. 폴더 구조

```
src/
├── api/
│   ├── client.ts        # ApiResponse 언래핑(apiGet/apiPost/apiPostForm), JWT 헤더, ApiError
│   ├── propertyApi.ts   # GET /properties, /properties/surge-rankings
│   ├── userApi.ts       # GET /users/me/recent-views
│   ├── uploadApi.ts     # Presigned URL 발급 + S3 직접 업로드 (중개사 서류/프로필 이미지)
│   └── authApi.ts       # 로그인/회원가입/이메일인증/실명인증/중개사가입(전부 실제 API) + 아이디/비번 찾기 스텁
├── types/
│   ├── api.ts             # ApiResponse<T>
│   ├── property.ts        # PropertyListItem, PropertyType, TradeType + 라벨
│   └── auth.ts             # LoginRequest, TokenDto, SignupRequest, SignupResult,
│                              IdentityVerificationResult, RealtorSignupRequest, RealtorSignupResult
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
│                                   EmailAccountFields(계정 정보 단계 공용 UI)
├── pages/
│   ├── HomePage.tsx
│   ├── LoginPage.tsx              # /login
│   ├── FindIdPage.tsx             # /find-id
│   ├── FindPasswordPage.tsx       # /find-password
│   ├── SignupPage.tsx             # /signup (가입 유형 선택)
│   ├── SignupWizardPage.tsx       # /signup/user (일반 사용자 가입 마법사)
│   └── SignupAgentWizardPage.tsx  # /signup/realtor (공인중개사 가입 마법사)
├── App.tsx    # BrowserRouter + Routes
└── index.tsx
```

## 5. 백엔드 연동 현황 요약

**실제로 동작하는 것**
- 로그인(`POST /users/login`)
- 일반 회원가입 전체 흐름: 이메일 중복확인 → 이메일 인증 → 가입 → 자동 로그인
- 중개사 회원가입 전체 흐름: 위와 동일 + 개인정보/중개사정보/서류 업로드(멀티파트) → 가입 → 자동 로그인
- 사업자등록번호 중복(`REALTOR400_1`) 등 주요 에러 코드 분기 안내

**아직 스텁인 것**
- 아이디 찾기 / 비밀번호 찾기 — 백엔드에 대응 API가 없어서 호출하면 "아직 준비되지 않았어요"로 안내
- 실명 인증(PortOne) — 실제 API(`POST /users/me/verification`)는 연결돼 있지만 PortOne SDK가
  없어서 버튼을 눌러도 안내만 뜸
- 구글 로그인 — 정확한 URL(`POST /users/oauth/google`)은 확인했지만 OAuth SDK 미연동으로 버튼 비활성

**세션 관리 갭 (회원가입 범위 밖, 다음 작업 후보)**
- `POST /users/refresh` (토큰 재발급) 미연동 — 지금은 액세스 토큰 만료 시 그냥 로그아웃됨
- `POST /users/logout` 미연동 — 로그아웃 버튼/기능 없음
- `PATCH /users/me/password` (로그인 상태 비밀번호 변경) 미연동 — 마이페이지 없음

## 6. TODO (다음 스텝)
- 중개사 이미지 업로드: 백엔드 Presigned URL API 나오는 대로 `uploadApi.ts`/`RealtorSignupRequest` 필드명 최종 확정
- 백엔드에 아이디/비밀번호 찾기 API 추가 → `authApi.ts` 스텁 연결
- 회원가입 온보딩: 닉네임/사용목적(투자·전세 등) 입력을 어느 API로 받을지 백엔드팀과 확인 후 마법사 뒤에 이어붙이기
- 구글 로그인 SDK 연동 → `POST /users/oauth/google` 연결
- 로그아웃/토큰 재발급/마이페이지 비밀번호 변경 기능 추가
