import { describe, expect, it } from 'vitest'
import {
  conversationRoom,
  userRoom,
} from '../../../../../src/modules/messaging/socket/socket.rooms'

describe('socket room helpers', () => {
  it('builds a per-user room name', () => {
    expect(userRoom('user-1')).toBe('user:user-1')
  })

  it('builds a per-conversation room name', () => {
    expect(conversationRoom('conv-1')).toBe('conversation:conv-1')
  })
})
