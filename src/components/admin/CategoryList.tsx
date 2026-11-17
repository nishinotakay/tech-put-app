import { useRef, useState } from 'react'
import Modal from '../shared/Modal'
import { useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../lib/api'
import { updateCategory, deleteCategory, type Category } from '../../lib/categoryApi'
import { useNavigate } from 'react-router-dom'
export type CategoryListItem = {
  id: string
  name: string
  articleCount?: number
}

type Props = {
  categories: CategoryListItem[]
  onUpdated: (category: Category) => void
  onDeleted: (categoryId: string) => void
}

export default function CategoryList({ categories, onUpdated, onDeleted }: Props) {
  const [editingCategory, setEditingCategory] = useState<CategoryListItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const updateInProgress = useRef(false)
  const { courseId } = useParams<{ courseId: string }>()
  const deleteInProgress = useRef(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const navigate = useNavigate()

  function startEditing(category: CategoryListItem) {
    if (updateInProgress.current || deleteInProgress.current) return
    setEditingCategory(category)
    setEditName(category.name)
    setEditError('')
  }

  function closeEditModal() {
    if (updateInProgress.current) return
    setEditingCategory(null)
    setEditName('')
  }

  async function handleUpdateCategory() {
    if (!editingCategory || updateInProgress.current || deleteInProgress.current) return
    if (!courseId) {
      setEditError('コースIDがありません。コース一覧から開き直してください。')
      return
    }
    if(!editName.trim()) {
      setEditError('カテゴリー名を入力してください')
      return
    }
    updateInProgress.current = true
    setEditSaving(true)
    setEditError('')
    try{
      const updatedCategory = await updateCategory(
        courseId,
        editingCategory.id,
        editName.trim()
      )
      onUpdated(updatedCategory)
      setEditingCategory(null)
      setEditName('')
    }catch(err) {
      setEditError(getApiErrorMessage(err, 'カテゴリー名の更新に失敗しました。'))
    } finally {
      updateInProgress.current = false
      setEditSaving(false)
    }
  }

  async function handleDeleteCategory(id: string) {
    if (deleteInProgress.current || updateInProgress.current) return
    if (!courseId) {
      setDeleteError('コースIDがありません。コース一覧から開き直してください。')
      return
    }
    const category = categories.find(item => item.id === id)
    if (!category) return
    if (!window.confirm(`「${category.name}」を本当に削除してよいですか？`)) return
    deleteInProgress.current = true
    setDeletingId(id)
    setDeleteError('')
    try {
      await deleteCategory(courseId, id)
      onDeleted(id)
    }catch(err) {
      setDeleteError(getApiErrorMessage(err, 'カテゴリーの削除に失敗しました。'))
    } finally {
      deleteInProgress.current = false
      setDeletingId(null)
    }
  }

  return (
    <>
    {deleteError && <p className="text-danger" role="alert">{deleteError}</p>}
    <ul className="category-index__list">
      {categories.map(category => (
        <li key={category.id} className="category-index__card">
          <div>
            <h2>{category.name}</h2>
            {category.articleCount !== undefined && <p>{category.articleCount}件の記事と紐付け</p>}
          </div>
          <div className="category-index__actions">
            <button type="button" className='btn bg-primary-subtle text-black-50'
              onClick={() =>
                navigate(
                  `/admin/courses/${courseId}/categories/${category.id}/articles`
                )
              }
            >記事を管理</button>
            <button type="button" disabled={editSaving || deletingId !== null} onClick={() => startEditing(category)}>名前を編集</button>
            <button
              type="button"
              className="category-index__delete"
              disabled={deletingId !== null || editSaving}
              onClick={() => { void handleDeleteCategory(category.id) }}
            >
              {deletingId === category.id ? '削除中…' : '削除'}
            </button>
          </div>
        </li>
      ))}
    </ul>
    <form
      noValidate
      onSubmit={event => {
        event.preventDefault()
        void handleUpdateCategory()
      }}
    >
      <Modal
        isOpen={editingCategory !== null}
        onClose={closeEditModal}
        title="カテゴリー名を編集"
        titleId="category-edit-title"
        footer={
          <>
            <button type="button" className="btn btn-outline-secondary" disabled={editSaving} onClick={closeEditModal}>
              キャンセル
            </button>
            <button type="submit" className="btn btn-primary" disabled={editSaving}>
              {editSaving ? '保存中…' : '保存する'}
            </button>
          </>
        }
      >
        <label htmlFor="category-edit-name" className="form-label fw-semibold mb-0">
          カテゴリー名 <span className="text-danger">必須</span>
        </label>
        <input
          id="category-edit-name"
          type="text"
          className={`form-control${editError ? ' is-invalid' : ''}`}
          value={editName}
          disabled={editSaving}
          onChange={event => setEditName(event.currentTarget.value)}
          required
          maxLength={255}
          aria-invalid={!!editError}
          aria-describedby={editError ? 'course-inline-error' : undefined}
        />
        {editError && (
          <>
            <p id="course-inline-error" className="course-form-error" role="alert">
              <span aria-hidden="true">⚠</span> {editError}
            </p>
            <p
              id="category-edit-help"
              className={`small mt-2 mb-0 ${
                editError ? 'text-warning' : 'text-muted'
              }`}
            >
              カテゴリー名を入力して「保存する」を押してください。
            </p>
          </>
        )}
      </Modal>
    </form>
    </>
  )
}
