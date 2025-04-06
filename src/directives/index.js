import { throttle } from '@/utils';

/**
 * 点击外部区域指令
 */
export const clickOutside = {
  beforeMount(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event);
      }
    };
    document.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent);
  },
};

/**
 * 长按指令
 */
export const longPress = {
  beforeMount(el, binding) {
    const { value } = binding;
    if (typeof value !== 'function') {
      console.warn(`v-long-press: 需要一个回调函数`);
      return;
    }

    let pressTimer = null;
    const handler = (e) => {
      value(e);
    };

    const start = (e) => {
      if (e.button && e.button !== 0) return;
      if (pressTimer === null) {
        pressTimer = setTimeout(() => {
          handler(e);
        }, 500);
      }
    };

    const cancel = () => {
      if (pressTimer !== null) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };

    el.addEventListener('mousedown', start);
    el.addEventListener('touchstart', start);
    el.addEventListener('mouseup', cancel);
    el.addEventListener('mouseleave', cancel);
    el.addEventListener('touchend', cancel);
    el.addEventListener('touchcancel', cancel);
  },
};

/**
 * 复制文本指令
 */
export const copy = {
  beforeMount(el, binding) {
    el.copyValue = binding.value;
    el.addEventListener('click', () => {
      const textarea = document.createElement('textarea');
      textarea.value = el.copyValue;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      // 可选：添加成功提示
      if (window.ElMessage) {
        window.ElMessage.success('复制成功');
      }
    });
  },
  updated(el, binding) {
    el.copyValue = binding.value;
  },
};

/**
 * 防抖指令
 */
export const debounce = {
  beforeMount(el, binding) {
    const { value, arg = 300 } = binding;
    let timer = null;

    el.handler = function () {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(
        () => {
          value();
        },
        Number(arg) || 300
      );
    };

    el.addEventListener('click', el.handler);
  },
  unmounted(el) {
    el.removeEventListener('click', el.handler);
  },
};

/**
 * 节流指令
 */
export const throttled = {
  beforeMount(el, binding) {
    const { value, arg = 300 } = binding;
    el.handler = throttle(value, Number(arg) || 300);
    el.addEventListener('click', el.handler);
  },
  unmounted(el) {
    el.removeEventListener('click', el.handler);
  },
};

/**
 * 拖拽指令
 */
export const drag = {
  beforeMount(el, binding) {
    el.style.position = 'absolute';
    el.style.cursor = (binding.value && binding.value.cursor) || 'move';

    const handleDrag = throttle(function (e) {
      const { clientX, clientY } = e;
      const { offsetX, offsetY, startX, startY } = el.dragData;

      const left = clientX - offsetX;
      const top = clientY - offsetY;

      const limitLeft = binding.value && binding.value.limitX;
      const limitTop = binding.value && binding.value.limitY;

      if (!limitLeft) {
        el.style.left = `${left}px`;
      }

      if (!limitTop) {
        el.style.top = `${top}px`;
      }
    }, 10);

    el._dragstart = function (e) {
      const { clientX, clientY } = e;
      const { left, top } = el.getBoundingClientRect();

      el.dragData = {
        offsetX: clientX - left,
        offsetY: clientY - top,
        startX: left,
        startY: top,
      };

      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', el._dragend);
    };

    el._dragend = function () {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', el._dragend);
    };

    el.addEventListener('mousedown', el._dragstart);
  },
  unmounted(el) {
    el.removeEventListener('mousedown', el._dragstart);
  },
};

export default {
  install(app) {
    app.directive('click-outside', clickOutside);
    app.directive('long-press', longPress);
    app.directive('copy', copy);
    app.directive('debounce', debounce);
    app.directive('throttle', throttled);
    app.directive('drag', drag);
  },
};
