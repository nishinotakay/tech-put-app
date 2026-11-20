import { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api, getApiErrorMessage } from '../../lib/api'

type SearchResult = {
  articles: { id: string; title: string; author: string }[]
  total_count: number
  extracted_filters: string
}

export default function GoogleArticleSearch() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const requestId = useRef(0)
  useEffect(() => () => { requestId.current++ }, [])

  async function search() {
    if (busy) return
    const text = query.trim()
    if (!text || text.length > 500) { setError('検索文を1〜500文字で入力してください。'); return }
    const current = ++requestId.current
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const response = await api.post<SearchResult>('/admin/article_search', { query: text })
      if (current === requestId.current) setResult(response.data)
    } catch (err) {
      if (current === requestId.current) setError(getApiErrorMessage(err, '文章による検索に失敗しました。'))
    } finally {
      if (current === requestId.current) setBusy(false)
    }
  }

  return <section className="border rounded bg-white p-3 mb-4" aria-labelledby="google-article-search-title">
    <h2 id="google-article-search-title" className="h5 fw-bold">文章で記事を検索（Google Cloud）</h2>
    <p className="small text-muted">Google Cloudに登録した記事全体を検索します。下のサンプル一覧とは別の検索結果です。</p>
    <label htmlFor="google-article-query" className="form-label">探したい記事を文章で入力</label>
    <div className="d-flex gap-2 flex-wrap">
      <input id="google-article-query" className="form-control" style={{ flex: '1 1 240px' }} value={query} maxLength={500} placeholder="例：田中さんが書いたRubyの環境構築の記事を探して" onChange={event => setQuery(event.target.value)} onKeyDown={event => {
        if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); void search() }
      }} />
      <button type="button" className="btn btn-primary" disabled={busy} onClick={() => { void search() }}>{busy ? '検索中…' : '文章で検索'}</button>
    </div>
    {error && <p role="alert" className="text-danger mt-3 mb-0">{error}</p>}
    {result && <div className="mt-3">
      <p role="status">検索結果：{result.total_count}件（最大20件表示）</p>
      <div className="table-responsive" style={{ maxHeight: 320 }}><table className="table"><thead><tr><th>記事タイトル</th><th>作成者</th></tr></thead><tbody>
        {result.articles.map((article, index) => <tr key={`${article.id}-${index}`}><td>{/^\d+$/.test(article.id) ? <Link to={`/admin/articles/${article.id}`} target="_blank" rel="noopener noreferrer">{article.title} ↗</Link> : article.title}</td><td>{article.author}</td></tr>)}
        {!result.articles.length && <tr><td colSpan={2}>条件に一致する記事はありません。</td></tr>}
      </tbody></table></div>
    </div>}
  </section>
}
