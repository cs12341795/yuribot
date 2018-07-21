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