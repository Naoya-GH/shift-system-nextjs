"use client";

export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()}>
      印刷する
    </button>
  );
}
