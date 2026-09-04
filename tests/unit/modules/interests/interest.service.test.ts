import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../../src/modules/interests/repositories/interest.repository', () => ({
  findAllInterests: vi.fn(),
  findInterestsByIds: vi.fn(),
  findUserInterests: vi.fn(),
  setUserInterests: vi.fn(),
}))

import * as interestRepository from '../../../../src/modules/interests/repositories/interest.repository'
import * as interestService from '../../../../src/modules/interests/services/interest.service'
import {
  MAX_USER_INTERESTS,
  toInterestResponse,
} from '../../../../src/modules/interests/services/interest.service'

const coffee = { id: 'int-1', name: 'Coffee', icon: '☕', createdAt: new Date() }
const photography = { id: 'int-2', name: 'Photography', icon: '📷', createdAt: new Date() }
const travel = { id: 'int-3', name: 'Travel', icon: '🏖️', createdAt: new Date() }
const music = { id: 'int-4', name: 'Music', icon: '🎵', createdAt: new Date() }

describe('MAX_USER_INTERESTS', () => {
  it('caps selectable interests at 3', () => {
    expect(MAX_USER_INTERESTS).toBe(3)
  })
})

describe('toInterestResponse', () => {
  it('maps an interest to its public shape', () => {
    expect(toInterestResponse(coffee as never)).toEqual({
      id: 'int-1',
      name: 'Coffee',
      icon: '☕',
    })
  })
})

describe('interestService.listInterests', () => {
  it('returns all available interests', async () => {
    vi.mocked(interestRepository.findAllInterests).mockResolvedValue([coffee, photography] as never)

    const result = await interestService.listInterests()

    expect(result).toEqual([coffee, photography])
  })
})

describe('interestService.setUserInterests', () => {
  beforeEach(() => {
    vi.mocked(interestRepository.findInterestsByIds).mockReset()
    vi.mocked(interestRepository.setUserInterests).mockReset().mockResolvedValue(undefined)
    vi.mocked(interestRepository.findUserInterests).mockReset()
  })

  it('sets the selected interests when all ids exist and count is within the limit', async () => {
    vi.mocked(interestRepository.findInterestsByIds).mockResolvedValue([
      coffee,
      photography,
      travel,
    ] as never)
    vi.mocked(interestRepository.findUserInterests).mockResolvedValue([
      coffee,
      photography,
      travel,
    ] as never)

    const result = await interestService.setUserInterests('user-1', ['int-1', 'int-2', 'int-3'])

    expect(interestRepository.setUserInterests).toHaveBeenCalledWith('user-1', [
      'int-1',
      'int-2',
      'int-3',
    ])
    expect(result).toEqual([coffee, photography, travel])
  })

  it('dedupes repeated ids before checking the limit', async () => {
    vi.mocked(interestRepository.findInterestsByIds).mockResolvedValue([coffee] as never)
    vi.mocked(interestRepository.findUserInterests).mockResolvedValue([coffee] as never)

    await interestService.setUserInterests('user-1', ['int-1', 'int-1', 'int-1'])

    expect(interestRepository.findInterestsByIds).toHaveBeenCalledWith(['int-1'])
    expect(interestRepository.setUserInterests).toHaveBeenCalledWith('user-1', ['int-1'])
  })

  it('rejects when more than MAX_USER_INTERESTS are selected', async () => {
    await expect(
      interestService.setUserInterests('user-1', ['int-1', 'int-2', 'int-3', 'int-4']),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'You can select up to 3 interests',
    })
    expect(interestRepository.setUserInterests).not.toHaveBeenCalled()
  })

  it('rejects when one or more interest ids do not exist', async () => {
    vi.mocked(interestRepository.findInterestsByIds).mockResolvedValue([coffee] as never)

    await expect(
      interestService.setUserInterests('user-1', ['int-1', 'non-existent-id']),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'One or more interests do not exist',
    })
    expect(interestRepository.setUserInterests).not.toHaveBeenCalled()
  })

  it('allows clearing all interests with an empty array', async () => {
    vi.mocked(interestRepository.findUserInterests).mockResolvedValue([])

    const result = await interestService.setUserInterests('user-1', [])

    expect(interestRepository.findInterestsByIds).not.toHaveBeenCalled()
    expect(interestRepository.setUserInterests).toHaveBeenCalledWith('user-1', [])
    expect(result).toEqual([])
  })
})

describe('interestService.getUserInterests', () => {
  it('returns the interests currently selected by a user', async () => {
    vi.mocked(interestRepository.findUserInterests).mockResolvedValue([music] as never)

    const result = await interestService.getUserInterests('user-1')

    expect(interestRepository.findUserInterests).toHaveBeenCalledWith('user-1')
    expect(result).toEqual([music])
  })
})
