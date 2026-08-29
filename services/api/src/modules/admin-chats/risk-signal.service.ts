import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface RiskSignalResult {
  score: number;
  riskLevel: 'NORMAL' | 'REVIEW' | 'HIGH_RISK';
  triggers: string[];
}

@Injectable()
export class RiskSignalService {
  // Configurable Risk Signal Thresholds
  private readonly SUSPICIOUS_PATTERNS = [
    /\b(telegram|tg|whatsapp|viber|imo|wechat)\b/i,
    /\b(09\d{8}|\+251\d{9}|2519\d{8})\b/, // Ethiopian phone numbers in message body
    /\b(wire|bank transfer|telebirr|cbe birr|direct transfer|outside payment)\b/i,
    /https?:\/\/(?!(\w+\.)?(ethiopianfashion|marketplace|cloudinary)\.com)/i, // External links
  ];

  private readonly REPEATED_MESSAGE_THRESHOLD = 3;
  private readonly MULTI_REPORT_THRESHOLD = 3;
  private readonly MULTI_BLOCK_THRESHOLD = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Evaluate risk signals for a conversation based on recent activity and flags.
   */
  async evaluateConversationRisk(conversationId: string): Promise<RiskSignalResult> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        buyer: { select: { id: true, status: true } },
        seller: { select: { id: true, status: true } },
        reports: {
          where: { status: { in: ['pending', 'under_review', 'investigating'] } },
        },
      },
    });

    if (!conversation) {
      return { score: 0, riskLevel: 'NORMAL', triggers: [] };
    }

    let score = 0;
    const triggers: string[] = [];

    // Signal 1: Suspicious patterns (off-platform contact/payment, external links)
    let patternMatchCount = 0;
    for (const msg of conversation.messages) {
      if (msg.content) {
        for (const pattern of this.SUSPICIOUS_PATTERNS) {
          if (pattern.test(msg.content)) {
            patternMatchCount++;
            break;
          }
        }
      }
    }
    if (patternMatchCount > 0) {
      const added = Math.min(patternMatchCount * 15, 45);
      score += added;
      triggers.push(`Off-platform contact/payment pattern detected (${patternMatchCount} messages)`);
    }

    // Signal 2: Repeated identical messages from same sender
    const recentSenderMsgs = new Map<string, string[]>();
    for (const msg of conversation.messages) {
      if (!msg.content) continue;
      const list = recentSenderMsgs.get(msg.senderId) || [];
      list.push(msg.content.trim().toLowerCase());
      recentSenderMsgs.set(msg.senderId, list);
    }
    for (const [senderId, msgs] of recentSenderMsgs.entries()) {
      const counts: Record<string, number> = {};
      for (const m of msgs) {
        counts[m] = (counts[m] || 0) + 1;
        if (counts[m] >= this.REPEATED_MESSAGE_THRESHOLD) {
          score += 20;
          triggers.push(`Repeated identical message detected from sender ${senderId.slice(0, 8)}`);
          break;
        }
      }
    }

    // Signal 3: Multiple pending reports filed on this conversation or users
    const openReportCount = conversation.reports.length;
    if (openReportCount > 0) {
      score += openReportCount * 20;
      triggers.push(`${openReportCount} active report(s) on conversation`);
    }

    // Signal 4: Participant report & block history
    const [buyerReports, sellerReports, buyerBlocks, sellerBlocks] = await Promise.all([
      this.prisma.report.count({
        where: { reportedUserId: conversation.buyerId, status: { in: ['pending', 'under_review'] } },
      }),
      this.prisma.report.count({
        where: { reportedUserId: conversation.sellerId, status: { in: ['pending', 'under_review'] } },
      }),
      this.prisma.userBlock.count({
        where: { blockedUserId: conversation.buyerId },
      }),
      this.prisma.userBlock.count({
        where: { blockedUserId: conversation.sellerId },
      }),
    ]);

    if (buyerReports >= this.MULTI_REPORT_THRESHOLD || sellerReports >= this.MULTI_REPORT_THRESHOLD) {
      score += 25;
      triggers.push('Participant has multiple open reports across platform');
    }

    if (buyerBlocks >= this.MULTI_BLOCK_THRESHOLD || sellerBlocks >= this.MULTI_BLOCK_THRESHOLD) {
      score += 20;
      triggers.push('Participant has been blocked by multiple users');
    }

    // Cap total score at 100
    score = Math.min(score, 100);

    let riskLevel: 'NORMAL' | 'REVIEW' | 'HIGH_RISK' = 'NORMAL';
    if (score >= 50) {
      riskLevel = 'HIGH_RISK';
    } else if (score >= 25) {
      riskLevel = 'REVIEW';
    }

    const isFlagged = riskLevel !== 'NORMAL';

    // Persist riskScore & isFlagged on conversation
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        riskScore: score,
        isFlagged,
      },
    });

    if (riskLevel === 'HIGH_RISK') {
      this.eventEmitter.emit('chat.high_risk_detected', {
        conversationId,
        riskScore: score,
        triggers,
      });
    }

    return { score, riskLevel, triggers };
  }

  /**
   * Get complete user risk signals summary for Admin User details
   */
  async getUserRiskProfile(userId: string) {
    const [
      sentMessagesCount,
      reportsReceivedCount,
      reportsSubmittedCount,
      userBlockedCount,
      blockedByCount,
      activeRestriction,
    ] = await Promise.all([
      this.prisma.message.count({ where: { senderId: userId } }),
      this.prisma.report.count({ where: { reportedUserId: userId } }),
      this.prisma.report.count({ where: { reporterId: userId } }),
      this.prisma.userBlock.count({ where: { blockerId: userId } }),
      this.prisma.userBlock.count({ where: { blockedUserId: userId } }),
      this.prisma.messagingRestriction.findFirst({
        where: { userId, isActive: true },
      }),
    ]);

    let userRiskScore = 0;
    userRiskScore += reportsReceivedCount * 15;
    userRiskScore += blockedByCount * 10;
    if (activeRestriction) userRiskScore += 30;

    userRiskScore = Math.min(userRiskScore, 100);

    let riskLevel: 'NORMAL' | 'REVIEW' | 'HIGH_RISK' = 'NORMAL';
    if (userRiskScore >= 50) riskLevel = 'HIGH_RISK';
    else if (userRiskScore >= 25) riskLevel = 'REVIEW';

    return {
      userId,
      sentMessagesCount,
      reportsReceivedCount,
      reportsSubmittedCount,
      userBlockedCount,
      blockedByCount,
      activeRestriction,
      userRiskScore,
      riskLevel,
    };
  }
}
