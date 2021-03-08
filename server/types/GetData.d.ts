import {
  gameDisplayInfo,
  gamePlayerObject,
  gameStateType,
  userObj,
  usersPlayedCards,
  userWhiteCardsType,
} from './game'
import { gameplayState } from '../src/gameplayStateEnum'

export interface GetData {
  usersWhiteCards(uid: string, gid: string): Promise<userWhiteCardsType>

  lobbies(): Promise<{ [gid: string]: gameDisplayInfo }>

  czar(gid: string): Promise<gameStateType['gameplayInfo']['czar']>

  username(uid: string): Promise<string>

  gameplayState(gid: string): Promise<gameplayState>

  usersPlayedCards(gid: string, uid: string): Promise<usersPlayedCards>

  playedCards(gid: string): Promise<gameStateType['playedCards']>

  gameplayInfo(gid: string): Promise<gameStateType['gameplayInfo']>

  game(gid: string): Promise<gameStateType>

  userState(uid: string): Promise<userObj['state']>

  playerScore(gid: string, uid: string): Promise<gamePlayerObject['points']>

  gamePlayers(gid: string): Promise<gameStateType['players']>

  whiteCardsData(gid: string): Promise<gameStateType['whiteCardsData']>

  roundNum(gid: string): Promise<number>
}
