# TON Hackathon Demo Launch Guide

> 这份 guide 只列出**你需要亲自操作**的事情。所有代码修改由 Claude 完成。
> 预计总耗时: 30-45 分钟（不含代码修改等待时间）

---

## 前置条件

在开始之前，确认你有:
- [x] Telegram 账号
- [x] 一个 TON 钱包（推荐 Tonkeeper，App Store 下载）
- [x] Cloudflare 账号（用于部署 mini-app）
- [x] EC2 SSH 访问权限（用于部署 server）

---

## Step 1: 创建 Telegram Bot

**在 Telegram 中操作，耗时 ~3 分钟**

1. 打开 Telegram，搜索 `@BotFather`
2. 发送 `/newbot`
3. 设置 bot 名称，例如: `Soulink Agent Identity`
4. 设置 bot username，例如: `SoulinkTonBot`（必须以 Bot 结尾）
5. **保存返回的 Bot Token**（格式: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`）

做完后记录:
```
BOT_USERNAME=SoulinkTonBot
BOT_TOKEN=<BotFather 给的 token>
```

---

## Step 2: 获取 Testnet TON

**在 Telegram 中操作，耗时 ~2 分钟**

1. 打开 Tonkeeper → Settings → Network → 切换到 **Testnet**
2. 复制你的 testnet 钱包地址
3. 在 Telegram 搜索 `@testgiver_ton_bot`
4. 发送你的钱包地址，bot 会发送 2 TON（testnet）
5. 等 10-20 秒，Tonkeeper 中确认到账

> 需要至少 1 TON 用于部署合约 + 注册测试

做完后记录:
```
DEPLOYER_WALLET=<你的 testnet 钱包地址>
```

---

## Step 3: 部署合约到 Testnet

**在终端操作，耗时 ~5 分钟**

前提: Claude 已经修好代码并确认 `npx blueprint build` 通过。

```bash
cd ~/soulink/ton/contracts
npx blueprint run deployAgentRegistry --testnet --tonconnect
```

这会:
1. 弹出一个二维码 / 链接
2. 用 Tonkeeper（testnet 模式）扫码连接
3. 确认部署交易（~0.1 TON gas）
4. 终端会打印合约地址

做完后记录:
```
REGISTRY_ADDRESS=<终端输出的合约地址>
```

验证部署成功:
```bash
# 打开浏览器访问:
https://testnet.tonviewer.com/<REGISTRY_ADDRESS>
```

---

## Step 4: 准备 Operator 钱包

**需要一个专用的 operator 钱包（不是你的主钱包）**

方式 A — 生成新钱包（推荐）:
```bash
# Claude 会写一个脚本来生成，运行后保存输出的助记词
cd ~/soulink/ton/server
npx tsx scripts/generate-wallet.ts
```

方式 B — 用现有钱包:
- 导出 24 词助记词（Tonkeeper → Settings → Backup）

做完后:
1. 给 operator 钱包转入 ~0.5 TON（testnet）用于发送注册交易
2. 在合约上设置 operator（Claude 会写脚本）

记录:
```
OPERATOR_MNEMONIC=word1 word2 word3 ... word24
OPERATOR_ADDRESS=<operator 钱包地址>
```

---

## Step 5: 配置并启动 Server

**在 EC2 或本地操作，耗时 ~5 分钟**

创建 `ton/server/.env`:
```bash
OPERATOR_MNEMONIC=<Step 4 的 24 词>
REGISTRY_ADDRESS=<Step 3 的合约地址>
TON_ENDPOINT=https://testnet.toncenter.com/api/v2/jsonRPC
TON_NETWORK=testnet
PORT=4022
CORS_ORIGIN=https://ton.soulink.dev
```

本地启动测试:
```bash
cd ~/soulink/ton/server
npm install && npm run dev
```

验证:
```bash
curl http://localhost:4022/health
# 应该返回 {"status":"ok"}

curl http://localhost:4022/api/v1/names/search?q=alice
# 应该返回 {"success":true,"data":[...]}
```

### 部署到 EC2（可选，demo 可以用本地）:

```bash
ssh -i ~/.ssh/cax-ec2.pem ubuntu@18.176.163.22 \
  "cd ~/soulink/ton/server && git pull && npm install && \
   cp .env.example .env && nano .env && \
   pm2 start npm --name soulink-ton -- run start"
```

---

## Step 6: 部署 Mini App

**耗时 ~5 分钟**

### 6a. 设置 DNS

在 Cloudflare Dashboard 中:
1. 域名 `soulink.dev` → DNS → 添加记录
2. 添加 CNAME: `ton` → `<pages-project>.pages.dev`（或用 Workers）

### 6b. 部署到 Cloudflare Pages

```bash
cd ~/soulink/ton/mini-app

# 设置 API 地址（指向你的 server）
echo "VITE_API_URL=https://ton.soulink.dev/api/v1" > .env.production

npm install && npm run build

# 方式 A: Cloudflare Pages (推荐)
npx wrangler pages deploy dist --project-name=soulink-ton

# 方式 B: 直接用 Pages Dashboard 连 GitHub
```

验证: 浏览器打开 `https://ton.soulink.dev`，应该看到 Soulink 页面。

### 6c. API 代理（如果 server 不在同域名下）

如果 server 跑在 EC2（`api.soulink.dev:4022`），需要在 Cloudflare Workers 中添加代理规则把 `ton.soulink.dev/api/v1/*` 转发到 server。Claude 可以写这个 worker。

---

## Step 7: 注册 Mini App 到 BotFather

**在 Telegram 中操作，耗时 ~2 分钟**

1. 回到 `@BotFather`
2. 发送 `/newapp`
3. 选择 Step 1 创建的 bot
4. 设置:
   - Title: `Soulink`
   - Description: `Agent identity on TON`
   - Photo: 上传一张 640x360 图片（可选，可以跳过）
   - Web App URL: `https://ton.soulink.dev`（Step 6 部署的地址）
   - Short name: `app`
5. 完成后，Mini App 可通过以下方式访问:
   - 链接: `https://t.me/SoulinkTonBot/app`
   - Bot 菜单按钮（可选设置）

### 设置菜单按钮（可选）:
```
/setmenubutton
选择你的 bot
输入 URL: https://ton.soulink.dev
输入按钮文字: Open Soulink
```

---

## Step 8: 端到端测试

**耗时 ~5 分钟**

用手机 Telegram 打开 `https://t.me/SoulinkTonBot/app`，完整走一遍:

### 测试清单:

- [ ] Mini App 正常打开（不白屏）
- [ ] 点击 "Connect Wallet" → Tonkeeper 弹出授权
- [ ] 钱包连接成功，显示地址
- [ ] 搜索 agent 名称（如 `alice`）→ 显示可用
- [ ] 点击注册 → Tonkeeper 弹出支付确认
- [ ] 支付完成 → 轮询显示注册成功
- [ ] 搜索刚注册的名称 → 能解析到地址
- [ ] 查看 agent profile 页面
- [ ] 查看 credit score（应该是 N/A 或默认值）

如果某步失败，截图发给我，我来排查。

---

## Step 9: 录制 Demo 视频

**耗时 ~10 分钟**

### 推荐结构（2-3 分钟）:

1. **问题** (15s) — "Telegram 有几千个 AI bot，但没有统一身份验证"
2. **方案** (15s) — "Soulink: 链上 agent 身份 + 信用评分"
3. **Live Demo** (90s):
   - 打开 Mini App，连接钱包
   - 注册一个 `.agent` 名称
   - 展示链上 SBT（tonviewer 上查看）
   - 用 MCP server 从另一个 agent 解析身份
   - 提交信用报告
4. **技术架构** (20s) — 快速过一下架构图
5. **已有基础** (10s) — "已在 Base 上线，EVM 版本运行中"

### 录制工具:
- Mac: QuickTime Player → File → New Screen Recording
- 或者 OBS（免费）
- 手机 demo 部分: 用 QuickTime 投屏录制 iPhone

---

## Step 10: 提交 Hackathon

**耗时 ~5 分钟**

1. 前往 [identityhub.app](https://identityhub.app) 的提交页面
2. 填写:
   - Project name: `Soulink on TON`
   - Description: Agent identity layer for Telegram — register .agent names, verify identity, build reputation
   - GitHub repo: `github.com/你的repo`（确保 `ton/` 目录已推送）
   - Demo video: 上传或贴 YouTube/Loom 链接
   - Category: Identity / Infrastructure
   - Team: 你的信息

---

## 速查: 需要记录的所有值

```bash
# Step 1
BOT_USERNAME=
BOT_TOKEN=

# Step 2
DEPLOYER_WALLET=

# Step 3
REGISTRY_ADDRESS=

# Step 4
OPERATOR_MNEMONIC=
OPERATOR_ADDRESS=

# Step 6
MINI_APP_URL=https://ton.soulink.dev
API_URL=https://ton.soulink.dev/api/v1
```

---

## 时间线建议

| 顺序 | 你做 | Claude 做 | 可并行？ |
|------|------|-----------|---------|
| 1 | Step 1-2 (创 bot + 拿 TON) | 修所有代码 bug | ✅ 并行 |
| 2 | Step 3 (部署合约) | — | 等 Claude 修完 contracts |
| 3 | Step 4 (operator 钱包) | 写钱包生成脚本 | ✅ 并行 |
| 4 | Step 5 (启动 server) | — | 等 Claude 修完 server |
| 5 | Step 6-7 (部署 mini-app + 注册 bot) | 写 CF worker 代理 | ✅ 并行 |
| 6 | Step 8 (测试) | 即时修 bug | 交替 |
| 7 | Step 9-10 (录视频 + 提交) | — | 你独立完成 |
