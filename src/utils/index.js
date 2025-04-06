/**
 * 格式化日期
 * @param {Date|string|number} date 日期对象/字符串/时间戳
 * @param {string} format 格式化规则
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return '';

  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = d.getHours();
  const minute = d.getMinutes();
  const second = d.getSeconds();

  return format
    .replace('YYYY', year)
    .replace('MM', padZero(month))
    .replace('DD', padZero(day))
    .replace('HH', padZero(hour))
    .replace('mm', padZero(minute))
    .replace('ss', padZero(second));
}

/**
 * 数字补零
 * @param {number} num 需要补零的数字
 * @returns {string} 补零后的字符串
 */
function padZero(num) {
  return String(num).padStart(2, '0');
}

/**
 * 深拷贝对象
 * @param {Object} obj 要拷贝的对象
 * @returns {Object} 拷贝后的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;

  const clone = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clone[key] = deepClone(obj[key]);
    }
  }

  return clone;
}

/**
 * 防抖函数
 * @param {Function} fn 要执行的函数
 * @param {number} delay 延迟时间，单位毫秒
 * @returns {Function} 防抖后的函数
 */
export function debounce(fn, delay = 300) {
  let timer = null;

  return function (...args) {
    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 节流函数
 * @param {Function} fn 要执行的函数
 * @param {number} delay 延迟时间，单位毫秒
 * @returns {Function} 节流后的函数
 */
export function throttle(fn, delay = 300) {
  let timer = null;
  let lastTime = 0;

  return function (...args) {
    const now = Date.now();

    if (now - lastTime >= delay) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      fn.apply(this, args);
      lastTime = now;
    } else if (!timer) {
      timer = setTimeout(
        () => {
          fn.apply(this, args);
          lastTime = Date.now();
          timer = null;
        },
        delay - (now - lastTime)
      );
    }
  };
}

/**
 * 获取URL参数
 * @param {string} name 参数名
 * @returns {string|null} 参数值
 */
export function getUrlParam(name) {
  const reg = new RegExp(`(^|&)${name}=([^&]*)(&|$)`);
  const search = window.location.search.substr(1);
  const r = search.match(reg);

  if (r != null) return decodeURIComponent(r[2]);
  return null;
}

/**
 * 存储localStorage
 * @param {string} key 键名
 * @param {any} value 值
 */
export function setLocalStorage(key, value) {
  if (!key) return;

  if (typeof value === 'object') {
    value = JSON.stringify(value);
  }

  window.localStorage.setItem(key, value);
}

/**
 * 获取localStorage
 * @param {string} key 键名
 * @returns {any} 值
 */
export function getLocalStorage(key) {
  if (!key) return null;

  const value = window.localStorage.getItem(key);

  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
}

/**
 * 删除localStorage
 * @param {string} key 键名
 */
export function removeLocalStorage(key) {
  if (!key) return;

  window.localStorage.removeItem(key);
}

/**
 * 文件大小格式化
 * @param {number} size 文件大小(字节)
 * @returns {string} 格式化后的文件大小
 */
export function formatFileSize(size) {
  if (!size) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const index = Math.floor(Math.log(size) / Math.log(1024));

  return `${(size / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}
