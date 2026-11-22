import type {
  ComplaintAnalysis,
  ComplaintCategory,
  TimeOfDay,
} from "@/features/complaint/types";

/**
 * analysis 모듈: 민원 문장 → 유형·시간대·원인 시설
 *
 * - VITE_AI_API_URL이 있으면 유리님 AI 모듈에 POST로 보낸다.
 *   요청: { text, x, z, category }  응답: ComplaintAnalysis (source 제외)
 * - 없거나 실패하면 키워드 기반 목업으로 대신한다. (화면에 "목업"으로 표시)
 */

interface AnalyzeInput {
  text: string;
  x: number;
  z: number;
  category: ComplaintCategory;
}

const AI_API_URL = import.meta.env.VITE_AI_API_URL as string | undefined;

export async function analyzeComplaint(
  input: AnalyzeInput,
): Promise<ComplaintAnalysis> {
  if (AI_API_URL) {
    try {
      const res = await fetch(AI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        const data = (await res.json()) as Omit<ComplaintAnalysis, "source">;
        return { ...data, source: "ai" };
      }
    } catch {
      // 연결 실패 시 목업으로 진행
    }
  }
  await new Promise((r) => setTimeout(r, 700));
  return mockAnalyze(input);
}

const CATEGORY_KEYWORDS: [ComplaintCategory, string[]][] = [
  ["pet", ["강아지", "반려", "개 ", "배변", "짖"]],
  ["traffic", ["자전거", "킥보드", "유모차", "휠체어", "계단", "부딪", "좁아"]],
  ["smell", ["냄새", "쓰레기", "악취"]],
  ["light", ["조명", "가로등", "밝아", "어두"]],
  ["shade", ["그늘", "햇빛", "더워", "쉴 곳"]],
  ["noise", ["소리", "소음", "시끄", "함성", "울려"]],
];

const TIME_KEYWORDS: [TimeOfDay, string[]][] = [
  ["dawn", ["새벽", "아침", "오전"]],
  ["night", ["밤", "야간", "11시", "12시", "자정"]],
  ["evening", ["저녁", "퇴근"]],
  ["day", ["낮", "오후", "주말", "점심"]],
];

const FACILITY_KEYWORDS: [string, string[]][] = [
  ["court", ["농구", "공 튀", "코트"]],
  ["dogpark", ["반려견 놀이터", "애견"]],
  ["playground", ["놀이터"]],
  ["recycle", ["분리수거", "쓰레기", "수거"]],
  ["garden", ["정원", "벤치"]],
];

function matchFirst<T>(text: string, table: [T, string[]][]): T | undefined {
  return table.find(([, words]) => words.some((w) => text.includes(w)))?.[0];
}

export function mockAnalyze({
  text,
  category,
}: AnalyzeInput): ComplaintAnalysis {
  const detected = matchFirst(text, CATEGORY_KEYWORDS) ?? category;
  return {
    category: detected,
    timeOfDay: matchFirst(text, TIME_KEYWORDS) ?? "unknown",
    facilityId: matchFirst(text, FACILITY_KEYWORDS),
    summary: text.length > 22 ? `${text.slice(0, 22)}…` : text,
    source: "mock",
  };
}
