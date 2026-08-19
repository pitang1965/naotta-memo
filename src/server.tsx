import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";

// サーバー(SSR)は HTML を描くだけ。データは持たない・保存しない。
// 健康情報はすべてクライアントの localStorage に閉じる(ADR 0005)。
const startFetch = createStartHandler(defaultStreamHandler);

function withSecurityHeaders(res: Response): Response {
  const headers = new Headers(res.headers);
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

export default {
  fetch: async (request: Request) => withSecurityHeaders(await startFetch(request)),
};
