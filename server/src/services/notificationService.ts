import { Server } from 'socket.io';

let ioInstance: Server | null = null;

export interface SimulatedSMS {
  id: string;
  recipientPhone: string;
  recipientName: string;
  message: string;
  timestamp: string;
  status: 'DELIVERED' | 'SENT';
  type: 'SMS' | 'WHATSAPP';
}

const mockSMSInbox: SimulatedSMS[] = [];

export class NotificationService {
  static setIo(io: Server) {
    ioInstance = io;
  }

  static getIo(): Server | null {
    return ioInstance;
  }

  static emit(event: string, data: any) {
    if (ioInstance) {
      ioInstance.emit(event, data);
    }
  }

  static sendSimulatedSMS(recipientPhone: string, recipientName: string, message: string, type: 'SMS' | 'WHATSAPP' = 'SMS') {
    const sms: SimulatedSMS = {
      id: `sms-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      recipientPhone,
      recipientName,
      message,
      timestamp: new Date().toISOString(),
      status: 'DELIVERED',
      type,
    };
    mockSMSInbox.unshift(sms);
    if (mockSMSInbox.length > 100) mockSMSInbox.pop();

    this.emit('sms:received', sms);
    return sms;
  }

  static getRecentSMS(limit = 20): SimulatedSMS[] {
    return mockSMSInbox.slice(0, limit);
  }
}
