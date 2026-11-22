import { findFacility, nearestBuildingName } from "@/features/site/siteData";
import { CATEGORIES, CATEGORY_META, TIME_LABEL } from "./constants";
import type { Complaint, ComplaintCategory } from "./types";
import styles from "./ComplaintBoard.module.css";

interface ComplaintBoardProps {
  complaints: Complaint[];
  filter: ComplaintCategory | "all";
  onFilter: (f: ComplaintCategory | "all") => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  counts: Record<ComplaintCategory, number>;
}

/** 조합·설계자 화면의 민원 목록 + 유형 필터 */
export function ComplaintBoard({
  complaints,
  filter,
  onFilter,
  selectedId,
  onSelect,
  counts,
}: ComplaintBoardProps) {
  return (
    <div className={styles.board}>
      <div className={styles.filters}>
        <button
          type="button"
          className={`${styles.filter} ${filter === "all" ? styles.on : ""}`}
          onClick={() => onFilter("all")}
        >
          전체
        </button>
        {CATEGORIES.filter((c) => counts[c] > 0).map((c) => (
          <button
            type="button"
            key={c}
            className={`${styles.filter} ${filter === c ? styles.on : ""}`}
            onClick={() => onFilter(c)}
          >
            <i
              className={styles.dot}
              style={{ background: CATEGORY_META[c].color }}
            />
            {CATEGORY_META[c].label} {counts[c]}
          </button>
        ))}
      </div>

      {complaints.length === 0 ? (
        <p className={styles.empty}>
          아직 민원이 없어요. 왼쪽 화면에서 첫 민원을 접수해 보세요.
        </p>
      ) : (
        <ul className={styles.list}>
          {complaints.map((c) => {
            const a = c.analysis;
            const cat = a?.category ?? c.category;
            const facility = findFacility(a?.facilityId);
            return (
              <li key={c.id}>
                <button
                  type="button"
                  className={`${styles.item} ${c.id === selectedId ? styles.selected : ""}`}
                  onClick={() => onSelect(c.id)}
                >
                  <span className={styles.itemHead}>
                    <span
                      className={styles.cat}
                      style={{ color: CATEGORY_META[cat].color }}
                    >
                      {CATEGORY_META[cat].label}
                    </span>
                    <span className={styles.meta}>
                      {nearestBuildingName(c.x, c.z)}
                      {facility ? ` · ${facility.name}` : ""}
                      {a ? ` · ${TIME_LABEL[a.timeOfDay]}` : ""}
                    </span>
                    {c.origin === "resident" && (
                      <span className={styles.newTag}>방금 접수</span>
                    )}
                  </span>
                  <span className={styles.text}>{c.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
