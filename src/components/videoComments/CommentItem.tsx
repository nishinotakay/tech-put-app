import { useState } from "react";
import { formatSlashDateTime } from "../../lib/formatDate";
import type { VideoComment } from "../../lib/videoCommentApi";
import CommentForm from "./CommentForm";
import "../../styles/components/videoCommentThread.css";

type Props = {
  comment: VideoComment;
  isTopLevel: boolean;
  deleting: boolean;
  onReply?: () => void;
  onUpdate: (commentId: string, content: string) => Promise<void>;
  onDelete: (comment: VideoComment, isTopLevel: boolean) => void;
};

export default function CommentItem({ comment, isTopLevel, deleting, onReply, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const edited = comment.updatedAt !== comment.createdAt;

  return (
    <div>
      <div className="video-comments__header">
        <span className="video-comments__author text-truncate">{comment.authorName}</span>
        {comment.authorType === "admin" && <span className="badge bg-primary">講師</span>}
        <small className="text-muted">
          {formatSlashDateTime(comment.createdAt)}
          {edited && " · 編集済み"}
        </small>
      </div>
      {editing ? (
        <div className="mt-2">
          <CommentForm
            ariaLabel="コメントを編集"
            submitLabel="保存"
            initialContent={comment.content}
            autoFocus
            onSubmit={async (content) => {
              await onUpdate(comment.id, content);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : (
        <p className="video-comments__content">{comment.content}</p>
      )}
      {!editing && (
        <div className="video-comments__actions">
          {onReply && (
            <button
              type="button"
              className="btn btn-link btn-sm video-comments__action"
              aria-label={`${comment.authorName}さんに返信`}
              onClick={onReply}
            >
              返信
            </button>
          )}
          {comment.isMine && (
            <button type="button" className="btn btn-link btn-sm video-comments__action" onClick={() => setEditing(true)}>
              編集
            </button>
          )}
          {comment.canDelete && (
            <button
              type="button"
              className="btn btn-link btn-sm text-danger video-comments__action"
              disabled={deleting}
              onClick={() => onDelete(comment, isTopLevel)}
            >
              削除
            </button>
          )}
        </div>
      )}
    </div>
  );
}
