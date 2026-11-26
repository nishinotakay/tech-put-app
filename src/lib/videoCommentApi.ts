import { api } from './api'

export type VideoComment = {
  id: string
  postId: string
  parentId: string | null
  content: string
  authorType: 'user' | 'admin'
  authorId: string
  authorName: string
  isMine: boolean
  canDelete: boolean
  createdAt: string
  updatedAt: string
  replies?: VideoComment[]
}

export type CommentRole = 'admin' | 'user'

// 管理者は /admin/ 配下でないと api.ts が管理者トークンを付けない
function commentsPath(role: CommentRole, postId: string): string {
  return role === 'admin' ? `/admin/posts/${postId}/comments` : `/posts/${postId}/comments`
}

export async function fetchVideoComments(role: CommentRole, postId: string): Promise<VideoComment[]> {
  const res = await api.get<{ comments: VideoComment[] }>(commentsPath(role, postId))
  return res.data.comments
}

export async function createVideoComment(
  role: CommentRole,
  postId: string,
  content: string,
  parentId?: string,
): Promise<VideoComment> {
  const res = await api.post<{ comment: VideoComment }>(commentsPath(role, postId), {
    content,
    ...(parentId ? { parent_id: parentId } : {}),
  })
  return res.data.comment
}

export async function updateVideoComment(
  role: CommentRole,
  postId: string,
  commentId: string,
  content: string,
): Promise<VideoComment> {
  const res = await api.patch<{ comment: VideoComment }>(`${commentsPath(role, postId)}/${commentId}`, { content })
  return res.data.comment
}

export async function deleteVideoComment(role: CommentRole, postId: string, commentId: string): Promise<void> {
  await api.delete(`${commentsPath(role, postId)}/${commentId}`)
}
