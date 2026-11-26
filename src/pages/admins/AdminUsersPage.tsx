// 登録ユーザーの検索・並べ替え・個別画面への遷移と解約・再開を提供する。
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, cancelUser, resumeUser } from "../../lib/adminApi";
import type { AdminUser } from "../../lib/userTypes";
import AdminLayout from "../../components/admin/AdminLayout";
import PageSpinner from "../../components/admin/PageSpinner";
import PageError from "../../components/admin/PageError";
import { useRequireAdmin } from "../../lib/useRequireAdmin";
import UserSortModal, { DEFAULT_SORT_CRITERION, type SortCriterion } from "../../components/admin/UserSortModal"
import UserFilterModal, { EMPTY_FILTER, type FilterCondition } from "../../components/admin/UserFilterModal"
import UserRowMenu from "../../components/admin/UserRowMenu"
import {
  createCreatedAtComparator,
  createNameComparator,
  DEFAULT_SORT_ORDER,
  type SortOrder,
} from "../../lib/sort";
import FlashMessage from "../../components/shared/FlashMessage"
import { useFlash } from "../../lib/useFlash"
import type { LoadStatus } from "../../lib/loadStatus"
import { formatSlashDate } from "../../lib/formatDate"

export default function AdminUsersPage() {
  const navigate = useNavigate()
  const { admin, loading, error, handleLogout } = useRequireAdmin();
  const [users, setUsers] = useState<AdminUser[]>([])

  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading")

  // 取得失敗はPageError、解約・再開の結果は一時通知に分ける。
  const { flash, showSuccessFlash, showErrorFlash, clearFlash } = useFlash()

  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null)

  const [statusChangingId, setStatusChangingId] = useState<string | null>(null)

  // キャンセル時に一覧を変えないよう、入力中の条件はモーダル側、適用済みの条件はここで持つ。
  const [showSortModal, setShowSortModal] = useState(false)
  const [appliedSortCriterion, setAppliedSortCriterion] = useState<SortCriterion>(DEFAULT_SORT_CRITERION)
  const [appliedSortOrder, setAppliedSortOrder] = useState<SortOrder>(DEFAULT_SORT_ORDER)

  const [showFilterModal, setShowFilterModal] = useState(false)
  const [appliedFilter, setAppliedFilter] = useState<FilterCondition>(EMPTY_FILTER)

  useEffect(() => {
    if (!admin) return;
    // 離脱後に古い取得結果を反映しない。
    let cancelled = false;
    setLoadStatus("loading");
    getUsers()
      .then((allUsers) => {
        if (cancelled) return;
        setUsers(allUsers);
        setLoadStatus("loaded");
      })
      .catch(() => {
        if (!cancelled) setLoadStatus("failed");
      });
    return () => { cancelled = true; };
  }, [admin]);

  useEffect(() => {
    const handleDocumentClick = () => setOpenMenuUserId(null)
    document.addEventListener("click", handleDocumentClick)
    return () => document.removeEventListener("click", handleDocumentClick)
  }, [])

  // 検索と並べ替えは取得済みの一覧に適用し、APIを再取得しない。
  const displayedUsers = useMemo(() => {
    const filteredUsers = users.filter((user) => {
      if (appliedFilter.name && !user.name.includes(appliedFilter.name)) return false
      if (appliedFilter.email && !user.email.includes(appliedFilter.email)) return false
      // ISO 8601の先頭10文字を日付入力と同じYYYY-MM-DDで比較する。
      if (appliedFilter.fromDate && user.createdAt.slice(0, 10) < appliedFilter.fromDate) return false
      if (appliedFilter.toDate && user.createdAt.slice(0, 10) > appliedFilter.toDate) return false
      if (appliedFilter.status === "active" && user.cancelledAt) return false
      if (appliedFilter.status === "cancelled" && !user.cancelledAt) return false
      return true
    })

    const compareUsers =
      appliedSortCriterion === "name"
        ? createNameComparator(appliedSortOrder)
        : createCreatedAtComparator(appliedSortOrder)

    // filterで作った配列だけを並べ替え、usersのstateを直接変更しない。
    return filteredUsers.sort(compareUsers)
  }, [users, appliedFilter, appliedSortCriterion, appliedSortOrder])

  const replaceUser = (updatedUser: AdminUser) => {
    setUsers((previousUsers) =>
      previousUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    )
  }

  const handleCancel = async (userId: string) => {
    // 処理中の再操作による重複リクエストを防ぐ。
    if (statusChangingId || !window.confirm("解約すると、この受講生はログインできなくなります。データは残り、あとで再開できます。")) return
    setStatusChangingId(userId)
    try {
      replaceUser(await cancelUser(userId))
      showSuccessFlash("受講生を解約しました。")
    } catch {
      showErrorFlash("解約に失敗しました。もう一度お試しください。")
    } finally {
      setStatusChangingId(null)
      // 失敗時もメニューを閉じ、結果の通知を隠さない。
      setOpenMenuUserId(null)
    }
  }

  const handleResume = async (userId: string) => {
    if (statusChangingId) return
    setStatusChangingId(userId)
    try {
      replaceUser(await resumeUser(userId))
      showSuccessFlash("受講生を再開しました。")
    } catch {
      showErrorFlash("再開に失敗しました。もう一度お試しください。")
    } finally {
      setStatusChangingId(null)
      setOpenMenuUserId(null)
    }
  }

  const applySort = (sortCriterion: SortCriterion, sortOrder: SortOrder) => {
    setAppliedSortCriterion(sortCriterion)
    setAppliedSortOrder(sortOrder)
    setShowSortModal(false)
  }

  const applyFilter = (filter: FilterCondition) => {
    setAppliedFilter(filter)
    setShowFilterModal(false)
  }

  if (error) {
    return <PageError message={error} />;
  }

  if (loading || loadStatus === "loading") {
    return <PageSpinner />;
  }

  // 取得失敗を「登録ユーザー0件」と表示しない。
  if (loadStatus === "failed") {
    return <PageError message="受講生一覧を取得できませんでした。" />
  }

  return (
    <AdminLayout admin={admin} onLogout={handleLogout}>
      {/* 解約・再開の結果の通知 */}
      <FlashMessage flash={flash} onClose={clearFlash} />

      {/* 見出し・検索条件 */}
      <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
        <h4 className="mb-0">登録ユーザー一覧</h4>
        <button className="btn btn-success btn-sm text-nowrap" onClick={() => setShowSortModal(true)}>
          並べ替え
        </button>
        <button className="btn btn-success btn-sm text-nowrap" onClick={() => setShowFilterModal(true)}>
          絞り込み検索
        </button>
      </div>

      {/* 登録ユーザー一覧 */}
      <div className="card shadow-sm admin-table-cards">
        <table className="table table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th>名前</th>
              <th>email</th>
              <th>記事投稿数</th>
              <th>動画投稿数</th>
              <th>つぶやき投稿数</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {displayedUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4">
                  登録されているユーザーがいません
                </td>
              </tr>
            ) : (
              displayedUsers.map((user) => (
                <tr key={user.id}>
                  <td data-label="名前">
                    {user.name}
                    {user.cancelledAt && (
                      <span className="badge bg-secondary ms-2">
                        解約済み {formatSlashDate(user.cancelledAt)}
                      </span>
                    )}
                  </td>
                  <td data-label="email">{user.email}</td>
                  <td data-label="記事投稿数">
                    <button
                      className="btn btn-link p-0 text-decoration-none"
                      onClick={() => navigate(`/admin/users/${user.id}/articles`)}
                    >
                      {user.articlesCount}
                    </button>
                  </td>
                  <td data-label="動画投稿数">
                    <button
                      className="btn btn-link p-0 text-decoration-none"
                      onClick={() => navigate(`/admin/users/${user.id}/posts`)}
                    >
                      {user.postsCount}
                    </button>
                  </td>
                  <td data-label="つぶやき投稿数">
                    <button
                      className="btn btn-link p-0 text-decoration-none"
                      onClick={() => navigate(`/admin/users/${user.id}/tweets`)}
                    >
                      {user.tweetsCount}
                    </button>
                  </td>
                  <td className="text-center admin-table-cards__menu">
                    <UserRowMenu
                      user={user}
                      isOpen={openMenuUserId === user.id}
                      isStatusChanging={statusChangingId === user.id}
                      onToggle={() => setOpenMenuUserId(openMenuUserId === user.id ? null : user.id)}
                      onCancel={() => handleCancel(user.id)}
                      onResume={() => handleResume(user.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 並べ替え条件 */}
      {showSortModal && (
        <UserSortModal
          appliedSortCriterion={appliedSortCriterion}
          appliedSortOrder={appliedSortOrder}
          onApply={applySort}
          onClose={() => setShowSortModal(false)}
        />
      )}

      {/* 絞り込み条件 */}
      {showFilterModal && (
        <UserFilterModal
          appliedFilter={appliedFilter}
          onApply={applyFilter}
          onClose={() => setShowFilterModal(false)}
        />
      )}
    </AdminLayout>
  );
}
