import { sanitizeAuditPayload, computeChanges } from './audit-sanitizer.util';

describe('AuditSanitizer Utility', () => {
  describe('sanitizeAuditPayload', () => {
    it('should redact sensitive keys recursively', () => {
      const input = {
        username: 'admin',
        password: 'SuperSecretPassword123!',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        nested: {
          refreshToken: 'refresh-123',
          creditCard: '4111111111111111',
          normalField: 'hello',
        },
      };

      const result = sanitizeAuditPayload(input);

      expect(result.username).toBe('admin');
      expect(result.password).toBe('[REDACTED]');
      expect(result.token).toBe('[REDACTED]');
      expect(result.nested.refreshToken).toBe('[REDACTED]');
      expect(result.nested.creditCard).toBe('[REDACTED]');
      expect(result.nested.normalField).toBe('hello');
    });

    it('should handle null and primitives gracefully', () => {
      expect(sanitizeAuditPayload(null)).toBeNull();
      expect(sanitizeAuditPayload('string')).toBe('string');
      expect(sanitizeAuditPayload(123)).toBe(123);
    });
  });

  describe('computeChanges', () => {
    it('should compute before/after diff for updated fields', () => {
      const before = {
        title: 'Old Title',
        price: 4000,
        status: 'PENDING',
        unchangedField: 'same',
      };
      const after = {
        title: 'New Title',
        price: 3500,
        status: 'APPROVED',
        unchangedField: 'same',
      };

      const diff = computeChanges(before, after);

      expect(diff).toEqual({
        title: { before: 'Old Title', after: 'New Title' },
        price: { before: 4000, after: 3500 },
        status: { before: 'PENDING', after: 'APPROVED' },
      });
      expect(diff?.unchangedField).toBeUndefined();
    });

    it('should redact sensitive keys in diff calculation', () => {
      const before = { password: 'old', status: 'ACTIVE' };
      const after = { password: 'new', status: 'SUSPENDED' };

      const diff = computeChanges(before, after);

      expect(diff?.password).toBeUndefined();
      expect(diff?.status).toEqual({ before: 'ACTIVE', after: 'SUSPENDED' });
    });
  });
});
