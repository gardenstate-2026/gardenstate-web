import { useCallback, useEffect, useState } from "react";
import { readJSON, writeJSON } from "@/shared/lib/storage";
import { SAMPLE_COMPLAINTS } from "./sampleComplaints";
import type { Complaint, ComplaintExport } from "./types";

const STORAGE_KEY = "gardenstate:complaints:v1";

/**
 * 민원 저장소 (complaint 모듈)
 * 지금은 이 브라우저의 localStorage에만 저장한다.
 * 백엔드가 생기면 이 훅 안쪽만 API 호출(POST /complaints, GET /complaints)로 바꾸면 된다.
 */
export function useComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>(() =>
    readJSON(STORAGE_KEY, SAMPLE_COMPLAINTS),
  );

  useEffect(() => {
    writeJSON(STORAGE_KEY, complaints);
  }, [complaints]);

  const addComplaint = useCallback((complaint: Complaint) => {
    setComplaints((prev) => [complaint, ...prev]);
  }, []);

  const loadSamples = useCallback(() => setComplaints(SAMPLE_COMPLAINTS), []);
  const clearAll = useCallback(() => setComplaints([]), []);

  return { complaints, addComplaint, loadSamples, clearAll };
}

export function toExport(complaints: Complaint[]): ComplaintExport {
  return {
    version: 1,
    site: "gardenstate-sample",
    generatedAt: new Date().toISOString(),
    complaints,
  };
}
