import { SetMetadata } from '@nestjs/common';

export const OPTIONAL_AUTH_KEY = 'optionalAuth';

/** On @Public() routes, attempt JWT without requiring authentication. */
export const OptionalAuth = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(OPTIONAL_AUTH_KEY, true);
