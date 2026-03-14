# Telegram Mini App + TON Connect Research

## SDK Choice: `@telegram-apps/sdk-react`

Typed React hooks + signal-based reactivity. Wraps the raw `window.Telegram.WebApp` API.

### Init Pattern (run BEFORE React render)

```typescript
import {
  backButton, expandViewport, init as initSDK,
  initData, miniApp, swipeBehavior, themeParams, viewport,
} from '@telegram-apps/sdk-react'

export function telegramSDKInit(debug: boolean): void {
  initSDK()
  expandViewport()
  if (backButton.isSupported()) backButton.mount()
  miniApp.mount()
  themeParams.mount()
  swipeBehavior.mount()
  initData.restore()
  void viewport.mount().then(() => {
    viewport.bindCssVars()
    miniApp.bindCssVars()
    themeParams.bindCssVars()
    swipeBehavior.disableVertical()  // prevent accidental close on iOS
  })
}
```

### Theme CSS Variables (auto-bound)
```css
var(--tg-theme-bg-color)
var(--tg-theme-text-color)
var(--tg-theme-hint-color)
var(--tg-theme-link-color)
var(--tg-theme-button-color)
var(--tg-theme-button-text-color)
var(--tg-theme-secondary-bg-color)
```

## TON Connect (`@tonconnect/ui-react`)

### Setup
1. Host `tonconnect-manifest.json` publicly (no CORS)
2. Wrap app with `<TonConnectUIProvider manifestUrl="..." actionsConfiguration={{ twaReturnUrl: 'https://t.me/Bot/app' }}>`
3. Use `<TonConnectButton />` or `useTonConnectUI()` hook

### Sending TON
```tsx
const [tonConnectUI] = useTonConnectUI()
await tonConnectUI.sendTransaction({
  validUntil: Math.floor(Date.now() / 1000) + 300,
  messages: [{
    address: '<CONTRACT_ADDRESS>',
    amount: toNano("0.2").toString(),  // nanotons as string
    payload: body.toBoc().toString("base64")  // optional
  }]
})
```

### Contract Call with Payload
```tsx
const body = beginCell()
  .storeUint(opcode, 32)
  .storeStringTail(agentName)
  .endCell()

// Add as payload to sendTransaction message
```

## User Identification

### Client-side (display only)
```typescript
import { initData } from '@telegram-apps/sdk-react'
const user = initData.user() // id, first_name, username, language_code, is_premium
```

### Server-side Validation (HMAC-SHA256)
```typescript
const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
// Compare with hash from initData
```

## iOS Gotchas
- `env(safe-area-inset-bottom)` does NOT work — use Telegram's safe area API
- Edge swipes close the app — call `swipeBehavior.disableVertical()`
- Call `Telegram.WebApp.ready()` immediately to prevent white screen

## BotFather Setup
1. `/newbot` → create bot
2. `/newapp` → register Mini App (provide HTTPS URL)
3. App accessible at `https://t.me/BotName/app`
4. Test environment accepts HTTP; production requires HTTPS

## Recommended Stack
| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript + Vite |
| Telegram SDK | `@telegram-apps/sdk-react` |
| UI Components | `@telegram-apps/telegram-ui` |
| Wallet | `@tonconnect/ui-react` |
| TON Interaction | `@ton/ton` + `@ton/core` |
| Routing | `react-router-dom` |
| Deploy | Cloudflare Pages |

## Reference Template
[Telegram-Mini-Apps/reactjs-template](https://github.com/Telegram-Mini-Apps/reactjs-template) — best starting point, has SDK init, TON Connect, routing, dev mocking pre-wired.

## Haptic Feedback
```typescript
Telegram.WebApp.HapticFeedback.impactOccurred('medium')    // button tap
Telegram.WebApp.HapticFeedback.notificationOccurred('success')  // confirmation
```
