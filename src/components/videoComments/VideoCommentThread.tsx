import { useCallback, useEffect, useRef, useState } from "react";
import { getApiErrorMessage } from "../../lib/api";
import type { LoadStatus } from "../../lib/loadStatus";
import {
  createVideoComment,
  deleteVideoComment,
  fetchVideoComments,
  updateVideoComment,
  type CommentRole,
  type VideoComment,
} from "../../lib/videoCommentApi";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";
import "../../styles/components/videoCommentThread.css";

type Props = {
  role: CommentRole;
  postId: string;
};

type CommentThread = VideoComment & { replies: VideoComment[] };

export default function VideoCommentThread({ role, postId }: Props) {
  const [comments, setComments] = useState<CommentThread[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const latestRequestIdRef = useRef(0);

  const load = useCallback(async () => {
    latestRequestIdRef.current += 1;
    const requestId = latestRequestIdRef.current;
    setStatus("loading");
    try {
      const fetched = await fetchVideoComments(role, postId);
      // 古い応答（別動画・再読み込み前）で上書きしない
      if (requestId !== latestRequestIdRef.current) return;
      setComments(fetched.map((thread) => ({ ...thread, replies: thread.replies ?? [] })));
      setStatus("loaded");
    } catch {
      if (requestId === latestRequestIdRef.current) setStatus("failed");
    }
  }, [role, postId]);

  useEffect(() => {
    setComments([]);
    setOpenReplyId(null);
    setActionError("");
    setDeletingId(null);
    load();
    return () => {
      latestRequestIdRef.current += 1;
    };
  }, [load]);

  const totalCount = comments.reduce((sum, thread) => sum + 1 + thread.replies.length, 0);

  const handleCreate = async (content: string, parentId?: string) => {
    const created = await createVideoComment(role, postId, content, parentId);
    if (parentId) {
      setComments((current) =>
        current.map((thread) => (thread.id === parentId ? { ...thread, replies: [...thread.replies, created] } : thread))
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
          replies: thread.replies.map((reply) => (reply.id === commentId ? updated : reply)),
        };
      })
    );
  };

  const handleDelete = async (comment: VideoComment, isTopLevel: boolean) => {
    const message = isTopLevel ? "このコメントを削除しますか？返信も削除されます。" : "このコメントを削除しますか？";
    if (!window.confirm(message)) return;
    setActionError("");
    setDeletingId(comment.id);
    try {
      await deleteVideoComment(role, postId, comment.id);
    } catch (deleteError) {
      setActionError(getApiErrorMessage(deleteError, "削除に失敗しました。"));
      setDeletingId(null);
      return;
    }
    setDeletingId(null);
    setComments((current) =>
      isTopLevel
        ? current.filter((thread) => thread.id !== comment.id)
        : current.map((thread) => ({
            ...thread,
            replies: thread.replies.filter((reply) => reply.id !== comment.id),
          }))
    );
  };

  return (
    <section className="video-comments">
      <h2 className="video-comments__title">コメント{status === "loaded" && ` (${totalCount})`}</h2>
      {status === "loaded" && (
        <CommentForm ariaLabel="コメントを入力" submitLabel="コメントする" onSubmit={(content) => handleCreate(content)} />
      )}

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
                deleting={deletingId === thread.id}
                onReply={() => setOpenReplyId(openReplyId === thread.id ? null : thread.id)}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
              {thread.replies.length > 0 && (
                <ul className="video-comments__replies">
                  {thread.replies.map((reply) => (
                    <li key={reply.id} className="video-comments__reply">
                      {/* 返信への返信もスレッドのトップレベルに付けるため、返信ボタンはトップレベル id を開く */}
                      <CommentItem
                        comment={reply}
                        isTopLevel={false}
                        deleting={deletingId === reply.id}
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
