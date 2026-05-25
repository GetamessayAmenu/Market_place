import { Injectable } from '@nestjs/common';
import { API_VERSION } from '@marketplace/config';

@Injectable()
export class AppService {
  getMeta(): { readonly service: string; readonly version: string } {
    return {
      service: '@marketplace/api',
      version: API_VERSION,
    };
  }
}
