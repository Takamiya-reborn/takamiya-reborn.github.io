# takamiya-reborn.github.io

我的个人主页

Nuxt 4 + Lucide Icons，静态生成部署在 GitHub Pages。

```bash
mise install
npm install
npm run dev      # 本地开发
npm run generate # 构建静态站点
```

## 维护指南

日常改内容**只需要动一个文件**：[app/config/site.ts](app/config/site.ts)

| 想改什么                           | 改哪个字段                                                                  |
| ---------------------------------- | --------------------------------------------------------------------------- |
| 头像（留空则显示首字母占位）       | `profile.avatar`（放图片到 `public/` 后填路径）                             |
| 名字 / 状态 / 签名 / 位置          | `profile.*`                                                                 |
| 打字机轮播的身份标签               | `profile.roles`                                                             |
| 社交链接（GitHub / Steam / 邮箱…） | `socials`（导航栏、名片、联系区三处自动同步）                               |
| 「关于我」正文                     | `about`（字符串数组，一项一段）                                             |
| 技能树                             | `skillGroups`（组会自动换行排布）                                           |
| 正在游玩的游戏与平台               | `games`（`platform`: `'steam' \| 'xbox' \| 'ns'`，可带成就进度 `progress`） |
| 项目展示                           | `projects`（`repo` / `link` 可选）                                          |
| 经历时间线                         | `timeline`                                                                  |
| 章节标题 / 编号 / 副标题           | `sections`（**导航栏锚点会自动跟着变**）                                    |
| 彩蛋 / 成就弹窗文案                | `easterEgg`                                                                 |

图标本地可用两套前缀：`lucide:*`（通用图标）与 `simple-icons:*`（Steam / Xbox 等品牌 logo）。

### 加一个新板块

1. 在 `sections` 数组里加一项（导航自动生成锚点）
2. 在 `app/components/cards/` 下建内容组件
3. 在 `app/pages/index.vue` 里放进去

### 部署

Github Pages
