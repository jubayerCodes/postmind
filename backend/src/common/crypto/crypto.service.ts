import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name);
  private readonly encryptionKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    const rawKey =
      this.configService.get<string>('APP_ENCRYPTION_KEY') ||
      'postmind-default-dev-encryption-key-32-bytes-long!';

    if (rawKey.length === 64 && /^[0-9a-fA-F]+$/.test(rawKey)) {
      this.encryptionKey = Buffer.from(rawKey, 'hex');
    } else {
      // Deterministically derive a secure 256-bit key using SHA-256
      this.encryptionKey = crypto.createHash('sha256').update(rawKey).digest();
    }
  }

  /**
   * Encrypts a string using AES-256-GCM.
   * Format returned: ivHex:authTagHex:encryptedDataHex
   */
  encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
      const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);

      const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final(),
      ]);
      const authTag = cipher.getAuthTag();

      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
    } catch (error) {
      this.logger.error('Failed to encrypt credential', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypts an AES-256-GCM encrypted payload.
   * Expected format: ivHex:authTagHex:encryptedDataHex
   */
  decrypt(cipherText: string): string {
    try {
      const parts = cipherText.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted payload format');
      }

      const [ivHex, authTagHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const encrypted = Buffer.from(encryptedHex, 'hex');

      const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      this.logger.error('Failed to decrypt credential', error);
      throw new Error('Decryption failed');
    }
  }
}
