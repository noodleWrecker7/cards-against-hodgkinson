import { Socket } from 'socket.io'
import { sockCB, userWhiteCardsType } from './game'

export interface GameFuncs {
  startGame(uid: string, gid: string, socket: Socket): void

  dealCards(gid: string): Promise<void>

  progressGame(gid: string): void

  nextCzar(gid: string): Promise<string>

  logout(uid: string, socket?: Socket): void

  removePlayerFromGame(uid: string, gid: string, socket?: Socket, newstate?: string): void

  arriveAtGamePage(gid: string, uid: string, socket: Socket): void

  joinPlayerToGame(uid: string, gid: string): void

  attemptCreateGame(
    title: string,
    maxPlayers: number,
    uid: string,
    maxRounds: number,
    isPrivate: boolean,
    ownerName: string,
    socket: Socket
  ): void

  createGame(
    name: string,
    maxPlayer: number,
    owner: string,
    maxRounds: number,
    isPrivate: boolean,
    ownerName: string
  ): string

  returningsession(uid: string, socket: Socket): void

  applyforusername(data: string, socket: Socket): void

  clearInactiveUsers(_logout: (uid:string, socket?:Socket)=>void): void

  selectCards(uid: string, gid: string, cards: string[], callback: sockCB): void

  playCards(
    gid: string,
    uid: string,
    cards: string[],
    userCards: userWhiteCardsType
  ): Promise<boolean>

  isAllCardsPlayed(gid: string): Promise<boolean>

  czarPicksCard(gid: string, czaruid: string, winneruid: string, socket: Socket): void

  removeLosingCards(gid: string, winner: string): Promise<boolean>

  incrementPlayerScore(gid: string, uid: string): void

  leaveGame(uid: string, gid: string, socket: Socket): void

  stripPlayerList(gid: string): Promise<void>
}
