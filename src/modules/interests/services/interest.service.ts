import { Interest } from '../../../database/types'
import { AppError } from '../../../shared/errors/app-error'
import * as interestRepository from '../repositories/interest.repository'

export const MAX_USER_INTERESTS = 3

export interface InterestResponse {
  id: string
  name: string
  icon: string
}

export function toInterestResponse(interest: Interest): InterestResponse {
  return { id: interest.id, name: interest.name, icon: interest.icon }
}

export async function listInterests(): Promise<Interest[]> {
  return interestRepository.findAllInterests()
}

export async function getUserInterests(userId: string): Promise<Interest[]> {
  return interestRepository.findUserInterests(userId)
}

export async function setUserInterests(userId: string, interestIds: string[]): Promise<Interest[]> {
  const uniqueIds = [...new Set(interestIds)]

  if (uniqueIds.length > MAX_USER_INTERESTS) {
    throw new AppError(`You can select up to ${MAX_USER_INTERESTS} interests`, 400)
  }

  if (uniqueIds.length > 0) {
    const found = await interestRepository.findInterestsByIds(uniqueIds)
    if (found.length !== uniqueIds.length) {
      throw new AppError('One or more interests do not exist', 400)
    }
  }

  await interestRepository.setUserInterests(userId, uniqueIds)

  return interestRepository.findUserInterests(userId)
}
