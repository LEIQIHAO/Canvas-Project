declare module 'crypto-js' {
  export const AES: {
    encrypt(text: string, key: string): {
      toString(): string;
    };
    decrypt(encryptedText: string, key: string): {
      toString(encoding: any): string;
    };
  };
  export const enc: {
    Utf8: any;
  };
} 