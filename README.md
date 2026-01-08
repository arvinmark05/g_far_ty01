# Fantasy Adventure RPG

一個使用 React + TypeScript + Vite 開發的文字冒險 RPG 遊戲。

## 線上 Demo

專案已自動部署到 GitHub Pages：[https://YOUR_USERNAME.github.io/fantasy-adventure-rpg/](https://YOUR_USERNAME.github.io/fantasy-adventure-rpg/)

## 本地開發

**前置需求：** Node.js 20+

1. 安裝依賴：`npm install`
2. 啟動開發伺服器：`npm run dev`
3. 在瀏覽器開啟：`http://localhost:3000`

## 建置專案

```bash
npm run build
```

建置完成的檔案會輸出到 `dist` 目錄。

## 自動部署到 GitHub Pages

本專案已設定 GitHub Actions 自動部署流程：

### 初次設定步驟

1. **啟用 GitHub Pages**
   - 前往你的 GitHub 儲存庫
   - 點選 `Settings` > `Pages`
   - 在 `Source` 選擇 `GitHub Actions`

2. **推送程式碼**
   ```bash
   git add .
   git commit -m "Add GitHub Pages deployment"
   git push origin main
   ```

3. **查看部署狀態**
   - 前往 `Actions` 標籤頁
   - 查看 "Deploy to GitHub Pages" workflow 執行狀態
   - 部署成功後，網站會在幾分鐘內上線

### 自動部署觸發條件

- ✅ 每次推送到 `main` 分支時自動部署
- ✅ 可在 Actions 頁面手動觸發部署

### 注意事項

- 確保 `vite.config.ts` 中的 `base` 路徑與你的儲存庫名稱一致
- 如果儲存庫名稱不是 `fantasy-adventure-rpg`，請修改 `vite.config.ts` 中的 base 設定：
  ```typescript
  base: process.env.NODE_ENV === 'production' ? '/你的儲存庫名稱/' : '/',
  ```

## 技術棧

- **框架：** React 19
- **語言：** TypeScript
- **建置工具：** Vite 6
- **UI 圖示：** Lucide React
- **部署：** GitHub Pages + GitHub Actions
