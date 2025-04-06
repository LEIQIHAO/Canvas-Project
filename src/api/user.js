import request from '@/utils/request';

/**
 * 用户登录
 * @param {Object} data - 登录参数
 * @returns {Promise} Promise对象
 */
export function login(data) {
  return request({
    url: '/user/login',
    method: 'post',
    data,
  });
}

/**
 * 获取用户信息
 * @returns {Promise} Promise对象
 */
export function getUserInfo() {
  return request({
    url: '/user/info',
    method: 'get',
  });
}

/**
 * 用户退出
 * @returns {Promise} Promise对象
 */
export function logout() {
  return request({
    url: '/user/logout',
    method: 'post',
  });
}

/**
 * 用户注册
 * @param {Object} data - 注册参数
 * @returns {Promise} Promise对象
 */
export function register(data) {
  return request({
    url: '/user/register',
    method: 'post',
    data,
  });
}
