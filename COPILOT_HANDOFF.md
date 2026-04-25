# Copilot Handoff — Yalla 项目

> Claude 因 usage limit 暂时不可用，由 Copilot 接手继续开发。
> Claude 恢复后会 review 本阶段工作并继续。

---

## 项目是什么

**Yalla** — 群体点单工具。参与者独立填写数量，组织者看汇总。
类比：数字化传一圈的纸质点菜单。

**技术栈：** Next.js 14 App Router + TypeScript + Supabase + shadcn/ui + Tailwind

---

## 当前状态（接手时的起点）

### ✅ 已完成
- Next.js 14 项目初始化，依赖安装完毕
- `.env.local` 已配置（Supabase URL / Anon Key / Service Role Key / Admin Email）
- shadcn/ui 初始化，组件已装：button / card / badge / separator / table
- `scripts/seed.ts` 写好（插入活动和菜单数据）
- `menu.md` 已填写（炭火小烧烤 4.26，10 个菜单项）

### ⚠️ 卡住的地方（第一件事）
Supabase 数据库表还没建成功。需要在 **Supabase SQL Editor** 依次执行：

**Step 1 — 建表：**（从 PRD 文件取完整 SQL）
PRD 路径：`/Users/anicol/Library/Mobile Documents/iCloud~md~obsidian/Documents/Froyo's Brain/10-策·立项/活动接龙统计工具/活动接龙统计工具 PRD v1.0.md`

**Step 2 — 修复权限：**
```sql
GRANT ALL ON TABLE activity TO anon, authenticated, service_role;
GRANT ALL ON TABLE menu_item TO anon, authenticated, service_role;
GRANT ALL ON TABLE participant_order TO anon, authenticated, service_role;
```

**Step 3 — 验证：**
```bash
npm run seed
```
成功输出 activity uuid 和两个页面路径即可。

---

## 接下来要写的代码（按顺序）

### 1. `middleware.ts`（根目录）
PRD 里有完整代码，直接复制。功能：未登录访问 `/activity/*` 跳转 `/login?redirect=原路径`

### 2. `lib/supabase.ts`
两个 client：
- `createBrowserClient()` — 前端用
- `createServerClient()` — server component / action 用（从 cookies 读 session）

### 3. `lib/actions.ts`
顶部必须 `'use server'`，包含：
- `upsertOrder(activityId, menuItemId, quantity)` — 参与者提交，用 anon client
- `getSummary(activityId)` — 组织者读全量，用 service role client，先校验 ADMIN_EMAIL

### 4. 三个页面
- `app/login/page.tsx` — Google OAuth 登录
- `app/activity/[id]/page.tsx` — 参与者填写页（+/- 按钮，sticky 提交）
- `app/activity/[id]/admin/page.tsx` — 汇总页（Realtime 实时更新）

---

## 关键约束（必须遵守）

1. 用 `@supabase/ssr`，**不用** `@supabase/auth-helpers-nextjs`（已废弃）
2. `SUPABASE_SERVICE_ROLE_KEY` 只在 `lib/actions.ts` 使用，不得出现在任何 client 文件
3. Realtime 订阅必须加 `.filter('activity_id=eq.<id>')` 避免全表广播
4. Admin 校验：`session.user.email === process.env.ADMIN_EMAIL`
5. 表名用 `participant_order`（`order` 是 SQL 保留字）
6. quantity >= 0，+/- 按钮点击热区 ≥ 44px

---

## 路由
- `/login` — 登录页
- `/activity/[id]` — 参与者填写
- `/activity/[id]/admin` — 组织者汇总（需 ADMIN_EMAIL 校验）

---

## 完成后请记录在 `worklogs.md`

格式示例：
```
## 2026/04/24  Copilot 接手阶段

工作内容：建表、seed、middleware、lib/supabase.ts...
```

---

## Claude 恢复后会做的事
1. Review Copilot 写的代码
2. 跑 `npm run dev` 验证 UI
3. 配 Google OAuth
4. Vercel 部署
