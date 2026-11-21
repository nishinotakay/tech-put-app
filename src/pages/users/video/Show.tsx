import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import UserLayout, { dashboardMenu } from "../../../components/user/UserLayout";
import VideoCommentThread from "../../../components/VideoCommentThread";
import { getApiErrorMessage } from "../../../lib/api";
import { formatVideoDate } from "../../../lib/formatDate";
import type { LoadStatus } from "../../../lib/loadStatus";
import { getUserPost, type UserPost } from "../../../lib/userApi";
import { getYouTubeVideoId } from "../../../lib/youtube";
import "../../../styles/components/videoCommentThread.css";

export default function VideoShowPage() {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<UserPost | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setStatus("loading");
    getUserPost(id)
      .then((post) => {
        if (cancelled) return;
        setVideo(post ?? null);
        setStatus("loaded");
      })
      .catch((loadError) => {
        if (cancelled) return;
        setErrorMessage(getApiErrorMessage(loadError, "動画の読み込みに失敗しました。"));
        setStatus("failed");
      });
    return () => { cancelled = true; };
  }, [id]);

  const videoId = video ? getYouTubeVideoId(video.youtubeUrl) : null;

  return (
    <UserLayout menu={dashboardMenu} headerTitle="動画詳細">
      {() => (
        <div className="row">
          <div className="col-md-10 offset-md-1">
            <Link to="/videos" className="btn btn-link btn-sm px-0 mb-2">
              ← 動画一覧に戻る
            </Link>
            {status === "loading" && (
              <div className="d-flex align-items-center gap-2" role="status">
                <div className="spinner-border spinner-border-sm" aria-hidden="true" />
                <span>動画を読み込み中…</span>
              </div>
            )}
            {status === "failed" && (
              <div className="alert alert-danger" role="alert">
                {errorMessage}
              </div>
            )}
            {status === "loaded" && !video && (
              <p className="text-muted">
                動画が見つかりません。<Link to="/videos">動画一覧へ</Link>
              </p>
            )}
            {status === "loaded" && video && id && (
              <div className="card">
                <div className="card-body">
                  <h1 className="h4 video-summary__title">{video.title}</h1>
                  <small className="text-muted d-block mb-3">{formatVideoDate(video.createdAt)}</small>
                  {videoId && (
                    <div className="ratio ratio-16x9 mb-3">
                      <iframe
                        src={`https://www.youtube.com/embed/${encodeURIComponent(videoId)}`}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                  <p className="video-description text-break">{video.body}</p>
                  <VideoCommentThread role="user" postId={id} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </UserLayout>
  );
}
