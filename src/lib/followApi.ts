import { api } from './api'

export type FollowUserProfile = {
  id: string
  name: string
  followingsCount: number
  followersCount: number
  followedByCurrentUser: boolean
  isCurrentUser: boolean
}

export type FollowUserRow = {
  id: string
  name: string
  followedByCurrentUser: boolean
  isCurrentUser: boolean
}

export type FollowListKind = 'followings' | 'followers'

export async function fetchUsers(): Promise<FollowUserRow[]> {
  const response = await api.get<{ users: FollowUserRow[] }>('/users')
  return response.data.users
}

export async function fetchUserProfile(userId: string): Promise<FollowUserProfile> {
  const response = await api.get<{ user: FollowUserProfile }>(`/users/${userId}`)
  return response.data.user
}

export async function fetchFollowList(userId: string, kind: FollowListKind): Promise<FollowUserRow[]> {
  const response = await api.get<{ users: FollowUserRow[] }>(`/users/${userId}/${kind}`)
  return response.data.users
}

export async function followUser(userId: string): Promise<FollowUserProfile> {
  const response = await api.post<{ user: FollowUserProfile }>(`/users/${userId}/follow`)
  return response.data.user
}

export async function unfollowUser(userId: string): Promise<FollowUserProfile> {
  const response = await api.delete<{ user: FollowUserProfile }>(`/users/${userId}/follow`)
  return response.data.user
}
