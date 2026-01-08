---
description: 部署遊戲到 GitHub Pages
---

# 部署到 GitHub Pages

本工作流程說明如何將遊戲部署到 GitHub Pages，讓所有人都能透過網址遊玩。

## 前置條件

- 已完成遊戲開發
- 擁有 GitHub 帳號
- 已建立 GitHub Repository

## 部署步驟

### 1. 確認配置檔案

確保以下檔案已正確設定：

- `vite.config.ts` - 包含 `base: '/fantasy-adventure-rpg/'`
- `.github/workflows/deploy.yml` - GitHub Actions 工作流程
- `.nojekyll` - 防止 Jekyll 處理

### 2. 推送程式碼到 GitHub

// turbo
```bash
git add .
```

```bash
git commit -m "Setup GitHub Pages deployment"
```

```bash
git push origin main
```

### 3. 啟用 GitHub Pages

1. 前往 GitHub Repository
2. 點選 **Settings** → **Pages**
3. Source 選擇 **GitHub Actions**
4. 儲存設定

### 4. 等待部署完成

- 前往 **Actions** 標籤查看進度
- 等待建置與部署完成（約 1-2 分鐘）
- 綠色勾勾表示成功 ✅

### 5. 訪問遊戲

部署完成後，遊戲網址為：

```
https://<你的帳號>.github.io/fantasy-adventure-rpg/
```

## 本地測試

在推送前可先本地測試：

// turbo
```bash
npm run build
```

// turbo
```bash
npm run preview
```

開啟 `http://localhost:4173/fantasy-adventure-rpg/` 驗證。

## 更新遊戲

每次更新遊戲內容後：

```bash
git add .
git commit -m "Update game content"
git push origin main
```

GitHub Actions 會自動重新部署。

## 疑難排解

### 問題：頁面顯示 404

**解決方案**：
- 確認 `vite.config.ts` 的 `base` 路徑正確
- 確認 Repository 名稱與 base 路徑一致

### 問題：資源載入失敗

**解決方案**：
- 檢查 `.nojekyll` 檔案是否存在
- 確認 GitHub Pages 設定為 GitHub Actions

### 問題：Actions 執行失敗

**解決方案**：
- 檢查 `package.json` 依賴是否正確
- 查看 Actions 日誌找出錯誤訊息
- 確認 Node.js 版本相容（建議 20.x）

## 替代部署方案

### Vercel (推薦)

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Cloudflare Pages

1. 連結 GitHub Repository
2. 設定建置指令：`npm run build`
3. 設定輸出目錄：`dist`
