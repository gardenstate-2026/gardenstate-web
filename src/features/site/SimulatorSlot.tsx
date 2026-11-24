import { useCallback, useEffect, useRef, useState } from "react";
import { toExport } from "@/features/complaint/useComplaints";
import type { Complaint } from "@/features/complaint/types";
import { SitePlan } from "./SitePlan";
import { BUILDINGS, FACILITIES, PATHS, SITE_BOUNDS, TREES } from "./siteData";
import { CATEGORIES } from "@/features/complaint/constants";
import styles from "./SimulatorSlot.module.css";

interface SimulatorSlotProps {
  complaints: Complaint[];
  showHeatmap: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const SIMULATOR_URL = import.meta.env.VITE_SIMULATOR_URL as string | undefined;
const frameUrl = SIMULATOR_URL || `${import.meta.env.BASE_URL}simulator/index.html`;
const site = { buildings: BUILDINGS, facilities: FACILITIES, paths: PATHS, bounds: SITE_BOUNDS, trees: TREES };

/** postMessage로 3D 시뮬레이터에 보내는 메시지 형식 */
export const SIMULATOR_MESSAGE_TYPE = "gardenstate:complaints";

export function SimulatorSlot({
  complaints,
  showHeatmap,
  selectedId,
  onSelect,
}: SimulatorSlotProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [planView, setPlanView] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const origin = new URL(frameUrl, window.location.href).origin;

  const send = useCallback(() => {
    const target = frameRef.current?.contentWindow;
    if (!target) return;
    const theme = getComputedStyle(document.documentElement);
    const colors = Object.fromEntries(CATEGORIES.map((key) => [key, theme.getPropertyValue(`--cat-${key}`).trim()]));
    target.postMessage(
      {
        type: SIMULATOR_MESSAGE_TYPE,
        payload: {
          ...toExport(complaints), showHeatmap, selectedId,
          ...(!SIMULATOR_URL && { layout: site, colors }),
        },
      },
      origin,
    );
  }, [complaints, showHeatmap, selectedId, origin]);

  useEffect(send, [send]);

  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin !== origin || event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === "gardenstate:ready") send();
      if (event.data?.type === "gardenstate:unavailable") setUnavailable(true);
      if (event.data?.type === "gardenstate:select" && complaints.some((c) => c.id === event.data.id)) {
        onSelect(event.data.id);
      }
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [complaints, onSelect, origin, send]);

  if (!planView && !unavailable) {
    return (
      <div className={styles.slot}>
        <iframe
          ref={frameRef}
          src={frameUrl}
          title="3D 단지 시뮬레이터"
          className={styles.frame}
          onLoad={send}
          onError={() => setUnavailable(true)}
        />
        <button type="button" className={styles.switchView} onClick={() => setPlanView(true)}>2D 배치도</button>
      </div>
    );
  }

  return (
    <div className={styles.slot}>
      <SitePlan
        complaints={complaints}
        showHeatmap={showHeatmap}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      {unavailable ? (
        <div className={styles.badge} role="status">3D를 표시할 수 없어 2D 배치도를 표시합니다</div>
      ) : (
        <button type="button" className={styles.switchView} onClick={() => setPlanView(false)}>3D 단지 보기</button>
      )}
    </div>
  );
}
