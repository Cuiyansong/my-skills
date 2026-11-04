---
name: react-skills
description: 基于 React 框架的现代前端开发技能（React 前端专家），涵盖组件化开发、状态管理、性能优化等核心技术，适用于构建大型单页应用、服务端渲染应用和企业级前端项目。
---

## 基础技能

### 核心概念
- **组件化开发**：熟练使用函数组件和类组件，理解组件生命周期
- **JSX 语法**：精通 JSX 语法规则和最佳实践
- **Props 和 State**：深入理解组件通信和状态管理
- **事件处理**：掌握 React 事件系统和合成事件
- **条件渲染**：熟练使用多种条件渲染方式
- **列表渲染**：精通使用 map 等方法进行列表渲染，理解 key 的重要性

### 开发工具
- **Create React App / Vite**：熟练使用现代化的 React 项目脚手架
- **ESLint & Prettier**：配置和使用代码质量工具
- **Git**：熟练的版本控制能力

## 高级技能

### Hooks
- **基础 Hooks**：useState、useEffect、useContext、useRef、useCallback、useMemo
- **高级 Hooks**：useTransition、useDeferredValue、useId、useLayoutEffect、useImperativeHandle、useSyncExternalStore
- **自定义 Hooks**：根据业务需求创建可复用的自定义 Hooks
- **Hooks 规则**：理解并遵守 Hooks 使用规则

### 状态管理
- **Redux**：精通 Redux 核心概念、中间件、异步操作
- **Redux Toolkit**：使用官方推荐的 Redux 工具集
- **MobX**：了解 MobX 状态管理方案
- **Context API**：在适当场景下使用 Context API 进行状态管理

### 性能优化
- **组件优化**：使用 React.memo、useCallback、useMemo 进行组件性能优化
- **虚拟 DOM**：理解虚拟 DOM 工作原理
- **渲染优化**：避免不必要的渲染，合理使用 key
- **代码分割**：使用 React.lazy 和 Suspense 进行代码分割
- **bundle 优化**：分析和优化打包体积

### 路由
- **React Router**：精通 React Router v6+ 的使用
- **嵌套路由**：实现复杂的嵌套路由结构
- **路由守卫**：实现路由权限控制
- **动态路由**：处理动态参数和查询参数

### 表单处理
- **受控组件**：使用受控组件处理表单
- **非受控组件**：在适当场景下使用非受控组件
- **表单库**：了解并使用 Formik、React Hook Form 等表单库
- **表单验证**：实现客户端和服务端表单验证

### 动画
- **CSS 动画**：结合 React 使用 CSS 动画
- **React Transition Group**：使用官方动画库
- **Framer Motion**：使用现代化的 React 动画库

## 生态系统

### UI 库
- **Material-UI**：精通 MUI 组件库的使用
- **Ant Design**：熟悉 Ant Design 组件库
- **Tailwind CSS**：结合 React 使用 Tailwind CSS
- **Chakra UI**：了解 Chakra UI 组件库

### 数据请求
- **Axios**：使用 Axios 进行 HTTP 请求
- **Fetch API**：使用浏览器原生 Fetch API
- **SWR / React Query**：使用数据请求库优化数据获取

### 测试
- **Jest**：使用 Jest 进行单元测试
- **React Testing Library**：使用 RTL 进行组件测试
- **Cypress**：进行端到端测试

### 构建工具
- **Webpack**：理解并配置 Webpack
- **Vite**：使用 Vite 进行快速开发和构建
- **Rollup**：了解 Rollup 打包工具

### 类型系统
- **TypeScript**：精通 TypeScript 在 React 项目中的使用
- **PropTypes**：在 JavaScript 项目中使用 PropTypes 进行类型检查

## 项目经验

### 项目类型
- **单页应用 (SPA)**：开发和优化大型 SPA
- **服务端渲染 (SSR)**：使用 Next.js 等框架实现 SSR
- **静态站点生成 (SSG)**：使用 Next.js 等框架实现 SSG
- **渐进式 Web 应用 (PWA)**：将 React 应用转换为 PWA

### 团队协作
- **代码规范**：制定和遵守团队代码规范
- **组件库**：搭建和维护团队内部组件库
- **技术文档**：编写清晰的技术文档
- **代码审查**：参与和主导代码审查

## 最佳实践

### 代码组织
- **文件夹结构**：合理组织项目文件结构
- **命名规范**：统一的命名规范
- **代码分割**：按功能和模块分割代码

### 性能最佳实践
- **网络优化**：减少 HTTP 请求，使用 CDN
- **资源优化**：优化图片、字体等静态资源
- **缓存策略**：合理使用浏览器缓存

### 可访问性
- **ARIA 标签**：使用适当的 ARIA 标签
- **键盘导航**：确保应用支持键盘导航
- **屏幕阅读器**：优化屏幕阅读器体验

### 安全性
- **XSS 防护**：防止跨站脚本攻击
- **CSRF 防护**：防止跨站请求伪造
- **数据验证**：服务端数据验证

### 部署和监控
- **CI/CD**：配置持续集成和持续部署
- **性能监控**：使用 Google Analytics、Lighthouse 等工具监控性能
- **错误监控**：使用 Sentry 等工具监控错误

## 学习资源

### 官方文档
- React 官方文档
- React Router 官方文档
- Redux 官方文档

### 在线课程
- React 官方教程
- Frontend Masters React 课程
- Udemy React 高级课程

### 社区资源
- React 博客
- GitHub 优质 React 项目
- Stack Overflow React 标签

## 代码示例

### 使用说明
详细的使用说明、注意事项和常见问题请参考 [examples/README.md](./examples/README.md)

### 基础技能示例

#### 函数组件
参见 [FunctionComponent.jsx](./examples/FunctionComponent.jsx)

#### useState Hook
参见 [UseState.jsx](./examples/UseState.jsx)

#### useEffect Hook
参见 [UseEffect.jsx](./examples/UseEffect.jsx)

#### 条件渲染
参见 [ConditionalRendering.jsx](./examples/ConditionalRendering.jsx)

#### 列表渲染
参见 [ListRendering.jsx](./examples/ListRendering.jsx)

### 高级技能示例

#### 自定义 Hook
参见 [CustomHook.jsx](./examples/CustomHook.jsx)

#### Context API
参见 [ContextAPI.jsx](./examples/ContextAPI.jsx)

#### React.memo 优化
参见 [ReactMemo.jsx](./examples/ReactMemo.jsx)

#### useCallback 和 useMemo
参见 [UseCallbackUseMemo.jsx](./examples/UseCallbackUseMemo.jsx)

#### useTransition
参见 [UseTransition.jsx](./examples/UseTransition.jsx)

#### useDeferredValue
参见 [UseDeferredValue.jsx](./examples/UseDeferredValue.jsx)

#### useId
参见 [UseId.jsx](./examples/UseId.jsx)

#### useLayoutEffect
参见 [UseLayoutEffect.jsx](./examples/UseLayoutEffect.jsx)

#### useImperativeHandle
参见 [UseImperativeHandle.jsx](./examples/UseImperativeHandle.jsx)

#### useSyncExternalStore
参见 [UseSyncExternalStore.jsx](./examples/UseSyncExternalStore.jsx)

### 生态系统示例

#### React Router
参见 [ReactRouter.jsx](./examples/ReactRouter.jsx)

#### Redux Toolkit
参见 [ReduxToolkit.jsx](./examples/ReduxToolkit.jsx)

#### React Query
参见 [ReactQuery.jsx](./examples/ReactQuery.jsx)

#### TypeScript
参见 [TypeScript.tsx](./examples/TypeScript.tsx)

### 最佳实践示例

#### 组件结构
参见 [ComponentStructure.jsx](./examples/ComponentStructure.jsx)

#### 错误边界
参见 [ErrorBoundary.jsx](./examples/ErrorBoundary.jsx)

#### 表单验证
参见 [FormValidation.jsx](./examples/FormValidation.jsx)

## 技能评估

### 初级
- 理解 React 基本概念
- 能够构建简单的 React 应用
- 熟悉基础 Hooks 的使用

### 中级
- 能够构建复杂的 React 应用
- 熟悉状态管理方案
- 了解性能优化技巧

### 高级
- 能够设计和架构大型 React 应用
- 精通性能优化和调试
- 能够解决复杂的 React 相关问题
- 对 React 生态系统有深入了解

### 专家
- 能够贡献 React 生态系统
- 能够制定团队 React 技术栈和最佳实践
- 能够培训和指导其他开发者
- 对 React 源码和工作原理有深入理解