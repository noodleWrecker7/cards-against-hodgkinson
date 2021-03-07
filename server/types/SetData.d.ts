export interface SetData {
  userState(uid: string, value: string): Promise<never>

  czar(gid: string, value: string): Promise<never>

  gamePlayerDoing(gid: string, uid: string, value: string): Promise<never>

  playerScore(gid: string, uid: string, value: number): Promise<never>

  playedCards(gid: string, value: unknown): Promise<never>

  roundNum(gid: string, value: number): Promise<never>
}
