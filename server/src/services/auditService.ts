import { prisma } from '../prisma';

export class AuditService {
  static async log(params: {
    userId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    details: string;
  }) {
    try {
      return await prisma.auditLog.create({
        data: {
          userId: params.userId || null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          details: params.details,
        },
      });
    } catch (err) {
      console.error('Failed to create audit log:', err);
      return null;
    }
  }

  static async getRecentLogs(limit = 50) {
    return prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }
}
