export interface CursorPageParams {
  cursor?: string
  take: number
}

export interface CursorPageArgs {
  cursor?: { id: string }
  skip?: number
  take: number
}

export function toCursorPageArgs({ cursor, take }: CursorPageParams): CursorPageArgs {
  return cursor ? { cursor: { id: cursor }, skip: 1, take } : { take }
}
