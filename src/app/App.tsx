import { useMemo, useState } from "react";
import { ComplaintBoard } from "@/features/complaint/ComplaintBoard";
import {
  ComplaintPhone,
  type PhoneTab,
} from "@/features/complaint/ComplaintPhone";
import { CATEGORIES } from "@/features/complaint/constants";
import type { ComplaintCategory } from "@/features/complaint/types";
import { toExport, useComplaints } from "@/features/complaint/useComplaints";
import { SimulatorSlot } from "@/features/site/SimulatorSlot";
import styles from "./App.module.css";

export function App() {
  const { complaints, addComplaint, loadSamples, clearAll } = useComplaints();
  const [filter, setFilter] = useState<ComplaintCategory | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [viewer, setViewer] = useState<"scenario" | "complaints">("scenario");
  const [phoneTab, setPhoneTab] = useState<PhoneTab>("new");
  const [phoneGlow, setPhoneGlow] = useState(false);

  const startDemo = () => {
    setPhoneTab("new");
    setPhoneGlow(true);
    window.setTimeout(() => setPhoneGlow(false), 1600);
    document
      .getElementById("resident-phone")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const counts = useMemo(() => {
    const base = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<
      ComplaintCategory,
      number
    >;
    for (const c of complaints) base[c.analysis?.category ?? c.category] += 1;
    return base;
  }, [complaints]);

  const visible = useMemo(
    () =>
      filter === "all"
        ? complaints
        : complaints.filter(
            (c) => (c.analysis?.category ?? c.category) === filter,
          ),
    [complaints, filter],
  );

  const myComplaints = useMemo(
    () => complaints.filter((c) => c.origin === "resident"),
    [complaints],
  );
  const residentCount = myComplaints.length;

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(toExport(complaints), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "complaints.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.wrap}>
      <header className={styles.top}>
        <span className={styles.logo}>
          <span className={styles.mark} aria-hidden="true">
            G
          </span>
          가든스테이트
        </span>
        <span className={styles.topNote}>
          2026 SVC Seoul AI 해커톤 · 주제 ② AI 아파트 조경공간 설계·시공 도우미
        </span>
      </header>

      <section id="demo" className={styles.demo}>
        <div className={styles.demoHead}>
          <div>
            <h2 className={styles.h2}>민원 한 건이 도면에 오르기까지</h2>
            <p className={styles.sub}>
              01 입주민 접수 → 02 조합·설계자 민원 지도에 바로 반영
            </p>
          </div>
          <div className={styles.tools}>
            <button type="button" className={styles.tool} onClick={startDemo}>
              민원 접수 체험하기
            </button>
            <button type="button" className={styles.tool} onClick={loadSamples}>
              입주민 민원 불러오기 (예시 30건)
            </button>
            <button
              type="button"
              className={`${styles.tool} ${styles.toolGhost}`}
              onClick={clearAll}
            >
              비우기
            </button>
          </div>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>전체 민원</span>
            <span className={styles.statValue}>{complaints.length}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>이번 시연에서 접수</span>
            <span className={styles.statValue}>{residentCount}</span>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={showHeatmap}
              onChange={(e) => {
                setShowHeatmap(e.target.checked);
                setViewer("complaints");
              }}
            />
            민원 지도 히트맵
          </label>
          <button
            type="button"
            className={styles.tool}
            onClick={downloadJson}
          >
            complaints.json 내보내기
          </button>
        </div>

        <div className={styles.columns}>
          <div className={styles.col}>
            <div className={styles.colHead}>
              <span className={styles.step}>01</span>
              <div>
                <div className={styles.colTitle}>입주민 화면</div>
                <div className={styles.colSub}>
                  my HILLS 마이 › 신청 › 민원에 위치·유형 태깅 추가 (기능 제안)
                </div>
              </div>
            </div>
            <div
              id="resident-phone"
              className={`${styles.phoneWrap} ${phoneGlow ? styles.glow : ""}`}
            >
              <ComplaintPhone
                myComplaints={myComplaints}
                tab={phoneTab}
                onTabChange={setPhoneTab}
                onSubmit={(c) => {
                  addComplaint(c);
                  setSelectedId(c.id);
                  setFilter("all");
                  setViewer("complaints");
                }}
              />
            </div>
            <p className={styles.phoneLegend}>
              <span className={styles.legendItem}>
                <i className={styles.legendOn}>●</i> 체험 가능: 민원접수 ·
                접수내역
              </span>
              <span className={styles.legendItem}>
                <i className={styles.legendOff}>●</i> 흐린 메뉴는 시연 범위 밖
              </span>
            </p>
          </div>

          <div className={styles.col}>
            <div className={styles.colHead}>
              <span className={styles.step}>02</span>
              <div>
                <div className={styles.colTitle}>조합·설계자 화면</div>
                <div className={styles.colSub}>
                  쌓인 민원을 단지 도면 위에서 확인
                </div>
              </div>
            </div>

            <div className={styles.client}>
              <SimulatorSlot
                view={viewer}
                onViewChange={setViewer}
                complaints={visible}
                showHeatmap={showHeatmap}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
              <ComplaintBoard
                complaints={visible}
                filter={filter}
                onFilter={setFilter}
                selectedId={selectedId}
                onSelect={(id) => {
                  setSelectedId(id);
                  setViewer("complaints");
                }}
                counts={counts}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>민원 기반 AI 조경 시각화 도우미</p>
        <h1 className={styles.title}>
          주민의 민원으로
          <br />
          정원의 상태를 읽어요
        </h1>
        <p className={styles.lead}>
          입주민이 남긴 민원에 위치와 유형을 붙여 모으면, 조합과 설계자가 같은
          도면 위에서 민원이 몰리는 곳을 보고 조경 계획을 고칠 수 있어요.
        </p>
        <div className={styles.heroActions}>
          <span className={styles.notice}>
            단지·민원은 모두 가상 데이터예요. 입력한 내용은 이 브라우저에만
            저장돼요.
          </span>
        </div>
      </section>

      <section className={styles.flow}>
        <h2 className={styles.h2}>데이터 흐름</h2>
        <ol className={styles.flowList}>
          <li>
            <b>complaint</b>
            <span>입주민이 위치·유형·내용을 남겨요</span>
          </li>
          <li>
            <b>analysis</b>
            <span>AI가 유형·시간대·원인 시설을 해석해요 (현재 목업)</span>
          </li>
          <li>
            <b>site</b>
            <span>
              단지 좌표 위에 핀·히트맵으로 표시해요
            </span>
          </li>
          <li>
            <b>proposal</b>
            <span>
              민원 위험이 낮은 A/B/C안을 비교하고 투표해요 (예시 설계안)
            </span>
          </li>
        </ol>
      </section>

      <footer className={styles.footer}>
        가든스테이트 · 2026 SVC Seoul AI 해커톤 with 현대건설 · 프로토타입 (가상
        데이터)
      </footer>
    </div>
  );
}
