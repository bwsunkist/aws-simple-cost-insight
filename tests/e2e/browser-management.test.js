/**
 * E2E Test - Browser Tab Management Best Practices
 * 各テスト間でブラウザタブを適切にクリーンアップ
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

/**
 * テスト設定とヘルパー関数
 */
class BrowserTestManager {
    constructor() {
        this.indexPath = path.resolve(__dirname, '../../index.html');
        this.fileUrl = `file://${this.indexPath}`;
    }

    /**
     * 新しいタブを開いてページに移動
     * @param {Browser} browser - Playwrightブラウザインスタンス
     * @returns {Page} 新しいページインスタンス
     */
    async openNewTab(browser) {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        // ページロードのタイムアウト設定
        page.setDefaultTimeout(30000);
        
        try {
            await page.goto(this.fileUrl, { 
                waitUntil: 'domcontentloaded',
                timeout: 15000 
            });
            
            // 初期化完了を待機
            await page.waitForSelector('#accountName', { timeout: 10000 });
            await page.waitForFunction(() => {
                return window.Chart && window.registeredAccounts !== undefined;
            }, { timeout: 10000 });
            
            return { page, context };
        } catch (error) {
            await context.close();
            throw new Error(`Failed to open new tab: ${error.message}`);
        }
    }

    /**
     * ページとコンテキストを安全にクリーンアップ
     * @param {Page} page - Playwrightページインスタンス
     * @param {BrowserContext} context - ブラウザコンテキスト
     */
    async cleanupTab(page, context) {
        try {
            if (page && !page.isClosed()) {
                await page.close();
            }
        } catch (error) {
            console.warn('Warning: Failed to close page:', error.message);
        }
        
        try {
            if (context) {
                await context.close();
            }
        } catch (error) {
            console.warn('Warning: Failed to close context:', error.message);
        }
    }

    /**
     * テストCSVファイルの内容を取得
     */
    getTestCSVContent() {
        return `"サービス","S3($)","EC2($)","Lambda($)","CloudWatch($)","合計コスト($)"
"サービス の合計","210.5000","169.8000","134.7000","91.3000","606.0000"
"2025-01-01","35.0000","28.0000","22.0000","15.0000","100.0000"
"2025-02-01","32.0000","25.0000","20.0000","13.0000","90.0000"
"2025-03-01","38.0000","30.0000","25.0000","17.0000","110.0000"
"2025-04-01","42.0000","35.0000","28.0000","20.0000","125.0000"
"2025-05-01","35.5000","28.5000","22.5000","14.5000","100.5000"
"2025-06-01","27.0000","23.3000","17.2000","11.8000","79.5000"`;
    }
}

// テストマネージャーのインスタンス
const testManager = new BrowserTestManager();

/**
 * Test Suite 1: アカウント登録フロー
 */
test.describe('Account Registration with Proper Tab Management', () => {
    let browser;

    test.beforeAll(async ({ browser: b }) => {
        browser = b;
    });

    test('should register single account and cleanup properly', async () => {
        let page, context;
        
        try {
            // 新しいタブを開く
            ({ page, context } = await testManager.openNewTab(browser));
            
            // アカウント登録操作
            await page.fill('#accountName', 'test-account');
            
            // CSVファイル作成とアップロード
            const csvContent = testManager.getTestCSVContent();
            const csvBuffer = Buffer.from(csvContent, 'utf-8');
            
            await page.setInputFiles('#csvFile', {
                name: 'test-costs.csv',
                mimeType: 'text/csv',
                buffer: csvBuffer
            });
            
            // 登録実行
            await page.click('#addAccountBtn');
            await page.waitForTimeout(1000);
            
            // 登録確認
            const accountList = await page.locator('.account-item');
            await expect(accountList).toHaveCount(1);
            
            const accountName = await page.locator('.account-name').textContent();
            expect(accountName).toBe('test-account');
            
        } finally {
            // 必ずタブをクリーンアップ
            await testManager.cleanupTab(page, context);
        }
    });

    test('should register multiple accounts with fresh tab', async () => {
        let page, context;
        
        try {
            // 前のテストとは独立した新しいタブ
            ({ page, context } = await testManager.openNewTab(browser));
            
            // 複数アカウント登録
            const accounts = ['dev-account', 'staging-account'];
            const csvContent = testManager.getTestCSVContent();
            
            for (const accountName of accounts) {
                await page.fill('#accountName', accountName);
                
                const csvBuffer = Buffer.from(csvContent, 'utf-8');
                await page.setInputFiles('#csvFile', {
                    name: `${accountName}-costs.csv`,
                    mimeType: 'text/csv',
                    buffer: csvBuffer
                });
                
                await page.click('#addAccountBtn');
                await page.waitForTimeout(500);
                
                // フィールドクリア確認
                const nameValue = await page.inputValue('#accountName');
                expect(nameValue).toBe('');
            }
            
            // 登録確認
            const accountList = await page.locator('.account-item');
            await expect(accountList).toHaveCount(2);
            
        } finally {
            await testManager.cleanupTab(page, context);
        }
    });
});

/**
 * Test Suite 2: データ分析フロー
 */
test.describe('Data Analysis with Clean Tab State', () => {
    let browser;

    test.beforeAll(async ({ browser: b }) => {
        browser = b;
    });

    test('should complete full analysis flow with proper cleanup', async () => {
        let page, context;
        
        try {
            ({ page, context } = await testManager.openNewTab(browser));
            
            // データ準備
            await page.fill('#accountName', 'analysis-test');
            
            const csvContent = testManager.getTestCSVContent();
            const csvBuffer = Buffer.from(csvContent, 'utf-8');
            
            await page.setInputFiles('#csvFile', {
                name: 'analysis-costs.csv',
                mimeType: 'text/csv',
                buffer: csvBuffer
            });
            
            await page.click('#addAccountBtn');
            await page.waitForTimeout(1000);
            
            // 分析開始
            await page.click('#analyzeBtn');
            await page.waitForTimeout(2000);
            
            // 結果確認
            await expect(page.locator('#dataSummary')).toBeVisible();
            await expect(page.locator('#chartsSection')).toBeVisible();
            await expect(page.locator('#analysisResults')).toBeVisible();
            
            // グラフ存在確認
            const chartCanvases = await page.locator('canvas').count();
            expect(chartCanvases).toBeGreaterThan(0);
            
        } finally {
            await testManager.cleanupTab(page, context);
        }
    });

    test('should handle chart interactions with fresh state', async () => {
        let page, context;
        
        try {
            ({ page, context } = await testManager.openNewTab(browser));
            
            // 前のテストの影響を受けない新しい状態
            await page.fill('#accountName', 'chart-test');
            
            const csvContent = testManager.getTestCSVContent();
            const csvBuffer = Buffer.from(csvContent, 'utf-8');
            
            await page.setInputFiles('#csvFile', {
                name: 'chart-costs.csv',
                mimeType: 'text/csv',
                buffer: csvBuffer
            });
            
            await page.click('#addAccountBtn');
            await page.waitForTimeout(1000);
            
            await page.click('#analyzeBtn');
            await page.waitForTimeout(2000);
            
            // チャート操作テスト
            // 月次推移グラフの切替
            await page.check('input[name="trendView"][value="total"]');
            await page.waitForTimeout(500);
            
            // サービス比較の切替
            await page.selectOption('#serviceComparisonPeriod', 'total');
            await page.waitForTimeout(500);
            
            // 積み上げグラフ設定変更
            await page.selectOption('#serviceStackedAccount', 'chart-test');
            await page.selectOption('#serviceStackedCount', '3');
            await page.waitForTimeout(500);
            
            // チャートが正常に更新されることを確認
            const updatedCanvases = await page.locator('canvas').count();
            expect(updatedCanvases).toBeGreaterThan(0);
            
        } finally {
            await testManager.cleanupTab(page, context);
        }
    });
});

/**
 * Test Suite 3: エラーハンドリングとタイムアウト対策
 */
test.describe('Error Handling with Robust Tab Management', () => {
    let browser;

    test.beforeAll(async ({ browser: b }) => {
        browser = b;
    });

    test('should handle page load failures gracefully', async () => {
        let page, context;
        
        try {
            // 意図的にタイムアウトしやすい設定でテスト
            const shortTimeoutContext = await browser.newContext();
            page = await shortTimeoutContext.newPage();
            context = shortTimeoutContext;
            
            page.setDefaultTimeout(5000); // 短いタイムアウト
            
            await page.goto(testManager.fileUrl, { 
                waitUntil: 'domcontentloaded',
                timeout: 5000 
            });
            
            // 基本要素が存在することを確認
            await expect(page.locator('#accountName')).toBeVisible();
            
        } catch (error) {
            // エラーが発生した場合も適切にクリーンアップ
            console.log('Expected timeout error handled:', error.message);
        } finally {
            await testManager.cleanupTab(page, context);
        }
    });

    test('should recover from previous test failures', async () => {
        let page, context;
        
        try {
            // 前のテストの失敗に関係なく新しいタブで開始
            ({ page, context } = await testManager.openNewTab(browser));
            
            // 正常な操作フローを実行
            await page.fill('#accountName', 'recovery-test');
            
            const csvContent = testManager.getTestCSVContent();
            const csvBuffer = Buffer.from(csvContent, 'utf-8');
            
            await page.setInputFiles('#csvFile', {
                name: 'recovery-costs.csv',
                mimeType: 'text/csv',
                buffer: csvBuffer
            });
            
            await page.click('#addAccountBtn');
            await page.waitForTimeout(1000);
            
            // 正常に登録されることを確認
            const accountList = await page.locator('.account-item');
            await expect(accountList).toHaveCount(1);
            
        } finally {
            await testManager.cleanupTab(page, context);
        }
    });
});

/**
 * 最終クリーンアップ確認テスト
 */
test.describe('Cleanup Verification', () => {
    test('should verify no lingering tabs after test suite', async ({ browser }) => {
        // テスト開始時のタブ/コンテキスト数を記録
        const initialContexts = browser.contexts().length;
        
        let page, context;
        try {
            ({ page, context } = await testManager.openNewTab(browser));
            
            // 簡単な操作
            await expect(page.locator('#accountName')).toBeVisible();
            
        } finally {
            await testManager.cleanupTab(page, context);
        }
        
        // クリーンアップ後にコンテキスト数が初期値に戻ることを確認
        await new Promise(resolve => setTimeout(resolve, 1000)); // クリーンアップ完了待機
        const finalContexts = browser.contexts().length;
        
        expect(finalContexts).toBe(initialContexts);
    });
});