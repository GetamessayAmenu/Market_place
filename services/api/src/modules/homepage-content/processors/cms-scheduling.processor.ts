import { Job } from 'bullmq';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';

import { QUEUE_NAMES } from '../../../infrastructure/queue/queue.constants';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

export interface CmsSchedulingJobData {
  type: 'publish' | 'unpublish';
  contentId: string;
  adminId?: string;
}

@Processor(QUEUE_NAMES.CMS_SCHEDULING)
export class CmsSchedulingProcessor extends WorkerHost {
  private readonly logger = new Logger(CmsSchedulingProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<CmsSchedulingJobData>): Promise<void> {
    this.logger.log(`Processing CMS scheduling job ${String(job.id)}: ${job.data.type} for content ${job.data.contentId}`);

    try {
      switch (job.data.type) {
        case 'publish':
          await this.handlePublish(job.data);
          break;
        case 'unpublish':
          await this.handleUnpublish(job.data);
          break;
        default:
          this.logger.warn(`Unknown CMS scheduling job type: ${String(job.data.type)}`);
      }
    } catch (error) {
      this.logger.error(`Failed to process CMS scheduling job: ${(error as Error).message}`);
      throw error;
    }
  }

  private async handlePublish(data: CmsSchedulingJobData): Promise<void> {
    const content = await this.prisma.homepageContent.findUnique({
      where: { id: data.contentId },
    });

    if (!content) {
      this.logger.warn(`Content ${data.contentId} not found for publish job`);
      return;
    }

    if (content.status === 'published') {
      this.logger.log(`Content ${data.contentId} is already published`);
      return;
    }

    await this.prisma.homepageContent.update({
      where: { id: data.contentId },
      data: { status: 'published' },
    });

    this.logger.log(`Content ${data.contentId} published successfully`);
  }

  private async handleUnpublish(data: CmsSchedulingJobData): Promise<void> {
    const content = await this.prisma.homepageContent.findUnique({
      where: { id: data.contentId },
    });

    if (!content) {
      this.logger.warn(`Content ${data.contentId} not found for unpublish job`);
      return;
    }

    if (content.status === 'draft') {
      this.logger.log(`Content ${data.contentId} is already in draft`);
      return;
    }

    await this.prisma.homepageContent.update({
      where: { id: data.contentId },
      data: { status: 'draft' },
    });

    this.logger.log(`Content ${data.contentId} unpublished successfully`);
  }
}
