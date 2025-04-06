// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import eslintPluginVue from 'eslint-plugin-vue';

export default [
  // 应用于所有文件
  js.configs.recommended,
  ...eslintPluginVue.configs['flat/recommended'], // 使用 flat config 推荐配置

  // 全局配置
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // parser: '@typescript-eslint/parser', // 移除或注释掉 TypeScript parser
        extraFileExtensions: ['.vue'],
      },
    },
    files: ['**/*.{js,mjs,cjs,vue}'],
    ignores: ['node_modules/**', 'dist/**'],
    rules: {
      // 这里可以覆盖或添加全局规则
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // 对未使用的变量发出警告，忽略下划线开头的参数
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    },
  },

  // 针对 Vue 文件的特定配置
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: 'espree', // 明确指定 espree
      },
    },
    rules: {
      // 这里可以覆盖或添加针对Vue文件的规则
      'vue/multi-word-component-names': 'off', // 关闭组件名必须多词的规则
      'vue/no-v-html': 'off',
    },
  },

  // 针对 JS 文件的特定配置 (如果需要)
  {
    files: ['**/*.{js,mjs,cjs}'],
    // 如果JS文件也需要指定解析器，可以在这里添加 languageOptions
    rules: {
      // JS 文件规则
    },
  },
];
