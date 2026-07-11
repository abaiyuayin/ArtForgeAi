/// <reference types="vite/client" />

// 声明 .vue 单文件模块，使 TypeScript 能够识别并导入 Vue 组件
declare module '*.vue' {
  // 导入 Vue 的 DefineComponent 类型
  import type { DefineComponent } from 'vue'
  // 默认导出一个通用 Vue 组件
  const component: DefineComponent<{}, {}, any>
  export default component
}
