import { useCallback, useEffect, useState } from "react";
import type { AppData } from "@/domain/types";
import { emptyAppData } from "@/domain/operations";
import {
  loadAppData,
  saveAppData,
  StorageCorruptError,
  requestPersistentStorage,
} from "@/lib/storage";

/**
 * AppData を localStorage と結ぶ。
 * - SSR/初期描画中は data=null(loading)。クライアントで useEffect が読み込む。
 * - 破損データは空で上書きせず、error として返す(UI が警告できる)。
 * - update(fn) は不変更新した結果を state に反映しつつ保存する。
 */
export function useAppData() {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<StorageCorruptError | null>(null);

  // マウント後に localStorage(外部システム)から一度だけ読み込む。
  // lazy 初期化にすると SSR は null(「読み込み中」)・クライアント初期値は実データとなり
  // ハイドレーション不一致を招くため、effect 内でのロード＋setState が正しい。
  useEffect(() => {
    try {
      const loaded = loadAppData();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 外部システムからの一度きりのロード(上記参照)
      setData(loaded ?? emptyAppData());
    } catch (e) {
      if (e instanceof StorageCorruptError) {
        setError(e);
        return;
      }
      throw e;
    }
    void requestPersistentStorage();
  }, []);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      saveAppData(next);
      return next;
    });
  }, []);

  return { data, error, update, ready: data !== null } as const;
}
