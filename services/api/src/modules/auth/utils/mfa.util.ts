import { createHmac, randomBytes } from 'node:crypto';

// Standard RFC 4648 Base32 alphabet
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a buffer to a base32 string.
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    if (byte === undefined) continue;
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a base32 string to a Buffer.
 */
export function base32Decode(input: string): Buffer {
  const cleanInput = input.toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleanInput.length; i++) {
    const char = cleanInput[i];
    if (!char) continue;
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid base32 character: ${char}`);
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a random base32 TOTP secret.
 */
export function generateTotpSecret(numBytes = 20): string {
  const bytes = randomBytes(numBytes);
  return base32Encode(bytes);
}

/**
 * Generates an RFC 6238 compliant 6-digit TOTP token.
 */
export function generateTotp(secret: string, timestampMs = Date.now(), stepSeconds = 30): string {
  const key = base32Decode(secret);
  const counter = Math.floor(timestampMs / 1000 / stepSeconds);

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));

  const hmac = createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;

  const binary =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);

  const otp = binary % 1_000_000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verifies a TOTP token against a secret with clock drift window.
 * Default window = 1 allows 30 seconds before and after.
 */
export function verifyTotp(
  token: string,
  secret: string,
  window = 1,
  timestampMs = Date.now(),
  stepSeconds = 30,
): boolean {
  if (!token || token.trim().length !== 6) {
    return false;
  }

  const cleanToken = token.trim();

  for (let i = -window; i <= window; i++) {
    const targetTime = timestampMs + i * stepSeconds * 1000;
    const generated = generateTotp(secret, targetTime, stepSeconds);
    if (generated === cleanToken) {
      return true;
    }
  }

  return false;
}

/**
 * Generates backup recovery codes formatted as 'RC-XXXX-XXXX'.
 */
export function generateRecoveryCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = randomBytes(4).toString('hex').toUpperCase();
    codes.push(`RC-${raw.slice(0, 4)}-${raw.slice(4, 8)}`);
  }
  return codes;
}

/**
 * Generates standard otpauth URL for Google Authenticator / 1Password / Authy QR codes.
 */
export function generateOtpAuthUri(
  secret: string,
  accountEmail: string,
  issuer = 'HabeshaMarketplace',
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountEmail);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}
