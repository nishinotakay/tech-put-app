import { useEffect, useRef, useState, type FormEvent } from "react";
import { getApiErrorMessage } from "../../lib/api";
import "../../styles/components/videoCommentThread.css";

const MAX_COMMENT_LENGTH = 1000;
const LOW_REMAINING_THRESHOLD = 100;

type Props = {
  ariaLabel: string;
  submitLabel: string;
  initialContent?: string;
  autoFocus?: boolean;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
};

export default function CommentForm({ ariaLabel, submitLabel, initialContent = "", autoFocus = false, onSubmit, onCancel }: Props) {
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

  const handleEscape = () => {
    if (!onCancel || submitting) return;
    if (content !== initialContent &&!window.confirm("入力中の内容を破棄しますか？")) return;
    onCancel();
  };

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(keyEvent) => {
        if (keyEvent.key === "Escape") handleEscape();
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
