export type updateType = { [ref: string]: unknown }
export type sockCB = (arg0: { error?: string | null; data?: unknown }) => void

export interface cardType {
  text: string
  pack: string
  rule?: number
}

export interface userObj {
  UID: string
  name: string
  secret: string
  lastseen: number
  state: string
}

export interface gameDisplayInfo {
  name: string
  ownerID: string
  playerCount: number
  maxPlayers: number
}

export interface gamePlayerObject {
  name: string
  points: number
  hasPlayed: boolean // probably not needed
  doing: string
}

export interface userWhiteCardsType {
  inventory: {
    [key: string]: cardType
  }
  played: boolean
}

export interface usersPlayedCards {
  [index: string]: cardType
}

import { gameplayState } from '../src/gameplayStateEnum'

export interface gameStateType {
  name: string
  spectators: { [key: string]: string }
  whiteCardsData: {
    [uid: string]: userWhiteCardsType
  }
  playedCards: {
    [uid: string]: usersPlayedCards
  }
  gameplayInfo: {
    blackCard: cardType
    round: number
    maxRounds: number
    creatorUID: string
    state: gameplayState
    czar: string
  }
  players: { [uid: string]: gamePlayerObject }
}
