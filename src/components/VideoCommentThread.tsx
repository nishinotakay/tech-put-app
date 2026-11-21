import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { getApiErrorMessage } from "../lib/api";
import { formatSlashDateTime } from "../lib/formatDate";
import type { LoadStatus } from "../lib/loadStatus";
import {
  createVideoComment,
  deleteVideoComment,
  fetchVideoComments,
  updateVideoComment,
  type CommentRole,
  type VideoComment,
} from "../lib/videoCommentApi";
import "../styles/components/videoCommentThread.css";

const MAX_COMMENT_LENGTH = 1000;
const LOW_REMAINING_THRESHOLD = 100;

type Props = {
  role: CommentRole;
  postId: string;
};

type CommentFormProps = {
  ariaLabel: string;
  submitLabel: string;
  initialContent?: string;
  autoFocus?: boolean;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
};

function CommentForm({ ariaLabel, submitLabel, initialContent = "", autoFocus = false, onSubmit, onCancel }: CommentFormProps) {
  const [content, setContent] = useState(initialContent);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  const remaining = MAX_COMMENT_LENGTH - content.length;
  const counterClass = remaining <= 0 ? "text-danger" : remaining < LOW_REMAINING_THRESHOLD ? "text-warning" : "";

  const handleSubmit = async (submitEvent: FormEvent) => {
    submitEvent.preventDefault();
    if (submitting || content.trim() === "") return;
    setSubmitting(true);
    setErrorMessage("");
    try {
      await onSubmit(content);
      // 編集・返信は成功後にフォームごと閉じられるため、新規投稿のときだけ入力を空にする
      if (initialContent === "" && !onCancel) setContent("");
    } catch (submitError) {
      setErrorMessage(getApiErrorMessage(submitError, "送信に失敗しました。"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(keyEvent) => {
        if (keyEvent.key === "Escape" && onCancel) onCancel();
      }}
    >
      <textarea
        ref={textareaRef}
        className="form-control video-comments__form-textarea"
        rows={3}
        maxLength={MAX_COMMENT_LENGTH}
        aria-label={ariaLabel}
        value={content}
        disabled={submitting}
        onChange={(changeEvent) => setContent(changeEvent.target.value)}
      />
      <div className={`video-comments__counter ${counterClass}`}>残り {remaining} 文字</div>
      <div className="d-flex gap-2 mt-2">
        <button type="submit" className="btn btn-primary btn-sm" disabled={submitting || content.trim() === ""}>
          {submitting ? "送信中…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-outline-secondary btn-sm" disabled={submitting} onClick={onCancel}>
            キャンセル
          </button>
        )}
      </div>
      {errorMessage && (
        <div className="alert alert-danger mt-2 mb-0" role="alert">
          {errorMessage}
        </div>
      )}
    </form>
  );
}

type CommentItemProps = {
  comment: VideoComment;
  isTopLevel: boolean;
  onReply?: () => void;
  onUpdate: (commentId: string, content: string) => Promise<void>;
  onDelete: (comment: VideoComment, isTopLevel: boolean) => void;
};

function CommentItem({ comment, isTopLevel, onReply, onUpdate, onDelete }: CommentItemProps) {
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
            <button type="button" className="btn btn-link btn-sm video-comments__action" onClick={onReply}>
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

export default function VideoCommentThread({ role, postId }: Props) {
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      setComments(await fetchVideoComments(role, postId));
      setStatus("loaded");
    } catch {
      setStatus("failed");
    }
  }, [role, postId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalCount = comments.reduce((sum, thread) => sum + 1 + (thread.replies?.length ?? 0), 0);

  const handleCreate = async (content: string, parentId?: string) => {
    const created = await createVideoComment(role, postId, content, parentId);
    if (parentId) {
      setComments((current) =>
        current.map((thread) =>
          thread.id === parentId ? { ...thread, replies: [...(thread.replies ?? []), created] } : thread
        )
      );
      setOpenReplyId(null);
    } else {
      setComments((current) => [{ ...created, replies: created.replies ?? [] }, ...current]);
    }
  };

  const handleUpdate = async (commentId: string, content: string) => {
    const updated = await updateVideoComment(role, postId, commentId, content);
    setComments((current) =>
      current.map((thread) => {
        if (thread.id === commentId) return { ...thread, ...updated, replies: thread.replies };
        return {
          ...thread,
          replies: (thread.replies ?? []).map((reply) => (reply.id === commentId ? updated : reply)),
        };
      })
    );
  };

  const handleDelete = async (comment: VideoComment, isTopLevel: boolean) => {
    const message = isTopLevel ? "このコメントを削除しますか？返信も削除されます。" : "このコメントを削除しますか？";
    if (!window.confirm(message)) return;
    setActionError("");
    try {
      await deleteVideoComment(role, postId, comment.id);
    } catch (deleteError) {
      setActionError(getApiErrorMessage(deleteError, "削除に失敗しました。"));
      return;
    }
    setComments((current) =>
      isTopLevel
        ? current.filter((thread) => thread.id !== comment.id)
        : current.map((thread) => ({
            ...thread,
            replies: (thread.replies ?? []).filter((reply) => reply.id !== comment.id),
          }))
    );
  };

  return (
    <section className="video-comments">
      <h2 className="video-comments__title">コメント ({totalCount})</h2>
      <CommentForm ariaLabel="コメントを入力" submitLabel="コメントする" onSubmit={(content) => handleCreate(content)} />

      {actionError && (
        <div className="alert alert-danger mt-3 mb-0" role="alert">
          {actionError}
        </div>
      )}

      {status === "loading" && (
        <div className="d-flex align-items-center gap-2 mt-3" role="status">
          <div className="spinner-border spinner-border-sm" aria-hidden="true" />
          <span>コメントを読み込み中…</span>
        </div>
      )}

      {status === "failed" && (
        <div className="alert alert-danger mt-3 d-flex align-items-center justify-content-between gap-2" role="alert">
          <span>コメントの読み込みに失敗しました。</span>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={load}>
            再読み込み
          </button>
        </div>
      )}

      {status === "loaded" && comments.length === 0 && (
        <p className="text-muted mt-3">まだコメントはありません。最初のコメントを書いてみましょう。</p>
      )}

      {status === "loaded" && comments.length > 0 && (
        <ul className="video-comments__list">
          {comments.map((thread) => (
            <li key={thread.id} className="video-comments__thread">
              <CommentItem
                comment={thread}
                isTopLevel
                onReply={() => setOpenReplyId(openReplyId === thread.id ? null : thread.id)}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
              {(thread.replies?.length ?? 0) > 0 && (
                <ul className="video-comments__replies">
                  {(thread.replies ?? []).map((reply) => (
                    <li key={reply.id} className="video-comments__reply">
                      {/* 返信への返信もスレッドのトップレベルに付けるため、返信ボタンはトップレベル id を開く */}
                      <CommentItem
                        comment={reply}
                        isTopLevel={false}
                        onReply={() => setOpenReplyId(thread.id)}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                      />
                    </li>
                  ))}
                </ul>
              )}
              {openReplyId === thread.id && (
                <div className="video-comments__reply-form">
                  <CommentForm
                    ariaLabel={`${thread.authorName}さんのコメントへの返信`}
                    submitLabel="返信する"
                    autoFocus
                    onSubmit={(content) => handleCreate(content, thread.id)}
                    onCancel={() => setOpenReplyId(null)}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
