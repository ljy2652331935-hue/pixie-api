# Project TODO

## 后端 API 端点
- [x] Pixie Suggestion API (POST /api/trpc pixie.suggestion) - 四种模式 icebreaker/rewrite/boundary/plan
- [x] Pixie Chat API (POST /api/trpc pixie.chat) - 私聊 Lumi
- [x] Pixie Auto Context API (POST /api/trpc pixie.autoContext) - 自动分析聊天上下文
- [x] Lumi 人设 System Prompt 注入 - 毒舌但靠谱，安全提醒优先

## 前端视觉风格
- [x] 沉浸式宇宙美学主题 - 午夜蓝与紫罗兰渐变、星光、星云光晕
- [x] 主标题发光青色外发光效果
- [x] 极简行星球体与微妙镜头光晕

## 前端可视化测试界面
- [x] Suggestion API 交互式测试面板
- [x] Chat API 交互式测试面板
- [x] Auto Context API 交互式测试面板
- [x] 支持填写请求参数、发送请求、查看格式化响应

## API 文档展示页
- [x] 三个端点的请求/响应字段说明
- [x] 模式说明与示例数据
- [x] 宇宙美学风格文档页面

## 补充优化
- [x] 为首页补充镜头光晕 lens flare 视觉效果
- [x] 为 Playground 增加格式化 JSON 响应查看器
- [x] 为三个测试面板添加基础表单校验

## Persona System 整合
- [x] 后端实现 6 个 Persona 的 system prompt 定义（Sassy Roast Bestie / Smooth Witty Fox / Elegant Gentleman / Loyal Bro / Soft Social Anxiety Helper / Calm Strategist）
- [x] 后端实现 6 个 Mode 的 prompt 模板（icebreaker / rewrite / boundary / plan / whisper / offline_profile）
- [x] 后端实现两层 prompt 组装逻辑（Base + Persona + Mode + Few-shot）
- [x] 后端 API 接口增加 persona 参数选择
- [x] 后端安全边界规则统一注入所有 persona
- [x] 前端 Playground 添加人格选择器
- [x] 前端 Playground 支持 whisper 和 offline_profile 模式
- [x] 前端 API 文档页展示完整人格与模式信息
- [x] 修复 Docs 页面导入错误

## Conversation Realism 整合
- [x] 后端更新输出 schema 为 bubbles 格式（responseStyle / visibility / bubbles / suggestedPublicMessage / quickReplies / riskLevel / confidence）
- [x] 后端注入 Conversation Realism system prompt（短气泡、反应优先、避免 AI 腔）
- [x] 前端 Playground 渲染逐条气泡动画（使用 delayMs）
- [x] 前端显示 typing indicator 在延迟气泡之间
- [x] 前端 suggestedPublicMessage 显示“使用此消息”按钮
- [x] 前端 quickReplies 渲染为可点击 chips
- [x] 前端 interrupt 样式显示为紧急但不吓人
- [x] 前端根据 visibility 区分渲染位置（private / public_suggestion / public_pixie）
