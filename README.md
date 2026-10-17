# 测井课程知识库

《地球物理测井 / 测井资料综合解释》的自主学习网站：**10 个考点 · 40 道真题 · 39 个知识块**，双链互相打通，支持全文搜索、反向链接和关系图。

- 线上地址：<https://wyattson.github.io/well-logging-kb/>
- 内容来源：Obsidian 笔记库里的 `测井课程知识库/` 目录，**只发布这一个目录**，个人笔记不会出现在网站上
- 站点引擎：[Quartz v5](https://quartz.jzhao.xyz/)
- 托管：GitHub Pages + GitHub Actions（推送即自动构建部署，不需要本机开机）

## 日常更新（最常用）

在 Obsidian 里改完笔记后，打开 PowerShell：

```powershell
cd "D:\19882\Obsidian\测井课程网站"
.\发布.ps1
```

脚本依次做：同步笔记 → 本地构建校验 → 提交 → 推送。推送后约 1 分钟，GitHub Actions 会重新构建并部署网站。

| 参数 | 作用 |
| --- | --- |
| 无 | 同步 + 构建校验 + 推送 |
| `-SkipBuild` | 跳过本地构建校验（更快，但内容有问题要等线上才发现） |
| `-LocalOnly` | 只同步和构建，不推送 |

## 本地预览

```powershell
node scripts/preview.mjs        # http://127.0.0.1:8080
```

> 必须用这个脚本预览，不要用 `python -m http.server`：Quartz 生成的是 `foo.html`，
> 线上 GitHub Pages 会把 `/foo` 映射到它，而简单静态服务器不支持，会全部 404。

## 目录结构

```
content/                     ← 站点内容（由笔记库同步而来，一般不要直接改）
  index.md                   ← 手写首页（同步时受保护，不会被覆盖）
  90-使用说明.md              ← 面向网站改写的使用说明（同步时受保护）
  00-总入口.md / 40-问答清单.md
  10-考点/  20-真题/  30-知识块/
quartz/                      ← Quartz 引擎源码（不要改）
quartz.config.yaml           ← 站点配置：标题、颜色、字体、插件
scripts/sync-content.mjs     ← 笔记库 → content/ 的同步脚本
scripts/preview.mjs          ← 本地预览服务器
sync.config.json             ← 笔记库路径 + 受保护文件
.github/workflows/deploy.yml ← 推送后自动构建并部署到 GitHub Pages
发布.ps1                      ← 一键发布
```

## 站点配置里几处「非默认」是有意为之

- `locale: zh-CN` —— 界面中文
- `baseUrl: wyattson.github.io/well-logging-kb` —— 换自定义域名时要同步改
- `theme.fontOrigin: local` —— **完全不请求 Google Fonts**，直接用系统字体，国内访问更快
- `og-image` 关闭 —— 中文 OG 图需要额外字体，且明显拖慢构建
- `note-properties` 必须开启并设 `hidePropertiesView: true` —— 它负责剥离 frontmatter，关掉会导致 YAML 原文漏进正文
- `obsidian-flavored-markdown.parseBlockReferences: false` —— **必须关**，否则公式里的上标 `φ^m`、`S_o^n` 会被当成块引用 ID 删掉
- `layout.byPageType.content.exclude: [article-title]` —— 正文页已有自己的 H1，避免标题重复；文件夹页和标签页仍保留标题
- `crawl-links.markdownLinkResolution: shortest` —— 笔记里的 `[[双链]]` 全是裸文件名，只能按最短路径解析

## 对 Quartz 打的两个小补丁

1. **`scripts/patch-quartz.mjs`**（`npm install` / `npm ci` 后由 `postinstall` 自动执行，CI 里也单独跑一次）
   Quartz 的 explorer 插件打开笔记时会对当前文件调用 `scrollIntoView({behavior:"smooth"})`，
   缺少 `block:"nearest"`，导致**整个页面被向下滚 277px**，标题和面包屑直接顶出屏幕。
   补丁把它改成最小滚动。上游修好之后这个脚本会自动跳过，可安全删除。

2. **`quartz/styles/custom.scss`**
   图谱缩放后节点标签会溢出 250px 的侧边面板，加 `overflow: hidden` 裁掉；
   另外让正文宽表格在窄屏上横向滚动，避免撑破版面（长表在手机上本来是痛点）。

## 换成自己的域名

1. 改 `quartz.config.yaml` 里的 `baseUrl`；
2. 仓库 Settings → Pages → Custom domain 填域名；
3. DNS 加 CNAME 记录指向 `<用户名>.github.io`。

## 内容与许可

- 笔记内容整理自课程题库与公开教材（含《岩石物理学基础》，刘向君等编著），**仅供学习交流**，不代表课程标准答案。
- 站点引擎 Quartz 采用 MIT 许可，见 `LICENSE.txt`。
