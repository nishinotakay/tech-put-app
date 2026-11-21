import axios from 'axios'
import { api, tokenStorage } from './api'
import type { User, GenderValue } from './userTypes'

// TODO: httpOnly Cookie 移行時に各関数内の tokenStorage.setXxx() / removeXxx() を削除する。
//   Rails がレスポンスで Set-Cookie するため、フロント側での token 保存・削除は不要になる。

export async function signup(params: {
  name: string
  email: string
  password: string
  birthday?: string
  gender?: GenderValue
  tenantId: string
}): Promise<User> {
  const { tenantId, ...rest } = params
  const res = await api.post<{ token: string; user: User }>('/auth/signup', { ...rest, tenant_id: tenantId })
  tokenStorage.setUser(res.data.token)
  tokenStorage.setUserTenantId(tenantId)
  return res.data.user
}

export async function login(email: string, password: string, tenantId: string): Promise<User> {
  const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password, tenant_id: tenantId })
  tokenStorage.setUser(res.data.token)
  tokenStorage.setUserTenantId(tenantId)
  return res.data.user
}

export async function logout(): Promise<void> {
  await api.delete('/auth/logout').catch(() => {})
  tokenStorage.removeUser()
}


export async function getCurrentUser(): Promise<User | null> {
  const token = tokenStorage.getUser()
  if (!token) return null
  try {
    const res = await api.get<{ user: User }>('/auth/me')
    return res.data.user
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      tokenStorage.removeUser()
      return null
    }
    throw err
  }
}

export type UserPost = {
  id: string
  title: string
  body: string
  youtubeUrl: string
  userId: string | null
  adminId: string | null
  createdAt: string
  updatedAt: string
}

export async function getUserPosts(): Promise<UserPost[]> {
  const res = await api.get<{ posts: UserPost[] }>('/posts')
  return res.data.posts
}

// 404 は「動画が無い」ため undefined を返し、それ以外は呼び出し側でエラー表示する
export async function getUserPost(id: string): Promise<UserPost | undefined> {
  try {
    const res = await api.get<{ post: UserPost }>(`/posts/${id}`)
    return res.data.post
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return undefined
    throw err
  }
}
