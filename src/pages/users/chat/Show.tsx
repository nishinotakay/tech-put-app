import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import UserLayout, { dashboardMenu } from "../../../components/user/UserLayout";
import { getApiErrorMessage } from "../../../lib/api";
import { fetchChatMessages, sendChatMessage, type ChatMessage, type ChatPartner } from "../../../lib/chatApi";
import { formatSlashDateTime } from "../../../lib/formatDate";
import type { LoadStatus } from "../../../lib/loadStatus";
import "../../../styles/pages/chat.css";

type ChatRoomLoadStatus = LoadStatus | "notFound";

const POLLING_INTERVAL_MS = 5000;
const MESSAGE_MAX_LENGTH = 1000;
const SEND_FAILED_MESSAGE = "メッセージの送信に失敗しました。";

// 送信の応答と 5 秒ごとの取り直しが同じ発言を返すことがあるため、id で重複を除く
function appendNewMessages(currentMessages: ChatMessage[], fetchedMessages: ChatMessage[]): ChatMessage[] {
  const knownIds = new Set(currentMessages.map((message) => message.id));
  const newMessages = fetchedMessages.filter((message) => !knownIds.has(message.id));
  return newMessages.length === 0 ? currentMessages : [...currentMessages, ...newMessages];
}

export default function ChatRoomShowPage() {
  const { id: chatRoomId } = useParams<{ id: string }>();
  const [partner, setPartner] = useState<ChatPartner | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadStatus, setLoadStatus] = useState<ChatRoomLoadStatus>("loading");
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const messageListRef = useRef<HTMLDivElement>(null);

  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : undefined;
  const canSend = draft.trim().length > 0 && !isSending;

  useEffect(() => {
    if (!chatRoomId) return;
    let cancelled = false;
    setLoadStatus("loading");
    fetchChatMessages(chatRoomId)
      .then((roomMessages) => {
        if (cancelled) return;
        setPartner(roomMessages.chatRoom.partner);
        setMessages(roomMessages.chatMessages);
        setLoadStatus("loaded");
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadStatus(axios.isAxiosError(err) && err.response?.status === 404 ? "notFound" : "failed");
      });
    return () => {
      cancelled = true;
    };
  }, [chatRoomId]);

  useEffect(() => {
    if (!chatRoomId || loadStatus !== "loaded") return;
    let cancelled = false;
    const timerId = setInterval(() => {
      if (document.hidden) return;
      fetchChatMessages(chatRoomId, lastMessageId)
        .then((roomMessages) => {
          if (!cancelled) setMessages((currentMessages) => appendNewMessages(currentMessages, roomMessages.chatMessages));
        })
        .catch(() => {
          // 一時的な失敗で毎回通知を出さず、次の回で取り直す
        });
    }, POLLING_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timerId);
    };
  }, [chatRoomId, loadStatus, lastMessageId]);

  useEffect(() => {
    const messageList = messageListRef.current;
    if (messageList) messageList.scrollTop = messageList.scrollHeight;
  }, [messages.length]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!chatRoomId || !canSend) return;
    setIsSending(true);
    setSendError("");
    try {
      await sendChatMessage(chatRoomId, draft);
      // 取り直しに失敗しても、次の 5 秒の取得で同じ範囲を拾える
      const roomMessages = await fetchChatMessages(chatRoomId, lastMessageId).catch(() => null);
      if (roomMessages) {
        setMessages((currentMessages) => appendNewMessages(currentMessages, roomMessages.chatMessages));
      }
      setDraft("");
    } catch (err) {
      const isValidationError = axios.isAxiosError(err) && err.response?.status === 422;
      setSendError(isValidationError ? getApiErrorMessage(err, SEND_FAILED_MESSAGE) : SEND_FAILED_MESSAGE);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <UserLayout menu={dashboardMenu} headerTitle="チャット">
      {() => (
        <div className="chat-page">
          {loadStatus === "loading" && <p className="text-muted">読み込み中...</p>}
          {loadStatus === "failed" && (
            <div className="alert alert-danger py-2" role="alert">
              チャットを読み込めませんでした。
            </div>
          )}
          {loadStatus === "notFound" && (
            <div className="card card-body">
              <p className="mb-3">チャットが見つかりません</p>
              <div>
                <Link to="/chat_rooms" className="btn btn-sm btn-outline-secondary">
                  一覧へ
                </Link>
              </div>
            </div>
          )}
          {loadStatus === "loaded" && partner && (
            <div className="card">
              <div className="card-header bg-white d-flex align-items-center gap-2">
                <h2 className="h6 fw-bold mb-0 flex-grow-1 chat-one-line">{partner.name}さんとのチャット</h2>
                <Link to="/chat_rooms" className="btn btn-sm btn-outline-secondary text-nowrap">
                  一覧へ
                </Link>
              </div>
              <div ref={messageListRef} className="card-body chat-message-list">
                {messages.length === 0 ? (
                  <p className="text-muted text-center my-4">まだメッセージはありません。最初のメッセージを送ってみましょう。</p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`chat-message ${message.isMine ? "chat-message--mine" : "chat-message--partner"}`}
                    >
                      <div className="chat-bubble">{message.content}</div>
                      <div className="text-muted small mt-1">{formatSlashDateTime(message.createdAt)}</div>
                    </div>
                  ))
                )}
              </div>
              <form className="card-footer bg-white" onSubmit={handleSubmit}>
                {sendError && (
                  <div className="alert alert-danger py-2" role="alert">
                    {sendError}
                  </div>
                )}
                <textarea
                  className="form-control mb-2"
                  rows={3}
                  maxLength={MESSAGE_MAX_LENGTH}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="メッセージを入力"
                  aria-label="メッセージ"
                />
                <div className="d-flex justify-content-end">
                  <button type="submit" className="btn btn-success" disabled={!canSend}>
                    {isSending ? "送信中..." : "送信"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </UserLayout>
  );
}
