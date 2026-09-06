# 部署到 meauzeek 的 GitHub Pages

准备的仓库名：`engram-atelier`。这是独立仓库，不需要改动 QUALITHM，也不要把本站的离线程序放到整个 `meauzeek.github.io` 站点根目录来替代其他应用。

本交付是部署包，尚未创建仓库、推送文件或启用 Pages。直接代为部署还需要 GitHub 连接授权。不要在聊天中粘贴账号密码或访问令牌。

## 用 GitHub 网页发布

1. 登录自己的 GitHub，创建新仓库 `engram-atelier`。使用公开仓库，可沿用免费 GitHub Pages 方案。若已有同名仓库，不要覆盖已有文件，先核对内容；也可以换个新名字。
2. 解压 `Engram_Atelier_v5.zip`。打开其中的 `engram-atelier` 文件夹，将**文件夹内部的所有文件和子目录**上传至仓库并提交到 `main`。不是上传 ZIP 文件，也不是把整个外层文件夹再套在仓库内部。
3. 确认仓库首页直接看得到 `index.html`、`sw.js`、`manifest.webmanifest`、`styles.css`、`core.js`、`storage.js` 和 `vendor` 目录。
4. 仓库 **Settings → Pages → Build and deployment**，Source 选 **Deploy from a branch**，Branch 选 **main**，目录选 **/(root)**，然后 Save。
5. 等 GitHub Pages 的部署状态显示成功。以 Settings → Pages 提供的正式地址为准。若仓库名就是 `engram-atelier`，通常为：

```text
https://meauzeek.github.io/engram-atelier/
```

上面的地址是发布后的目标地址，交付时并未确认已经上线。Source 和文件路径步骤依据 GitHub 官方配置文档。[1]

解压得到的 `.nojekyll` 是空文件；部分文件管理器可能把它隐藏。纯静态部署建议一并保留。网页上传不了隐藏文件时，可以在仓库用 Add file → Create new file 新建 `.nojekyll`。

单个文件都远小于一般上传限制，源码运行无需安装 npm。`tools/` 用于未来维护，不是首次部署的必经步骤。

## 手机第一次打开

用手机的正常浏览器访问部署成功的 HTTPS 地址，先等首页载入。在“⋯ → 离线 / 安装”查看“离线程序已就绪”，再按浏览器菜单添加到主屏幕。

iPhone：Safari → 分享 → 添加到主屏幕；存在“作为网页 App 打开”时开启它。[2]

不要把 GitHub 的文件预览页当成实际应用页：`github.com/.../blob/...` 展示源码；实际运行用 `meauzeek.github.io/...`。

## 导入你已有的进度

在旧 v4 编辑器中导出 JS 或 JSON。打开新网站，进入“存档 → 导入存档”，选择该文件。以后在相同设备、浏览器、网站路径打开，优先恢复本机项目库，而不是重置模板。

电脑、手机、平板各自保存自己的进度。“备份 / 跨设备转移”生成带图片的 JSON，可以通过系统文件空间、聊天文件或设备分享传到另一端，再导入。当前没有自动云端合并；同一份项目尽量交替编辑，不要同时在两台设备各改一半后期待自动合并。

## 保存与公开范围

网页和仓库中的源码、默认模板、素材会公开。编辑时自动保存的草稿不会被写进 GitHub，也不会被其他访问者读取；他们有自己的本机项目库。不要把私人进度文件主动提交到公开仓库。

本机自动保存、历史快照不等于外部备份。存储许可可在项目库申请，浏览器有权拒绝；清除网站数据仍会删除本机项目。重要版本下载一份 JS/JSON。[3]

## 常见情况

**404：** 检查 Pages 的分支和根目录；仓库根应直接有 `index.html`，不要多套一层 `engram-atelier/`。

**打开的是旧版本：** 应用内“⋯ → 离线 / 安装 → 检查应用更新”。新版本准备完成后点击“保存并更新”。源码修改后需重新运行 `python tools/update_sw.py`，并一起提交新的 `sw.js`。

**第一次断网打不开：** 首次完整在线载入是前提。在离线状态页确认就绪，排除受限的内置浏览器；必须使用 HTTPS 部署地址。

**Logo 不对：** 项目与外观 → 文字标题与自定义 Logo。通用模板选“文字标题”或“上传自己的 Logo”；两套图片分别对应浅色与深色。

**字形和电脑不同：** 系统字体不完全相同。工程不附字库；可以在字体窗口选择自己已有的字体。编辑和保存不依赖外部字体成功加载。

**感觉空图片位占空间：** “⋯ → 显示 / 隐藏空图位”。这是显示开关，不会删除已经上传的插图。

**换域名或仓库名：** 相对路径可适配新地址，但浏览器不会把旧来源数据自动搬过去。更换前导出完整工程，之后再导入。

## 官方资料

[1] `https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site`

[2] `https://support.apple.com/en-gb/guide/iphone/iphea86e5236/ios`

[3] `https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria`
