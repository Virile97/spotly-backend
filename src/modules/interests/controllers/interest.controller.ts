import { Request, Response } from 'express'
import * as interestService from '../services/interest.service'
import { toInterestResponse } from '../services/interest.service'
import { SetUserInterestsDto } from '../dto/set-user-interests.dto'

export async function list(_req: Request, res: Response): Promise<void> {
  const interests = await interestService.listInterests()

  res.status(200).json({ interests: interests.map(toInterestResponse) })
}

export async function setMine(req: Request, res: Response): Promise<void> {
  const dto = req.body as SetUserInterestsDto
  const interests = await interestService.setUserInterests(req.userId, dto.interestIds)

  res.status(200).json({ interests: interests.map(toInterestResponse) })
}
