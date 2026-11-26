import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout, { dashboardMenu } from "../../../components/user/UserLayout";
import UserAvatar from "../../../components/user/UserAvatar";
import { fetchChatRooms, type ChatRoomRow } from "../../../lib/chatApi";
import { formatSlashDateTime } from "../../../lib/formatDate";
import type { LoadStatus } from "../../../lib/loadStatus";
import "../../../styles/pages/chat.css";

export default function ChatRoomIndexPage() {
  const [chatRooms, setChatRooms] = useState<ChatRoomRow[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    fetchChatRooms()
      .then((fetchedChatRooms) => {
        if (cancelled) return;
        setChatRooms(fetchedChatRooms);
        setLoadStatus("loaded");
      })
      .catch(() => {
        if (!cancelled) setLoadStatus("failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <UserLayout menu={dashboardMenu} headerTitle="チャット">
      {() => (
        <div className="chat-page">
          {loadStatus === "loading" && <p className="text-muted">読み込み中...</p>}
          {loadStatus === "failed" && (
            <div className="alert alert-danger py-2" role="alert">
              チャットの一覧を読み込めませんでした。
            </div>
          )}
          {loadStatus === "loaded" && chatRooms.length === 0 && (
            <div className="card card-body text-muted">
              まだチャットはありません。フォローしている受講生のページやプロフィール一覧の「チャット」から始められます。
            </div>
          )}
          {loadStatus === "loaded" && chatRooms.length > 0 && (
            <div className="list-group">
              {chatRooms.map((chatRoom) => (
                <Link
                  key={chatRoom.id}
                  to={`/chat_rooms/${chatRoom.id}`}
                  className="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3"
                >
                  <UserAvatar size="md" />
                  <div className="chat-room-summary flex-grow-1">
                    <div className="d-flex align-items-baseline gap-2">
                      <span className="fw-bold chat-one-line flex-grow-1">{chatRoom.partner.name}</span>
                      <span className="text-muted small text-nowrap">
                        {formatSlashDateTime(chatRoom.lastMessage?.createdAt ?? chatRoom.createdAt)}
                      </span>
                    </div>
                    <p className="text-muted small mb-0 chat-one-line">
                      {chatRoom.lastMessage?.content ?? "（まだメッセージはありません）"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </UserLayout>
  );
}
