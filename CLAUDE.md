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

## Git コミットルール
### コミット単位の基準
- **機能単位**: 1つの機能追加・修正は1コミットにまとめる
- **ファイル種別**: HTML、CSS、JSなど異なる種類の変更でも関連する機能なら同一コミット
- **ドキュメント**: 機能に関連するドキュメント更新は機能コミットに含める
- **設定ファイル**: プロジェクト設定の変更は独立したコミット

### コミットメッセージ形式
```
動詞 + 対象 + 簡潔な説明

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 例
- `Add CSV parser and data visualization components`
- `Fix chart rendering issue for empty data`
- `Update project documentation and development guide`
- `Refactor data processing for better performance`

### プッシュタイミング
- 機能が完成してテストが通った段階で速やかにプッシュ
- 複数の小さな関連コミットは一度にプッシュしても可

## 開発ログ管理
### development-log.md 運用ルール
- **継続更新**: 主要な開発活動・技術的決定を随時記録
- **記録タイミング**: 
  - 新機能実装完了時
  - 重要な技術的決定時
  - 問題解決・バグ修正時
  - プロジェクト構成変更時
- **記録内容**:
  - 日付・概要
  - 実施内容（詳細な作業項目）
  - 技術的決定事項と理由
  - 作成・更新したファイル
  - Git操作履歴（コミットハッシュ）
- **フォーマット**: 日付ごとのセクション形式で時系列記録
