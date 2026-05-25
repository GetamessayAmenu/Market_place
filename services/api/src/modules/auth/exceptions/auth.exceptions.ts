import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

export class InvalidCredentialsException extends UnauthorizedException {
  constructor(message = 'Invalid email or password') {
    super({ code: 'INVALID_CREDENTIALS', message });
  }
}

export class InvalidTokenException extends UnauthorizedException {
  constructor(message = 'Invalid or expired token') {
    super({ code: 'INVALID_TOKEN', message });
  }
}

export class TokenExpiredException extends UnauthorizedException {
  constructor(message = 'Token has expired') {
    super({ code: 'TOKEN_EXPIRED', message });
  }
}

export class AccountSuspendedException extends ForbiddenException {
  constructor(message = 'Account is suspended') {
    super({ code: 'ACCOUNT_SUSPENDED', message });
  }
}

export class AccountBannedException extends ForbiddenException {
  constructor(message = 'Account is banned') {
    super({ code: 'ACCOUNT_BANNED', message });
  }
}

export class EmailAlreadyRegisteredException extends ForbiddenException {
  constructor(message = 'Email is already registered') {
    super({ code: 'EMAIL_ALREADY_REGISTERED', message });
  }
}

export class SessionInvalidException extends UnauthorizedException {
  constructor(message = 'Session is invalid or expired') {
    super({ code: 'SESSION_INVALID', message });
  }
}
