import { Socket } from 'socket.io'
import { cardType } from './index'

interface Utils {
  getBlackCard(): cardType;

  getWhiteCard(): cardType;

  generateID(): string;

  escapeHtml(arg0: string): string;

  handleCall(uid: string, socket: Socket): Promise<boolean>;
}
