import { useEffect, useState } from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import axios from "axios";
import UserLayout, { dashboardMenu } from "../../../components/user/UserLayout";
import FollowUserListItem from "../../../components/user/FollowUserListItem";
import {
  fetchFollowList,
  fetchUserProfile,
  type FollowListKind,
  type FollowUserProfile,
  type FollowUserRow,
} from "../../../lib/followApi";
import type { LoadStatus } from "../../../lib/loadStatus";
import { buildUserPageHeading } from "../../../lib/pageHeading";
import "../../../styles/pages/follow.css";

type FollowListLoadStatus = LoadStatus | "notFound";

const LIST_LABELS: Record<FollowListKind, { tab: string; heading: (name: string) => string; empty: string }> = {
  followings: { tab: "フォロー中", heading: (name) => `${name}さんがフォロー中`, empty: "まだ誰もフォローしていません" },
  followers: { tab: "フォロワー", heading: (name) => `${name}さんのフォロワー`, empty: "まだフォロワーはいません" },
};

type FollowListPageProps = {
  kind: FollowListKind;
};

export default function FollowListPage({ kind }: FollowListPageProps) {
  const { id } = useParams<{ id: string }>();
  const [owner, setOwner] = useState<FollowUserProfile | null>(null);
  const [users, setUsers] = useState<FollowUserRow[]>([]);
  const [loadStatus, setLoadStatus] = useState<FollowListLoadStatus>("loading");

  useEffect(() => {
    if (!id) return;
    // タブや受講生を切り替えた後に、前の一覧の応答で上書きしない
    let cancelled = false;
    setLoadStatus("loading");
    Promise.all([fetchUserProfile(id), fetchFollowList(id, kind)])
      .then(([fetchedOwner, fetchedUsers]) => {
        if (cancelled) return;
        setOwner(fetchedOwner);
        setUsers(fetchedUsers);
        setLoadStatus("loaded");
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadStatus(axios.isAxiosError(err) && err.response?.status === 404 ? "notFound" : "failed");
      });
    return () => {
      cancelled = true;
    };
  }, [id, kind]);

  // 外しても行は消さず、ボタンだけ戻す
  const handleFollowChange = (changedUser: FollowUserProfile) => {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === changedUser.id ? { ...user, followedByCurrentUser: changedUser.followedByCurrentUser } : user,
      ),
    );
  };

  const labels = LIST_LABELS[kind];
  const headerTitle = loadStatus === "loaded" && owner ? buildUserPageHeading(owner.name, labels.tab) : labels.tab;

  return (
    <UserLayout menu={dashboardMenu} headerTitle={headerTitle}>
      {() => (
        <div className="follow-page">
          {loadStatus === "loading" && <p className="text-muted">読み込み中…</p>}
          {loadStatus === "failed" && <p className="text-danger">読み込みに失敗しました</p>}
          {loadStatus === "notFound" && (
            <div className="card card-body">
              <p className="mb-3">受講生が見つかりません</p>
              <div>
                <Link to="/profiles" className="btn btn-sm btn-outline-secondary">
                  プロフィール一覧へ戻る
                </Link>
              </div>
            </div>
          )}
          {loadStatus === "loaded" && owner && (
            <>
              <Link to={`/users/${owner.id}`} className="d-inline-block small text-decoration-none mb-3">
                <i className="fa-solid fa-arrow-left me-1" aria-hidden="true" />
                {owner.name}さんのページへ戻る
              </Link>
              <h2 className="h5 fw-bold mb-3 follow-user-name">{labels.heading(owner.name)}</h2>
              <ul className="nav nav-tabs">
                {(Object.keys(LIST_LABELS) as FollowListKind[]).map((tabKind) => (
                  <li className="nav-item" key={tabKind}>
                    <NavLink to={`/users/${owner.id}/${tabKind}`} className="nav-link">
                      {LIST_LABELS[tabKind].tab}
                    </NavLink>
                  </li>
                ))}
              </ul>
              {users.length === 0 ? (
                <p className="bg-white border border-top-0 p-3 mb-0 text-muted">{labels.empty}</p>
              ) : (
                <ul className="list-group follow-list">
                  {users.map((user) => (
                    <FollowUserListItem key={user.id} user={user} onFollowChange={handleFollowChange} />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </UserLayout>
  );
}
