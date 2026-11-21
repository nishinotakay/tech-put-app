import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { getAdminPost, type AdminPost } from "../../../lib/adminApi";
import { getApiErrorMessage } from "../../../lib/api";
import AdminLayout from "../../../components/admin/AdminLayout";
import PageSpinner from "../../../components/admin/PageSpinner";
import PageError from "../../../components/admin/PageError";
import VideoCommentThread from "../../../components/videoComments/VideoCommentThread";
import { formatVideoDate } from "../../../lib/formatDate";
import { getYouTubeVideoId } from "../../../lib/youtube";
import { useRequireAdmin } from "../../../lib/useRequireAdmin";
import "../../../styles/components/videoSummary.css";

export default function AdminVideoCommentsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { admin, loading, error, handleLogout } = useRequireAdmin();
  const [video, setVideo] = useState<AdminPost | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");

  useEffect(() => {
    if (!admin || !id) return;
    let cancelled = false;
    setVideo(null);
    setVideoReady(false);
    setLoadErrorMessage("");
    getAdminPost(id)
      .then((post) => {
        if (!cancelled) setVideo(post);
      })
      .catch((err) => {
        if (cancelled) return;
        const isNotFound = axios.isAxiosError(err) && err.response?.status === 404;
        if (!isNotFound) setLoadErrorMessage(getApiErrorMessage(err, "動画の読み込みに失敗しました。"));
      })
      .finally(() => {
        if (!cancelled) setVideoReady(true);
      });
    return () => { cancelled = true; };
  }, [admin, id]);

  if (error) return <PageError message={error} />;
  if (loading || !videoReady) return <PageSpinner />;

  if (!video || !id) {
    return (
      <AdminLayout admin={admin} onLogout={handleLogout}>
        <p className={loadErrorMessage ? "text-danger" : "text-muted"}>
          {loadErrorMessage || "動画が見つかりません。"}
        </p>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate("/admin/videos")}>
          一覧に戻る
        </button>
      </AdminLayout>
    );
  }

  const videoId = getYouTubeVideoId(video.youtubeUrl);

  return (
    <AdminLayout admin={admin} onLogout={handleLogout}>
      <div className="row justify-content-center">
        <div className="col-md-9 col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex gap-3 align-items-start">
                <div className="ratio ratio-16x9 video-summary__thumbnail bg-light">
                  {videoId && (
                    <img
                      src={`https://img.youtube.com/vi/${encodeURIComponent(videoId)}/mqdefault.jpg`}
                      alt=""
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="video-summary__title">
                  <h5 className="mb-1">{video.title}</h5>
                  <small className="text-muted">{formatVideoDate(video.createdAt)}</small>
                </div>
              </div>

              <VideoCommentThread key={id} role="admin" postId={id} />

              <div className="d-flex gap-2 justify-content-end mt-4">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate("/admin/videos")}>
                  一覧に戻る
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
