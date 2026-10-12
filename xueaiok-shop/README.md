# XueAiOK 演示商城

乾淨明亮的遊戲充值／點卡演示站（繁體中文 · HKD）。

## 功能

- 瀏覽商品、加購、結帳確認（前端演示，無真實扣款）
- 用戶名＋密碼註冊／登入（無需電郵驗證）— **僅在 VPS 部署時可用**

## 本機靜態預覽

```bash
python3 -m http.server 8765
```

打開 http://127.0.0.1:8765/

## 後端（VPS）

見 `backend/`：Flask + SQLite + waitress，systemd 服務 `xueaiok-api`，Nginx 反代 `/api/`。

GitHub Pages 只有靜態頁，註冊／登入 API 不可用。
