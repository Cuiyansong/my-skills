# React Hooks 示例使用说明

## 基础技能示例

### FunctionComponent.jsx
**功能**：最简单的函数组件示例

**使用场景**：
- 学习 React 组件基础
- 理解 Props 传递

**注意事项**：
- 函数组件名称必须大写开头
- Props 是只读的，不能修改

---

### UseState.jsx
**功能**：useState Hook 基础用法，实现计数器

**使用场景**：
- 管理组件内部状态
- 处理用户交互

**注意事项**：
- setState 是异步的
- 不要直接修改 state，始终使用 setState

---

### UseEffect.jsx
**功能**：useEffect Hook 基础用法

**使用场景**：
- 执行副作用操作（数据获取、订阅、DOM 操作）
- 组件挂载、更新、卸载时执行代码

**注意事项**：
- 依赖数组为空时只在挂载时执行
- 正确设置依赖数组避免无限循环

---

### ConditionalRendering.jsx
**功能**：多种条件渲染方式

**使用场景**：
- 根据条件显示不同内容
- 处理加载状态、错误状态

**注意事项**：
- 选择合适的条件渲染方式（三元运算符、&&、if）
- 避免过度嵌套

---

### ListRendering.jsx
**功能**：列表渲染和 key 的使用

**使用场景**：
- 渲染数组数据
- 动态列表

**注意事项**：
- 必须为列表项提供唯一的 key
- 不要使用 index 作为 key（除非列表是静态的）

---

## 高级技能示例

### CustomHook.jsx
**功能**：自定义 Hook 示例，监听窗口大小变化

**使用场景**：
- 复用状态逻辑
- 封装通用功能

**注意事项**：
- 自定义 Hook 必须以 "use" 开头
- 遵循 Hooks 规则（只在顶层调用）

---

### ContextAPI.jsx
**功能**：Context API 状态管理

**使用场景**：
- 跨组件传递数据
- 避免 Props 层层传递

**注意事项**：
- Context 会触发所有消费者重新渲染
- 对于频繁更新的数据，考虑拆分 Context

---

### ReactMemo.jsx
**功能**：React.memo 组件优化

**使用场景**：
- 避免不必要的重新渲染
- 优化性能

**注意事项**：
- 不要过度使用，只在必要时使用
- 配合 useCallback 和 useMemo 使用效果更好

---

### UseCallbackUseMemo.jsx
**功能**：useCallback 和 useMemo 性能优化

**使用场景**：
- 缓存函数和计算结果
- 避免子组件不必要的重新渲染

**注意事项**：
- 依赖数组要正确设置
- 不要过早优化，先测量性能

---

## 新增高级 Hooks 示例

### UseTransition.jsx
**功能**：useTransition Hook，标记非紧急更新

**使用场景**：
- 大列表渲染
- 搜索过滤等耗时操作
- 保持 UI 响应性

**使用说明**：
- `startTransition` 将更新标记为低优先级
- `isPending` 指示是否有待处理的过渡更新
- 输入框保持响应，列表渲染延迟更新

**注意事项**：
- 适用于非紧急的 UI 更新
- 不要用于关键路径的更新

---

### UseDeferredValue.jsx
**功能**：useDeferredValue Hook，延迟值更新

**使用场景**：
- 搜索框实时过滤
- 大数据集渲染
- 与输入相关的重计算

**使用说明**：
- 将值包装在 useDeferredValue 中
- 该值会延迟更新，保持输入响应
- 适用于派生状态

**注意事项**：
- 类似于防抖，但由 React 自动管理
- 适用于频繁更新的派生值

---

### UseId.jsx
**功能**：useId Hook，生成唯一 ID

**使用场景**：
- 表单标签关联
- 无障碍标签
- 避免硬编码 ID

**使用说明**：
- 每次调用返回唯一的 ID
- 服务端渲染时保持一致性
- 自动处理重复渲染

**注意事项**：
- ID 在组件生命周期内保持稳定
- 不要用于列表 key

---

### UseLayoutEffect.jsx
**功能**：useLayoutEffect Hook，同步执行副作用

**使用场景**：
- DOM 测量（getBoundingClientRect）
- 同步滚动位置
- 需要在浏览器绘制前执行的 DOM 操作

**使用说明**：
- 在所有 DOM 变更后同步执行
- 会阻塞浏览器绘制
- 与 useEffect 类似，但执行时机不同

**注意事项**：
- 优先使用 useEffect
- 仅在必要时使用（需要读取 DOM 布局）
- 可能影响性能

---

### UseImperativeHandle.jsx
**功能**：useImperativeHandle Hook，自定义 ref 暴露

**使用场景**：
- 父组件需要调用子组件方法
- 封装组件内部实现
- 暴露有限的 API

**使用说明**：
- 配合 forwardRef 使用
- 自定义暴露给父组件的方法
- 隐藏内部实现细节

**注意事项**：
- 尽量避免使用，优先使用 props
- 仅在必要时暴露方法
- 保持暴露的 API 简洁

---

### UseSyncExternalStore.jsx
**功能**：useSyncExternalStore Hook，订阅外部 store

**使用场景**：
- 订阅浏览器 API（网络状态、媒体查询）
- 集成第三方状态管理库
- 订阅非 React 状态

**使用说明**：
- subscribe：订阅函数，返回取消订阅函数
- getSnapshot：获取当前快照
- getServerSnapshot：服务端渲染时的快照

**注意事项**：
- 用于订阅外部数据源
- 确保订阅和取消订阅正确配对
- 服务端渲染时必须提供 getServerSnapshot

---

## 生态系统示例

### ReactRouter.jsx
**功能**：React Router v6 路由配置

**使用场景**：
- 单页应用路由
- 嵌套路由
- 路由守卫

**注意事项**：
- 理解路由匹配规则
- 正确使用 useParams 和 useLocation

---

### ReduxToolkit.jsx
**功能**：Redux Toolkit 状态管理

**使用场景**：
- 大型应用状态管理
- 复杂状态逻辑
- 时间旅行调试

**注意事项**：
- 遵循 Redux 三原则
- 正确使用 createSlice 和 configureStore

---

### ReactQuery.jsx
**功能**：React Query 数据获取和缓存

**使用场景**：
- 服务端数据管理
- 自动缓存和重新验证
- 乐观更新

**注意事项**：
- 理解缓存策略
- 正确处理错误和加载状态

---

### TypeScript.tsx
**功能**：React + TypeScript 类型定义

**使用场景**：
- 类型安全的 React 开发
- 组件 Props 类型定义
- Hook 类型定义

**注意事项**：
- 为组件 Props 定义接口
- 使用泛型增强类型安全性

---

## 最佳实践示例

### ComponentStructure.jsx
**功能**：组件结构最佳实践

**使用场景**：
- 组织组件代码
- 提高可读性
- 便于维护

**注意事项**：
- 保持组件单一职责
- 合理拆分组件

---

### ErrorBoundary.jsx
**功能**：错误边界组件

**使用场景**：
- 捕获子组件错误
- 显示错误信息
- 防止整个应用崩溃

**注意事项**：
- 只能捕获子组件错误
- 不能捕获事件处理器中的错误
- 不能捕获异步代码中的错误

---

### FormValidation.jsx
**功能**：表单验证示例

**使用场景**：
- 用户输入验证
- 实时验证反馈
- 表单提交处理

**注意事项**：
- 提供清晰的错误提示
- 验证规则要合理
- 考虑无障碍性
