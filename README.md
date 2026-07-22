# Vision Episode Tracker

Vision Episode Tracker（视觉异常发作记录器）是一款本地优先的 PWA，最初用于记录我自己的典型偏头痛发作及相关视觉表现。

它帮助记录发作时间、持续时长、视觉症状、眼别、严重程度、伴随表现和恢复情况，并把零散记录整理为趋势、日历和就诊报告。

> 本项目是个人记录工具，不是医疗器械，也不提供诊断、急救判断或治疗建议。突发视力丧失、言语困难、单侧无力等异常情况应及时寻求专业医疗帮助。

## 当前能力

- 一键开始实时记录，恢复后自动计算持续时间；
- 补录已经结束的发作，支持精确时间、大约时间、仅时段和仅日期；
- 按需记录视觉表现、眼别、视野、伴随表现、活动和可能相关情况；
- 查看 7、30、365 天概览、时段分布、日历和数据完整度；
- 生成可复制、打印或保存为 PDF 的就诊摘要；
- 导出 CSV，以及带校验和的完整 JSON 备份；
- 安装到 iPhone 主屏幕，首次加载后可离线使用；
- 无需账号即可在本机完整使用；
- 可选邮箱账户，在联网时跨设备同步；
- 首次登录时认领已有本地记录，导出前合并云端与本机数据。

## 数据与隐私

未登录时，健康记录只保存在当前浏览器的 IndexedDB 中。用户注册或登录后，已有本地记录会被当前账户认领，后续变更先写入本机，再通过 outbox 在联网时同步到 Supabase。

云端数据通过 PostgreSQL Row Level Security 按账户隔离。前端只使用可公开的 publishable key，不得包含 secret key、service-role key、数据库密码或其他高权限凭据。应用不会把健康数据发送到 GitHub、Cloudflare 或分析服务。

清除浏览器数据不会删除已经完成同步的云端记录，但可能丢失尚未上传的离线变更。退出账户时会清除该账户在设备上的本地缓存，避免随后进入本地模式的使用者看到原账户数据。

登录用户导出 JSON 前会先完成一次双向同步；同步失败时可以取消，或明确选择只导出当前设备的数据。导出的备份文件当前不加密，需要由用户自行妥善保管。

## 技术栈

- React、TypeScript、Vite；
- Dexie / IndexedDB；
- Supabase Auth / PostgreSQL；
- Zod；
- vite-plugin-pwa / Workbox；
- Vitest、Testing Library、Playwright；
- Cloudflare Workers。

## 本地开发

需要 Node.js 22，并使用 `package.json` 声明的 Yarn 版本。

```sh
corepack enable
yarn install --immutable
yarn dev
```

复制环境变量模板并填写 Supabase 项目配置：

```sh
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
```

`VITE_*` 是 Vite 构建时变量，会被写入浏览器 JavaScript，因此只能存放公开配置。不要添加 secret key、service-role key 或数据库密码。

### Supabase 初始化

在目标 Supabase 项目的 SQL Editor 中按文件名顺序执行 `supabase/migrations/` 下的 migration：

```text
supabase/migrations/202607220001_create_episodes.sql
supabase/migrations/202607220002_enable_realtime.sql
```

该 migration 创建：

- `episodes` 发作记录表；
- `episode_deletions` 删除标记表；
- 按 `auth.uid()` 隔离数据的 RLS policies；
- 带版本比较的同步函数，防止旧设备覆盖或复活已删除记录。
- 发作记录和删除标记的 Realtime publication。

如启用邮箱确认，还需要在 Supabase Dashboard 的 Authentication → URL Configuration 中设置正式站点地址，并把本地开发地址加入 Redirect URLs，例如：

```text
Site URL: https://your-app.example.com
Redirect URLs:
  https://your-app.example.com/**
  http://localhost:5173/**
```

常用检查命令：

```sh
yarn lint
yarn typecheck
yarn test
yarn build
```

## 部署

本项目通过 Cloudflare Workers Static Assets 托管 `dist/`：

```sh
yarn build
yarn deploy
```

静态站点不能在浏览器运行时读取服务器 `.env`。Supabase 的两个公开变量必须在执行 `yarn build` 时存在：本地部署由本地 `.env` 提供，CI 或 Cloudflare 平台构建则应配置对应的 build variables。

例如 GitHub Actions：

```yaml
- name: Build PWA
  env:
    VITE_SUPABASE_URL: ${{ vars.VITE_SUPABASE_URL }}
    VITE_SUPABASE_PUBLISHABLE_KEY: ${{ vars.VITE_SUPABASE_PUBLISHABLE_KEY }}
  run: yarn build
```

## 路线图

未来版本计划在不破坏本地优先原则的前提下逐步加入：

- 设备管理和活跃会话查看；
- 更清晰的同步状态、失败重试与冲突提示；
- 端到端加密、备份加密和精细化数据权限；
- 受控分享报告及医生协作能力；
- 更完整的趋势对比和自定义报告；
- 高级 AI 报告分析，用于整理记录、发现值得关注的数据模式和生成就诊问题清单；
- AI 分析结果的证据引用、不确定性说明和人工确认机制。

AI 能力只用于辅助整理用户已经记录的数据，不替代医生诊断，也不应直接给出用药或治疗决策。

## License

当前仓库尚未声明开源许可证。在添加许可证前，默认保留全部权利。
