import { BadRequestException, NotFoundException } from '@nestjs/common';

export class ReportNotFoundException extends NotFoundException {
  constructor() {
    super({ code: 'REPORT_NOT_FOUND', message: 'Report not found' });
  }
}

export class ReportAlreadyResolvedException extends BadRequestException {
  constructor() {
    super({
      code: 'REPORT_ALREADY_RESOLVED',
      message: 'This report has already been resolved',
    });
  }
}

export class DuplicateReportException extends BadRequestException {
  constructor() {
    super({
      code: 'DUPLICATE_REPORT',
      message: 'You have already reported this target',
    });
  }
}
