<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/18eXXa6b156FNJZ21oyUWYOyzyTVMzWkb

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Web (e.g. GitHub Pages)

1. 确保在项目根目录创建 `.env.local`，并设置有效的 **GEMINI_API_KEY**（与本地运行相同）。
2. 执行 **`npm run build`**。构建时会把该 key 打入前端资源；若未设置或 key 无效，线上会出现「召唤失败」或 400 API key invalid。
3. 将 **`dist/`** 目录下的全部内容上传到你的静态站点对应路径（如 `beast/` 文件夹）。
4. 若在 Google Cloud 控制台对 API Key 做了「HTTP 引荐来源」限制，请把部署后的网页域名加入允许列表（如 `https://你的用户名.github.io/*`）。
