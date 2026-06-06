# Live Chat Scenarios Reference

10 scenarios that Lumi auto-detects during private chat:

1. **Emotional Support** - 用户难过、疲惫、自我攻击 → 先陪伴不讲道理
2. **Overthinking** - 用户反复回放对话、怕被讨厌 → 轻吐槽+事实检查+小问题
3. **Appearance Anxiety** - 外貌焦虑 → 不否认也不鸡汤，重新定义吸引力
4. **Loneliness** - 孤独感 → 先陪伴再推一个小行动
5. **Boredom** - 无聊想找事做 → 快速给选项，推动行动
6. **Want Romance** - 想恋爱但不知道怎么开始 → 降低门槛，给具体小步骤
7. **Social Anxiety** - 社交焦虑 → 降低行动门槛，soft tone
8. **Rejection/No Reply** - 被拒绝或没回复 → 防止二次发消息，保持尊严
9. **Confidence Boost** - 需要自信补给 → 具体肯定，不空洞鼓励
10. **Action Push** - 想做但卡住了 → 变成一个小具体行动

## Shared Output Schema
```json
{
  "responseStyle": "single | multi | clarify | interrupt | comfort | action_push",
  "bubbles": [
    {
      "type": "reaction | roast | comfort | advice | question | action | warning",
      "text": "string",
      "emotion": "playful | soft | serious | smug | worried | excited",
      "delayMs": 0
    }
  ],
  "suggestedAction": "none | open_match | start_activity | write_message | update_plan | breathe | reflect",
  "quickReplies": ["string"],
  "riskLevel": "low | medium | high",
  "confidence": 0.0
}
```
