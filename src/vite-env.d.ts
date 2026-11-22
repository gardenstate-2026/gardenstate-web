/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 유리님 AI 모듈 주소. 비우면 키워드 목업 사용 */
  readonly VITE_AI_API_URL?: string;
  /** 유리님 3D 시뮬레이터 주소. 비우면 2D 배치도 미리보기 사용 */
  readonly VITE_SIMULATOR_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
