import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout, { dashboardMenu } from "../../../components/user/UserLayout";
import { getApiErrorMessage } from "../../../lib/api";
import { formatVideoDate } from "../../../lib/formatDate";
import type { LoadStatus } from "../../../lib/loadStatus";
import { getUserPosts, type UserPost } from "../../../lib/userApi";
import { getYouTubeVideoId } from "../../../lib/youtube";
import "../../../styles/components/videoSummary.css";

export default function VideoIndexPage() {
  const [videos, setVideos] = useState<UserPost[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      setVideos(await getUserPosts());
      setStatus("loaded");
    } catch (loadError) {
      setErrorMessage(getApiErrorMessage(loadError, "動画の読み込みに失敗しました。"));
      setStatus("failed");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <UserLayout menu={dashboardMenu} headerTitle="動画一覧">
      {() => (
        <>
          {status === "loading" && (
            <div className="d-flex align-items-center gap-2" role="status">
              <div className="spinner-border spinner-border-sm" aria-hidden="true" />
              <span>動画を読み込み中…</span>
            </div>
          )}
          {status === "failed" && (
            <div className="alert alert-danger d-flex align-items-center justify-content-between gap-2" role="alert">
              <span>{errorMessage}</span>
              <button type="button" className="btn btn-outline-danger btn-sm" onClick={load}>
                再読み込み
              </button>
            </div>
          )}
          {status === "loaded" && videos.length === 0 && <p className="text-muted">動画はまだありません。</p>}
          {status === "loaded" && videos.length > 0 && (
            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3">
              {videos.map((video) => {
                const videoId = getYouTubeVideoId(video.youtubeUrl);
                return (
                  <div key={video.id} className="col">
                    <div className="card h-100">
                      <div className="ratio ratio-16x9 bg-light">
                        {videoId && (
                          <img
                            className="video-summary__image"
                            src={`https://img.youtube.com/vi/${encodeURIComponent(videoId)}/mqdefault.jpg`}
                            alt=""
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className="card-body">
                        <h6 className="card-title video-summary__title">
                          <Link className="stretched-link text-decoration-none text-reset" to={`/videos/${video.id}`}>
                            {video.title}
                          </Link>
                        </h6>
                        <small className="text-muted">{formatVideoDate(video.createdAt)}</small>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </UserLayout>
  );
}
