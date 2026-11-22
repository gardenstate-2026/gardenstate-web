/**
 * 민원 데이터 형식 (v1)
 * 유리님 3D 시뮬레이터와 주고받는 약속이다. 바꿀 때는 docs/data-format.md도 같이 고친다.
 */

export type ComplaintCategory =
  "noise" | "pet" | "traffic" | "smell" | "light" | "shade" | "etc";

export type TimeOfDay = "dawn" | "day" | "evening" | "night" | "unknown";

/** AI(지금은 목업)가 민원 문장을 해석한 결과 */
export interface ComplaintAnalysis {
  category: ComplaintCategory;
  timeOfDay: TimeOfDay;
  /** 원인으로 추정되는 시설 id (features/site/siteData.ts의 FACILITIES) */
  facilityId?: string;
  summary: string;
  /** "ai" = 실제 AI 모듈, "mock" = 키워드 목업 */
  source: "ai" | "mock";
}

export interface Complaint {
  id: string;
  /** ISO 8601 */
  createdAt: string;
  /** 단지 좌표 (m). 좌표계는 siteData.ts 주석 참고 */
  x: number;
  z: number;
  /** 입주민이 직접 고른 유형 */
  category: ComplaintCategory;
  text: string;
  /** 사진 첨부 여부 (프로토타입은 이미지를 저장하지 않는다) */
  hasPhoto: boolean;
  analysis?: ComplaintAnalysis;
  /** "resident" = 이번 시연에서 접수, "sample" = 예시 데이터 */
  origin: "resident" | "sample";
}

/** 3D 시뮬레이터로 넘기는 묶음 */
export interface ComplaintExport {
  version: 1;
  site: string;
  generatedAt: string;
  complaints: Complaint[];
}
