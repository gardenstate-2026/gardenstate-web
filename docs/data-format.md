# 민원 데이터 형식 (v1)

웹(민원 접수)과 3D 시뮬레이터, AI 모듈이 주고받는 약속이에요.
타입 원본: `src/features/complaint/types.ts`

## 좌표계

- 단위: m, 위에서 내려다본 배치도 기준
- 원점 `(0, 0)` = 단지 중앙
- `x`: 동쪽(오른쪽)이 +, 범위 -60 ~ 60
- `z`: 남쪽(아래쪽)이 +, 범위 -40 ~ 40
- 3D에서는 `(x, z)`를 바닥 평면 좌표로 그대로 쓰면 돼요.

건물·시설 위치는 `src/features/site/siteData.ts`에 있어요.

## complaints.json

```json
{
  "version": 1,
  "site": "gardenstate-sample",
  "generatedAt": "2026-11-23T12:00:00.000Z",
  "complaints": [
    {
      "id": "sample-01",
      "createdAt": "2026-11-20T12:00:00.000Z",
      "x": 42,
      "z": 9,
      "category": "noise",
      "text": "104동 앞 농구장에서 밤 11시까지 공 튀기는 소리가 나요",
      "hasPhoto": true,
      "origin": "sample",
      "analysis": {
        "category": "noise",
        "timeOfDay": "night",
        "facilityId": "court",
        "summary": "104동 앞 농구장에서 밤 11시까지 공 튀기는…",
        "source": "mock"
      }
    }
  ]
}
```

| 필드              | 값                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `category`        | `noise` 소음 · `pet` 반려견 · `traffic` 통행 · `smell` 냄새 · `light` 조명 · `shade` 그늘 · `etc` 기타 |
| `timeOfDay`       | `dawn` 새벽·아침 · `day` 주간 · `evening` 저녁 · `night` 야간 · `unknown`                              |
| `facilityId`      | `playground` · `court` · `dogpark` · `recycle` · `garden` (없으면 생략)                                |
| `origin`          | `resident` 시연 중 접수 · `sample` 예시 데이터                                                         |
| `analysis.source` | `ai` 실제 AI · `mock` 키워드 목업                                                                      |

예시 파일: `public/data/complaints.sample.json`

## 3D 시뮬레이터 연결 (postMessage)

`.env`에 `VITE_SIMULATOR_URL`을 넣으면 조합·설계자 화면에 iframe으로 띄우고,
민원이 바뀔 때마다 아래 메시지를 보내요.

```js
{ type: "gardenstate:complaints", payload: { ...complaints.json, showHeatmap: true } }
```

3D 쪽에서 받는 예:

```js
window.addEventListener("message", (e) => {
  if (e.data?.type !== "gardenstate:complaints") return;
  const { complaints, showHeatmap } = e.data.payload;
  // complaints[i].x, complaints[i].z 위치에 핀/히트맵 그리기
});
```

## AI 모듈 연결 (HTTP)

`.env`에 `VITE_AI_API_URL`을 넣으면 민원 접수 시 POST로 보내요. 실패하면 목업으로 대신해요.

- 요청: `{ "text": "...", "x": 42, "z": 9, "category": "noise" }`
- 응답: `{ "category": "noise", "timeOfDay": "night", "facilityId": "court", "summary": "..." }`
