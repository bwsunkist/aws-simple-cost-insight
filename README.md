# aws-simple-cost-insight
Visualize and compare AWS costs across multiple accounts using exported CSVs.

## 🔒 データプライバシー
**完全ローカル処理**: アップロードしたCSVデータはブラウザ内でのみ処理され、外部に送信されることは一切ありません。

## プロジェクト構成
- **要件・仕様**: [docs/requirements.md](docs/requirements.md)
- **開発ログ**: [docs/development-log.md](docs/development-log.md)
- **タスク進捗**: [docs/task-progress.md](docs/task-progress.md)
- **Issue管理**: [docs/ISSUES.md](docs/ISSUES.md)
- **開発ガイド**: [CLAUDE.md](CLAUDE.md)
- **操作マニュアル**: [USER_MANUAL.md](USER_MANUAL.md)

## 🤖 Claude Code カスタムコマンド
### `/workflow` - 包括的開発ワークフロー実行
機能追加・修正時の標準手順を自動実行：
1. 機能実装完了確認
2. 単体テスト実行・実装
3. ユーザーマニュアル更新
4. Playwright E2E検証
5. Git コミット実行
6. ドキュメント更新（3ファイル必須）
7. ドキュメントコミット
8. 完了報告

**使用方法**: Claude Code で `/workflow` と入力
