import request from '@/utils/request';

/**
 * 检查API健康状态
 * @returns {Promise<boolean>} API是否健康
 */
export async function checkApiHealth() {
  try {
    await request({
      url: '/health',
      method: 'get',
    });
    return true;
  } catch (error) {
    console.error('API健康检查失败:', error);
    return false;
  }
}

/**
 * 获取全局配置
 * @returns {Promise} Promise对象
 */
export function getConfig() {
  return request({
    url: '/config',
    method: 'get',
  });
}

/**
 * 获取字典数据
 * @param {string} type - 字典类型
 * @returns {Promise} Promise对象
 */
export function getDictionary(type) {
  return request({
    url: '/dictionary',
    method: 'get',
    params: { type },
  });
}
