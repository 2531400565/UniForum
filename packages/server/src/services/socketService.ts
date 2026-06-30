import { Server } from 'socket.io';

let io: Server | null = null;

export function initSocket(socketIo: Server) {
  io = socketIo;
}

export function getIO(): Server | null {
  return io;
}

/**
 * 向指定用户推送实时通知
 */
export function pushNotification(userId: number, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit('notification', data);
  }
}

/**
 * 向指定用户推送新私信
 */
export function pushMessage(userId: number, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit('newMessage', data);
  }
}
