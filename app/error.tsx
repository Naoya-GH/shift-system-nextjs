"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="error-page">
      <h1>エラーが発生しました</h1>
      <p>予期しない問題が発生しました。しばらくしてからもう一度お試しください。</p>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={() => reset()}>
          もう一度試す
        </button>
        <a href="/" className="btn btn-primary">
          トップへ戻る
        </a>
      </div>
    </main>
  );
}
