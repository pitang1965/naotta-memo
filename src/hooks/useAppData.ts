import { useCallback, useEffect, useRef, useState } from "react";
import type { AppData } from "@/domain/types";
import { emptyAppData } from "@/domain/operations";
import {
  loadAppData,
  saveAppData,
  StorageCorruptError,
  STORAGE_KEY,
  requestPersistentStorage,
} from "@/lib/storage";

/**
 * AppData を localStorage と結ぶ。
 * - SSR/初期描画中は data=null(loading)。クライアントで useEffect が読み込む。
 * - 破損データは空で上書きせず、error として返す(UI が警告できる)。
 * - update(fn) は不変更新した結果を保存し、成功したときだけ state に反映して true を返す。
 */
export function useAppData() {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<StorageCorruptError | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  // update が連続で呼ばれても最新の値から積み上げるため、state とは別に同期的に持つ
  const dataRef = useRef<AppData | null>(null);

  // マウント後に localStorage(外部システム)から一度だけ読み込む。
  // lazy 初期化にすると SSR は null(「読み込み中」)・クライアント初期値は実データとなり
  // ハイドレーション不一致を招くため、effect 内でのロード＋setState が正しい。
  useEffect(() => {
    try {
      const loaded = loadAppData() ?? emptyAppData();
      dataRef.current = loaded;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 外部システムからの一度きりのロード(上記参照)
      setData(loaded);
    } catch (e) {
      if (e instanceof StorageCorruptError) {
        setError(e);
        return;
      }
      throw e;
    }
    void requestPersistentStorage();
  }, []);

  // 別タブ/PWA が保存したら読み直す。古いコピーのまま update すると相手の記録を上書きで消すため。
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY && e.key !== null) return;
      try {
        const loaded = loadAppData() ?? emptyAppData();
        dataRef.current = loaded;
        setData(loaded);
        setError(null);
      } catch (err) {
        if (err instanceof StorageCorruptError) setError(err);
        else throw err;
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // 保存の成否を呼び出し側へ返す。失敗時は画面を保存済みの状態に留める(成功メッセージを出させない)。
  const update = useCallback((fn: (d: AppData) => AppData): boolean => {
    const prev = dataRef.current;
    if (!prev) return false;
    const next = fn(prev);
    const ok = saveAppData(next);
    setSaveFailed(!ok);
    if (!ok) return false;
    dataRef.current = next;
    setData(next);
    return true;
  }, []);

  return { data, error, saveFailed, update, ready: data !== null } as const;
}
