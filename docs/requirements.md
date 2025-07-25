# AWS コスト可視化ツール 要件定義

## 目的
複数のAWSアカウントのコスト分析をシンプルに行える可視化ツール

## データ構造

### データ取得方式
**コストデータ登録ベース**:
- ユーザーがCSVファイルをアップロード
- アカウント名（任意）（dev, prod, staging等）を手動入力
- 複数アカウントを順次登録・蓄積
- ブラウザ内でデータ管理（sessionStorage活用）
- CSVファイル取得方法ガイド提供（対話型）

### 登録フロー
1. アカウント名（任意）入力（任意の文字列）
2. 対応するCSVファイル選択
3. 「アカウントを追加」で登録
4. 複数アカウント登録後「データ分析開始」

### 柔軟性
- アカウント名は固定ではない（dev, prod以外も可）
- CSVファイルはローカルから自由選択
- 登録済みアカウントの表示・削除機能
- 実際の運用環境に合わせた利用が可能

### CSVデータ形式
```csv
"サービス","S3($)","Key Management Service($)","Secrets Manager($)","SNS($)","SQS($)","CloudWatch($)","Tax($)","合計コスト($)"
"サービス の合計","0.0055552","0","0","0","0","0","0","0.0055552"
"2025-01-01","0.0009006","0","0","0","0","0","0","0.0009006"
"2025-02-01","0.0008204","0","0","0","0","0","0","0.0008204"
```

## 機能要件

### 1. 基本可視化機能
- **月次コスト推移グラフ**
  - アカウント別の推移
  - 全アカウント合計の推移
  - 期間選択機能

- **サービス別コスト比較**
  - 棒グラフまたは積み上げグラフ
  - アカウント間比較
  - コストが高いサービスの特定

- **月次サービス別積み上げグラフ**
  - 月次推移でのサービス別コスト内訳表示
  - アカウント個別/全アカウント表示切替
  - コスト上位サービス個別表示（デフォルト5サービス）
  - 表示サービス数設定機能（1-10サービス選択可能）
  - 設定数を超えるサービスは「その他」としてまとめ表示
  - 時系列でのサービス利用パターン分析

### 2. コスト削減効果測定
- **前月比較**
  - 増減率とパーセンテージ表示
  - アカウント別削減効果比較
  - サービス別増減の可視化

### 3. コスト削減優先度検討
- **サービス別コスト構成比**
  - 円グラフで全体に占める割合表示
  - 高コストサービスの特定

- **利用状況分析**
  - 未使用サービス（$0）の一覧
  - 低使用サービス（極小コスト）の特定
  - サービス別成長率/削減率ランキング

### 4. 実用機能
- **期間指定比較**
  - 任意期間での比較機能
  - 3ヶ月前vs現在などの比較

- **エクスポート機能**
  - レポート作成用データ出力
  - グラフの画像エクスポート

## 優先度

### 高優先度
1. 月次コスト推移（アカウント別/全体）
2. サービス別コスト比較
3. 前月比増減率
4. サービス別コスト構成比
5. 月次サービス別積み上げグラフ

### 中優先度
1. 未使用/低使用サービス特定
2. アカウント別削減効果比較
3. 期間指定比較

### 低優先度
1. エクスポート機能
2. 削減目標設定機能（将来的に検討）

## 技術要件
- HTML + JavaScript（Chart.js等）でのSPA
- クライアントサイドでのCSV読み込み・解析
- レスポンシブデザイン対応