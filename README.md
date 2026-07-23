# へらすノート

スマホで飲酒量を記録し、1日の目標値と比べながら「減らす」を続けるための日本語PWAです。データはブラウザのlocalStorageに保存されるため、再読み込み後も端末内に残ります。

## 主な機能

- 飲酒した日を日付入力で自由に選んで記録
- 「ビール350ml」「ウイスキーロック」「酎ハイ」の数量をタップで増減
- 保存済み記録の編集・削除
- 1日の目標値（純アルコール量g）の設定
- 値を全部削除してから入力し直せる目標値入力欄
- 毎朝、昨日の飲酒量を記録するよう促すリマインダー設定
- タップ時に縮小・色・影で押した感覚が分かるボタン
- PWA対応（manifest / Service Worker）

## 起動方法

```bash
npm install
npm run dev
```

表示されたローカルURLをスマホまたはブラウザで開いてください。同一ネットワーク上のスマホで確認する場合は、開発サーバーのNetwork URLを使用します。

## ビルド確認

```bash
npm run build
```

ビルド成果物は `dist/` に生成されます。生成後にローカルで確認する場合は次を実行します。

```bash
npm run preview
```

## GitHub Pagesへの公開方法

このアプリは依存パッケージなしの静的Webアプリとしてビルドし、生成された `dist/` を公開できます。

1. GitHubの対象リポジトリで **Settings** → **Pages** を開きます。
2. **Build and deployment** のSourceで **GitHub Actions** を選択します。
3. 次のようなワークフローを `.github/workflows/deploy.yml` として追加します。

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

4. `main` ブランチへpushすると、GitHub Actionsが `dist/` をGitHub Pagesへ公開します。
