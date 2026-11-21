import { useEffect, useState } from "react";
import UserLayout, { dashboardMenu } from "../../../components/user/UserLayout";
import FollowUserListItem from "../../../components/user/FollowUserListItem";
import { fetchUsers, type FollowUserProfile, type FollowUserRow } from "../../../lib/followApi";
import type { LoadStatus } from "../../../lib/loadStatus";
import "../../../styles/pages/follow.css";

export default function UserIndexPage() {
  const [users, setUsers] = useState<FollowUserRow[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    fetchUsers()
      .then((fetchedUsers) => {
        if (cancelled) return;
        setUsers(fetchedUsers);
        setLoadStatus("loaded");
      })
      .catch(() => {
        if (!cancelled) setLoadStatus("failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFollowChange = (changedUser: FollowUserProfile) => {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === changedUser.id ? { ...user, followedByCurrentUser: changedUser.followedByCurrentUser } : user,
      ),
    );
  };

  return (
    <UserLayout menu={dashboardMenu} headerTitle="プロフィール一覧">
      {() => (
        <div className="follow-page">
          {loadStatus === "loading" && <p className="text-muted">読み込み中…</p>}
          {loadStatus === "failed" && <p className="text-danger">読み込みに失敗しました</p>}
          {loadStatus === "loaded" && (
            <ul className="list-group">
              {users.map((user) => (
                <FollowUserListItem key={user.id} user={user} onFollowChange={handleFollowChange} showChatButton />
              ))}
            </ul>
          )}
        </div>
      )}
    </UserLayout>
  );
}
