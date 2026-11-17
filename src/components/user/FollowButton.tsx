import { useState } from "react";
import { getApiErrorMessage } from "../../lib/api";
import { followUser, unfollowUser, type FollowUserProfile } from "../../lib/followApi";
import Modal from "../shared/Modal";

type FollowButtonProps = {
  userId: string;
  userName: string;
  followed: boolean;
  onChange: (user: FollowUserProfile) => void;
};

export default function FollowButton({ userId, userName, followed, onChange }: FollowButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [followError, setFollowError] = useState("");

  const submitFollowChange = async (
    request: (targetUserId: string) => Promise<FollowUserProfile>,
    fallbackMessage: string,
  ) => {
    setIsSubmitting(true);
    setFollowError("");
    try {
      onChange(await request(userId));
    } catch (err) {
      setFollowError(getApiErrorMessage(err, fallbackMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnfollowConfirm = async () => {
    setIsConfirmOpen(false);
    await submitFollowChange(unfollowUser, "フォローを外せませんでした。");
  };

  return (
    <div className="flex-shrink-0 text-end">
      {followed ? (
        <button
          type="button"
          className="btn btn-sm btn-success text-nowrap"
          onClick={() => setIsConfirmOpen(true)}
          disabled={isSubmitting}
          aria-pressed="true"
        >
          <i className="fa-solid fa-check me-1" aria-hidden="true" />
          フォロー中
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-sm btn-outline-success text-nowrap"
          onClick={() => submitFollowChange(followUser, "フォローできませんでした。")}
          disabled={isSubmitting}
          aria-pressed="false"
        >
          <i className="fa-solid fa-user-plus me-1" aria-hidden="true" />
          フォローする
        </button>
      )}
      {followError && <p className="text-danger small mt-1 mb-0">{followError}</p>}

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="フォローを外す"
        titleId={`unfollow-modal-title-${userId}`}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsConfirmOpen(false)}>
              キャンセル
            </button>
            <button type="button" className="btn btn-danger" onClick={handleUnfollowConfirm}>
              外す
            </button>
          </>
        }
      >
        <p className="mb-0">{userName}さんのフォローを外しますか？</p>
      </Modal>
    </div>
  );
}
