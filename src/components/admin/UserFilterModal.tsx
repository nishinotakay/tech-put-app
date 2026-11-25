// 受講生一覧の絞り込み条件を入力し、「検索する」を押したときだけ親へ渡す。
import { useState } from "react"
import Modal from "../shared/Modal"

const USER_STATUS_FILTERS = ["all", "active", "cancelled"] as const
type UserStatusFilter = (typeof USER_STATUS_FILTERS)[number]

function isUserStatusFilter(value: string): value is UserStatusFilter {
  return USER_STATUS_FILTERS.some((userStatusFilter) => userStatusFilter === value)
}

export interface FilterCondition {
  name: string       // 名前（部分一致）
  email: string      // メールアドレス（部分一致）
  fromDate: string   // 登録日（から）YYYY-MM-DD形式
  toDate: string     // 登録日（まで）YYYY-MM-DD形式
  status: UserStatusFilter
}

export const EMPTY_FILTER: FilterCondition = { name: "", email: "", fromDate: "", toDate: "", status: "all" }

type UserFilterModalProps = {
  appliedFilter: FilterCondition
  onApply: (filter: FilterCondition) => void
  onClose: () => void
}

export default function UserFilterModal({ appliedFilter, onApply, onClose }: UserFilterModalProps) {
  // 開くたびにマウントされ、入力中の条件は適用済みの条件から始まる。
  const [filterInput, setFilterInput] = useState<FilterCondition>(appliedFilter)

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="絞り込み検索"
      titleId="user-filter-modal-title"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            戻る
          </button>
          <button className="btn btn-success" onClick={() => onApply(filterInput)}>
            検索する
          </button>
        </>
      }
    >
      <div>
        <label htmlFor="user-filter-name" className="form-label fw-semibold">
          名前
        </label>
        <input
          id="user-filter-name"
          type="text"
          className="form-control"
          placeholder="例：田中"
          value={filterInput.name}
          onChange={(changeEvent) =>
            setFilterInput({ ...filterInput, name: changeEvent.target.value })
          }
        />
      </div>
      <div>
        <label htmlFor="user-filter-email" className="form-label fw-semibold">
          メールアドレス
        </label>
        <input
          id="user-filter-email"
          type="text"
          className="form-control"
          placeholder="例：example@gmail.com"
          value={filterInput.email}
          onChange={(changeEvent) =>
            setFilterInput({ ...filterInput, email: changeEvent.target.value })
          }
        />
      </div>
      <div>
        <label htmlFor="user-filter-from-date" className="form-label fw-semibold">
          登録日（から）
        </label>
        <input
          id="user-filter-from-date"
          type="date"
          className="form-control"
          value={filterInput.fromDate}
          onChange={(changeEvent) =>
            setFilterInput({ ...filterInput, fromDate: changeEvent.target.value })
          }
        />
      </div>
      <div>
        <label htmlFor="user-filter-to-date" className="form-label fw-semibold">
          登録日（まで）
        </label>
        <input
          id="user-filter-to-date"
          type="date"
          className="form-control"
          value={filterInput.toDate}
          onChange={(changeEvent) =>
            setFilterInput({ ...filterInput, toDate: changeEvent.target.value })
          }
        />
      </div>

      <div>
        <label htmlFor="user-filter-status" className="form-label fw-semibold">
          状態
        </label>
        <select
          id="user-filter-status"
          className="form-select"
          value={filterInput.status}
          onChange={(changeEvent) => {
            const selectedValue = changeEvent.target.value
            if (isUserStatusFilter(selectedValue)) setFilterInput({ ...filterInput, status: selectedValue })
          }}
        >
          <option value="all">すべて</option>
          <option value="active">利用中</option>
          <option value="cancelled">解約済み</option>
        </select>
      </div>
    </Modal>
  )
}
