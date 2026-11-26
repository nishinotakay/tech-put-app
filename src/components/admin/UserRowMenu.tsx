// 受講生一覧の各行の ⋮ メニュー（詳細・解約・再開）を表示する。
import { useNavigate } from "react-router-dom"
import type { AdminUser } from "../../lib/userTypes"

type UserRowMenuProps = {
  user: AdminUser
  isOpen: boolean
  isStatusChanging: boolean
  onToggle: () => void
  onCancel: () => void
  onResume: () => void
}

export default function UserRowMenu({
  user,
  isOpen,
  isStatusChanging,
  onToggle,
  onCancel,
  onResume,
}: UserRowMenuProps) {
  const navigate = useNavigate()

  return (
    <>
      {/* 外クリックで閉じる処理と競合しないよう、メニュー内のクリック伝播を止める。 */}
      <button
        className="btn btn-sm btn-link text-secondary p-0"
        onClick={(clickEvent) => {
          clickEvent.stopPropagation()
          onToggle()
        }}
      >
        ⋮
      </button>
      {isOpen && (
        <div
          className="dropdown-menu show"
          style={{ position: "absolute", right: 0, top: "100%", zIndex: 1000, minWidth: "100px" }}
          onClick={(clickEvent) => clickEvent.stopPropagation()}
        >
          <button
            className="dropdown-item"
            onClick={() => navigate(`/admin/users/${user.id}`)}
          >
            詳細
          </button>
          {user.cancelledAt ? (
            <button
              className="dropdown-item"
              onClick={onResume}
              disabled={isStatusChanging}
            >
              {isStatusChanging ? "再開中..." : "再開"}
            </button>
          ) : (
            <button
              className="dropdown-item text-danger"
              onClick={onCancel}
              disabled={isStatusChanging}
            >
              {isStatusChanging ? "解約中..." : "解約"}
            </button>
          )}
        </div>
      )}
    </>
  )
}
