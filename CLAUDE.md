# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要
複数のAWSアカウントのコスト削減取り組みの効果測定と、削減優先度検討のための可視化ツールを開発する。
requirements.mdに要件の詳細を記載している。

## 技術スタック
- **HTML5** - 基本構造とUI
- **Vanilla JavaScript** - CSV読み込み・データ処理・DOM操作
- **Chart.js** - グラフ描画ライブラリ（軽量で高機能）
- **CSS3** - スタイリング

フレームワークは使用せず、シンプルな静的サイトとして構築。CSVファイルの読み込みと可視化に特化した軽量な実装。

## プロジェクト構造
```
├── index.html              # メインページ
├── css/
│   └── style.css          # スタイルシート
├── js/
│   ├── app.js             # メイン処理・UI制御
│   ├── csv-parser.js      # CSV解析・データ変換
│   └── chart-config.js    # Chart.js設定・グラフ生成
├── resources/             # CSVデータ配置
│   ├── dev/costs.csv      # 開発環境コストデータ
│   ├── prod/costs.csv     # 本番環境コストデータ
│   └── staging/costs.csv  # ステージング環境コストデータ
├── requirements.md        # 機能要件定義
└── README.md             # プロジェクト説明
```

## データ構造
- CSVファイルは `resources/{env-name}/costs.csv` 形式で配置
- `{env-name}` 部分がAWSアカウント名として識別される
- 各CSVは同じ基本形式だが、利用サービスに応じて列の増減あり

## 開発ワークフロー
### 開発サーバー起動
```bash
# シンプルなHTTPサーバーを起動（Python 3.x）
python -m http.server 8000

# または Node.js がある場合
npx serve .
```

### ファイル確認
- `index.html` - ブラウザで http://localhost:8000 にアクセス
- CSVファイルは File API で動的読み込み、またはサーバー経由で取得

### デプロイ
静的ファイルのみなので、任意のWebサーバーやGitHub Pagesに配置可能。
