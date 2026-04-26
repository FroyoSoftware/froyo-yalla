# froyo-yalla

## 产品定位

**Yalla** — 群体点单 + 实时汇总工具。不是接龙，是每个人独立填写数量的表单，组织者后台看总量和每人明细。类比：数字化版的传一圈纸质点菜单。

中文产品名待定，英文品牌名 **Yalla**，repo 名 `froyo-yalla`。

## PRD 位置

```
/Users/anicol/Library/Mobile Documents/iCloud~md~obsidian/Documents/Froyo's Brain/10-策·立项/活动接龙统计工具/活动接龙统计工具 PRD v1.0.md
```

## 技术栈

- **Next.js 16.2.4** App Router + TypeScript（注意：版本较新，有 breaking changes，`cookies()` 是 async）
- Supabase（Postgres + Google OAuth + Realtime）— project ID: `gzrphmankmaqlmqepgvk`
- shadcn/ui（使用 `@base-ui/react`，**非** Radix）+ Tailwind CSS（移动端优先）
- Vercel 部署（已完成，生产域名 `yalla.froyo.me`）

## 关键约束（勿忘）

- Next.js 16 中间件文件名是 `proxy.ts`，导出 `export async function proxy()`（非 `middleware`）
- 用 `@supabase/ssr` 0.10.2，**不用** `@supabase/auth-helpers-nextjs`（已废弃）；用 `getAll/setAll` cookie pattern
- `SUPABASE_SERVICE_ROLE_KEY` 只在 `lib/actions.ts` server actions 中使用，绝不出现在 client 文件
- `cookies()` 在 Next 16 是 async：`const store = await cookies()`
- Realtime 订阅必须加 `.filter('activity_id=eq.<id>')` 避免全表广播
- Admin 校验：server action 对比 `session.user.email === process.env.ADMIN_EMAIL`（env var 名 `ADMIN_EMAIL`，非 `NEXT_PUBLIC_`）
- 表名 `participant_order`（`order` 是 SQL 保留字）
- quantity >= 0，最小值 0，+/- 按钮 ≥ 44px 点击热区
- 参与者特别备注上限 150 字（UI maxLength=150，DB constraint 300，以 UI 为准）
- seed 按固定 `ACTIVITY_ID` upsert，不按标题匹配；regex 用 `[ \t]*` 而非 `\s*` 防跨行

## 文件结构（实际）

```
proxy.ts                          ← Next.js 中间件（session refresh + 路由保护）
lib/
  supabase.ts                     ← createClient() + createAdminClient()
  actions.ts                      ← 所有 server actions
app/
  layout.tsx                      ← Title: "Yalla · Order"
  page.tsx                        ← 首页（提示用活动链接）
  login/page.tsx                  ← Google OAuth 登录页
  auth/callback/route.ts          ← OAuth code exchange
  activity/[id]/
    page.tsx                      ← 参与者点单页（Server Component）
    OrderForm.tsx                  ← 点单表单（Client Component）
    admin/page.tsx                ← 组织者汇总页（Server Component）
scripts/
  seed.ts                         ← 自动解析 menu.md 建活动 + 菜单
menu.md                           ← 菜单源文件
.env.local                        ← SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY / ADMIN_EMAIL
```

## 路由

- `/login` — Google OAuth 登录页
- `/activity/[id]` — 参与者填写页
- `/activity/[id]/admin` — 组织者汇总页（server-side 校验 ADMIN_EMAIL）

## 数据

- Supabase project: `gzrphmankmaqlmqepgvk`
- 当前活动 ID（含备注+发起人）：`89a1d39f-2c78-49e3-ae87-0f6ccd180e55`（ID 已稳定，seed 改为 upsert）
- 旧活动 ID（含备注，无发起人）：`4d2337d9-379b-48ea-b892-cea133cc5d49`
- 旧活动 ID（无备注）：`571c5cce-8948-4068-85f1-0908e248e5fd`
- ADMIN_EMAIL：`froyosoftware@gmail.com`
- Google OAuth Client ID：`185404195869-pa85afrdntjcs63sbo42l7vcqt5pc7c2.apps.googleusercontent.com`
- 生产域名：`https://yalla.froyo.me`
- GitHub 仓库：`https://github.com/FroyoSoftware/froyo-yalla`

## 完成状态

- [x] Next.js 项目初始化
- [x] 依赖安装：`@supabase/ssr @supabase/supabase-js`
- [x] shadcn 初始化 + 组件：button / card / badge / separator / table
- [x] `.env.local` 配置完整
- [x] Supabase 建表 + RLS + GRANT（activity / menu_item / participant_order）
- [x] Google OAuth 配置完成（Google Auth Platform + Supabase Dashboard）
- [x] 全部核心代码完成（proxy.ts / lib/ / app/ 所有页面）
- [x] 菜单备注 pill badge（menu_item.note，从 menu.md `()` 解析）
- [x] 参与者特别备注（participant_note 表 + textarea，300字上限）
- [x] 组织者 vs 参与者角色区分（仅 ADMIN_EMAIL 看到 Organizer 入口）
- [x] seed 自动解析 menu.md，新活动 ID: `4d2337d9`
- [x] UI 全英文，移动端友好，note badge 间距优化
- [x] `npm run build` 通过，零报错
- [x] Supabase SQL migration 已执行（SQL Editor）
- [x] 历史 SQL 已回填为迁移链（2026-04-23 ~ 2026-04-25）
- [x] activity 表加 organizer_name 列，seed 写入发起人
- [x] seed 改为 upsert（按标题匹配），ID 永久稳定
- [x] parseDeadline 修复（支持 YYYY-M-D 格式，不再 hardcode）
- [x] 页面展示发起人 + 截止日期（仅日期，无时间）
- [x] Vercel 部署（froyo-yalla.vercel.app，env vars 已配置）
- [x] 自定义域名接入（yalla.froyo.me + Cloudflare CNAME）
- [x] GitHub 首次推送（origin/main）
- [x] 线上 admin 统计异常修复（root cause: Invalid API key / service role key）
- [x] 管理员邮箱比对容错（trim + dequote + lowercase）
- [x] seed 改为按固定 ACTIVITY_ID upsert（标题改了也不新建，ID 永久稳定）
- [x] seed regex 修复（`\s*` → `[ \t]*`，防止跨行误读 description）
- [x] 登录后跳回原活动页（proxy returnTo → signInWithGoogle → callback）
- [x] OAuth Redirect URLs 补齐 `?*` 通配符（localhost + 生产）
- [x] 一键清空订单（删除 participant_order + participant_note）
- [x] 删除确认改为页面内警告弹窗（非浏览器原生 confirm）；背景点击可关闭
- [x] UI 优化：Host 标签、截止日期加年份、· 分隔符、description/badge spacing
- [x] 备注字数上限统一为 150（UI maxLength + server action 校验 + DB constraint）
- [x] normalizeEmail 提取到 lib/utils.ts，消除三处重复定义
- [x] 删除未使用的 shadcn 组件（badge/button/card/separator/table）
- [ ] Realtime 实时刷新（未来功能）
- [ ] 短链接 slug（未来功能）

---

## 下一步（新 session 从这里开始）

**当前状态：v1 已上线，核心链路稳定。下一步按需选做：**
- Realtime 实时刷新（admin 页自动更新）
- 短链接 slug（URL 不暴露 UUID）

### 第一步：迁移基线（已完成）

历史迁移链（已补齐，按时间排序）：

`supabase/migrations/20260423_create_core_schema_rls_realtime.sql`
`supabase/migrations/20260423_grant_core_tables.sql`
`supabase/migrations/20260423_seed_initial_activity_menu.sql`
`supabase/migrations/20260424_initial_participant_note_policies.sql`
`supabase/migrations/20260425_add_menu_note_and_participant_note.sql`

说明：上面链路已在生产项目中“事后回填”，用于追踪与新环境复现；日后新增数据库改动时，继续在 `supabase/migrations/` 新增文件，不改历史文件。

本次核心 SQL（已执行）如下：

```sql
-- 菜单备注列（seed 已写入数据，但列不存在会报错）
ALTER TABLE menu_item ADD COLUMN IF NOT EXISTS note text;

-- 参与者特别备注表
CREATE TABLE IF NOT EXISTS participant_note (
  id            uuid primary key default gen_random_uuid(),
  activity_id   uuid not null references activity(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  note          text check (char_length(note) <= 300),
  updated_at    timestamptz not null default now(),
  unique (activity_id, user_id)
);
ALTER TABLE participant_note ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can manage own notes"
  ON participant_note FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
GRANT ALL ON TABLE participant_note TO anon, authenticated, service_role;
```

### 第二步：本地测试完整流程

```bash
npm run dev
# 打开：http://localhost:3000/activity/89a1d39f-2c78-49e3-ae87-0f6ccd180e55
```

验证清单：
- [ ] 未登录 → 跳转 `/login`
- [ ] Google 登录 → 跳回活动页
- [ ] 看到菜单 + 备注 badge
- [ ] 提交点单 + 特别备注 → 成功 toast
- [ ] 点击 Clear all → 弹出警告窗口；确认后数量与备注均清空
- [ ] 用 `froyosoftware@gmail.com` 登录 → 看到 "Organizer" 链接
- [ ] 组织者汇总页：总量 + 每人明细 + 特别备注

### 第三步：Vercel 运营要点（已上线后）

```bash
npx vercel --prod
# 记得在 Vercel 设置全部 env vars：
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# ADMIN_EMAIL
```

已完成域名：`https://yalla.froyo.me`

OAuth 配置要求（当前应保持如下）：
- Google Auth Platform：保留 Supabase callback（`https://gzrphmankmaqlmqepgvk.supabase.co/auth/v1/callback`）
- Supabase Dashboard：
  - Site URL = `https://yalla.froyo.me`
  - Redirect URLs 至少包含：
    - `http://localhost:3000/auth/callback`
    - `http://localhost:3000/auth/callback?*`
    - `https://yalla.froyo.me/auth/callback`
    - `https://yalla.froyo.me/auth/callback?*`

当前发布状态：
- v1 上线稳定，最新一次 commit 包含：clear all 弹窗、备注 150 字统一、normalizeEmail 提取、shadcn 死代码清理
- 下次改动后记得 `npx vercel --prod` 同步到生产

### 第四步：推送 GitHub（防密钥泄露）

先确认当前目录是 git 仓库；若不是，先初始化：

```bash
git init
git branch -M main
```

推送前安全检查：

```bash
git add .
git restore --staged .env.local
git rm --cached .env.local 2>/dev/null || true
git ls-files | grep -E '^\.env' || true
```

期望结果：
- 只看到 `.env.example`，不出现 `.env.local`

提交并推送：

```bash
git commit -m "chore: prepare MVP launch and safe github push"
git remote add origin <your-repo-url>
git push -u origin main
```

额外防护：
- 已新增 `.env.example` 模板用于团队协作
- `scripts/seed.ts` 已移除 service key 前缀日志，避免终端泄露片段
