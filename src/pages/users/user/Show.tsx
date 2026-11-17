import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import UserLayout, { dashboardMenu } from "../../../components/user/UserLayout";
import UserAvatar from "../../../components/user/UserAvatar";
import FollowButton from "../../../components/user/FollowButton";
import { fetchUserProfile, type FollowUserProfile } from "../../../lib/followApi";
import type { LoadStatus } from "../../../lib/loadStatus";
import { buildUserPageHeading } from "../../../lib/pageHeading";
import "../../../styles/pages/follow.css";

type ProfileLoadStatus = LoadStatus | "notFound";

export default function UserShowPage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<FollowUserProfile | null>(null);
  const [loadStatus, setLoadStatus] = useState<ProfileLoadStatus>("loading");

  useEffect(() => {
    if (!id) return;
    // 別の受講生のページへ移った後に、前のページの応答で上書きしない
    let cancelled = false;
    setLoadStatus("loading");
    fetchUserProfile(id)
      .then((fetchedProfile) => {
        if (cancelled) return;
        setProfile(fetchedProfile);
        setLoadStatus("loaded");
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadStatus(axios.isAxiosError(err) && err.response?.status === 404 ? "notFound" : "failed");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const headerTitle = loadStatus === "loaded" && profile ? buildUserPageHeading(profile.name, "ページ") : "受講生ページ";

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
          {loadStatus === "loaded" && profile && (
            <div className="card card-body">
              <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                <div className="d-flex align-items-center gap-3 flex-grow-1 follow-user-name">
                  <UserAvatar size="lg" />
                  <h2 className="h5 fw-bold mb-0 follow-user-name">{profile.name}</h2>
                </div>
                {!profile.isCurrentUser && (
                  <FollowButton
                    userId={profile.id}
                    userName={profile.name}
                    followed={profile.followedByCurrentUser}
                    onChange={setProfile}
                  />
                )}
              </div>
              <div className="d-flex flex-wrap gap-4">
                <Link to={`/users/${profile.id}/followings`} className="text-body text-decoration-none">
                  <span className="fw-bold fs-5 me-1">{profile.followingsCount}</span>フォロー
                </Link>
                <Link to={`/users/${profile.id}/followers`} className="text-body text-decoration-none">
                  <span className="fw-bold fs-5 me-1">{profile.followersCount}</span>フォロワー
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </UserLayout>
  );
}
