/**
 * 샘플 단지 데이터 (단위: m)
 *
 * 좌표계 (유리님 3D와 공유하는 약속)
 * - 원점(0, 0) = 단지 중앙
 * - x: 동쪽(오른쪽)이 +
 * - z: 남쪽(아래쪽)이 +   ← 위에서 내려다본 배치도 기준
 * - 단지 범위: x -60 ~ 60, z -40 ~ 40
 *
 * 3D 쪽에서는 (x, z)를 바닥 평면 좌표로 그대로 쓰면 된다.
 * 해커톤 당일 스케치업 모델로 바꿀 때도 이 좌표계에 맞춰 내보낸다.
 */

export interface Bounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface Building {
  id: string;
  name: string;
  x: number;
  z: number;
  width: number;
  depth: number;
}

export type FacilityKind =
  "playground" | "court" | "dogpark" | "recycle" | "garden";

export interface Facility {
  id: string;
  name: string;
  kind: FacilityKind;
  x: number;
  z: number;
  width: number;
  depth: number;
}

export const SITE_BOUNDS: Bounds = { minX: -60, maxX: 60, minZ: -40, maxZ: 40 };

export const BUILDINGS: Building[] = [
  { id: "101", name: "101동", x: -36, z: -27, width: 30, depth: 11 },
  { id: "102", name: "102동", x: 36, z: -27, width: 30, depth: 11 },
  { id: "103", name: "103동", x: -36, z: 28, width: 30, depth: 11 },
  { id: "104", name: "104동", x: 36, z: 28, width: 30, depth: 11 },
];

export const FACILITIES: Facility[] = [
  {
    id: "playground",
    name: "놀이터",
    kind: "playground",
    x: 0,
    z: -3,
    width: 18,
    depth: 13,
  },
  {
    id: "court",
    name: "농구장",
    kind: "court",
    x: 43,
    z: 1,
    width: 17,
    depth: 12,
  },
  {
    id: "dogpark",
    name: "반려견 놀이터",
    kind: "dogpark",
    x: -43,
    z: 1,
    width: 17,
    depth: 12,
  },
  {
    id: "recycle",
    name: "분리수거장",
    kind: "recycle",
    x: 0,
    z: 31,
    width: 9,
    depth: 6,
  },
  {
    id: "garden",
    name: "중앙 정원",
    kind: "garden",
    x: 0,
    z: 15,
    width: 26,
    depth: 8,
  },
];

/** 산책로 (폴리라인) */
export const PATHS: { id: string; name: string; points: [number, number][] }[] =
  [
    {
      id: "loop",
      name: "순환 산책로",
      points: [
        [-56, -14],
        [56, -14],
        [56, 18],
        [-56, 18],
        [-56, -14],
      ],
    },
    {
      id: "center",
      name: "중앙 보행로",
      points: [
        [0, -40],
        [0, 40],
      ],
    },
  ];

export const TREES: [number, number][] = [
  [-50, -8],
  [-38, -7],
  [-26, -9],
  [-15, -7],
  [15, -8],
  [27, -7],
  [52, -8],
  [-50, 10],
  [-30, 12],
  [-20, 9],
  [20, 10],
  [30, 12],
  [52, 10],
  [-16, 22],
  [16, 22],
  [-9, 35],
  [10, 36],
];

export const FACILITY_COLOR: Record<FacilityKind, string> = {
  playground: "var(--fac-playground)",
  court: "var(--fac-court)",
  dogpark: "var(--fac-dogpark)",
  recycle: "var(--fac-recycle)",
  garden: "var(--fac-garden)",
};

export function findFacility(id?: string) {
  return id ? FACILITIES.find((f) => f.id === id) : undefined;
}

/** 좌표에서 가장 가까운 동 이름 (민원 카드 표시용) */
export function nearestBuildingName(x: number, z: number): string {
  let best = BUILDINGS[0];
  let bestDist = Infinity;
  for (const b of BUILDINGS) {
    const d = (b.x - x) ** 2 + (b.z - z) ** 2;
    if (d < bestDist) {
      best = b;
      bestDist = d;
    }
  }
  return best.name;
}
