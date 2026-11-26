import { api } from './api'

export type ChatPartner = {
  id: string
  name: string
}

export type ChatLastMessage = {
  content: string
  createdAt: string
}

export type ChatRoomRow = {
  id: string
  partner: ChatPartner
  lastMessage: ChatLastMessage | null
  createdAt: string
}

export type ChatMessage = {
  id: string
  userId: string
  content: string
  isMine: boolean
  createdAt: string
}

export type ChatRoomMessages = {
  chatRoom: { id: string; partner: ChatPartner }
  chatMessages: ChatMessage[]
}

export async function fetchChatRooms(): Promise<ChatRoomRow[]> {
  const response = await api.get<{ chatRooms: ChatRoomRow[] }>('/chat_rooms')
  return response.data.chatRooms
}

export async function openChatRoomWith(userId: string): Promise<ChatRoomRow> {
  const response = await api.post<{ chatRoom: ChatRoomRow }>('/chat_rooms', { user_id: userId })
  return response.data.chatRoom
}

export async function fetchChatMessages(chatRoomId: string, afterId?: string): Promise<ChatRoomMessages> {
  const params = afterId ? { after_id: afterId } : {}
  const response = await api.get<ChatRoomMessages>(`/chat_rooms/${chatRoomId}/messages`, { params })
  return response.data
}

export async function sendChatMessage(chatRoomId: string, content: string): Promise<ChatMessage> {
  const response = await api.post<{ chatMessage: ChatMessage }>(`/chat_rooms/${chatRoomId}/messages`, { content })
  return response.data.chatMessage
}
