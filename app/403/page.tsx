export default function ForbiddenPage() {
  return (
    <main className="error-page">
      <h1>アクセス権限がありません</h1>
      <p>このページを表示する権限がありません。</p>
      <a href="/">トップへ戻る</a>
    </main>
  );
}
