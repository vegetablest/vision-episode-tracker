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
- 安装到 iPhone 主屏幕，首次加载后可离线使用。

## 数据与隐私

当前版本没有账号和后端。所有健康记录默认只保存在浏览器的 IndexedDB 中，不会上传到 GitHub、Cloudflare 或第三方分析服务。

删除 PWA、清除浏览器网站数据或更换访问域名都可能造成数据丢失，请定期导出 JSON 备份。导出的备份文件当前不加密，需要由用户自行妥善保管。

## 技术栈

- React、TypeScript、Vite；
- Dexie / IndexedDB；
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

常用检查命令：

```sh
yarn lint
yarn typecheck
yarn test
yarn build
```

## 部署

部署到 Cloudflare Workers：

```sh
yarn build
yarn deploy
```

## 路线图

未来版本计划在不破坏本地优先原则的前提下逐步加入：

- 用户注册、登录和设备管理；
- 可选择的数据托管与多设备同步；
- 端到端加密、备份加密和精细化数据权限；
- 受控分享报告及医生协作能力；
- 更完整的趋势对比和自定义报告；
- 高级 AI 报告分析，用于整理记录、发现值得关注的数据模式和生成就诊问题清单；
- AI 分析结果的证据引用、不确定性说明和人工确认机制。

AI 能力只用于辅助整理用户已经记录的数据，不替代医生诊断，也不应直接给出用药或治疗决策。

## License

当前仓库尚未声明开源许可证。在添加许可证前，默认保留全部权利。
