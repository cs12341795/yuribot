# Yuribot

## 開發準備

1. 安裝 node.js (https://nodejs.org/en/)
2. 安裝 yarn (https://yarnpkg.com/en/docs/install)
3. 執行 `yarn` 命令下載 node_modules
4. 執行 `npm run dev` 命令在本地 4000 port 開啟 koa server
5. 執行 `npm run test` 命令在本地跑測試 (須先準備好資料庫)

## 準備資料庫

1. 安裝 docker (https://docs.docker.com/install/)
2. 執行 `docker run -d -p 5432:5432 postgres:10-alpine` 在本地建立一個 PostgreSQL
3. 執行 `npm run migrate:pg` 在本地 PostgreSQL 創表

## 必要環境變數

要正式運行至少要設定下面參數：

| 名稱  | 說明 |
| ------------- | ------------- |
| DISCORD_BOT_TOKEN | 需先註冊DiscordApp取得，用於發文  |
| DISCORD_CLIENT_ID  | 需先註冊DiscordApp取得，用於驗證身分  |
| DISCORD_CLIENT_SECRET  | 需先註冊DiscordApp取得，用於驗證身分  |
| DISCORD_OAUTH_REDIRECT | 需先在DiscordApp設定位置才能使用  |
| DISCORD_GUILD_ID | 設定 Discord 群組的 ID  |

## docker-compose

設定完上面的環境變數後，也可以使用 docker 運行

1. 安裝 docker-compose
2. 執行 `docker-compose up -d db`
3. 執行 `docker-compose up -d app`
