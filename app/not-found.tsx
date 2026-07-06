export default function NotFound() {
  return (
    <main className="error-page">
      <h1>ページが見つかりません</h1>
      <p>お探しのページは存在しないか、移動した可能性があります。</p>
      <a href="/" className="btn btn-primary">
        トップへ戻る
      </a>
    </main>
  );
}
