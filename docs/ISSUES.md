# Issues管理

## Issue一覧

| ID | タイトル | 重要度 | ステータス | 発見日 | 修正日 |
|----|----------|---------|------------|---------|---------|
| #001 | CSSファイル読み込みエラー | High | Open | 2025-07-19 | - |
| #002 | JavaScriptファイル読み込みエラー | High | Fixed | 2025-07-19 | 2025-07-19 |
| #003 | アカウント追加ボタンが動作しない | Critical | Fixed | 2025-07-19 | 2025-07-19 |
| #004 | CSV解析エラー「Invalid or empty data array」 | High | Fixed | 2025-07-19 | 2025-07-19 |
| #005 | データ分析開始機能が動作しない | High | Fixed | 2025-07-19 | 2025-07-19 |
| #006 | Chart.jsでvalue.toFixedエラー | Medium | Open | 2025-07-19 | - |
| #007 | Chart.js構文エラーによるアプリケーション停止 | Critical | Fixed | 2025-07-22 | 2025-07-22 |
| #008 | データ分析でTypeError発生 | High | Fixed | 2025-07-22 | 2025-07-22 |
| #009 | アカウント別削減効果比較の期間選択ドロップダウンが空 | High | Fixed | 2025-07-24 | 2025-07-24 |
| #010 | サービス横断推移分析のチャートheightが非常に小さい | High | Fixed | 2025-07-24 | 2025-07-24 |
| #011 | サービス横断推移分析の自動分析で無限ループ発生 | High | Fixed | 2025-07-25 | 2025-07-25 |

---

## Issue詳細

### #001: CSSファイル読み込みエラー
- **発見日**: 2025-07-19
- **重要度**: High
- **ステータス**: Open
- **発見者**: Playwright E2E検証

#### 症状
- **発生画面**: メインページ（index.html）全体
- **期待動作**: 美しいUI（グラデーションヘッダー、カードレイアウト、ボタンスタイル）が表示される
- **実際動作**: 素のHTMLスタイル（黒文字、左寄せ、デフォルトボタン）で表示
- **具体的なエラー**: 
  ```
  [ERROR] Failed to load resource: net::ERR_FILE_NOT_FOUND @ 
  file:///mnt/c/work/GitHub/aws-simple-cost-insight/css/style.css
  ```

#### 視覚的な問題詳細
- **ヘッダー**: グラデーション背景なし、通常のテキスト表示
- **フォーム**: 枠線なし、間隔が詰まった表示
- **ボタン**: デフォルトのグレーボタン、ホバーエフェクトなし
- **レイアウト**: Grid/Flexboxレイアウトが適用されない

#### 再現手順
1. ターミナルで `file:///mnt/c/work/GitHub/aws-simple-cost-insight/index.html` にアクセス
2. ページ読み込み完了を待つ
3. F12キーでデベロッパーツールを開く
4. Consoleタブでエラーメッセージを確認
5. Elementsタブで`<link rel="stylesheet" href="css/style.css">`のリンクが赤色表示を確認

#### 環境情報
- **ブラウザ**: Playwright (Chromium based)
- **アクセス方法**: file:// プロトコル
- **パス**: `/mnt/c/work/GitHub/aws-simple-cost-insight/index.html`
- **OS**: Linux (WSL2)
- **CSS file存在確認**: `css/style.css` ファイルは存在

#### 影響範囲
- **UI/UX**: 全画面でデザインが崩れ、使いにくい
- **レスポンシブ**: モバイル対応が無効
- **ユーザビリティ**: ボタンの識別が困難
- **印象**: プロフェッショナルでない見た目

#### 技術的原因推測
- file://プロトコルでの相対パス解決問題
- CORS制限による外部ファイル読み込み制限
- パス区切り文字の問題（Windows/Linux）

#### 修正予定
- HTTP server（`python -m http.server 8000`）経由でのアクセス検証
- 相対パス・絶対パスの検証
- ブラウザ別動作確認

---

### #002: JavaScriptファイル読み込みエラー
- **発見日**: 2025-07-19
- **重要度**: High
- **ステータス**: Open
- **発見者**: Playwright E2E検証

#### 症状
- **発生画面**: メインページ（index.html）
- **期待動作**: JavaScriptファイルが読み込まれ、フォームの動的制御が動作
- **実際動作**: JSファイルが読み込まれず、全て静的なHTMLとして表示
- **具体的なエラー**: 
  ```
  [ERROR] Failed to load resource: net::ERR_FILE_NOT_FOUND @ 
  file:///mnt/c/work/GitHub/aws-simple-cost-insight/js/csv-parser.js
  [ERROR] Failed to load resource: net::ERR_FILE_NOT_FOUND @ 
  file:///mnt/c/work/GitHub/aws-simple-cost-insight/js/chart-config.js
  [ERROR] Failed to load resource: net::ERR_FILE_NOT_FOUND @ 
  file:///mnt/c/work/GitHub/aws-simple-cost-insight/js/app.js
  ```

#### 動作しない機能詳細
- **ファイル選択**: 選択してもファイル名表示されない
- **ボタン状態制御**: アカウント名入力+ファイル選択してもボタン有効化されない
- **イベントハンドリング**: クリック・入力イベントが反応しない
- **データ処理**: CSV解析・変換処理が動作しない

#### 再現手順
1. `file:///mnt/c/work/GitHub/aws-simple-cost-insight/index.html` にアクセス
2. F12キーでデベロッパーツールを開く
3. Consoleタブで3つのJSファイル読み込みエラーを確認
4. アカウント名「test」を入力
5. ファイル選択ボタンをクリック（反応なし）
6. ファイル選択後もボタンが無効状態のまま確認

#### 環境情報
- **ブラウザ**: Playwright (Chromium based)
- **アクセス方法**: file:// プロトコル
- **パス**: `/mnt/c/work/GitHub/aws-simple-cost-insight/index.html`
- **OS**: Linux (WSL2)
- **JSファイル存在確認**: 
  - `js/csv-parser.js` ✅ 存在
  - `js/chart-config.js` ❌ 未実装
  - `js/app.js` ❌ 未実装

#### 影響範囲
- **Core機能**: アプリケーションの主要機能が完全に無効
- **ユーザーフロー**: アカウント登録→分析のフロー全体が利用不可
- **データ処理**: CSV読み込み・解析・可視化が動作不可
- **UI**: 動的なフィードバック・状態変更が無効

#### 根本原因
1. **app.js未実装**: メインのイベントハンドリングロジック未実装
2. **chart-config.js未実装**: Chart.js設定未実装
3. **file://プロトコル制限**: ローカルファイル読み込み制限

#### 修正完了 (2025-07-19)
- ✅ chart-config.js実装完了
- ✅ app.js実装完了（イベントハンドリング・UI制御）
- ✅ JavaScript動作確認（file://プロトコルでも動作）

#### 修正内容
- Chart.js設定とデータ変換関数実装
- 完全なイベント処理・UI状態制御実装
- ファイル選択・ボタン有効化の正常動作確認

---

### #003: アカウント追加ボタンが動作しない
- **発見日**: 2025-07-19
- **重要度**: Critical
- **ステータス**: Open
- **発見者**: Playwright E2E検証

#### 症状
- **発生画面**: アカウント登録フォーム
- **期待動作**: アカウント名入力＋ファイル選択完了後、「アカウントを追加」ボタンが青色で有効化
- **実際動作**: 必要な入力完了後もボタンがグレーアウト（disabled）状態で押せない
- **エラーメッセージ**: コンソールエラーなし（JSファイル未読み込みのため）

#### 詳細な動作確認
- **アカウント名入力**: テキストボックスに「dev」入力→正常
- **ファイル選択**: 
  - ファイル選択ダイアログ表示→正常
  - テストCSVファイル選択→正常
  - ファイル名表示→❌ 表示されない
- **ボタン状態**: 
  - 初期状態: `disabled` ✅ 正常
  - 入力後: `disabled` のまま ❌ 本来は有効化されるべき

#### 期待される動作フロー
1. アカウント名入力 → リアルタイムでバリデーション
2. ファイル選択 → 選択ファイル名を表示
3. 両方完了 → ボタンが有効化（色変更・クリック可能）
4. ボタンクリック → CSV解析開始・アカウント追加処理

#### 再現手順
1. Playwright で `index.html` にアクセス
2. アカウント名フィールドに「dev」を入力
3. 「📁 ファイル選択」をクリック
4. ファイル選択ダイアログで `tests/fixtures/multi-account/dev/costs.csv` を選択
5. 選択完了後、ボタン状態を確認
6. ボタンクリックを試行（無反応確認）

#### 環境情報
- **ブラウザ**: Playwright (Chromium based)
- **アクセス方法**: file:// プロトコル
- **入力データ**: 
  - アカウント名: 「dev」（4文字、有効）
  - CSVファイル: 正常な形式のテストデータ
- **HTML要素確認**: 
  - `<input id="accountName">` に値あり
  - `<input id="csvFileInput" type="file">` にファイル選択済み
  - `<button id="addAccountBtn" disabled>` が disabled のまま

#### 影響範囲
- **機能**: アプリケーションの入り口が完全にブロック
- **ユーザー体験**: フラストレーション（操作しても何も起こらない）
- **テスト**: E2Eテストの継続実行が不可能
- **開発**: 後続機能の検証ができない

#### 根本原因分析
1. **app.js未実装**: フォーム制御ロジックが存在しない
2. **イベントリスナー未設定**: 入力変更を監視する仕組みがない
3. **状態管理未実装**: ボタン有効化条件の判定ロジックがない
4. **file://制限**: JSファイル読み込み制限による根本的な問題

#### 必要な実装項目
1. **app.js作成**: メインのアプリケーションロジック
2. **イベントハンドリング**: input/change/clickイベント設定
3. **バリデーション**: アカウント名・ファイル選択の妥当性確認
4. **UI状態制御**: ボタン有効化・ファイル名表示・メッセージ表示

#### 修正完了 (2025-07-19)
- ✅ app.js実装によりイベントハンドリング機能追加
- ✅ リアルタイムフォームバリデーション実装
- ✅ ボタン状態制御の正常動作確認
- ✅ ファイル選択時の状態表示機能実装

#### 修正内容
- イベントリスナー設定（input/change/clickイベント）
- フォームバリデーション（アカウント名・ファイル必須・重複チェック）
- UI状態制御（ボタン有効化・ファイル名表示）
- エラーハンドリングとメッセージ表示

#### Playwright検証結果
- アカウント名入力：✅ 正常動作
- ファイル選択：✅ ファイル名・サイズ表示
- ボタン有効化：✅ 条件満たすと自動有効化
- クリック処理：✅ イベント正常実行

---

### #004: CSV解析エラー「Invalid or empty data array」
- **発見日**: 2025-07-19
- **重要度**: High
- **ステータス**: Fixed
- **発見者**: Playwright E2E検証

#### 症状
- **発生画面**: アカウント追加処理（「アカウントを追加」ボタンクリック後）
- **期待動作**: CSVファイルが正常に解析され、アカウントが登録される
- **実際動作**: CSV解析処理でエラーが発生し、アカウント登録が失敗
- **エラーメッセージ**: 
  ```
  Error adding account: Error: Invalid or empty data array
  at transformCostData (file:///mnt/c/work/GitHub/aws-simple-cost-insight/js/csv-parser.js)
  ```

#### 詳細な動作確認
- **ファイル選択**: ✅ 正常（costs.csv、463 Bytes）
- **CSV読み込み**: ❓ readCSVFile関数の結果不明
- **データ変換**: ❌ transformCostData関数でエラー
- **UI反応**: ✅ エラーメッセージ表示は正常

#### 再現手順
1. file:///mnt/c/work/GitHub/aws-simple-cost-insight/index.html にアクセス
2. アカウント名に「test-account」を入力
3. CSVファイル（tests/fixtures/multi-account/dev/costs.csv）を選択
4. 「アカウントを追加」ボタンをクリック
5. コンソールでエラー確認
6. 画面にエラーメッセージ表示確認

#### 環境情報
- **ブラウザ**: Playwright (Chromium based)
- **ファイル**: tests/fixtures/multi-account/dev/costs.csv（463 Bytes）
- **アクセス方法**: file:// プロトコル
- **関数**: transformCostData関数で例外発生

#### 影響範囲
- **アカウント登録**: 全てのCSVファイルで登録処理が失敗
- **データ処理**: CSV解析・変換処理の根本的な問題
- **ユーザーフロー**: アカウント登録→分析の基本フローが停止

#### 考えられる原因
1. **CSV形式問題**: テストファイルの形式が期待と異なる
2. **文字エンコーディング**: ファイル読み込み時の文字化け
3. **parseCSVString結果**: 空配列が返されている
4. **file://制限**: ローカルファイル読み込み制限

#### 修正完了 (2025-07-19)
- ✅ app.js:168-170行目の修正：`parseCSVString`関数呼び出し追加
- ✅ CSV読み込み→解析→変換の正常なフロー確立
- ✅ アカウント登録の正常動作確認（test-account登録成功）

#### 修正内容
- **根本原因**: `readCSVFile`が返す文字列を直接`transformCostData`に渡していた
- **修正内容**: CSV文字列の解析ステップ（`parseCSVString`）を追加
- **検証結果**: 
  - CSVファイル読み込み: ✅ 正常（463 Bytes）
  - CSV解析: ✅ 正常（8行データ）
  - データ変換: ✅ 正常（6ヶ月、$0.2691総コスト）
  - アカウント登録: ✅ 正常（UI表示・メッセージ確認）

#### Playwright検証結果
- アカウント名入力：✅ 正常動作
- ファイル選択：✅ costs.csv (463 Bytes)表示
- ボタンクリック：✅ アカウント追加成功
- 登録結果表示：✅ 「test-account • costs.csv • 6ヶ月 • $0.2691」

---

### #005: データ分析開始機能が動作しない
- **発見日**: 2025-07-19
- **重要度**: High
- **ステータス**: Fixed
- **発見者**: Playwright E2E検証

#### 症状
- **発生画面**: 登録済みアカウント管理セクション
- **期待動作**: 「データ分析開始」ボタンをクリックすると、月次コスト推移グラフなどの分析結果が表示される
- **実際動作**: ボタンクリック後「データ分析が完了しました」メッセージは表示されるが、チャートセクションや分析結果が表示されない
- **エラーメッセージ**: コンソールエラーなし

#### 詳細な動作確認
- **ボタンクリック**: ✅ 正常（「データ分析開始」ボタン応答）
- **成功メッセージ**: ✅ 正常（「データ分析が完了しました」表示）
- **チャートセクション表示**: ❌ 表示されない
- **分析結果セクション表示**: ❌ 表示されない

#### 再現手順
1. file:///mnt/c/work/GitHub/aws-simple-cost-insight/index.html にアクセス
2. 登録済みアカウント（test-account）が存在することを確認
3. 「データ分析開始」ボタンをクリック
4. 成功メッセージ表示後、ページを下にスクロール
5. チャート・分析セクションの非表示を確認

#### 環境情報
- **ブラウザ**: Playwright (Chromium based)
- **アカウントデータ**: test-account（6ヶ月、$0.2691）
- **アクセス方法**: file:// プロトコル
- **関数**: startDataAnalysis、aggregateAccountsData等

#### 影響範囲
- **Phase 2機能**: 月次コスト推移グラフ表示が完全に無効
- **分析機能**: サービス別比較・構成比等の全分析機能が利用不可
- **ユーザーフロー**: アカウント登録後の主要機能が使用不可

#### 考えられる原因
1. **aggregateAccountsData未実装**: データ集約処理の不備
2. **チャートセクションDOM**: HTMLに分析セクションが存在しない
3. **CSS表示制御**: display:noneの制御ロジック問題
4. **Chart.js初期化**: Chart描画処理の失敗

#### 修正完了 (2025-07-19)
- ✅ handleAnalyzeData関数のデバッグログ追加
- ✅ 既存のaggregateMultiAccountData関数動作確認
- ✅ データ分析機能の正常動作確認（表示・チャート生成）

#### 修正内容
- **根本原因**: 機能は実装済みだったが、sessionStorageから古いデータが読み込まれ、動作確認が困難だった
- **修正内容**: デバッグログ追加により動作状況の可視化
- **検証結果**:
  - データ概要表示: ✅ 正常（アカウント数、総コスト、期間、前月比表示）
  - 月次コスト推移チャート: ✅ 正常（線グラフ表示）
  - サービス別コスト比較: ✅ 正常（棒グラフ表示）
  - サービス別構成比: ✅ 正常（円グラフ表示）
  - 前月比増減率テーブル: ✅ 正常（test-account -10.39%表示）
  - 分析結果: ✅ 正常（未使用・高コストサービス表示）

#### Phase 2.1 完了確認
- 月次コスト推移グラフ機能: ✅ 完全実装・動作確認済み
- アカウント別推移データ処理: ✅ 正常動作
- 全体合計推移データ処理: ✅ 正常動作  
- 線グラフ描画実装: ✅ Chart.js Line Chart表示
- UI統合・イベント処理: ✅ ユーザー操作対応完了

### #007: Chart.js構文エラーによるアプリケーション停止
- **発見日**: 2025-07-22
- **重要度**: Critical
- **ステータス**: Fixed
- **発見者**: ユーザー報告（アカウント追加ボタン動作不能）

#### 症状
- **発生画面**: アプリケーション全体
- **期待動作**: JavaScriptエラーなしでアプリケーション正常初期化
- **実際動作**: JavaScript構文エラーによりアプリケーション完全停止
- **具体的なエラー**: `Unexpected end of input` → `initializeChartDefaults is not defined`

#### 詳細なエラー情報
```
/mnt/c/work/GitHub/aws-simple-cost-insight/js/chart-config.js:1486
}

SyntaxError: Unexpected end of input
```

#### 再現手順
1. ブラウザで `file:///mnt/.../index.html` にアクセス
2. ブラウザコンソール（F12）を開く
3. JavaScriptエラーメッセージ確認
4. アカウント追加ボタン等の動作確認→全て無効

#### 環境情報
- **ブラウザ**: All browsers (構文エラーのため)
- **問題箇所**: `js/chart-config.js:1331` - 単一アカウントモードセクション
- **エラー種別**: JavaScript構文エラー（閉じ括弧不足）

#### 影響範囲
- **Critical**: アプリケーション完全停止
- **UI機能**: 全ボタン・フォーム・分析機能が無効
- **ユーザー体験**: ツール使用不可能

#### 修正内容 (2025-07-22)
- **根本原因**: アカウント別サービス推移実装時の単一アカウントモードで閉じ括弧不足
- **修正内容**:
```javascript
// 修正前（エラー）
borderDash: service === 'その他' ? [5, 5] : undefined
});
});

// 修正後（正常）
borderDash: service === 'その他' ? [5, 5] : undefined
});
});
}  // ← 不足していた閉じ括弧を追加
```
- **検証**: `node -c chart-config.js` で構文確認完了

#### E2E検証結果
- アプリケーション初期化: ✅ 正常（`AWS Cost Insight Tool initialized`ログ出力）
- JavaScriptエラー: ✅ 完全解消（コンソールエラーなし）
- アカウント追加ボタン: ✅ 動作復旧
- 全UI機能: ✅ 正常動作確認

### #008: データ分析でTypeError発生
- **発見日**: 2025-07-22
- **重要度**: High
- **ステータス**: Fixed
- **発見者**: ユーザー報告（データ分析開始ボタンクリック時）

#### 症状
- **発生画面**: データ分析開始処理
- **期待動作**: 「データ分析開始」ボタンクリック後、全チャート・分析結果が正常表示
- **実際動作**: `TypeError: Cannot convert undefined or null to object` エラーで分析処理失敗
- **具体的なエラー**: `Object.entries()` にnull/undefinedが渡されてエラー

#### 詳細なエラー情報
```
Error analyzing data: TypeError: Cannot convert undefined or null to object
    at Object.entries (<anonymous>)
    at file:///mnt/c/work/GitHub/aws-simple-cost-insight/js/csv-parser.js:236:24
    at Array.forEach (<anonymous>)
    at file:///mnt/c/work/GitHub/aws-simple-cost-insight/js/csv-parser.js:229:22
```

#### 再現手順
1. アカウントを追加（CSVファイルアップロード）
2. 「データ分析開始」ボタンクリック
3. TypeErrorが発生し分析結果が表示されない
4. ブラウザコンソールでエラーメッセージ確認

#### 影響範囲
- **Core機能**: データ分析機能が完全に無効
- **UI**: 分析結果セクション・チャート表示が失敗
- **ユーザー体験**: 主要機能が使用不可能

#### 修正内容 (2025-07-22)
- **根本原因**: 
  - `csv-parser.js:236` - `monthRecord.services`がnull時のObject.entries()エラー
  - `app.js` - `aggregatedData.serviceAggregation`未チェック
- **修正内容**:
  - `csv-parser.js`: `monthRecord.services`のnullチェック追加
  - `app.js`: `displayAnalysisResults()`でnullチェック強化
  - `app.js`: `updateLowUsageServicesDisplay()`でnullチェック追加
- **検証結果**: データ分析機能完全復旧・全チャート正常表示

#### E2E検証結果
- データ分析開始: ✅ エラーなし
- 全チャート表示: ✅ 正常（月次推移・サービス比較・構成比等）
- 分析結果表示: ✅ 正常（未使用・高コスト・削減効果等）
- コンソールエラー: ✅ 完全解消

---

## Issue統計

### ステータス別
- **Open**: 1件
- **In Progress**: 0件
- **Fixed**: 7件
- **Verified**: 0件

### 重要度別
- **Critical**: 0件（1件→Fixed）
- **High**: 7件（6件→Fixed, 1件Open）
- **Medium**: 0件
- **Low**: 0件

### 発見方法別
- **Playwright E2E検証**: 5件
- **ユーザーフィードバック**: 3件
- **Unit Tests**: 0件
- **Manual Testing**: 0件

---

## 修正履歴

### 2025-07-19 Phase 1.4実装による修正
#### Issue #002: JavaScriptファイル読み込みエラー → Fixed
- **修正内容**: chart-config.js, app.js実装完了
- **検証結果**: JavaScript正常動作確認（「AWS Cost Insight Tool initialized」ログ出力）
- **影響**: 全ての動的機能が正常動作

#### Issue #003: アカウント追加ボタンが動作しない → Fixed  
- **修正内容**: app.jsでイベントハンドリング・UI制御実装
- **検証結果**: 
  - アカウント名入力→正常
  - ファイル選択→ファイル名表示正常
  - ボタン状態制御→自動有効化正常
  - クリックイベント→正常実行
- **影響**: アカウント登録フローの基本動作が正常化

#### Issue #004: CSV解析エラー「Invalid or empty data array」→ Fixed
- **修正内容**: app.js:168-170行目でparseCSVString関数呼び出し追加
- **検証結果**:
  - CSV読み込み→解析→変換の正常フロー確立
  - アカウント登録成功（test-account、$0.2691、6ヶ月データ）
  - エラーメッセージなし、正常なUI表示
- **影響**: アカウント登録機能が完全動作、Phase 1実装完了

---

### 2025-07-23 機能改善: アカウント別削減効果比較の簡素化
#### Issue なし（機能改善）: アカウント別削減効果比較の簡素化・精度向上
- **対応内容**: 期間選択UIの簡素化（複雑な期間範囲→月単位選択）
- **品質向上**: 
  - 負の値表示対応（formatCurrency関数拡張）
  - エラーハンドリング強化（バリデーション・nullチェック）
  - デフォルト動作改善（前月比較自動設定）
- **E2E検証結果**: 全機能正常動作・新機能検証完了
- **コミット**: 8c26031 - "Simplify account reduction effect comparison to single month selection"
- **影響**: ユーザビリティ向上、操作性改善、レイアウト統一

*最終更新: 2025-07-23*

### #009: アカウント別削減効果比較の期間選択ドロップダウンが空

#### 基本情報
- **発見日**: 2025-07-24
- **重要度**: High
- **ステータス**: Fixed
- **修正日**: 2025-07-24

#### 症状詳細
**期待動作**: アカウント別削減効果比較の「ベース月」「対象月」ドロップダウンに利用可能な期間（2025-01～2025-06）が表示される
**実際動作**: ドロップダウンが空で、期間選択が不可能

#### 再現手順
1. アカウントデータを登録して「データ分析開始」を実行
2. 「アカウント別削減効果比較」セクションまでスクロール  
3. 「ベース月」または「対象月」ドロップダウンをクリック
4. 選択肢が何も表示されない（空）

#### 環境情報
- **ブラウザ**: Playwright (Chromium)
- **アクセス方法**: file:// プロトコル
- **登録データ**: 6ヶ月分のテストデータ（2025-01～2025-06）
- **HTML要素確認**: 
  - `<select id="baseMonth">` が空
  - `<select id="targetMonth">` が空

#### 影響範囲
- **機能**: アカウント別削減効果比較が完全に利用不可能
- **ユーザー体験**: 期間比較機能への期待に応えられない
- **テスト**: E2E検証で削減効果比較の動作確認ができない

#### 根本原因分析
**根本原因**: `initializePeriodSelectors()`関数が分析開始時に実行されていない
1. **既存関数**: `initializePeriodSelectors()`は実装済みだが呼び出されていない
2. **呼び出し箇所**: カスタム期間選択時のみ実行される設計
3. **初期化不足**: `displayAnalysisResults()`で期間選択初期化が実行されない

#### 修正内容
**修正ファイル**: `js/app.js:494行`
**修正内容**: `displayAnalysisResults()`関数に`initializePeriodSelectors()`呼び出し追加

```javascript
function displayAnalysisResults() {
    if (!aggregatedData || !aggregatedData.serviceAggregation) return;
    
    // Initialize period selectors for account reduction comparison
    initializePeriodSelectors();
    
    // 既存処理...
}
```

#### 修正効果確認
- **期間選択復旧**: ドロップダウンに全期間（2025-01～2025-06）が正常表示
- **デフォルト値**: 前月（05月）・最新月（06月）が自動選択
- **比較実行**: 期間変更・比較実行が正常動作（例：01月→06月で-25.9%削減）
- **テーブル更新**: 結果テーブルのヘッダーも適切に期間表示

#### 検証方法
- **Playwright E2E**: 期間選択・変更・比較実行の全フロー確認
- **複数期間テスト**: 異なる期間組み合わせでの動作確認
- **UI確認**: ドロップダウン表示・デフォルト値・結果表示の検証

*最終更新: 2025-07-24*

### #010: サービス横断推移分析のチャートheightが非常に小さい

#### 基本情報
- **発見日**: 2025-07-24
- **重要度**: High
- **ステータス**: Fixed
- **修正日**: 2025-07-24
- **発見者**: ユーザーフィードバック

#### 症状詳細
**期待動作**: サービス横断推移分析のチャートが適切なサイズ（他のチャートと同様の高さ）で表示される
**実際動作**: チャートのheightが非常に小さく表示され、グラフの内容が見づらい

#### 再現手順
1. アカウントデータを登録して「データ分析開始」を実行
2. 「サービス横断推移分析」セクションまでスクロール
3. サービス（例：S3）を選択
4. 「分析実行」ボタンをクリック
5. 表示されるチャートのheightが非常に小さいことを確認

#### 環境情報
- **機能**: サービス横断推移分析（Service Cross-Analysis）
- **対象チャート**: serviceCrossAnalysisChart
- **Chart.js設定**: createServiceCrossAnalysisChartConfig関数
- **HTML要素**: `<div id="serviceCrossAnalysisChart" class="chart-container">`

#### 根本原因
サービス横断推移分析チャートは `.analysis-card` コンテナ内にあり、通常の `.chart-container` と異なるCSS設定のため、適切な高さが設定されていなかった。

#### 修正内容
**修正ファイル**: `css/style.css`
**修正内容**: 分析カード内のチャートコンテナに適切な高さとスタイルを追加

```css
/* Chart containers inside analysis cards */
.analysis-card .chart-container {
    height: 450px;
    min-height: 450px;
    background: white;
    padding: 1.5rem;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
```

#### 修正結果・効果
- **修正前**: 150px height（非常に小さい）
- **修正後**: 400px height（適切なサイズ）
- **改善効果**: 167%の高さ増加（150px → 400px）
- **他チャートとの差**: 46px差（月次推移チャート446px）で許容範囲内
- **視認性**: 大幅向上で分析結果が見やすくなった

#### 検証完了
- **Playwright E2E検証**: サービス選択・チャート表示・高さ測定完了
- **複数サービステスト**: S3以外のサービスでも正常な高さを確認
- **他チャート比較**: 月次コスト推移チャート（446px）との比較で適切な高さを確認

*修正完了: 2025-07-24*

### #011: サービス横断推移分析の自動分析で無限ループ発生

#### 基本情報
- **発見日**: 2025-07-25
- **重要度**: High
- **ステータス**: Fixed
- **修正日**: 2025-07-25
- **発見者**: ユーザーフィードバック

#### 症状詳細
**期待動作**: サービス選択時に自動分析が1回実行され、結果が表示される
**実際動作**: サービス選択後に無限ループが発生し、ブラウザがフリーズする
**コンソール症状**: `console.log('Analyzing service:', selectedService);` が連続で大量出力される

#### 再現手順
1. アカウントデータを登録して「データ分析開始」を実行
2. 「サービス横断推移分析」セクションまでスクロール
3. サービス（例：EC2）をドロップダウンから選択
4. 自動分析が開始される
5. ブラウザコンソールで `console.log('Analyzing service:')` が連続表示
6. ブラウザがフリーズして操作不能になる

#### 環境情報
- **機能**: サービス横断推移分析の自動分析機能
- **対象関数**: `validateServiceSelection()`, `handleServiceCrossAnalysis()`
- **発生条件**: UX改善実装後（分析ボタン削除、自動分析導入）
- **影響範囲**: サービス選択機能全体

#### 根本原因分析
**無限ループの流れ**:
1. `validateServiceSelection()` → `handleServiceCrossAnalysis()`を呼び出し
2. `handleServiceCrossAnalysis()`のfinallyブロック → `validateServiceSelection()`を再度呼び出し
3. 1に戻って無限ループ継続

**問題箇所**: `js/app.js:1710行目`
```javascript
} finally {
    // Reset button state
    elements.executeServiceAnalysis.disabled = false;
    elements.executeServiceAnalysis.textContent = '分析実行';
    validateServiceSelection(); // ← この行が無限ループの原因
}
```

#### 修正内容
**修正ファイル**: `js/app.js:1710行目`
**修正内容**: `finally`ブロックから再帰的な`validateServiceSelection()`呼び出しを削除

```javascript
// 修正前（無限ループ）
} finally {
    elements.executeServiceAnalysis.disabled = false;
    elements.executeServiceAnalysis.textContent = '分析実行';
    validateServiceSelection(); // ← 削除
}

// 修正後（正常動作）
} finally {
    elements.executeServiceAnalysis.disabled = false;
    elements.executeServiceAnalysis.textContent = '分析実行';
}
```

#### 修正効果・検証結果
- **無限ループ解消**: サービス選択時の分析が1回のみ実行
- **コンソール正常化**: `console.log('Analyzing service:')` が1回のみ出力
- **ブラウザ安定性**: フリーズ現象完全解消
- **機能動作**: 自動分析機能は正常に動作継続

#### 技術的学習・予防策
- **自動実行関数**: 再帰呼び出しを避ける設計の重要性
- **UX改善時**: 既存の処理フローへの影響を慎重に確認
- **エラーハンドリング**: `finally`ブロックでの不要な再実行を避ける
- **デバッグ**: 無限ループはコンソールログで早期発見可能

*修正完了: 2025-07-25*