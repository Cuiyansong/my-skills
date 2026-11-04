---
name: Task Planner 专家
description: 任务管理与日程规划技能，涵盖任务创建、优先级管理、依赖关系、时间追踪、团队协作等核心功能，适用于构建个人任务管理应用、团队协作工具和项目管理平台。
---

## 基础技能

### 核心概念
- **任务生命周期**：理解任务从创建到完成的完整生命周期（待办、进行中、已完成、已归档）
- **优先级系统**：掌握多级优先级管理（紧急/重要四象限、数字优先级、自定义优先级）
- **依赖关系**：理解任务之间的前置依赖和后置依赖关系
- **时间估算**：掌握任务时间估算方法和技巧
- **截止日期**：理解截止日期管理和逾期处理

### 数据结构
- **任务模型**：设计完整的任务数据结构（标题、描述、状态、优先级、截止日期、标签等）
- **标签系统**：实现灵活的标签分类和筛选
- **分类管理**：创建项目、文件夹、列表等多层分类体系
- **子任务**：支持任务的层级分解和子任务管理

### 开发工具
- **前端框架**：React、Vue、Angular 等现代前端框架
- **状态管理**：Redux、MobX、Zustand、Pinia 等状态管理方案
- **日期处理**：date-fns、dayjs、luxon 等日期处理库
- **表单处理**：Formik、React Hook Form、VeeValidate 等表单库
- **UI 组件库**：Material-UI、Ant Design、Chakra UI 等组件库

## 高级技能

### 任务调度
- **自动调度**：基于优先级和截止日期的自动任务调度算法
- **冲突检测**：检测和处理时间冲突和资源冲突
- **资源分配**：合理分配人力、设备等资源
- **工作日历**：支持自定义工作日、节假日设置
- **时间块管理**：实现番茄工作法、时间块等时间管理方法

### 依赖管理
- **任务依赖图**：可视化展示任务之间的依赖关系
- **循环依赖检测**：自动检测和处理循环依赖
- **级联更新**：依赖任务状态变更时的级联更新
- **关键路径**：计算项目关键路径和关键任务
- **里程碑管理**：设置和管理项目里程碑

### 提醒系统
- **多种提醒方式**：应用内通知、推送通知、邮件提醒、短信提醒
- **智能提醒**：基于用户习惯和任务重要性的智能提醒
- **重复任务**：支持每日、每周、每月等重复任务模式
- **提醒规则**：自定义提醒时机和频率
- **时区支持**：处理多时区用户的提醒时间

### 时间追踪
- **工时记录**：精确记录任务实际耗时
- **统计分析**：生成工时统计和效率分析报告
- **效率分析**：分析个人和团队的工作效率
- **时间日志**：详细的时间操作日志
- **报表导出**：支持多种格式的时间报表导出

### 团队协作
- **任务分配**：将任务分配给团队成员
- **权限管理**：细粒度的权限控制（查看、编辑、删除、分配）
- **实时同步**：多用户实时协作和数据同步
- **评论和讨论**：任务评论和团队讨论功能
- **活动流**：展示任务和项目的活动历史

## 生态系统

### UI 组件
- **日历视图**：月视图、周视图、日视图的多维日历展示
- **看板视图**：类似 Trello 的看板式任务管理
- **时间轴视图**：按时间轴展示任务和事件
- **甘特图**：项目进度和依赖关系的甘特图展示
- **列表视图**：灵活的列表展示和筛选
- **仪表板**：个人和团队的工作概览仪表板

### 数据持久化
- **本地存储**：localStorage、IndexedDB 等浏览器本地存储
- **数据库**：PostgreSQL、MySQL、MongoDB 等后端数据库
- **云同步**：多设备数据同步和备份
- **离线支持**：PWA 离线支持和数据同步
- **数据迁移**：版本升级时的数据迁移方案

### 通知服务
- **推送通知**：Web Push、APNs、FCM 等推送服务
- **邮件提醒**：SMTP、SendGrid、Mailgun 等邮件服务
- **短信提醒**：Twilio、阿里云短信等短信服务
- **即时通讯**：Slack、钉钉、企业微信等集成
- **浏览器通知**：Notification API 浏览器通知

### 第三方集成
- **Google Calendar**：与 Google Calendar 双向同步
- **Outlook**：与 Outlook Calendar 集成
- **Slack**：Slack 消息通知和任务创建
- **Trello**：与 Trello 看板集成
- **GitHub**：与 GitHub Issues 和 Projects 集成
- **Jira**：与 Jira 项目管理集成

### 数据分析
- **报表生成**：生成各类统计报表
- **可视化图表**：使用 Chart.js、ECharts 等图表库
- **数据导出**：支持 CSV、Excel、PDF 等格式导出
- **趋势分析**：任务完成率、效率趋势分析
- **团队分析**：团队成员工作量和效率分析

## 项目经验

### 项目类型
- **个人任务管理**：面向个人的简单任务管理应用
- **团队协作工具**：支持多人协作的任务管理平台
- **项目管理平台**：完整的项目管理解决方案
- **时间追踪应用**：专注时间追踪和效率分析
- **日程规划应用**：日历和日程管理应用

### 团队协作
- **敏捷开发**：Scrum、Kanban 等敏捷开发方法
- **看板方法**：看板工作流和限制在制品（WIP）
- **代码规范**：制定和遵守团队代码规范
- **技术文档**：编写清晰的技术文档和 API 文档
- **代码审查**：参与和主导代码审查

## 最佳实践

### 性能优化
- **大数据量处理**：处理成千上万任务的性能优化
- **虚拟滚动**：实现虚拟滚动优化长列表渲染
- **懒加载**：按需加载任务和子任务
- **缓存策略**：合理使用缓存减少数据请求
- **分页加载**：大数据集的分页和无限滚动

### 用户体验
- **拖拽交互**：流畅的拖拽排序和任务移动
- **快捷键**：完整的键盘快捷键支持
- **离线支持**：PWA 离线工作和数据同步
- **响应式设计**：适配桌面、平板、手机多端
- **无障碍性**：ARIA 标签和键盘导航支持

### 数据安全
- **数据加密**：敏感数据的加密存储和传输
- **备份恢复**：定期备份和灾难恢复方案
- **权限控制**：细粒度的 RBAC 权限控制
- **审计日志**：完整的操作审计日志
- **数据隐私**：遵守 GDPR 等数据隐私法规

### 代码组织
- **文件夹结构**：合理的项目文件组织
- **模块化设计**：高内聚低耦合的模块设计
- **组件复用**：可复用的通用组件库
- **类型安全**：TypeScript 类型定义和检查
- **测试覆盖**：单元测试、集成测试和 E2E 测试

## 学习资源

### 官方文档
- React 官方文档
- Vue 官方文档
- date-fns 文档
- Chart.js 文档

### 在线课程
- Frontend Masters 课程
- Udemy 项目管理课程
- Coursera 软件工程课程

### 社区资源
- GitHub 优质任务管理项目
- Stack Overflow 标签
- Medium 技术博客
- Dev.to 社区

## 代码示例

### 使用说明
详细的使用说明、注意事项和常见问题请参考 [examples/README.md](./examples/README.md)

### 基础技能示例

#### 任务数据模型
参见 [TaskModel.tsx](./examples/TaskModel.tsx)

#### 任务列表组件
参见 [TaskList.tsx](./examples/TaskList.tsx)

#### 任务表单
参见 [TaskForm.tsx](./examples/TaskForm.tsx)

#### 优先级选择器
参见 [PrioritySelector.tsx](./examples/PrioritySelector.tsx)

#### 标签管理
参见 [TagManager.tsx](./examples/TagManager.tsx)

### 高级技能示例

#### 任务调度器
参见 [TaskScheduler.tsx](./examples/TaskScheduler.tsx)

#### 依赖关系图
参见 [DependencyGraph.tsx](./examples/DependencyGraph.tsx)

#### 提醒系统
参见 [ReminderSystem.tsx](./examples/ReminderSystem.tsx)

#### 时间追踪
参见 [TimeTracker.tsx](./examples/TimeTracker.tsx)

#### 团队协作
参见 [TeamCollaboration.tsx](./examples/TeamCollaboration.tsx)

### 生态系统示例

#### 日历视图
参见 [CalendarView.tsx](./examples/CalendarView.tsx)

#### 看板视图
参见 [KanbanView.tsx](./examples/KanbanView.tsx)

#### 时间轴视图
参见 [TimelineView.tsx](./examples/TimelineView.tsx)

#### 甘特图
参见 [GanttChart.tsx](./examples/GanttChart.tsx)

#### 数据持久化
参见 [DataPersistence.tsx](./examples/DataPersistence.tsx)

#### 通知服务
参见 [NotificationService.tsx](./examples/NotificationService.tsx)

#### 第三方集成
参见 [ThirdPartyIntegration.tsx](./examples/ThirdPartyIntegration.tsx)

#### 数据分析仪表板
参见 [AnalyticsDashboard.tsx](./examples/AnalyticsDashboard.tsx)

### 最佳实践示例

#### 拖拽交互
参见 [DragAndDrop.tsx](./examples/DragAndDrop.tsx)

#### 快捷键
参见 [KeyboardShortcuts.tsx](./examples/KeyboardShortcuts.tsx)

#### 离线支持
参见 [OfflineSupport.tsx](./examples/OfflineSupport.tsx)

#### 数据安全
参见 [DataSecurity.tsx](./examples/DataSecurity.tsx)

## 技能评估

### 初级
- 理解任务管理的基本概念
- 能够构建简单的任务列表应用
- 熟悉基础的前端框架和状态管理

### 中级
- 能够构建功能完整的任务管理应用
- 熟悉任务调度和依赖管理
- 了解基本的团队协作功能

### 高级
- 能够设计和架构复杂的任务管理平台
- 精通性能优化和大数据处理
- 能够实现复杂的依赖算法和调度系统

### 专家
- 能够设计企业级任务管理解决方案
- 能够制定团队技术栈和最佳实践
- 能够培训和指导其他开发者
- 对时间管理和项目管理方法论有深入理解
