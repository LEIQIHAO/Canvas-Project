import request from '@/utils/request';

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
