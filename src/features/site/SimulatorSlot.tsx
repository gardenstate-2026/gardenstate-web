import { useCallback, useEffect, useRef } from "react";
import { toExport } from "@/features/complaint/useComplaints";
import type { Complaint } from "@/features/complaint/types";
import { SitePlan } from "./SitePlan";
import styles from "./SimulatorSlot.module.css";

interface SimulatorSlotProps {
  complaints: Complaint[];
  showHeatmap: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const SIMULATOR_URL = import.meta.env.VITE_SIMULATOR_URL as string | undefined;

/** postMessage로 3D 시뮬레이터에 보내는 메시지 형식 */
export const SIMULATOR_MESSAGE_TYPE = "gardenstate:complaints";

/**
 * 유리님 3D 시뮬레이터가 들어갈 자리.
 * - VITE_SIMULATOR_URL이 있으면 iframe으로 띄우고, 민원이 바뀔 때마다 postMessage로 전달한다.
 * - 없으면 같은 좌표계의 2D 배치도로 미리보기를 보여준다.
 */
export function SimulatorSlot({
  complaints,
  showHeatmap,
  selectedId,
  onSelect,
}: SimulatorSlotProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  const send = useCallback(() => {
    if (!SIMULATOR_URL) return;
    const target = frameRef.current?.contentWindow;
    if (!target) return;
    target.postMessage(
      {
        type: SIMULATOR_MESSAGE_TYPE,
        payload: { ...toExport(complaints), showHeatmap },
      },
      new URL(SIMULATOR_URL, window.location.href).origin,
    );
  }, [complaints, showHeatmap]);

  useEffect(send, [send]);

  if (SIMULATOR_URL) {
    return (
      <div className={styles.slot}>
        <iframe
          ref={frameRef}
          src={SIMULATOR_URL}
          title="3D 단지 시뮬레이터"
          className={styles.frame}
          onLoad={send}
        />
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
      <div className={styles.badge}>
        3D 시뮬레이터 연결 전 · 2D 배치도 미리보기
      </div>
    </div>
  );
}
