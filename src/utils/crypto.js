import * as CryptoJS from 'crypto-js';

// 加密密钥，应该从环境变量中获取
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'your-encryption-key';

/**
 * 加密数据
 * @param {string} data - 要加密的数据
 * @returns {string} 加密后的数据
 */
export function encrypt(data) {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
}

/**
 * 解密数据
 * @param {string} encryptedData - 加密的数据
 * @returns {string} 解密后的数据
 */
export function decrypt(encryptedData) {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
