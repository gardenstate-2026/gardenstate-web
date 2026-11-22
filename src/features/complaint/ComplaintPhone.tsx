import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { analyzeComplaint } from "@/features/analysis/analyzeComplaint";
import { SitePlan } from "@/features/site/SitePlan";
import { findFacility, nearestBuildingName } from "@/features/site/siteData";
import { createId } from "@/shared/lib/storage";
import { CATEGORIES, CATEGORY_META, TIME_LABEL } from "./constants";
import type { Complaint, ComplaintCategory } from "./types";
import styles from "./ComplaintPhone.module.css";

export type PhoneTab = "new" | "history";

interface ComplaintPhoneProps {
  /** 이 기기에서 접수한 민원 (접수내역 탭에 표시) */
  myComplaints: Complaint[];
  onSubmit: (complaint: Complaint) => void;
  tab: PhoneTab;
  onTabChange: (tab: PhoneTab) => void;
}

type Step = "form" | "analyzing" | "done";

const LOCKED_MESSAGE =
  "시연에서는 민원접수(조경·공용시설)와 접수내역만 이용할 수 있어요";

/**
 * my HILLS 민원 접수에 위치·유형 태깅을 추가한 제안 화면.
 * 실제 my HILLS 앱의 화면 구성(상단 밑줄 탭, 회색 카드, 버건디 하단 바)과 컬러를 그대로 재현한 콘셉트 목업이다.
 */
export function ComplaintPhone({
  myComplaints,
  onSubmit,
  tab: subTab,
  onTabChange: setSubTab,
}: ComplaintPhoneProps) {
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | undefined>(undefined);
  const [point, setPoint] = useState<{ x: number; z: number } | null>(null);
  const [category, setCategory] = useState<ComplaintCategory | null>(null);
  const [text, setText] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [result, setResult] = useState<Complaint | null>(null);

  const reset = () => {
    setPoint(null);
    setCategory(null);
    setText("");
    setHasPhoto(false);
    setError("");
    setResult(null);
    setStep("form");
  };

  const showLocked = () => {
    setToast(LOCKED_MESSAGE);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2200);
  };

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!point) return setError("배치도에서 위치를 먼저 선택해 주세요.");
    if (!category) return setError("민원 유형을 선택해 주세요.");
    if (text.trim().length < 5)
      return setError("내용을 5자 이상 입력해 주세요.");
    setError("");
    setStep("analyzing");
    const analysis = await analyzeComplaint({
      text: text.trim(),
      x: point.x,
      z: point.z,
      category,
    });
    const complaint: Complaint = {
      id: createId("c"),
      createdAt: new Date().toISOString(),
      x: point.x,
      z: point.z,
      category,
      text: text.trim(),
      hasPhoto,
      analysis,
      origin: "resident",
    };
    onSubmit(complaint);
    setResult(complaint);
    setStep("done");
  };

  return (
    <div className={styles.phone}>
      <div className={styles.status}>
        <span>12:30</span>
        <span className={styles.camera} aria-hidden="true" />
        <span className={styles.statusIcons} aria-hidden="true">
          ▂▄▆ ◼
        </span>
      </div>

      <nav className={styles.topTabs} aria-label="마이 메뉴">
        <Locked onClick={showLocked}>조회</Locked>
        <span className={styles.topOn}>신청</span>
      </nav>

      <nav className={styles.subTabs} aria-label="신청 메뉴">
        <button
          type="button"
          className={subTab === "new" ? styles.subOn : ""}
          onClick={() => setSubTab("new")}
        >
          민원접수
        </button>
        <button
          type="button"
          className={subTab === "history" ? styles.subOn : ""}
          onClick={() => setSubTab("history")}
        >
          접수내역
          {myComplaints.length > 0 && (
            <i className={styles.count}>{myComplaints.length}</i>
          )}
        </button>
        <Locked onClick={showLocked}>A/S</Locked>
        <Locked onClick={showLocked}>Q&amp;A</Locked>
      </nav>

      <div className={styles.body}>
        {subTab === "history" ? (
          <History complaints={myComplaints} onNew={() => setSubTab("new")} />
        ) : step === "done" && result ? (
          <ResultView
            complaint={result}
            onNew={reset}
            onHistory={() => {
              reset();
              setSubTab("history");
            }}
          />
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.segment} role="presentation">
              <Locked onClick={showLocked}>일반 민원</Locked>
              <span className={styles.segOn}>
                조경·공용시설 <em className={styles.newBadge}>NEW</em>
              </span>
            </div>

            <Section
              title="위치 선택"
              action={point ? "다시 선택" : undefined}
              onAction={() => setPoint(null)}
            >
              <div className={styles.planCard}>
                <SitePlan
                  onPick={setPoint}
                  picked={point}
                  showPins={false}
                  compact
                />
              </div>
              <p className={styles.hint}>
                {point
                  ? `${nearestBuildingName(point.x, point.z)} 근처가 선택되었습니다.`
                  : "불편을 느낀 곳을 배치도에서 눌러주세요."}
              </p>
            </Section>

            <Section title="민원 유형">
              <div className={styles.chips}>
                {CATEGORIES.map((c) => (
                  <button
                    type="button"
                    key={c}
                    className={`${styles.chip} ${category === c ? styles.chipOn : ""}`}
                    onClick={() => {
                      setCategory(c);
                      setError("");
                    }}
                  >
                    {CATEGORY_META[c].label}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="내용">
              <textarea
                id="complaint-text"
                aria-label="민원 내용"
                className={styles.textarea}
                rows={3}
                value={text}
                placeholder="예) 밤 11시까지 농구장 공 소리가 들려요"
                onChange={(e) => {
                  setText(e.target.value);
                  setError("");
                }}
              />
              <button
                type="button"
                className={`${styles.photo} ${hasPhoto ? styles.photoOn : ""}`}
                onClick={() => setHasPhoto((v) => !v)}
              >
                <span className={styles.photoIcon} aria-hidden="true">
                  ⊕
                </span>
                {hasPhoto ? "사진 1장 첨부됨 (예시)" : "사진 첨부 (선택)"}
              </button>
            </Section>

            {error && <p className={styles.error}>{error}</p>}

            <button
              type="submit"
              className={styles.primary}
              disabled={step === "analyzing"}
            >
              {step === "analyzing"
                ? "민원 내용을 확인하고 있습니다…"
                : "접수하기"}
            </button>
          </form>
        )}
      </div>

      {toast && (
        <div className={styles.toast} role="status">
          {toast}
        </div>
      )}

      <BottomNav onLocked={showLocked} />
    </div>
  );
}

function Section({
  title,
  action,
  onAction,
  children,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h3>{title}</h3>
        {action && (
          <button type="button" className={styles.more} onClick={onAction}>
            {action}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function ResultView({
  complaint,
  onNew,
  onHistory,
}: {
  complaint: Complaint;
  onNew: () => void;
  onHistory: () => void;
}) {
  const a = complaint.analysis;
  const facility = findFacility(a?.facilityId);
  return (
    <div className={styles.form}>
      <div className={styles.doneHead}>
        <div className={styles.doneIcon} aria-hidden="true">
          ✓
        </div>
        <h3>민원이 접수되었습니다</h3>
        <p>관리사무소에서 확인 후 처리 결과를 알려드립니다.</p>
      </div>

      <Section title="접수 내용">
        <div className={styles.card}>
          <p className={styles.quote}>{complaint.text}</p>
        </div>
      </Section>

      {a && (
        <Section title="AI 자동 분류">
          <div className={styles.card}>
            {a.source === "mock" && <span className={styles.mock}>목업</span>}
            <dl className={styles.info}>
              <div>
                <dt>유형</dt>
                <dd className={styles.accentText}>
                  {CATEGORY_META[a.category].label}
                </dd>
              </div>
              <div>
                <dt>위치</dt>
                <dd>{nearestBuildingName(complaint.x, complaint.z)} 근처</dd>
              </div>
              <div>
                <dt>시간대</dt>
                <dd>{TIME_LABEL[a.timeOfDay]}</dd>
              </div>
              <div>
                <dt>원인 시설</dt>
                <dd>{facility?.name ?? "확인 중"}</dd>
              </div>
            </dl>
          </div>
        </Section>
      )}

      <div className={styles.btnRow}>
        <button type="button" className={styles.secondary} onClick={onHistory}>
          접수내역 보기
        </button>
        <button type="button" className={styles.primary} onClick={onNew}>
          추가 접수
        </button>
      </div>
    </div>
  );
}

function History({
  complaints,
  onNew,
}: {
  complaints: Complaint[];
  onNew: () => void;
}) {
  return (
    <div className={styles.form}>
      <Section title="나의 접수내역">
        {complaints.length === 0 ? (
          <div className={styles.card}>
            <p className={styles.empty}>접수한 민원이 없습니다.</p>
            <button type="button" className={styles.smallBtn} onClick={onNew}>
              민원접수
            </button>
          </div>
        ) : (
          <ul className={styles.historyList}>
            {complaints.map((c) => {
              const cat = c.analysis?.category ?? c.category;
              const d = new Date(c.createdAt);
              return (
                <li key={c.id} className={styles.historyItem}>
                  <span className={styles.historyIcon} aria-hidden="true">
                    {CATEGORY_META[cat].label.slice(0, 1)}
                  </span>
                  <span className={styles.historyText}>
                    <b>{c.text}</b>
                    <small>
                      {CATEGORY_META[cat].label} ·{" "}
                      {nearestBuildingName(c.x, c.z)} ·{" "}
                      {`${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`}
                    </small>
                  </span>
                  <span className={styles.state}>접수</span>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}

/** my HILLS 하단 메뉴 (공식 소개 이미지 기준). 민원은 마이 › 신청 › 민원에 있다 */
const NAV_ITEMS: { label: string; icon: ReactNode }[] = [
  { label: "HILLSTATE", icon: <path d="M5 20V6l7-3 7 3v14M9 20v-5h6v5" /> },
  { label: "우리집", icon: <path d="M4 11l8-6 8 6v8h-5v-5h-6v5H4z" /> },
  { label: "단지생활", icon: <path d="M4 5h16v11H9l-5 4z" /> },
  {
    label: "마이",
    icon: <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8c0-4 3-6 7-6s7 2 7 6" />,
  },
  { label: "전체메뉴", icon: <path d="M4 6h16M4 12h16M4 18h16" /> },
];

const ACTIVE_NAV = 3;

/** 시연 범위 밖 메뉴: 흐리게 보이고, 누르면 안내 토스트를 띄운다 */
function Locked({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.locked}
      aria-disabled="true"
      title="시연 범위 밖 메뉴"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function BottomNav({ onLocked }: { onLocked: () => void }) {
  return (
    <nav className={styles.bottomNav} aria-label="하단 메뉴">
      {NAV_ITEMS.map((item, i) => (
        <button
          type="button"
          key={item.label}
          className={i === ACTIVE_NAV ? styles.navOn : styles.navLocked}
          aria-disabled={i === ACTIVE_NAV ? undefined : "true"}
          onClick={i === ACTIVE_NAV ? undefined : onLocked}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {item.icon}
          </svg>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
