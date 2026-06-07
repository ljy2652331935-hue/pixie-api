# Pixie API вЂ” Lumi з¤ѕдє¤е‰Їй©ѕй©¶е№іеЏ° TODO

## жњЌеЉЎз«ЇиїЃз§»

- [x] е°† pixie-prompts.ts дё­ж‰Ђжњ‰ System Prompt иїЃз§»и‡іжњЌеЉЎз«Їпј€SUGGESTIONгЂЃCHATгЂЃAUTO_CONTEXT дё‰з§Ќз±»ећ‹пј‰
- [x] иїЃз§» /api/pixie/suggestion в†’ tRPC pixie.suggestпј€ж”ЇжЊЃ icebreaker/rewrite/boundary/plan/whisper/offline_profile е…­з§ЌжЁЎејЏпј‰
- [x] иїЃз§» /api/pixie/chat в†’ tRPC pixie.chatпј€з§ЃиЃЉ LumiпјЊиЋ·еЏ–з¤ѕдє¤е»єи®®пј‰
- [x] иїЃз§» /api/pixie/auto-context в†’ tRPC pixie.autoContextпј€иЇ»еЏ–иЃЉе¤©е®¤дёЉдё‹ж–‡пјЊе€¤ж–­ж�Їеђ¦дё»еЉЁеЏ‘иЁЂпј‰
- [x] ж–°еўћ tRPC pixie.liveChatпј€е¤љиЅ®еЇ№иЇќпјЊз”ЁдєЋ LiveChat жј”з¤єйЎµпј‰
- [x] ж–°еўћ tRPC pixie.personasпј€иЋ·еЏ–дєєж је€—иЎЁпј‰
- [x] ж‰Ђжњ‰ LLM и°ѓз”Ёе€‡жЌўи‡і claude-haiku-4-5пј€gpt-5-mini ењЁеЅ“е‰ЌзЋЇеўѓиї”е›ћз©єе†…е®№пј‰
- [x] жіЁе†Њ pixieRouter е€° server/routers.ts

## дєєж јзі»з»џ

- [x] ж”ЇжЊЃе…­з§Ќдєєж јпјљsassy_roast_bestie / smooth_witty_fox / elegant_gentleman / loyal_bro / soft_social_anxiety_helper / calm_strategist
- [x] ж‰Ђжњ‰дєєж ј System Prompt ењЁжњЌеЉЎз«Їз»„иЈ…пјЊдёЌжљґйњІз»™е®ўж€·з«Ї

## е‰Ќз«ЇйЎµйќў

- [x] е…Ёе±Ђж·±и‰Ідё»йў�пј€index.css CSS еЏ�й‡Џпј‰
- [x] дј�й›…е­—дЅ“пј€Cormorant Garamond + Interпј‰
- [x] App.tsx и·Їз”±й…ЌзЅ®пј€Home / Playground / Docs / LiveChatпј‰
- [x] Home иђЅењ°йЎµпј€е“Ѓз‰Ње±•з¤є + еЉџиѓЅе…ҐеЏЈ + дєєж је±•з¤єпј‰
- [x] Playground дє¤дє’жµ‹иЇ•йЎµпј€дё‰дёЄ API з«Їз‚№ + дєєж јйЂ‰ж‹©е™Ё + жЁЎејЏйЂ‰ж‹©е™Ёпј‰
- [x] Docs ж–‡жЎЈйЎµпј€API иЇґж�Ћ + иЇ·ж±‚/е“Ќеє”ж јејЏ + д»Јз Ѓз¤єдѕ‹ + дѕ§иѕ№ж ЏеЇји€Єпј‰
- [x] LiveChat жј”з¤єйЎµпј€е¤љиЅ®еЇ№иЇќ + дєєж је€‡жЌў + ж°”жіЎеЉЁз”» + еї«жЌ·е›ће¤Ќпј‰

## жµ‹иЇ•

- [x] auth.logout жµ‹иЇ•йЂљиї‡
- [x] pixie.suggest жµ‹иЇ•йЂљиї‡
- [x] pixie.chat жµ‹иЇ•йЂљиї‡
- [x] pixie.autoContext жµ‹иЇ•йЂљиї‡
- [x] pixie.liveChat жµ‹иЇ•йЂљиї‡
- [x] pixie.personas жµ‹иЇ•йЂљиї‡
- [x] TypeScript з±»ећ‹жЈЂжџҐйЂљиї‡пј€0 errorsпј‰

## Ask Lumi вЂ” дё‰е±‚е®‰е…Ёжћ¶жћ„
- [x] ask-lumi-prompts.tsпј€LUMI_BASE_IDENTITY / LUMI_CLASSIFIER_PROMPT / LUMI_SOCIAL_SOOTHING_PROMPT / LUMI_GROUNDING_PROMPT / LUMI_CRISIS_REDIRECT_PROMPTпј‰
- [x] Layer 1: е…ій”®иЇЌе®‰е…ЁжЈЂжµ‹пј€quickSafetyCheckпј‰
- [x] Layer 2: жѓ…з»Єе€†з±»е™Ёпј€classifyLumi в†’ JSON onlyпј‰
- [x] Layer 3a: Social Soothing з”џж€ђе™Ёпј€дЅЋйЈЋй™©пј‰
- [x] Layer 3b: Grounding з”џж€ђе™Ёпј€дё­йЈЋй™©пј‰
- [x] Layer 3c: Crisis Redirect з”џж€ђе™Ёпј€й«�йЈЋй™©пј‰
- [x] askLumi.ask tRPC з«Їз‚№пј€дё‰е±‚е®Њж•ґз®ЎйЃ“пј‰
- [x] askLumi.classify tRPC з«Їз‚№пј€и°ѓиЇ•з”Ёпј‰
- [x] AskLumi е‰Ќз«ЇйЎµйќўпј€/ask-lumiпј‰
- [x] Low Risk UIпј€SocialSoothingCard вЂ” е¤љж°”жіЎ + дё‰з§Ќж›їд»Јж–№жЎ€ + е¤Ќе€¶жЊ‰й’®пј‰
- [x] Medium Risk UIпј€GroundingCard вЂ” жЋҐењ°ж­ҐйЄ¤ + еЏЇйЂ‰е»¶иїџе›ће¤Ќпј‰
- [x] High Risk UIпј€CrisisRedirectCard вЂ” еЌ±жњєж”ЇжЊЃ + зґ§жЂҐиµ„жєђ + ж— з¤ѕдє¤е›ће¤Ќпј‰
- [x] е€†з±»е™Ёе€†жћђйќўжќїпј€еЏЇжЉ�еЏ пј‰
- [x] еЇји€Єж Џж·»еЉ  Ask Lumi е…ҐеЏЈ
- [x] Ask Lumi жµ‹иЇ•пј€4 дёЄз”Ёдѕ‹пјљдЅЋ/дё­/й«�йЈЋй™© + classifyпј‰

## дј�еЊ–иї­д»Ј v2
- [x] зІѕз®Ђдєєж јпјљеЏЄдїќз•™ sassy_roast_bestie е’Њ smooth_witty_fox
- [x] жњЌеЉЎз«Ї pixie-prompts.ts з§»й™¤е…¶дЅ™е››з§Ќдєєж ј
- [x] Playground suggest з•Њйќўйљђи—Џ mode йЂ‰йЎ№пјЊеЏЄж�ѕз¤є Ask Lumi жЊ‰й€•’®
- [x] LiveChat й‡Ќжћ„дёєзњџе®ћиЃЉе¤©з•Њйќўпј€еЏЊдєєеЇ№иЇќ + Lumi зІѕзЃµж°”жіЎжЏ’е…Ґпј‰
- [x] LiveChat йЎ¶йѓЁж�ѕз¤єеЇ№иЇќеЏЊж–№е¤ґеѓЏе’ЊеђЌе­—
- [x] LiveChat ж¶€жЃЇж°”жіЎеЊєе€†и‡Єе·±пј€еЏідѕ§ж·±и‰Іпј‰е’ЊеЇ№ж–№пј€е·¦дѕ§жµ…и‰Іпј‰
- [x] Lumi д»Ґе°ЏзІѕзЃµиє«д»ЅењЁиЃЉе¤©дё­жЏ’е…Ґе»єи®®ж°”жіЎ

## 优化迭代 v3 — 精灵交互重构
- [x] 点击「问问精灵」按鈕弹出 Ask Lumi 底部面板（图2风格）
- [x] Ask Lumi 面板：建议语句 + Your vibe right now 情绪标签
- [x] Ask Lumi 面板：Watch-outs 警示标签
- [x] Ask Lumi 面板：What I think you mean 解读
- [x] Ask Lumi 面板：Try sending this 大卡片 + Use this / More playful / Cancel
- [x] Ask Lumi 面板：底部 Risk / Confidence / Voice Match 数据
- [x] 点击精灵头像弹出 Lumi Whisper 私聊面板（图3风格）
- [x] Lumi Whisper 面板：与 Lumi 对话气泡 + 输入框
- [x] Lumi Whisper 面板：底部快捷问题标签（Help me reply 等）
- [x] Lumi Whisper 面板：Lumi suggests 建议卡片 + Use this / More casual

## 优化迭代 v4 — 精灵上下文感知 + 中文化
- [x] 修复精灵上下文感知：发送消息后自动触发精灵建议插入聊天流
- [x] 精灵气泡显示在聊天流中（区别于普通消息）
- [x] 全部 UI 文案切换为中文（LiveChat、Home、Playground、Docs、AskLumi）

- [x] 精灵 LLM 输出改为中文：在所有 system prompt 中加入"请始终用中文回复"指令
- [x] 精灵建议气泡显示在 Lucy（右侧）：将 lumi 气泡布局改为右对齐（flex-row-reverse）
- [x] 双精灵区分：Lumi（Lucy 右侧）和 Foxxz（Pat 左侧）各自独立气泡，Pat 回复后触发 Foxxz 建议
- [x] 改写 pixie-prompts.ts：沉默优先 + 严格 bubble 数量限制 + Lumi/Foxxz 人格区分 + autoContext 沉默规则
- [x] 精灵气泡改为公开样式：去掉"只有你能看到"标注，Lumi/Foxxz 作为公开对话参与者
- [x] 精灵公开/私下分流改造：PUBLIC_SPEAK_PROMPT + publicSpeak 端点 + LiveChat 场景检测分流渲染
- [x] private_whisper 分流：将 Lumi/Foxxz 私密提醒从主聊天流移除，改为仅进入 Whisper 私密面板
- [x] 为 pixie.publicSpeak 添加 Vitest 测试覆盖
- [x] 修复精灵气泡消失 bug：移除 setShowWhisper(true) 自动弹出，改为角标提示；精灵头像加红点角标
- [x] 修复精灵内容重复：Lucy 发消息只触发 Lumi，Pat 回复只触发 Foxxz，两者不同时触发

## 优化迭代 v5 — 强人格提示词升级
- [x] 升级 Lumi 和 Foxxz 的 PERSONA_PROMPTS（含 few-shot 示例台词、场景模板）
- [x] 修复 Playground 和 Docs 页面中 Foxxz 被错误标注为 Lumi 的问题

## 优化迭代 v5.1 — Pixie Chat Companion 提示词升级
- [x] 整合 Pixie Chat Companion 核心定位到 CHAT_PROMPT（私密聊天窗定位 + 多气泡回复公式）
- [x] 注入 sceneType 分类和 50 场景 few-shot 锚点（精选 12 个代表性场景）
- [x] 升级 Output Schema 支持 sceneType、responseStyle、suggestedAction 字段

## 优化迭代 v5.2 — Playground Ask Lumi 完整分析视图
- [x] 升级 Playground suggest 结果展示：加入 Your vibe / Watch-outs / What I think you mean / Try sending this / alternatives / 底部指标
- [x] 为 pixie.suggest 输出补充 alternatives 字段（more playful / more casual / softer）并更新 schema/router
- [x] 在 Playground suggest 结果卡片中渲染 alternatives 区域，提供可复制的替代文案

## 优化迭代 v5.3 — 清理毒舌残留 + 全站英文化
- [x] 清理 Lumi 人格中残留的旧毒舌/sassy/roast 相关内容
- [x] 将所有前端页面中文内容转换为英文（Home/Playground/Docs/LiveChat/AppDemo 等）
- [x] 整理项目为可复制的 GitHub 项目（README、.env.example、部署指南）

## LumiPixieChatBox — Lumi Pet Chat Channel (v6)
- [x] Upgrade LIVE_CHAT_PROMPT with full ZIP content (15 scenarios, 3 response modes, memory system, safety mode) — English
- [x] Fix ask-lumi-prompts.ts language: change Chinese output requirement to English
- [x] Create new server/lumi-chat-router.ts with lumiChat endpoint (memory-aware schema)
- [x] Create new client/src/pages/LumiChat.tsx — dedicated Lumi pet chat channel page
- [x] LumiChat: 3 response mode display (Soft Hug / Cute Roast / Gentle Action)
- [x] LumiChat: Memory consent UX (Remember / Not this time / Never remember this)
- [x] LumiChat: Quick replies (0-3 buttons per response)
- [x] LumiChat: Scene type badge display
- [x] LumiChat: Safety mode card (serious tone, emergency resources)
- [x] LumiChat: Risk level indicator
- [x] Register /lumi-chat route in App.tsx
- [x] Add Lumi Chat nav link to header
- [x] Update Home page to include Lumi Chat feature card
- [x] Write vitest tests for lumiChat endpoint
- [x] TypeScript zero errors, all tests passing

## Smart Planner — Activity Matching API

- [x] Add activity_plans table to drizzle/schema.ts
- [x] Generate migration SQL and apply via webdev_execute_sql
- [x] Add db helpers for activity_plans in server/db.ts
- [x] Build scoring algorithm in server/smart-planner-scoring.ts
- [x] Build server/smart-planner-router.ts: generate, getById, list endpoints
- [x] Register smartPlanner router in server/routers.ts
- [x] Build SmartPlanner frontend page: two-person profile form + timeslot
- [x] SmartPlanner: Result view — top 3 event cards with match score ring
- [x] SmartPlanner: Chat topics section
- [x] SmartPlanner: History view
- [x] Register /smart-planner route in App.tsx
- [x] Add Smart Planner nav link to Home.tsx
- [x] Write vitest tests for smart-planner-router
- [x] TypeScript zero errors
