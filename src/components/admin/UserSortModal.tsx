// 受講生一覧の並べ替え条件を入力し、「並べ替える」を押したときだけ親へ渡す。
import { useState } from "react"
import Modal from "../shared/Modal"
import { isSortOrder, DATE_SORT_ORDER_OPTIONS, type SortOrder } from "../../lib/sort"

// 型と実行時の検証で、許可する並べ替え基準を共有する。
const SORT_CRITERIA = ["createdAt", "name"] as const
export type SortCriterion = (typeof SORT_CRITERIA)[number]

function isSortCriterion(value: string): value is SortCriterion {
  return SORT_CRITERIA.some((sortCriterion) => sortCriterion === value)
}

export const DEFAULT_SORT_CRITERION: SortCriterion = "createdAt"

type UserSortModalProps = {
  appliedSortCriterion: SortCriterion
  appliedSortOrder: SortOrder
  onApply: (sortCriterion: SortCriterion, sortOrder: SortOrder) => void
  onClose: () => void
}

export default function UserSortModal({
  appliedSortCriterion,
  appliedSortOrder,
  onApply,
  onClose,
}: UserSortModalProps) {
  // 開くたびにマウントされ、入力中の条件は適用済みの条件から始まる。
  const [sortCriterionInput, setSortCriterionInput] = useState<SortCriterion>(appliedSortCriterion)
  const [sortOrderInput, setSortOrderInput] = useState<SortOrder>(appliedSortOrder)

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="並べ替え"
      titleId="user-sort-modal-title"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            戻る
          </button>
          <button className="btn btn-success" onClick={() => onApply(sortCriterionInput, sortOrderInput)}>
            並べ替える
          </button>
        </>
      }
    >
      <div>
        <label htmlFor="user-sort-criteria-select" className="form-label fw-semibold">
          並べ替え基準
        </label>
        <select
          id="user-sort-criteria-select"
          className="form-select"
          value={sortCriterionInput}
          onChange={(changeEvent) => {
            const selectedValue = changeEvent.target.value
            if (isSortCriterion(selectedValue)) setSortCriterionInput(selectedValue)
          }}
        >
          <option value="createdAt">登録日</option>
          <option value="name">名前</option>
        </select>
      </div>
      <div>
        {/* TODO: 名前で並べ替える場合のラベルは、仕様確認後に日時用と分ける。 */}
        <label htmlFor="user-sort-order-select" className="form-label fw-semibold">
          並べ替え順
        </label>
        <select
          id="user-sort-order-select"
          className="form-select"
          value={sortOrderInput}
          onChange={(changeEvent) => {
            const selectedValue = changeEvent.target.value
            if (isSortOrder(selectedValue)) setSortOrderInput(selectedValue)
          }}
        >
          {DATE_SORT_ORDER_OPTIONS.map((sortOrderOption) => (
            <option key={sortOrderOption.value} value={sortOrderOption.value}>
              {sortOrderOption.label}
            </option>
          ))}
        </select>
      </div>
    </Modal>
  )
}
