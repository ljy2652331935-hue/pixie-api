# App Demo Test Notes

## Working Features
1. **Suggest API** ✅ - "Ask Lumi" button works, rewrites message with suggestions
2. **Presence/AutoContext API** ✅ - Lumi auto-intervenes after Alice replies (plan_push)
3. **Chat API** ✅ - Private chat with Lumi works, shows whisper bubbles in both main chat and side panel
4. **Use This button** ✅ - Suggested public message appears as banner with "Use this" button

## Bug Found
- The private chat send button (index 13) doesn't respond to regular click/Enter from browser automation
- The button DOES work when clicked via JS `sendBtn.click()` 
- Root cause: likely the button's disabled state check or React event handling issue with browser_input overwriting state
- The quick question buttons correctly populate the input but the form submission needs a manual click on the send icon

## UI Issues to Fix
- Lumi whispers appear in BOTH the main chat area AND the side panel (redundant)
- The Presence bubble shows raw "plan_push" label - should be hidden or styled better
