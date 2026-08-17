import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { QUEUE_NAMES } from '../../infrastructure/queue/queue.constants';

interface SafetyCheckResult {
  isFlagged: boolean;
  riskScore: number;
  reason: string | null;
  keywordTriggered: string | null;
}

@Injectable()
export class ChatSafetyService {
  private readonly RISK_PATTERNS = {
    SUSPICIOUS_EXTERNAL_PAYMENT: [
      /\b(wire transfer|bank transfer|direct deposit|western union|moneygram|telebirr|cbe birr|amole|m-pesa|mobile money)\b/gi,
      /\b(off.?platform|outside.?app|outside.?platform|direct.?payment|pay.?direct)\b/gi,
      /\b(telegram|whatsapp|viber|signal|instagram|facebook|email|gmail|yahoo)\s+(pay|send|transfer|money)\b/gi,
      /\b(send.?money|transfer.?money|pay.?via|payment.?via)\s+(telegram|whatsapp|phone|call)\b/gi,
    ],
    ABUSIVE_LANGUAGE: [
      /\b(stupid|idiot|fool|dumb|crazy|insane|retard|moron)\b/gi,
      /\b(hate|kill|die|threat|scam|fraud|cheat|liar)\b/gi,
    ],
    OFF_PLATFORM_SCAM: [
      /\b(click.?link|bit\.ly|tinyurl|short\.link|t\.co)\b/gi,
      /\b(fake|scam|fraud|phishing|malware|virus|hack)\b/gi,
      /\b(verify.?account|confirm.?identity|update.?payment|secure.?account)\b/gi,
      /\b(prize|winner|lottery|bonus|reward|gift|free)\s+(money|cash|birr|dollar)\b/gi,
    ],
    PHISHING_ATTEMPT: [
      /\b(password|pin|otp|verification|security|login|signin)\b/gi,
      /\b(account.?suspended|account.?locked|verify.?now|urgent|immediate)\b/gi,
    ],
    HARASSMENT: [
      /\b(stalk|harass|threaten|bully|intimidate|blackmail|extort)\b/gi,
    ],
    SPAM: [
      /(buy\s+now|click\s+here|free\s+money|easy\s+money|get\s+rich|work\s+from\s+home)/gi,
      /\b(buy\s+followers|buy\s+likes|bot|fake\s+reviews)\b/gi,
    ],
  };

  private readonly RISK_SCORES = {
    SUSPICIOUS_EXTERNAL_PAYMENT: 40,
    ABUSIVE_LANGUAGE: 25,
    OFF_PLATFORM_SCAM: 50,
    PHISHING_ATTEMPT: 45,
    HARASSMENT: 35,
    SPAM: 20,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(QUEUE_NAMES.CHAT_SAFETY) private readonly chatSafetyQueue: Queue,
  ) {}

  async scanMessage(messageId: string, conversationId: string, content: string): Promise<SafetyCheckResult> {
    const result = this.analyzeContent(content);

    if (result.isFlagged) {
      await this.flagMessage(messageId, conversationId, result);
    }

    return result;
  }

  private analyzeContent(content: string): SafetyCheckResult {
    let maxRiskScore = 0;
    let triggeredReason: string | null = null;
    let triggeredKeyword: string | null = null;

    for (const [reason, patterns] of Object.entries(this.RISK_PATTERNS)) {
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          const riskScore = this.RISK_SCORES[reason as keyof typeof this.RISK_SCORES];
          if (riskScore > maxRiskScore) {
            maxRiskScore = riskScore;
            triggeredReason = reason;
            triggeredKeyword = matches[0];
          }
        }
      }
    }

    return {
      isFlagged: maxRiskScore > 0,
      riskScore: maxRiskScore,
      reason: triggeredReason,
      keywordTriggered: triggeredKeyword,
    };
  }

  private async flagMessage(
    messageId: string,
    conversationId: string,
    result: SafetyCheckResult,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.message.update({
        where: { id: messageId },
        data: { isFlagged: true },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          isFlagged: true,
          riskScore: { increment: result.riskScore },
        },
      }),
      this.prisma.chatFlagLog.create({
        data: {
          conversationId,
          reason: result.reason as any,
          keywordTriggered: result.keywordTriggered,
          status: 'PENDING_REVIEW',
        },
      }),
    ]);

    this.eventEmitter.emit('chat.safety_flag', {
      messageId,
      conversationId,
      reason: result.reason,
      keywordTriggered: result.keywordTriggered,
      riskScore: result.riskScore,
    });

    // Enqueue job for async processing and audit logging
    await this.chatSafetyQueue.add(
      'safety_flag',
      {
        type: 'safety_flag',
        messageId,
        conversationId,
        reason: result.reason,
        keywordTriggered: result.keywordTriggered,
        riskScore: result.riskScore,
      },
      {
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
  }

  async getRiskScore(conversationId: string): Promise<number> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { riskScore: true },
    });

    return conversation?.riskScore || 0;
  }

  async resetConversationRisk(conversationId: string): Promise<void> {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        isFlagged: false,
        riskScore: 0,
      },
    });
  }
}
