# 날씨 웹앱

탭 모드는 넓은 가로 화면에서 처음 열 때 기본으로 선택됩니다. 화면 상단에서 모드를 바꿀 수 있으며 브라우저가 선택을 기억합니다.

- 오늘 및 주간 예보: [Open-Meteo](https://open-meteo.com/). 두 지역의 예보를 한 요청으로 불러옵니다.
- 서울 미세먼지: 서울시 실시간 자치구별 대기환경 현황 (OA-1200, RealtimeCityAir). Vercel에 `SEOUL_AIR_API_KEY`를 설정하거나 기존 `NEXT_PUBLIC_SEOUL_FINE_DUST_API_KEY`를 사용합니다. 기존 키로 조회할 수 없는 경우 OA-1200 조회 권한이 있는 키를 설정하세요.
- 꽃가루: 기존 기상청 API. 오늘 값이 없으면 –로 표시합니다.
- 경계 데이터: [southkorea/seoul-maps](https://github.com/southkorea/seoul-maps), KOSTAT 2013 간략화 지오메트리 (Apache 2.0).
