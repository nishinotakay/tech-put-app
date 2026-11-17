import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../../../components/admin/AdminLayout'
import CategoryList from '../../../components/admin/CategoryList'
import Modal from '../../../components/shared/Modal'
import {
  adminLogout,
  getCurrentAdmin,
  type Admin,
} from '../../../lib/adminApi'
import {
  getCategories,
  createCategory,
  type Category,
} from '../../../lib/categoryApi'
import '../../../styles/pages/categories.css'

export default function AdminCategoryIndexPage() {
  const navigate = useNavigate()
  const { courseId } = useParams<{ courseId: string }>()

  const [admin, setAdmin] = useState<Admin | null>(null)
  const [courseName, setCourseName] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [createError, setCreateError] = useState('')

  function openCreateModal() {
    setCategoryName('')
    setCreateError('')
    setShowCreateModal(true)
  }

  function closeCreateModal() {
    setShowCreateModal(false)
  }

  async function handleCreateCategory() {
    const name = categoryName.trim()
    if (!name) {
      setCreateError('カテゴリー名を入力してください。')
      return
    }

    if (!courseId) {
      setCreateError('コースIDがありません。')
      return
    }
  
    try{
      const data = await createCategory(courseId,name)
      setCategories(previous => [...previous, data])
      setCategoryName('')
      closeCreateModal()
    } catch {
      setCreateError('カテゴリーの作成に失敗しました。')
    }
    
    closeCreateModal()
  }

  useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      setLoading(true)
      setError('')
      setCourseName('')
      setCategories([])

      try {
        if (!courseId) {
          throw new Error('コースIDがありません')
        }

        const currentAdmin = await getCurrentAdmin()
        if (cancelled) return

        if (!currentAdmin) {
          navigate('/admin/login', { replace: true })
          return
        }
        //ここにきてadminと確定したので格納
        setAdmin(currentAdmin)

        const response = await getCategories(courseId)
        if (cancelled) return

        setCourseName(response.course.name)
        setCategories(response.categories)
      } catch {
        if (!cancelled) {
          setError('カテゴリーを取得できませんでした。')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadCategories()

    return () => {
      cancelled = true
    }
  }, [courseId, navigate])

  async function handleLogout() {
    await adminLogout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <AdminLayout
      admin={admin}
      onLogout={handleLogout}
      headerTitle="カテゴリー管理"
    >
      <section
        className="category-index"
        aria-labelledby="category-index-title"
      >
        <Link
          className="category-index__back"
          to="/admin/courses"
        >
          ← コース一覧へ戻る
        </Link>

        <div className="category-index__heading">
          <div>
            <h1 id="category-index-title">
              {courseName
                ? `${courseName} ／ カテゴリー管理`
                : 'カテゴリー管理'}
            </h1>
            <p>
              このコースに所属するカテゴリーだけを表示しています。
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateModal}
            disabled={loading || !!error || !admin}
          >
            ＋ カテゴリーを追加
          </button>
        </div>

        {courseName && (
          <p className="category-index__scope">
            所属コース：<strong>{courseName}</strong>
            　カテゴリーは1つのコースに所属します。
          </p>
        )}

        {loading ? (
          <p role="status">読み込み中です…</p>
        ) : error ? (
          <p className="category-index__error" role="alert">
            {error}
          </p>
        ) : categories.length === 0 ? (
          <p className="category-index__empty" role="status">
            カテゴリーは存在しません。
          </p>
        ) : (
          <CategoryList
            key={courseId}
            categories={categories}
            onDeleted={categoryId => {
              setCategories(previous => previous.filter(category => category.id !== categoryId))
            }}
            onUpdated={updatedCategory => {
              setCategories(previous => previous.map(category =>
                category.id === updatedCategory.id
                  ? { ...category, ...updatedCategory }
                  : category
              ))
            }}
          />
        )}
      </section>
      <Modal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
        title="カテゴリーを追加"
        titleId="category-create-title"
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary" onClick={closeCreateModal}>
              キャンセル
            </button>
            <button type="submit" className="btn btn-primary" form="category-create-form">
              作成する
            </button>
          </>
        }
      >
        <p className="text-secondary mb-0">所属コース：<strong>{courseName}</strong></p>
        <form id="category-create-form" onSubmit={event => {
          event.preventDefault()
          handleCreateCategory()
        }}>
          <label htmlFor="category-create-name" className="form-label fw-semibold">
            カテゴリー名 <span className="text-danger">必須</span>
          </label>
          <input
            id="category-create-name"
            type="text"
            className="form-control"
            value={categoryName}
            onChange={event => {
              setCategoryName(event.currentTarget.value)
              setCreateError('')
            }}
            placeholder="例：基本文法"
            required
            maxLength={255}
            aria-invalid={!!createError}
            aria-describedby={createError ? 'category-create-error' : undefined}
          />
          {createError && (
            <p id="category-create-error" className="text-danger mt-2 mb-0" role="alert">
              {createError}
            </p>
          )}
        </form>
        <p className="text-secondary small mb-0">
          表示確認用です。作成したカテゴリーはDBに保存されず、再読み込みすると消えます。
        </p>
      </Modal>
    </AdminLayout>
  )
}
