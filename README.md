# 📚 팀 사내 위키 (Team Wiki)

> 팀에서 자주 사용하는 업무 도구와 문서 링크를 한곳에 모아, 팀원이 필요한 자료를 빠르게 찾을 수 있도록 지원하는 사내 위키 웹 서비스입니다.

---

## 🌟 프로젝트 개요

- **목적**: 메신저와 개인 북마크에 흩어진 업무 도구 및 문서 링크를 통합 관리하고, 빠른 검색과 담당자 확인을 통해 불필요한 커뮤니케이션 비용을 줄입니다.
- **데이터 기반 아키텍처**: 별도의 데이터베이스나 복잡한 백엔드 없이 `wiki-data.json` 파일을 통해 위키 항목과 카테고리를 손쉽게 관리할 수 있습니다.
- **깔끔한 UI/UX**: 좌측 고정 사이드바 레이아웃과 Lucide Icons 기반의 전문적인 디자인 시스템, 모바일 반응형 환경을 제공합니다.

---

## 🚀 주요 기능

1. **2열 사이드바 카테고리 네비게이션**
   - 8개 카테고리(기획, 디자인, 개발, 인사, 경비, 협업, 브랜드, 고객응대)별 실시간 카운트 뱃지 및 바로가기
   - 현재 선택된 카테고리 하이라이팅 및 전체 보기 지원
   - 모바일 환경에서는 상단 수평 터치 스크롤 메뉴로 자동 최적화

2. **실시간 스마트 검색 & 하이라이팅**
   - 링크 이름, 설명, 담당자, 카테고리명을 기준으로 실시간 다중 조건 필터링
   - 검색 키워드 일치 부분 자동 노란색 하이라이팅(`<mark>`)
   - 키보드 단축키 지원 (`⌘K` / `Ctrl+K` 또는 `/` 키로 검색창 포커스, `ESC`로 초기화)
   - 검색어 지우기 버튼 및 검색 결과 통계 바 제공

3. **신뢰성 있는 메타데이터 카드**
   - 각 링크의 명확한 사용 목적/상황 설명
   - 문의처/담당자 배지 및 최종 업데이트 일자 표시
   - 새 창(`target="_blank"`) 외부 링크 이동

4. **친절한 예외 처리 (Empty State)**
   - 일치하는 검색 결과가 없을 시 검색어 초기화 및 담당자 문의 액션 안내
   - 상단 공지 배너 및 하단 서포트 문의 위젯 탑재

5. **신규 입사자 부서별 온보딩 체크리스트 (`onboarding.html`)**
   - 부서별 맞춤 링크 접속 (`?dept=engineering`, `design`, `planning`, `operations`, `all`)
   - 카테고리 단위 아코디언 및 "'ㅇㅇㅇ' 관련 문서는 여기서 확인하세요" 친절한 안내 문구
   - 세부 문서별 개별 체크박스 + 카테고리 일괄 체크 지원
   - 실시간 온보딩 달성률 프로그레스 바 & `localStorage` 기반 상태 자동 저장

---

## 🛠 기술 스택

| 분류 | 기술 |
| :--- | :--- |
| **화면 구조** | 시맨틱 HTML5 |
| **스타일 & 반응형** | 모던 CSS (CSS Variables, Flexbox, Grid, Media Queries) |
| **동적 로직 & 검색** | 바닐라 JavaScript (ES6+) |
| **아이콘 시스템** | [Lucide Icons](https://lucide.dev/) (CDN) |
| **타이포그래피** | Pretendard, Plus Jakarta Sans (Google Fonts) |
| **데이터 스토리지** | `wiki-data.json`, `localStorage` (온보딩 진행 상태) |
| **버전 관리 & 배포** | Git, GitHub, Vercel / GitHub Pages (정적 호스팅) |

---

## 📁 프로젝트 구조

```text
team-wiki/
├── docs/
│   └── wiki-plan.md     # 사내 위키 프로젝트 기획서
├── app.js               # 메인 위키: 데이터 로드, 실시간 검색/필터링 및 렌더링 스크립트
├── index.html           # 메인 위키 웹페이지
├── onboarding.html      # 신규 입사자 전용 부서별 온보딩 체크리스트 웹페이지
├── onboarding.js        # 온보딩 체크리스트 로직, 아코디언, 프로그레스 및 localStorage 연동
├── onboarding.css       # 온보딩 페이지 전용 스타일시트
├── style.css            # 공통 디자인 시스템, 사이드바 그리드 및 반응형 스타일
├── wiki-data.json       # 위키 카테고리 및 링크 데이터셋
└── README.md            # 프로젝트 안내 문서
```

---

## 📊 데이터 수정 가이드 (`wiki-data.json`)

위키의 모든 데이터는 `wiki-data.json` 파일에서 관리됩니다. 새로운 카테고리나 링크를 추가하려면 아래 스키마 형식에 맞춰 JSON을 수정하면 화면에 자동 반영됩니다.

```json
{
  "version": 1,
  "notice": "상단 공지 배너 문구",
  "updatedAt": "2026-08-29",
  "support": {
    "message": "하단 서포트 안내 문구",
    "contact": "운영 담당"
  },
  "categories": [
    {
      "id": "engineering",
      "name": "개발과 엔지니어링",
      "items": [
        {
          "id": "api-docs",
          "title": "API 명세서 (Swagger)",
          "description": "백엔드 API 엔드포인트 및 요청/응답 스키마를 확인하는 문서입니다.",
          "url": "https://example.com/api-docs",
          "contact": "개발 담당",
          "updatedAt": "2026-08-29"
        }
      ]
    }
  ]
}
```

---

## 💻 로컬 실행 방법

정적 웹 애플리케이션이므로 별도의 빌드 단계 없이 로컬 웹 서버를 실행하여 바로 확인할 수 있습니다.

```bash
# Python 3 내장 웹 서버 실행 (권장)
python3 -m http.server 8088

# 또는 Node.js npx serve 실행
npx serve .
```

브라우저에서 `http://localhost:8088`에 접속하여 위키 페이지를 확인하세요.

---

## 🌐 배포 안내

- **GitHub Pages**: 저장소 Settings > Pages > `main` 브랜치 `/ (root)` 지정 후 배포
- **Vercel**: GitHub 저장소를 Vercel 프로젝트로 Import하면 추가 빌드 설정 없이 즉시 글로벌 CDN으로 배포됩니다.
