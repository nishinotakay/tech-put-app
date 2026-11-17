import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../../../components/admin/AdminLayout'
import { adminLogout, getCurrentAdmin, type Admin } from '../../../lib/adminApi'
import { articleTitleKeywords, collectArticleKeywords } from '../../../lib/articleKeywords'
import '../../../styles/pages/categoryArticles.css'
import {
  getCategoryArticles,
  type CategoryArticle,
  newCategoryArticles,
  deleteCategoryArticles,
} from '../../../lib/categoryApi'

export default function AdminCategoryArticlesPage() {
  const navigate = useNavigate()
  const { courseId, categoryId } = useParams<{ courseId: string; categoryId: string }>()
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [availableSearch, setAvailableSearch] = useState('')
  const [linkedSearch, setLinkedSearch] = useState('')
  const [availableAuthor, setAvailableAuthor] = useState('')
  const [linkedAuthor, setLinkedAuthor] = useState('')
  const [availableKeyword, setAvailableKeyword] = useState('')
  const [linkedKeyword, setLinkedKeyword] = useState('')
  const [authError, setAuthError] = useState('')
  const [linkedArticles, setLinkedArticles] = useState<CategoryArticle[]>([])

  const [availableArticles, setAvailableArticles] = useState<CategoryArticle[]>([])

  const [courseName, setCourseName] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false
    getCurrentAdmin().then(currentAdmin => {
      if (cancelled) return
      if (!currentAdmin) navigate('/admin/login', { replace: true })
      else setAdmin(currentAdmin)
    }).catch(() => {
      if (!cancelled) setAuthError('管理者情報を取得できませんでした。')
    })
    return () => { cancelled = true }
  }, [navigate])

  useEffect(() => {
    if (!courseId || !categoryId) {
      setLoadError('コースまたはカテゴリーのIDがありません。')
      setLoading(false)
      return
    }

    if (!admin) return

    let cancelled = false

    setLoading(true)
    setLoadError('')
    setLinkedArticles([])
    setAvailableArticles([])
    setSelectedIds([])
    setAvailableSearch('')
    setLinkedSearch('')
    setAvailableAuthor('')
    setLinkedAuthor('')
    setAvailableKeyword('')
    setLinkedKeyword('')

    async function loadArticles(
      currentCourseId: string,
      currentCategoryId: string
    ) {
      try {
        const data = await getCategoryArticles(
          currentCourseId,
          currentCategoryId
        )

        if (cancelled) return

        setLinkedArticles(data.linkedArticles)
        setAvailableArticles(data.availableArticles)
        setCourseName(data.course.name)
        setCategoryName(data.category.name)
      } catch {
        if (!cancelled) {
          setLoadError('記事を取得できませんでした。')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadArticles(courseId, categoryId)

    return () => {
      cancelled = true
    }
  }, [courseId, categoryId, admin])

  async function handleLogout() {
    await adminLogout()
    navigate('/admin/login', { replace: true })
  }

  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const deleteInProgress = useRef(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  async function handleUnlinkArticle(articleId: string) {
    if (!categoryId || deleteInProgress.current || adding) return
  
    const article = linkedArticles.find(item => item.id === articleId)
    if (!article) return
  
    if (!window.confirm(`「${article.title}」の紐付けを解除しますか？`)) return
  
    deleteInProgress.current = true
    setDeletingId(articleId)
    setDeleteError('')
  
    try {
      await deleteCategoryArticles(categoryId, articleId)
  
      // 解除成功後、右の一覧から取り除く
      setLinkedArticles(previous =>
        previous.filter(item => item.id !== articleId)
      )
  
      // 左の「追加できる記事」へ戻す
      setAvailableArticles(previous =>
        [...previous, article].sort(
          (a, b) => Number(a.id) - Number(b.id)
        )
      )
    } catch {
      setDeleteError('記事の紐付け解除に失敗しました。')
    } finally {
      deleteInProgress.current = false
      setDeletingId(null)
    }
  }

  async function handleAddArticles() {
    // カテゴリー未指定・未選択・処理中なら実行しない
    if (
      !categoryId ||
      selectedIds.length === 0 ||
      adding ||
      deleteInProgress.current
    ) return
  
    setAdding(true)
    setAddError('')
  
    try {
      const data = await newCategoryArticles(categoryId, selectedIds)
  
      // バックから返された追加後の一覧に更新する
      setLinkedArticles(data.linkedArticles)
      setAvailableArticles(data.availableArticles)
  
      // チェックの選択状態を解除する
      setSelectedIds([])
    } catch {
      setAddError('記事の紐付けに失敗しました。')
    } finally {
      setAdding(false)
    }
  }

  function renderArticleTable(linked: boolean) {
    const articles = linked ? linkedArticles : availableArticles
    const search = linked ? linkedSearch : availableSearch
    const author = linked ? linkedAuthor : availableAuthor
    const setSearch = linked ? setLinkedSearch : setAvailableSearch
    const setAuthor = linked ? setLinkedAuthor : setAvailableAuthor
    const keyword = linked ? linkedKeyword : availableKeyword
    const setKeyword = linked ? setLinkedKeyword : setAvailableKeyword
    const keywords = collectArticleKeywords(articles)
    const prefix = linked ? 'linked' : 'available'
    const query = search.trim().toLocaleLowerCase()
    const filtered = articles.filter(article =>
      `${article.title} ${article.author}`.toLocaleLowerCase().includes(query) &&
      (!author || article.author === author) &&
      (!keyword || articleTitleKeywords(article.title).includes(keyword))
    )

    return (
      <section className="category-articles__column" aria-labelledby={`${prefix}-heading`}>
        <h2 id={`${prefix}-heading`}>{linked ? '紐付け済みの記事' : '追加できる記事'}（{articles.length}件）</h2>
        {linked && deleteError && (
          <p className="text-danger" role="alert">
            {deleteError}
          </p>
        )}
        <label className="form-label" htmlFor={`${prefix}-search`}>タイトル・作成者で検索</label>
        <input id={`${prefix}-search`} className="form-control mb-3" placeholder="記事を検索" value={search} onChange={event => setSearch(event.target.value)} />
        <label className="form-label" htmlFor={`${prefix}-author`}>作成者で絞り込み</label>
        <select id={`${prefix}-author`} className="form-select mb-3" value={author} onChange={event => setAuthor(event.target.value)}>
          <option value="">すべての作成者</option>
          {[...new Set(articles.map(article => article.author))].map(name => <option key={name} value={name}>{name}</option>)}
        </select>
        <div className="category-articles__keywords">
          <label className="form-label" htmlFor={`${prefix}-keyword`}>タイトルのキーワードで絞り込み</label>
          <select id={`${prefix}-keyword`} className="form-select" value={keyword} onChange={event => setKeyword(event.target.value)} aria-describedby={`${prefix}-keyword-help`}>
            <option value="">すべてのキーワード</option>
            {keywords.map(item => <option key={item.word} value={item.word}>{item.word}（{item.count}件）</option>)}
            {keyword && !keywords.some(item => item.word === keyword) && <option value={keyword}>{keyword}（現在の選択）</option>}
          </select>
          <p id={`${prefix}-keyword-help`} className="small text-muted mt-2 mb-0">タイトルから自動集計した上位10語です。件数は検索・作成者の条件を適用する前の件数です。</p>
          {!keywords.length && !keyword && <p className="small text-muted mt-2 mb-0">共通キーワードがありません。検索欄で絞り込めます。</p>}
        </div>
        <p className="small text-muted" role="status">表示：{filtered.length}件 ／ 全{articles.length}件</p>
        <div className="category-articles__table" tabIndex={0} role="region" aria-label={linked ? '紐付け済みの記事一覧' : '追加できる記事一覧'}>
          <table className="table align-middle mb-0">
            <thead><tr><th>{linked ? '操作' : '選択'}</th><th>記事タイトル</th><th>作成者</th></tr></thead>
            <tbody>
              {filtered.map(article => (
                <tr key={article.id}>
                  <td>{linked ? (
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleUnlinkArticle(article.id)}
                      disabled={deletingId !== null || adding}
                    >
                      {deletingId === article.id ? '解除中…' : '解除'}
                    </button>
                  ) : (
                    <input type="checkbox" className="form-check-input" aria-label={`${article.title}を選択`} checked={selectedIds.includes(article.id)} onChange={event => {
                      const checked = event.target.checked
                      setSelectedIds(previous => checked ? [...previous, article.id] : previous.filter(id => id !== article.id))
                    }} />
                  )}</td>
                  <td>
                    <a
                      href={`/admin/articles/${article.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="category-articles__title"
                    >
                      {article.title}<span className="visually-hidden">（別タブで開く）</span> ↗
                    </a>
                  </td>
                  <td>{article.author}</td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={3} className="text-center text-muted py-4">{articles.length ? '条件に一致する記事はありません。' : linked ? '紐付け済みの記事はありません。' : '追加できる記事はありません。'}</td></tr>}
            </tbody>
          </table>
        </div>
        {!linked && (
          <div className="category-articles__selection-actions">
            <span className="text-muted" role="status">選択中：{selectedIds.length}件</span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddArticles}
              disabled={adding || deletingId !== null || selectedIds.length === 0}
            >
              {adding ? '追加中…' : '選択した記事を追加 →'}
            </button>

            {addError && (
              <p className="text-danger mt-2" role="alert">
                {addError}
              </p>
            )}
          </div>
        )}
      </section>
    )
  }

  return (
    <AdminLayout admin={admin} onLogout={handleLogout} headerTitle="カテゴリーの記事管理">
      <section className="category-articles">
        <button type="button" className="category-articles__back" onClick={() => navigate(`/admin/courses/${courseId}/categories`)}>← カテゴリー一覧へ戻る</button>
        {authError && <p className="text-danger" role="alert">{authError}</p>}
        <div className="category-articles__panel">
          <div className="category-articles__heading">
            <h1>カテゴリーの記事を管理</h1>
            <p className="text-muted mb-1">{courseName} ／ {categoryName}</p>
            <p className="text-muted mb-1">別コースで使用中の記事も追加できます。解除しても記事本文は削除されません。</p>
            <p className="small text-muted mb-0">追加・解除の保存処理は未接続です。</p>
          </div>
          {loading ? (
            <p className="p-4" role="status">記事を取得中です。</p>
          ) : loadError ? (
            <p className="p-4 text-danger" role="alert">{loadError}</p>
          ) : (
            <div className="category-articles__columns">{renderArticleTable(false)}{renderArticleTable(true)}</div>
          )}
        </div>
      </section>
    </AdminLayout>
  )
}
