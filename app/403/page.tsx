export default function ForbiddenPage() {
  return (
    <main className="error-page">
      <h1>アクセス権限がありません</h1>
      <p>このページを表示する権限がありません。</p>
      <a href="/" className="btn btn-primary">
        トップへ戻る
      </a>
    </main>
  );
}
