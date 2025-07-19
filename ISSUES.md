# Issues管理

## Issue一覧

| ID | タイトル | 重要度 | ステータス | 発見日 | 修正日 |
|----|----------|---------|------------|---------|---------|
| #001 | CSSファイル読み込みエラー | High | Open | 2025-07-19 | - |
| #002 | JavaScriptファイル読み込みエラー | High | Open | 2025-07-19 | - |
| #003 | アカウント追加ボタンが動作しない | Critical | Open | 2025-07-19 | - |

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

#### 修正予定
- Phase 1.4: Chart.js設定（chart-config.js）実装
- app.js実装（イベントハンドリング・UI制御）
- HTTP server経由でのアクセス検証

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

#### 修正予定
- **優先度**: Critical（他の全機能をブロック）
- **実装順序**: Phase 1.4と並行してapp.js実装
- **検証方法**: HTTP server経由でのPlaywright再検証

---

## Issue統計

### ステータス別
- **Open**: 3件
- **In Progress**: 0件
- **Fixed**: 0件
- **Verified**: 0件

### 重要度別
- **Critical**: 1件
- **High**: 2件
- **Medium**: 0件
- **Low**: 0件

### 発見方法別
- **Playwright E2E検証**: 3件
- **Unit Tests**: 0件
- **Manual Testing**: 0件

---

## 修正履歴

*修正完了したIssueはこちらに記録されます*

---

*最終更新: 2025-07-19*