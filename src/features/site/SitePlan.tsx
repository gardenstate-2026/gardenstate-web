import { useRef, type MouseEvent } from "react";
import { CATEGORY_META } from "@/features/complaint/constants";
import type { Complaint } from "@/features/complaint/types";
import {
  BUILDINGS,
  FACILITIES,
  FACILITY_COLOR,
  PATHS,
  SITE_BOUNDS,
  TREES,
} from "./siteData";
import styles from "./SitePlan.module.css";

interface SitePlanProps {
  complaints?: Complaint[];
  /** 위치 선택 모드: 클릭한 단지 좌표(m)를 넘겨준다 */
  onPick?: (point: { x: number; z: number }) => void;
  picked?: { x: number; z: number } | null;
  showHeatmap?: boolean;
  showPins?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  compact?: boolean;
}

const { minX, maxX, minZ, maxZ } = SITE_BOUNDS;
const WIDTH = maxX - minX;
const DEPTH = maxZ - minZ;

/** 위에서 내려다본 단지 배치도 (SVG, 단위 m) */
export function SitePlan({
  complaints = [],
  onPick,
  picked,
  showHeatmap = false,
  showPins = true,
  selectedId,
  onSelect,
  compact = false,
}: SitePlanProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleClick = (e: MouseEvent<SVGSVGElement>) => {
    if (!onPick || !svgRef.current) return;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(
      ctm.inverse(),
    );
    const x = Math.round(Math.min(maxX, Math.max(minX, pt.x)) * 10) / 10;
    const z = Math.round(Math.min(maxZ, Math.max(minZ, pt.y)) * 10) / 10;
    onPick({ x, z });
  };

  const label = compact ? 3.2 : 2.6;

  return (
    <svg
      ref={svgRef}
      className={`${styles.plan} ${onPick ? styles.pickable : ""}`}
      viewBox={`${minX} ${minZ} ${WIDTH} ${DEPTH}`}
      onClick={handleClick}
      role="img"
      aria-label="단지 배치도"
    >
      <defs>
        <radialGradient id="heat">
          <stop offset="0%" stopColor="var(--heat)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--heat)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect
        x={minX}
        y={minZ}
        width={WIDTH}
        height={DEPTH}
        className={styles.ground}
      />

      {PATHS.map((p) => (
        <polyline
          key={p.id}
          points={p.points.map(([x, z]) => `${x},${z}`).join(" ")}
          className={styles.path}
        />
      ))}

      {FACILITIES.map((f) => (
        <g key={f.id}>
          <rect
            x={f.x - f.width / 2}
            y={f.z - f.depth / 2}
            width={f.width}
            height={f.depth}
            rx={1.5}
            fill={FACILITY_COLOR[f.kind]}
            className={styles.facility}
          />
          <text
            x={f.x}
            y={f.z + 1}
            className={styles.facilityLabel}
            fontSize={label}
          >
            {f.name}
          </text>
        </g>
      ))}

      {TREES.map(([x, z], i) => (
        <circle key={i} cx={x} cy={z} r={1.8} className={styles.tree} />
      ))}

      {BUILDINGS.map((b) => (
        <g key={b.id}>
          <rect
            x={b.x - b.width / 2}
            y={b.z - b.depth / 2}
            width={b.width}
            height={b.depth}
            rx={1}
            className={styles.building}
          />
          <text
            x={b.x}
            y={b.z + 1}
            className={styles.buildingLabel}
            fontSize={label + 0.4}
          >
            {b.name}
          </text>
        </g>
      ))}

      {showHeatmap && (
        <g style={{ mixBlendMode: "multiply" }} pointerEvents="none">
          {complaints.map((c) => (
            <circle
              key={`h-${c.id}`}
              cx={c.x}
              cy={c.z}
              r={11}
              fill="url(#heat)"
            />
          ))}
        </g>
      )}

      {showPins &&
        complaints.map((c) => {
          const category = c.analysis?.category ?? c.category;
          const selected = c.id === selectedId;
          return (
            <g
              key={c.id}
              transform={`translate(${c.x} ${c.z})`}
              className={styles.pin}
              onClick={(e) => {
                if (!onSelect) return;
                e.stopPropagation();
                onSelect(c.id);
              }}
            >
              {selected && <circle r={3.6} className={styles.pinRing} />}
              <circle
                r={selected ? 2.2 : 1.6}
                fill={CATEGORY_META[category].color}
                className={styles.pinDot}
              />
            </g>
          );
        })}

      {picked && (
        <g
          transform={`translate(${picked.x} ${picked.z})`}
          pointerEvents="none"
        >
          <path
            d="M0 0 C-3 -4 -3.4 -6.2 -3.4 -7.4 A3.4 3.4 0 0 1 3.4 -7.4 C3.4 -6.2 3 -4 0 0Z"
            className={styles.marker}
          />
          <circle cy={-7.4} r={1.3} className={styles.markerDot} />
        </g>
      )}
    </svg>
  );
}
