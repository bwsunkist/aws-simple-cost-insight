/**
 * Main Application Logic
 * Event handling, UI control, and data management
 */

// Global state management
let registeredAccounts = [];
let aggregatedData = null;
let chartInstances = {};

// DOM elements (cached for performance)
let elements = {};

/**
 * Initialize application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeApplication();
});

/**
 * Initialize the application
 */
function initializeApplication() {
    // Cache DOM elements
    cacheElements();
    
    // Initialize Chart.js
    initializeChartDefaults();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load any existing data from sessionStorage
    loadStoredData();
    
    // Update UI state
    updateUIState();
    
    console.log('AWS Cost Insight Tool initialized');
}

/**
 * Cache frequently used DOM elements
 */
function cacheElements() {
    elements = {
        // Account registration form
        accountNameInput: document.getElementById('accountName'),
        csvFileInput: document.getElementById('csvFileInput'),
        selectedFileDiv: document.getElementById('selectedFile'),
        addAccountBtn: document.getElementById('addAccountBtn'),
        
        // Account management
        accountsList: document.getElementById('accountsList'),
        clearAllBtn: document.getElementById('clearAllBtn'),
        analyzeBtn: document.getElementById('analyzeBtn'),
        
        // Data summary
        dataSummary: document.getElementById('dataSummary'),
        accountCount: document.getElementById('accountCount'),
        totalCost: document.getElementById('totalCost'),
        datePeriod: document.getElementById('datePeriod'),
        monthlyChange: document.getElementById('monthlyChange'),
        
        // Charts section
        chartsSection: document.getElementById('chartsSection'),
        monthlyTrendChart: document.getElementById('monthlyTrendChart'),
        serviceComparisonChart: document.getElementById('serviceComparisonChart'),
        
        // Analysis section
        analysisSection: document.getElementById('analysisSection'),
        costVariationServices: document.getElementById('costVariationServices'),
        costVariationThreshold: document.getElementById('costVariationThreshold'),
        lowUsageServices: document.getElementById('lowUsageServices'),
        lowUsageThreshold: document.getElementById('lowUsageThreshold'),
        highCostServices: document.getElementById('highCostServices'),
        
        // Service cross-analysis
        serviceSelect: document.getElementById('serviceSelect'),
        executeServiceAnalysis: document.getElementById('executeServiceAnalysis'),
        serviceCrossAnalysisChart: document.getElementById('serviceCrossAnalysisChart'),
        serviceCrossAnalysisResults: document.getElementById('serviceCrossAnalysisResults'),
        
        // Chart controls
        serviceComparisonPeriod: document.getElementById('serviceComparisonPeriod'),
        stackedAccount: document.getElementById('stackedAccount'),
        topServicesCount: document.getElementById('topServicesCount'),
        serviceStackedChart: document.getElementById('serviceStackedChart'),
        growthRateTable: document.getElementById('growthRateTable'),
        
        // Account comparison chart
        accountComparisonTopServicesCount: document.getElementById('accountComparisonTopServicesCount'),
        accountComparisonChart: document.getElementById('accountComparisonChart'),
        
        // Account service trend chart
        accountServiceTrendAccount: document.getElementById('accountServiceTrendAccount'),
        accountServiceTrendTopCount: document.getElementById('accountServiceTrendTopCount'),
        accountServiceTrendChart: document.getElementById('accountServiceTrendChart'),
        
        // Statistical analysis
        statisticalAccountSelect: document.getElementById('statisticalAccountSelect'),
        baseStartDate: document.getElementById('baseStartDate'),
        baseEndDate: document.getElementById('baseEndDate'),
        compareStartDate: document.getElementById('compareStartDate'),
        compareEndDate: document.getElementById('compareEndDate'),
        executeStatisticalAnalysis: document.getElementById('executeStatisticalAnalysis'),
        statisticalAnalysisChart: document.getElementById('statisticalAnalysisChart'),
        statisticalAnalysisResults: document.getElementById('statisticalAnalysisResults')
    };
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
    // Account registration form
    elements.accountNameInput.addEventListener('input', validateForm);
    elements.csvFileInput.addEventListener('change', handleFileSelection);
    elements.addAccountBtn.addEventListener('click', handleAddAccount);
    
    // Account management
    elements.clearAllBtn.addEventListener('click', handleClearAll);
    elements.analyzeBtn.addEventListener('click', handleAnalyzeData);
    
    // Chart controls
    
    if (elements.serviceComparisonPeriod) {
        elements.serviceComparisonPeriod.addEventListener('change', handleServicePeriodChange);
    }
    
    
    if (elements.stackedAccount) {
        elements.stackedAccount.addEventListener('change', handleStackedAccountChange);
    }
    
    if (elements.topServicesCount) {
        elements.topServicesCount.addEventListener('change', handleTopServicesCountChange);
    }
    
    // Account comparison charts
    if (elements.accountComparisonTopServicesCount) {
        elements.accountComparisonTopServicesCount.addEventListener('change', handleAccountComparisonTopServicesCountChange);
    }
    
    // Account service trend chart
    if (elements.accountServiceTrendAccount) {
        elements.accountServiceTrendAccount.addEventListener('change', handleAccountServiceTrendAccountChange);
    }
    if (elements.accountServiceTrendTopCount) {
        elements.accountServiceTrendTopCount.addEventListener('change', handleAccountServiceTrendTopCountChange);
    }
    
    // Threshold setting
    if (elements.costVariationThreshold) {
        elements.costVariationThreshold.addEventListener('input', handleCostVariationThresholdChange);
    }
    if (elements.lowUsageThreshold) {
        elements.lowUsageThreshold.addEventListener('input', handleThresholdChange);
    }
    
    // Service cross-analysis
    if (elements.serviceSelect) {
        elements.serviceSelect.addEventListener('change', validateServiceSelection);
    }
    if (elements.executeServiceAnalysis) {
        elements.executeServiceAnalysis.addEventListener('click', handleServiceCrossAnalysis);
    }
    
    // Statistical analysis
    if (elements.executeStatisticalAnalysis) {
        elements.executeStatisticalAnalysis.addEventListener('click', handleStatisticalAnalysis);
    }
    if (elements.baseStartDate) {
        elements.baseStartDate.addEventListener('change', validateStatisticalPeriods);
    }
    if (elements.baseEndDate) {
        elements.baseEndDate.addEventListener('change', validateStatisticalPeriods);
    }
    if (elements.compareStartDate) {
        elements.compareStartDate.addEventListener('change', validateStatisticalPeriods);
    }
    if (elements.compareEndDate) {
        elements.compareEndDate.addEventListener('change', validateStatisticalPeriods);
    }
    
    // Service selection mode toggle
    setupSelectionModeToggle();
    
    // Multi-service control buttons
    setupMultiServiceControls();
}

/**
 * Validate the account registration form
 */
function validateForm() {
    const accountName = elements.accountNameInput.value.trim();
    const hasFile = elements.csvFileInput.files.length > 0;
    const isDuplicateName = registeredAccounts.some(acc => acc.name === accountName);
    
    const isValid = accountName.length > 0 && hasFile && !isDuplicateName;
    
    elements.addAccountBtn.disabled = !isValid;
    
    // Show validation feedback
    if (accountName && isDuplicateName) {
        showMessage('このアカウント名は既に登録されています', 'error');
    }
}

/**
 * Handle file selection
 */
function handleFileSelection(event) {
    const file = event.target.files[0];
    
    if (file) {
        elements.selectedFileDiv.innerHTML = `
            <div class="file-selected">
                📄 ${file.name} (${formatFileSize(file.size)})
            </div>
        `;
    } else {
        elements.selectedFileDiv.innerHTML = '';
    }
    
    validateForm();
}

/**
 * Handle adding a new account
 */
async function handleAddAccount() {
    const accountName = elements.accountNameInput.value.trim();
    const file = elements.csvFileInput.files[0];
    
    if (!accountName || !file) {
        showMessage('アカウント名とファイルの両方を入力してください', 'error');
        return;
    }
    
    try {
        // Show loading state
        elements.addAccountBtn.disabled = true;
        elements.addAccountBtn.textContent = '処理中...';
        
        // Read and parse CSV file
        const csvContent = await readCSVFile(file);
        const parsedData = parseCSVString(csvContent);
        const accountData = transformCostData(parsedData, accountName);
        
        // Add to registered accounts
        registeredAccounts.push({
            name: accountName,
            fileName: file.name,
            data: accountData,
            addedAt: new Date().toISOString()
        });
        
        // Save to sessionStorage
        saveDataToStorage();
        
        // Update UI
        updateAccountsList();
        updateUIState();
        clearForm();
        
        showMessage(`アカウント「${accountName}」を追加しました`, 'success');
        
        // Update UI state to enable analysis if multiple accounts
        updateUIState();
        
    } catch (error) {
        console.error('Error adding account:', error);
        showMessage(`エラー: ${error.message}`, 'error');
    } finally {
        // Reset button state
        elements.addAccountBtn.disabled = false;
        elements.addAccountBtn.textContent = 'アカウントを追加';
        validateForm();
    }
}

/**
 * Handle clearing all accounts
 */
function handleClearAll() {
    if (registeredAccounts.length === 0) return;
    
    if (confirm('全てのアカウントを削除しますか？この操作は取り消せません。')) {
        registeredAccounts = [];
        aggregatedData = null;
        
        // Clear storage
        sessionStorage.removeItem('awsCostAccounts');
        sessionStorage.removeItem('awsCostAggregatedData');
        
        // Update UI
        updateAccountsList();
        updateUIState();
        hideAnalysisResults();
        
        showMessage('全てのアカウントを削除しました', 'info');
    }
}

/**
 * Handle data analysis
 */
async function handleAnalyzeData() {
    if (registeredAccounts.length === 0) {
        showMessage('分析するアカウントがありません', 'error');
        return;
    }
    
    try {
        // Show loading state
        elements.analyzeBtn.disabled = true;
        elements.analyzeBtn.textContent = '分析中...';
        
        console.log('Starting data analysis...', registeredAccounts);
        
        // Aggregate data from all accounts
        const accountsData = registeredAccounts.map(acc => acc.data);
        console.log('Accounts data for aggregation:', accountsData);
        
        aggregatedData = aggregateMultiAccountData(accountsData);
        console.log('Aggregated data:', aggregatedData);
        
        // Save aggregated data
        sessionStorage.setItem('awsCostAggregatedData', JSON.stringify(aggregatedData));
        
        // Show analysis sections
        elements.dataSummary.style.display = 'block';
        elements.chartsSection.style.display = 'block';
        elements.analysisSection.style.display = 'block';
        
        // Update UI with analysis results
        console.log('Displaying data summary...');
        displayDataSummary();
        
        console.log('Displaying charts...');
        displayCharts();
        
        console.log('Displaying analysis results...');
        displayAnalysisResults();
        
        showMessage('データ分析が完了しました', 'success');
        
    } catch (error) {
        console.error('Error analyzing data:', error);
        showMessage(`分析エラー: ${error.message}`, 'error');
    } finally {
        // Reset button state
        elements.analyzeBtn.disabled = false;
        elements.analyzeBtn.textContent = 'データ分析開始';
    }
}

/**
 * Update accounts list display
 */
function updateAccountsList() {
    if (registeredAccounts.length === 0) {
        elements.accountsList.innerHTML = '<p class="no-accounts">アカウントが登録されていません</p>';
        return;
    }
    
    const accountsHTML = registeredAccounts.map((account, index) => `
        <div class="account-item">
            <div class="account-info">
                <div class="account-name">${escapeHtml(account.name)}</div>
                <div class="account-details">
                    ${escapeHtml(account.fileName)} • 
                    ${account.data.dataRange.monthCount}ヶ月 • 
                    ${formatCurrency(account.data.totalCost)}
                </div>
            </div>
            <div class="account-actions">
                <button class="remove-btn" onclick="removeAccount(${index})">削除</button>
            </div>
        </div>
    `).join('');
    
    elements.accountsList.innerHTML = accountsHTML;
}

/**
 * Update UI state based on current data
 */
function updateUIState() {
    const hasAccounts = registeredAccounts.length > 0;
    const hasAggregatedData = aggregatedData !== null;
    
    // Update button states
    elements.clearAllBtn.disabled = !hasAccounts;
    elements.analyzeBtn.disabled = !hasAccounts;
    
    // Update section visibility
    elements.dataSummary.style.display = hasAggregatedData ? 'block' : 'none';
    elements.chartsSection.style.display = hasAggregatedData ? 'block' : 'none';
    elements.analysisSection.style.display = hasAggregatedData ? 'block' : 'none';
    
    // Update account count in summary
    if (elements.accountCount) {
        elements.accountCount.textContent = registeredAccounts.length;
    }
}

/**
 * Display data summary
 */
function displayDataSummary() {
    if (!aggregatedData) return;
    
    elements.totalCost.textContent = formatCurrency(aggregatedData.totalCost);
    
    if (aggregatedData.dateRange) {
        elements.datePeriod.textContent = 
            `${aggregatedData.dateRange.startDate} 〜 ${aggregatedData.dateRange.endDate}`;
    }
    
    // Calculate and display monthly change
    if (aggregatedData.monthlyTrends && aggregatedData.monthlyTrends.length >= 2) {
        const trends = aggregatedData.monthlyTrends;
        const latest = trends[trends.length - 1];
        const previous = trends[trends.length - 2];
        const change = ((latest.totalCost - previous.totalCost) / previous.totalCost) * 100;
        
        elements.monthlyChange.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
        elements.monthlyChange.className = `summary-value ${change >= 0 ? 'growth-positive' : 'growth-negative'}`;
    }
}

/**
 * Display charts
 */
function displayCharts() {
    if (!aggregatedData) return;
    
    // Destroy existing charts
    Object.values(chartInstances).forEach(chart => {
        if (Array.isArray(chart)) {
            // Handle array of charts (like account comparison)
            chart.forEach(c => destroyChart(c));
        } else {
            destroyChart(chart);
        }
    });
    chartInstances = {};
    
    // Create monthly trend chart
    const trendConfig = createMonthlyTrendConfig(aggregatedData);
    chartInstances.monthlyTrend = new Chart(elements.monthlyTrendChart, trendConfig);
    
    // Create service comparison chart
    const comparisonPeriod = elements.serviceComparisonPeriod?.value || 'total';
    const comparisonConfig = createServiceComparisonConfig(aggregatedData, comparisonPeriod);
    chartInstances.serviceComparison = new Chart(elements.serviceComparisonChart, comparisonConfig);
    
    
    // Create service stacked chart
    const stackedAccount = elements.stackedAccount?.value || 'all';
    const topServicesCount = parseInt(elements.topServicesCount?.value || 5);
    const stackedConfig = createServiceStackedConfig(aggregatedData, stackedAccount, topServicesCount);
    chartInstances.serviceStacked = new Chart(elements.serviceStackedChart, stackedConfig);
    
    updateStackedAccountOptions();
    
    // Create account comparison charts
    displayAccountComparisonChart();
    
    // Update account options for service trend chart first, then create chart
    updateAccountServiceTrendOptions();
    
    // Create account service trend chart with updated options
    displayAccountServiceTrendChart();
}

/**
 * Display analysis results
 */
function displayAnalysisResults() {
    if (!aggregatedData || !aggregatedData.serviceAggregation) return;
    
    // Cost variation services (configurable threshold)
    updateCostVariationServicesDisplay();
    
    // Low usage services (configurable threshold)
    updateLowUsageServicesDisplay();
    
    // High cost services (top 5)
    const highCostServices = Object.entries(aggregatedData.serviceAggregation)
        .filter(([service, cost]) => cost > 0)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
    
    elements.highCostServices.innerHTML = highCostServices.length > 0
        ? `<ul class="service-list">${highCostServices.map(([service, cost]) => 
            `<li>${escapeHtml(service)} <span class="service-cost">${formatCurrency(cost)}</span></li>`
          ).join('')}</ul>`
        : '<p>コストデータがありません</p>';
    
    // Growth rate table
    displayGrowthRateTable();
    
    // Initialize service cross-analysis
    initializeServiceCrossAnalysis();
    
    // Initialize statistical analysis controls
    initializeStatisticalAnalysis();
}

/**
 * Display growth rate table
 */
function displayGrowthRateTable() {
    if (!registeredAccounts.length) return;
    
    // Calculate total growth rate from aggregated data
    const totalGrowthData = aggregatedData && aggregatedData.monthlyTrends && aggregatedData.monthlyTrends.length >= 2 
        ? calculateTotalGrowthRates(aggregatedData.monthlyTrends)
        : { latestCost: 0, monthOverMonth: 0, trend: 'stable' };
    
    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>アカウント</th>
                    <th>現在のコスト</th>
                    <th>前月比</th>
                    <th>トレンド</th>
                </tr>
            </thead>
            <tbody>
                ${registeredAccounts.map(account => {
                    const growthData = calculateGrowthRates(account.data.monthlyData);
                    return `
                        <tr>
                            <td>${escapeHtml(account.name)}</td>
                            <td>${formatCurrency(growthData.latestCost || account.data.totalCost)}</td>
                            <td class="${growthData.monthOverMonth >= 0 ? 'growth-positive' : 'growth-negative'}">
                                ${growthData.monthOverMonth >= 0 ? '+' : ''}${growthData.monthOverMonth}%
                            </td>
                            <td class="growth-${growthData.trend}">${getTrendIcon(growthData.trend)}</td>
                        </tr>
                    `;
                }).join('')}
                <tr class="total-row">
                    <td><strong>全体合計</strong></td>
                    <td><strong>${formatCurrency(totalGrowthData.latestCost)}</strong></td>
                    <td class="${totalGrowthData.monthOverMonth >= 0 ? 'growth-positive' : 'growth-negative'}">
                        <strong>${totalGrowthData.monthOverMonth >= 0 ? '+' : ''}${totalGrowthData.monthOverMonth}%</strong>
                    </td>
                    <td class="growth-${totalGrowthData.trend}"><strong>${getTrendIcon(totalGrowthData.trend)}</strong></td>
                </tr>
            </tbody>
        </table>
    `;
    
    elements.growthRateTable.innerHTML = tableHTML;
}


/**
 * Handle service comparison period change
 */
function handleServicePeriodChange(event) {
    if (aggregatedData && chartInstances.serviceComparison) {
        const newConfig = createServiceComparisonConfig(aggregatedData, event.target.value);
        updateChart(chartInstances.serviceComparison, newConfig);
    }
}

/**
 * Handle composition account change
 */
function handleCompositionAccountChange(event) {
    if (aggregatedData && chartInstances.serviceComposition) {
        const compositionTopServicesCount = parseInt(elements.compositionTopServicesCount?.value || 5);
        const newConfig = createServiceCompositionConfig(aggregatedData, event.target.value, compositionTopServicesCount);
        updateChart(chartInstances.serviceComposition, newConfig);
    }
}

/**
 * Handle composition top services count change
 */
function handleCompositionTopServicesCountChange(event) {
    if (aggregatedData && chartInstances.serviceComposition) {
        const compositionAccount = elements.compositionAccount?.value || 'all';
        const topServicesCount = parseInt(event.target.value);
        const newConfig = createServiceCompositionConfig(aggregatedData, compositionAccount, topServicesCount);
        updateChart(chartInstances.serviceComposition, newConfig);
    }
}

/**
 * Handle stacked account change
 */
function handleStackedAccountChange(event) {
    if (aggregatedData && chartInstances.serviceStacked) {
        const topServicesCount = parseInt(elements.topServicesCount?.value || 5);
        const newConfig = createServiceStackedConfig(aggregatedData, event.target.value, topServicesCount);
        updateChart(chartInstances.serviceStacked, newConfig);
    }
}

/**
 * Handle top services count change
 */
function handleTopServicesCountChange(event) {
    if (aggregatedData && chartInstances.serviceStacked) {
        const stackedAccount = elements.stackedAccount?.value || 'all';
        const topServicesCount = parseInt(event.target.value);
        const newConfig = createServiceStackedConfig(aggregatedData, stackedAccount, topServicesCount);
        updateChart(chartInstances.serviceStacked, newConfig);
    }
}

/**
 * Handle threshold change for low usage services
 */
function handleThresholdChange(event) {
    if (aggregatedData) {
        // Update only the low usage services display
        updateLowUsageServicesDisplay();
    }
}

/**
 * Update low usage services display based on current threshold
 */
function updateLowUsageServicesDisplay() {
    if (!aggregatedData || !aggregatedData.monthlyTrends || !elements.lowUsageServices) return;
    
    const threshold = parseFloat(elements.lowUsageThreshold?.value || 10);
    
    // Get latest month data for low usage analysis
    const sortedTrends = aggregatedData.monthlyTrends.sort((a, b) => new Date(a.date) - new Date(b.date));
    const latestMonth = sortedTrends[sortedTrends.length - 1];
    
    if (!latestMonth || !latestMonth.serviceBreakdown) {
        elements.lowUsageServices.innerHTML = '<p>最新月のデータがありません</p>';
        return;
    }
    
    const lowUsageServices = Object.entries(latestMonth.serviceBreakdown)
        .filter(([service, cost]) => cost > 0 && cost < threshold)
        .sort(([,a], [,b]) => a - b);
    
    elements.lowUsageServices.innerHTML = lowUsageServices.length > 0
        ? `<ul class="service-list">${lowUsageServices.map(([service, cost]) => 
            `<li>${escapeHtml(service)} <span class="service-cost">${formatCurrency(cost)}</span></li>`
          ).join('')}</ul>`
        : `<p>閾値 $${threshold.toFixed(2)} 以下のサービスはありません</p>`;
}

/**
 * Update cost variation services display based on threshold
 */
function updateCostVariationServicesDisplay() {
    if (!aggregatedData || !aggregatedData.monthlyTrends) return;
    
    const threshold = parseFloat(elements.costVariationThreshold.value) || 5;
    const costVariations = calculateCostVariations(threshold);
    
    elements.costVariationServices.innerHTML = costVariations.length > 0
        ? `<ul class="service-list">${costVariations.map(variation => 
            `<li class="cost-variation-item">
                <div class="service-name-cost">
                    <span class="service-name">${escapeHtml(variation.service)}</span>
                    <span class="service-cost">${formatCurrency(variation.currentCost)} 
                        ${variation.changeType === 'increase' ? '📈' : '📉'}
                    </span>
                </div>
                <div class="variation-details">
                    <span class="variation-rate ${variation.changeType}">${variation.changeRate >= 0 ? '+' : ''}${variation.changeRate.toFixed(1)}%</span>
                    <span class="previous-cost">前月: ${formatCurrency(variation.previousCost)}</span>
                </div>
            </li>`
          ).join('')}</ul>`
        : `<p>変動率 ${threshold}% 以上のサービスはありません</p>`;
}

/**
 * Calculate cost variations between previous and current month
 */
function calculateCostVariations(threshold) {
    if (!aggregatedData.monthlyTrends || aggregatedData.monthlyTrends.length < 2) {
        return [];
    }
    
    // Get the last two months of data
    const sortedTrends = aggregatedData.monthlyTrends.sort((a, b) => new Date(a.date) - new Date(b.date));
    const currentMonth = sortedTrends[sortedTrends.length - 1];
    const previousMonth = sortedTrends[sortedTrends.length - 2];
    
    if (!currentMonth.serviceBreakdown || !previousMonth.serviceBreakdown) {
        return [];
    }
    
    const variations = [];
    
    // Get all services from both months
    const allServices = new Set([
        ...Object.keys(currentMonth.serviceBreakdown),
        ...Object.keys(previousMonth.serviceBreakdown)
    ]);
    
    allServices.forEach(service => {
        const currentCost = currentMonth.serviceBreakdown[service] || 0;
        const previousCost = previousMonth.serviceBreakdown[service] || 0;
        
        // Skip if both costs are zero
        if (currentCost === 0 && previousCost === 0) return;
        
        let changeRate = 0;
        if (previousCost === 0 && currentCost > 0) {
            // New service appeared
            changeRate = 100;
        } else if (previousCost > 0 && currentCost === 0) {
            // Service disappeared
            changeRate = -100;
        } else if (previousCost > 0) {
            // Normal calculation
            changeRate = ((currentCost - previousCost) / previousCost) * 100;
        }
        
        // Check if variation meets threshold
        if (Math.abs(changeRate) >= threshold) {
            variations.push({
                service,
                currentCost,
                previousCost,
                changeRate,
                changeType: changeRate >= 0 ? 'increase' : 'decrease'
            });
        }
    });
    
    // Sort by absolute change rate (highest variation first)
    return variations.sort((a, b) => Math.abs(b.changeRate) - Math.abs(a.changeRate));
}

/**
 * Handle cost variation threshold change
 */
function handleCostVariationThresholdChange() {
    updateCostVariationServicesDisplay();
}






/**
 * Update stacked account select options
 */
function updateStackedAccountOptions() {
    if (!elements.stackedAccount || !aggregatedData) return;
    
    const options = ['<option value="all">全アカウント</option>'];
    registeredAccounts.forEach(account => {
        options.push(`<option value="${escapeHtml(account.name)}">${escapeHtml(account.name)}</option>`);
    });
    
    elements.stackedAccount.innerHTML = options.join('');
}

/**
 * Display account comparison charts
 */
function displayAccountComparisonChart() {
    if (!aggregatedData || !elements.accountComparisonChart) return;
    
    const topServicesCount = parseInt(elements.accountComparisonTopServicesCount?.value || 5);
    
    // Clear existing chart
    if (chartInstances.accountComparison) {
        destroyChart(chartInstances.accountComparison);
        chartInstances.accountComparison = null;
    }
    
    const chartConfig = createAccountComparisonChartConfig(aggregatedData, topServicesCount);
    
    if (!chartConfig || chartConfig.type === 'empty') {
        return;
    }
    
    // Create Chart instance
    chartInstances.accountComparison = new Chart(elements.accountComparisonChart, chartConfig);
}

/**
 * Destroy account comparison charts
 */

/**
 * Handle account comparison top services count change
 */
function handleAccountComparisonTopServicesCountChange() {
    if (!aggregatedData) return;
    
    displayAccountComparisonChart();
}

/**
 * Display account service trend chart
 */
function displayAccountServiceTrendChart() {
    if (!aggregatedData || !elements.accountServiceTrendChart) return;
    
    const accountName = elements.accountServiceTrendAccount?.value || '';
    const topServicesCount = parseInt(elements.accountServiceTrendTopCount?.value || 5);
    
    // Clear existing chart
    if (chartInstances.accountServiceTrend) {
        destroyChart(chartInstances.accountServiceTrend);
        chartInstances.accountServiceTrend = null;
    }
    
    const chartConfig = createAccountServiceTrendConfig(aggregatedData, accountName, topServicesCount);
    
    if (!chartConfig || chartConfig.type === 'empty') {
        return;
    }
    
    // Create Chart instance
    chartInstances.accountServiceTrend = new Chart(elements.accountServiceTrendChart, chartConfig);
}

/**
 * Update account options for service trend chart
 */
function updateAccountServiceTrendOptions() {
    if (!elements.accountServiceTrendAccount || !aggregatedData) return;
    
    const options = ['<option value="">全アカウント</option>'];
    registeredAccounts.forEach((account, index) => {
        const isSelected = index === 0 ? ' selected' : ''; // First account selected by default
        options.push(`<option value="${escapeHtml(account.name)}"${isSelected}>${escapeHtml(account.name)}</option>`);
    });
    
    elements.accountServiceTrendAccount.innerHTML = options.join('');
}

/**
 * Handle account service trend account change
 */
function handleAccountServiceTrendAccountChange() {
    if (!aggregatedData) return;
    
    displayAccountServiceTrendChart();
}

/**
 * Handle account service trend top services count change
 */
function handleAccountServiceTrendTopCountChange() {
    if (!aggregatedData) return;
    
    displayAccountServiceTrendChart();
}

/**
 * Remove account
 */
function removeAccount(index) {
    const account = registeredAccounts[index];
    if (account && confirm(`アカウント「${account.name}」を削除しますか？`)) {
        registeredAccounts.splice(index, 1);
        aggregatedData = null;
        
        saveDataToStorage();
        updateAccountsList();
        updateUIState();
        hideAnalysisResults();
        
        showMessage(`アカウント「${account.name}」を削除しました`, 'info');
    }
}

/**
 * Clear registration form
 */
function clearForm() {
    elements.accountNameInput.value = '';
    elements.csvFileInput.value = '';
    elements.selectedFileDiv.innerHTML = '';
    validateForm();
}

/**
 * Hide analysis results
 */
function hideAnalysisResults() {
    elements.dataSummary.style.display = 'none';
    elements.chartsSection.style.display = 'none';
    elements.analysisSection.style.display = 'none';
    
    // Destroy charts
    Object.values(chartInstances).forEach(chart => destroyChart(chart));
    chartInstances = {};
}

/**
 * Save data to sessionStorage
 */
function saveDataToStorage() {
    try {
        sessionStorage.setItem('awsCostAccounts', JSON.stringify(registeredAccounts));
        if (aggregatedData) {
            sessionStorage.setItem('awsCostAggregatedData', JSON.stringify(aggregatedData));
        }
    } catch (error) {
        console.error('Error saving to storage:', error);
    }
}

/**
 * Load data from sessionStorage
 */
function loadStoredData() {
    try {
        const storedAccounts = sessionStorage.getItem('awsCostAccounts');
        const storedAggregated = sessionStorage.getItem('awsCostAggregatedData');
        
        if (storedAccounts) {
            registeredAccounts = JSON.parse(storedAccounts);
            updateAccountsList();
        }
        
        if (storedAggregated) {
            aggregatedData = JSON.parse(storedAggregated);
            displayDataSummary();
            displayCharts();
            displayAnalysisResults();
        }
    } catch (error) {
        console.error('Error loading from storage:', error);
        // Clear corrupted data
        sessionStorage.removeItem('awsCostAccounts');
        sessionStorage.removeItem('awsCostAggregatedData');
    }
}

/**
 * Show message to user
 */
function showMessage(message, type = 'info') {
    // Create or get message container
    let messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'messageContainer';
        messageContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 400px;
        `;
        document.body.appendChild(messageContainer);
    }
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.style.cssText = `
        padding: 12px 16px;
        margin-bottom: 10px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        background-color: ${type === 'success' ? '#48bb78' : type === 'error' ? '#e53e3e' : type === 'warning' ? '#ed8936' : '#3182ce'};
    `;
    messageElement.textContent = message;
    
    messageContainer.appendChild(messageElement);
    
    // Animate in
    setTimeout(() => {
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 300);
    }, 5000);
}

/**
 * Utility functions
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getTrendIcon(trend) {
    switch (trend) {
        case 'increasing': return '📈';
        case 'decreasing': return '📉';
        case 'stable': return '➡️';
        default: return '❓';
    }
}


/**
 * Validate statistical analysis periods
 */
function validateStatisticalPeriods() {
    if (!elements.executeStatisticalAnalysis) return;
    
    const baseStart = elements.baseStartDate.value;
    const baseEnd = elements.baseEndDate.value;
    const compareStart = elements.compareStartDate.value;
    const compareEnd = elements.compareEndDate.value;
    
    // Check that all fields are filled and both periods have at least 1 month
    const isValidBase = baseStart && baseEnd && baseStart <= baseEnd;
    const isValidCompare = compareStart && compareEnd && compareStart <= compareEnd;
    
    elements.executeStatisticalAnalysis.disabled = !(isValidBase && isValidCompare);
}

/**
 * Handle statistical analysis execution
 */
function handleStatisticalAnalysis() {
    if (!validateStatisticalInput()) return;
    
    const selectedAccount = elements.statisticalAccountSelect.value;
    const basePeriod = {
        start: elements.baseStartDate.value,
        end: elements.baseEndDate.value
    };
    const comparePeriod = {
        start: elements.compareStartDate.value,
        end: elements.compareEndDate.value
    };
    
    try {
        const analysisData = calculateStatisticalAnalysis(selectedAccount, basePeriod, comparePeriod);
        displayStatisticalAnalysisResults(analysisData, basePeriod, comparePeriod);
        updateStatisticalAnalysisChart(analysisData, basePeriod, comparePeriod);
    } catch (error) {
        console.error('Statistical analysis error:', error);
        alert('統計分析でエラーが発生しました: ' + error.message);
    }
}

/**
 * Get the last day of a month in YYYY-MM-DD format
 * @param {string} yearMonth - Year-month in YYYY-MM format
 * @returns {string} Last day in YYYY-MM-DD format
 */
function getLastDayOfMonth(yearMonth) {
    const [year, month] = yearMonth.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate(); // month is 1-indexed, so this gets last day of previous month
    return `${yearMonth}-${String(lastDay).padStart(2, '0')}`;
}

/**
 * Validate statistical analysis input
 */
function validateStatisticalInput() {
    const baseStart = elements.baseStartDate.value;
    const baseEnd = elements.baseEndDate.value;
    const compareStart = elements.compareStartDate.value;
    const compareEnd = elements.compareEndDate.value;
    
    if (!baseStart || !baseEnd || !compareStart || !compareEnd) {
        alert('すべての期間を入力してください。');
        return false;
    }
    
    if (baseStart > baseEnd) {
        alert('ベース期間の開始月は終了月より前である必要があります。');
        return false;
    }
    
    if (compareStart > compareEnd) {
        alert('比較対象期間の開始月は終了月より前である必要があります。');
        return false;
    }
    
    return true;
}

/**
 * Calculate statistical analysis data
 */
function calculateStatisticalAnalysis(selectedAccount, basePeriod, comparePeriod) {
    let monthlyData;
    
    // Get data based on account selection
    if (selectedAccount === 'all') {
        if (!aggregatedData || !aggregatedData.monthlyTrends) {
            throw new Error('集約データが利用できません');
        }
        monthlyData = aggregatedData.monthlyTrends;
    } else {
        const account = registeredAccounts.find(acc => acc.name === selectedAccount);
        if (!account || !account.data || !account.data.monthlyData) {
            throw new Error('選択されたアカウントのデータが見つかりません');
        }
        monthlyData = account.data.monthlyData;
    }
    
    // Convert period dates to proper comparison format
    const baseStartDate = basePeriod.start + '-01'; // e.g. "2025-01" -> "2025-01-01"
    const baseEndDate = getLastDayOfMonth(basePeriod.end); // e.g. "2025-04" -> "2025-04-30"
    const compareStartDate = comparePeriod.start + '-01';
    const compareEndDate = getLastDayOfMonth(comparePeriod.end);
    
    // Filter data for base period
    const baseData = monthlyData.filter(month => 
        month.date >= baseStartDate && month.date <= baseEndDate
    );
    
    // Filter data for compare period
    const compareData = monthlyData.filter(month => 
        month.date >= compareStartDate && month.date <= compareEndDate
    );
    
    if (baseData.length === 0) {
        throw new Error('ベース期間にデータが見つかりません');
    }
    
    if (compareData.length === 0) {
        throw new Error('比較対象期間にデータが見つかりません');
    }
    
    // Calculate statistics
    const baseStats = calculatePeriodStatistics(baseData);
    const compareStats = calculatePeriodStatistics(compareData);
    
    return {
        account: selectedAccount,
        baseStats,
        compareStats,
        basePeriod,
        comparePeriod,
        allMonthlyData: monthlyData
    };
}

/**
 * Calculate statistics for a period
 */
function calculatePeriodStatistics(periodData) {
    const costs = periodData.map(month => month.totalCost);
    const n = costs.length;
    
    if (n === 0) return { mean: 0, stdDev: 0, min: 0, max: 0, count: 0 };
    
    // Calculate mean
    const mean = costs.reduce((sum, cost) => sum + cost, 0) / n;
    
    // Calculate standard deviation
    const variance = costs.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    
    // Find min and max
    const min = Math.min(...costs);
    const max = Math.max(...costs);
    
    return {
        mean: Math.round(mean * 100) / 100,
        stdDev: Math.round(stdDev * 100) / 100,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        count: n,
        data: periodData
    };
}

/**
 * Display statistical analysis results
 */
function displayStatisticalAnalysisResults(analysisData, basePeriod, comparePeriod) {
    if (!elements.statisticalAnalysisResults) return;
    
    const { baseStats, compareStats } = analysisData;
    const meanDifference = compareStats.mean - baseStats.mean;
    const percentChange = baseStats.mean > 0 ? ((meanDifference / baseStats.mean) * 100) : 0;
    
    const html = `
        <div class="statistics-summary">
            <div class="statistics-card base-period">
                <h5>ベース期間</h5>
                <div class="statistics-period">${basePeriod.start} 〜 ${basePeriod.end}</div>
                <div class="statistics-value">${formatCurrency(baseStats.mean)}</div>
                <div class="statistics-label">平均値 (${baseStats.count}ヶ月)</div>
                <div class="statistics-label">標準偏差: ${formatCurrency(baseStats.stdDev)}</div>
            </div>
            <div class="statistics-card compare-period">
                <h5>比較対象期間</h5>
                <div class="statistics-period">${comparePeriod.start} 〜 ${comparePeriod.end}</div>
                <div class="statistics-value">${formatCurrency(compareStats.mean)}</div>
                <div class="statistics-label">平均値 (${compareStats.count}ヶ月)</div>
                <div class="statistics-label">標準偏差: ${formatCurrency(compareStats.stdDev)}</div>
            </div>
            <div class="statistics-card difference-period ${meanDifference < 0 ? 'negative' : ''}">
                <h5>差分</h5>
                <div class="statistics-value">${meanDifference >= 0 ? '+' : ''}${formatCurrency(meanDifference, 0, true)}</div>
                <div class="statistics-label">${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}% 変化</div>
            </div>
        </div>
        <div class="statistics-details">
            <h4>詳細統計</h4>
            <table class="statistics-table">
                <thead>
                    <tr>
                        <th>項目</th>
                        <th>ベース期間</th>
                        <th>比較対象期間</th>
                        <th>差分</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>平均値</td>
                        <td>${formatCurrency(baseStats.mean)}</td>
                        <td>${formatCurrency(compareStats.mean)}</td>
                        <td>${meanDifference >= 0 ? '+' : ''}${formatCurrency(meanDifference, 0, true)}</td>
                    </tr>
                    <tr>
                        <td>標準偏差</td>
                        <td>${formatCurrency(baseStats.stdDev)}</td>
                        <td>${formatCurrency(compareStats.stdDev)}</td>
                        <td>${formatCurrency(compareStats.stdDev - baseStats.stdDev, 0, true)}</td>
                    </tr>
                    <tr>
                        <td>最小値</td>
                        <td>${formatCurrency(baseStats.min)}</td>
                        <td>${formatCurrency(compareStats.min)}</td>
                        <td>${formatCurrency(compareStats.min - baseStats.min, 0, true)}</td>
                    </tr>
                    <tr>
                        <td>最大値</td>
                        <td>${formatCurrency(baseStats.max)}</td>
                        <td>${formatCurrency(compareStats.max)}</td>
                        <td>${formatCurrency(compareStats.max - baseStats.max, 0, true)}</td>
                    </tr>
                    <tr>
                        <td>期間長</td>
                        <td>${baseStats.count}ヶ月</td>
                        <td>${compareStats.count}ヶ月</td>
                        <td>${compareStats.count - baseStats.count}ヶ月</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    elements.statisticalAnalysisResults.innerHTML = html;
}

/**
 * Update statistical analysis chart
 */
function updateStatisticalAnalysisChart(analysisData, basePeriod, comparePeriod) {
    const chartContainer = elements.statisticalAnalysisChart;
    if (!chartContainer) return;
    
    // Destroy existing chart first
    if (chartInstances.statisticalAnalysis) {
        chartInstances.statisticalAnalysis.destroy();
        chartInstances.statisticalAnalysis = null;
    }
    
    // Clear container and recreate canvas
    chartContainer.innerHTML = '<canvas></canvas>';
    
    const canvas = chartContainer.querySelector('canvas');
    if (canvas && typeof Chart !== 'undefined') {
        // Set canvas style attributes to ensure proper sizing
        canvas.style.width = '100%';
        canvas.style.height = '400px';
        canvas.style.maxWidth = '100%';
        
        const ctx = canvas.getContext('2d');
        const config = createStatisticalAnalysisChartConfig(analysisData, basePeriod, comparePeriod);
        
        // Create new chart instance
        chartInstances.statisticalAnalysis = new Chart(ctx, config);
        
        // Force a resize after creation to ensure proper display
        setTimeout(() => {
            if (chartInstances.statisticalAnalysis) {
                chartInstances.statisticalAnalysis.resize();
            }
        }, 100);
    }
}

/**
 * Initialize statistical analysis UI
 */
function initializeStatisticalAnalysis() {
    if (!aggregatedData || !registeredAccounts.length) return;
    
    // Populate account selector
    if (elements.statisticalAccountSelect) {
        elements.statisticalAccountSelect.innerHTML = '<option value="all">全アカウント合計</option>';
        
        registeredAccounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.name;
            option.textContent = account.name;
            elements.statisticalAccountSelect.appendChild(option);
        });
    }
    
    // Set date range limits and default values based on available data
    if (aggregatedData && aggregatedData.dateRange) {
        const dataStart = aggregatedData.dateRange.startDate.substring(0, 7); // YYYY-MM format
        const dataEnd = aggregatedData.dateRange.endDate.substring(0, 7);
        
        // Set min/max attributes for all statistical analysis date inputs
        if (elements.baseStartDate) {
            elements.baseStartDate.min = dataStart;
            elements.baseStartDate.max = dataEnd;
        }
        if (elements.baseEndDate) {
            elements.baseEndDate.min = dataStart;
            elements.baseEndDate.max = dataEnd;
        }
        if (elements.compareStartDate) {
            elements.compareStartDate.min = dataStart;
            elements.compareStartDate.max = dataEnd;
        }
        if (elements.compareEndDate) {
            elements.compareEndDate.min = dataStart;
            elements.compareEndDate.max = dataEnd;
        }
        
        // Set default date ranges if available and not already set
        if (aggregatedData.monthlyTrends && aggregatedData.monthlyTrends.length >= 2) {
            const dates = aggregatedData.monthlyTrends.map(t => t.date).sort();
            const midPoint = Math.floor(dates.length / 2);
            
            // Set base period as first half (only if not already set)
            if (elements.baseStartDate && !elements.baseStartDate.value) {
                elements.baseStartDate.value = dates[0];
            }
            if (elements.baseEndDate && !elements.baseEndDate.value) {
                elements.baseEndDate.value = dates[midPoint - 1];
            }
            
            // Set compare period as second half (only if not already set)
            if (elements.compareStartDate && !elements.compareStartDate.value) {
                elements.compareStartDate.value = dates[midPoint];
            }
            if (elements.compareEndDate && !elements.compareEndDate.value) {
                elements.compareEndDate.value = dates[dates.length - 1];
            }
        }
        
        validateStatisticalPeriods();
    }
}

/**
 * Initialize service cross-analysis controls (new 2-pane UI)
 */
function initializeServiceCrossAnalysis() {
    // Populate the new service selection list
    populateServiceSelectionList();
    
    // Initialize selection status
    updateSelectionStatus();
    
    // Clear previous results
    clearServiceCrossAnalysisResults();
}

/**
 * Populate service selection list (new 2-pane UI)
 */
function populateServiceSelectionList() {
    const serviceListContainer = document.getElementById('serviceSelectionList');
    if (!serviceListContainer || !registeredAccounts.length) return;
    
    // Get all unique services with total costs
    const serviceData = new Map();
    
    registeredAccounts.forEach(account => {
        if (account.data && account.data.monthlyData) {
            account.data.monthlyData.forEach(monthData => {
                // Services are stored as direct properties of monthData
                const nonServiceKeys = ['date', 'period', 'totalCost', 'summary', 'month', 'year'];
                Object.keys(monthData).forEach(key => {
                    if (!nonServiceKeys.includes(key) && typeof monthData[key] === 'number') {
                        const currentTotal = serviceData.get(key) || 0;
                        serviceData.set(key, currentTotal + monthData[key]);
                    }
                });
            });
        }
    });
    
    // Sort services by total cost (descending)
    const sortedServices = Array.from(serviceData.entries())
        .sort((a, b) => b[1] - a[1]);
    
    // Generate service rows
    const rows = sortedServices.map(([service, totalCost]) => {
        return `
            <div class="service-row" data-service="${escapeHtml(service)}">
                <span class="service-icon">○</span>
                <span class="service-name">${escapeHtml(service)}</span>
                <span class="service-cost">$${formatCurrency(totalCost)}</span>
            </div>
        `;
    }).join('');
    
    serviceListContainer.innerHTML = rows;
    
    // Add click event listeners to service rows
    serviceListContainer.addEventListener('click', handleServiceRowClick);
}

// Track selected service for new UI
let selectedService = null;

// Track multiple selected services and selection mode
let multiSelectedServices = new Set();
let selectionMode = 'single'; // 'single' or 'multiple'

/**
 * Handle service row click event (updated for single/multiple selection)
 */
function handleServiceRowClick(event) {
    const serviceRow = event.target.closest('.service-row');
    if (!serviceRow) return;
    
    const serviceName = serviceRow.dataset.service;
    
    if (selectionMode === 'single') {
        // Single selection mode
        if (selectedService === serviceName) {
            // Deselect current service
            selectedService = null;
            clearServiceCrossAnalysisResults();
        } else {
            // Select new service
            selectedService = serviceName;
            handleServiceCrossAnalysis();
        }
    } else {
        // Multiple selection mode
        if (multiSelectedServices.has(serviceName)) {
            // Deselect service
            multiSelectedServices.delete(serviceName);
        } else {
            // Select service
            multiSelectedServices.add(serviceName);
        }
        
        // Handle multi-service analysis
        if (multiSelectedServices.size > 0) {
            handleMultiServiceAnalysis();
        } else {
            clearServiceCrossAnalysisResults();
        }
    }
    
    // Update UI
    updateServiceRowSelection();
    updateSelectionStatus();
}

/**
 * Update service row selection visual state (updated for single/multiple selection)
 */
function updateServiceRowSelection() {
    const serviceRows = document.querySelectorAll('.service-row');
    
    serviceRows.forEach(row => {
        const serviceName = row.dataset.service;
        const icon = row.querySelector('.service-icon');
        
        // Remove existing classes
        row.classList.remove('selected', 'multi-select');
        
        if (selectionMode === 'single') {
            // Single selection mode
            if (serviceName === selectedService) {
                row.classList.add('selected');
                icon.textContent = '●';
            } else {
                icon.textContent = '○';
            }
        } else {
            // Multiple selection mode
            row.classList.add('multi-select');
            if (multiSelectedServices.has(serviceName)) {
                row.classList.add('selected');
            }
            // Icon is handled by CSS in multi-select mode
            icon.style.display = 'none';
        }
    });
}

/**
 * Update selection status display (updated for single/multiple selection)
 */
function updateSelectionStatus() {
    const statusElement = document.getElementById('selectionStatus');
    if (!statusElement) return;
    
    // Remove existing classes
    statusElement.classList.remove('multi-mode');
    statusElement.innerHTML = '';
    
    if (selectionMode === 'single') {
        // Single selection mode
        if (selectedService) {
            statusElement.textContent = `${selectedService} 選択中`;
        } else {
            statusElement.textContent = 'サービスを選択してください';
        }
    } else {
        // Multiple selection mode
        statusElement.classList.add('multi-mode');
        const count = multiSelectedServices.size;
        
        if (count === 0) {
            statusElement.textContent = 'サービスを選択してください';
        } else {
            const serviceNames = Array.from(multiSelectedServices).join(', ');
            statusElement.innerHTML = `${serviceNames}<span class="selection-count">${count}個選択中</span>`;
        }
    }
}

/**
 * Validate service selection and auto-execute analysis (legacy function)
 */
function validateServiceSelection() {
    if (!elements.serviceSelect || !elements.executeServiceAnalysis) return;
    
    const selectedService = elements.serviceSelect.value;
    const hasData = registeredAccounts.length > 0;
    
    elements.executeServiceAnalysis.disabled = !selectedService || !hasData;
    
    // Auto-execute analysis when service is selected
    if (selectedService && hasData) {
        handleServiceCrossAnalysis();
    } else {
        // Clear results when no service is selected
        clearServiceCrossAnalysisResults();
    }
}

/**
 * Handle service cross-analysis execution (updated for new UI)
 */
function handleServiceCrossAnalysis() {
    // Use global selectedService variable instead of dropdown
    if (!selectedService || !registeredAccounts.length) {
        showMessage('サービスを選択してください', 'error');
        return;
    }
    
    try {
        console.log('Analyzing service:', selectedService);
        
        // Calculate service account analysis data
        const analysisData = calculateServiceAccountAnalysis(selectedService);
        
        // Display results in new UI format
        displayServiceAccountAnalysisResults(analysisData, selectedService);
        updateServiceAccountAnalysisChart(analysisData, selectedService);
        
        
    } catch (error) {
        console.error('Error in service cross-analysis:', error);
        showMessage(`サービス分析エラー: ${error.message}`, 'error');
    }
}

/**
 * Calculate service account analysis data for new 2-pane UI
 * @param {string} selectedService - The selected service to analyze
 * @returns {Object} Analysis data with account breakdown and chart data
 */
function calculateServiceAccountAnalysis(selectedService) {
    const accountsData = [];
    const chartData = {
        labels: [],
        datasets: []
    };
    
    // Get unique months from all accounts
    const allMonths = new Set();
    registeredAccounts.forEach(account => {
        if (account.data && account.data.monthlyData) {
            account.data.monthlyData.forEach(monthData => {
                if (monthData.date) {
                    allMonths.add(monthData.date);
                }
            });
        }
    });
    
    // Sort months chronologically
    const sortedMonths = Array.from(allMonths).sort();
    chartData.labels = sortedMonths.map(date => {
        const monthMatch = date.match(/(\d{4})-(\d{2})/);
        if (monthMatch) {
            return `${monthMatch[1]}/${monthMatch[2]}`;
        }
        return date;
    });
    
    // Process each account
    let totalByMonth = new Array(sortedMonths.length).fill(0);
    
    registeredAccounts.forEach((account, accountIndex) => {
        if (!account.data || !account.data.monthlyData) return;
        
        const accountData = {
            accountName: account.name,
            monthlyData: [],
            totalCost: 0,
            averageCost: 0,
            trend: 'stable'
        };
        
        // Create monthly data array aligned with sorted months
        const monthlyValues = sortedMonths.map(targetMonth => {
            const monthData = account.data.monthlyData.find(data => data.date === targetMonth);
            const serviceCost = monthData ? (monthData[selectedService] || 0) : 0;
            
            accountData.monthlyData.push({
                date: targetMonth,
                cost: serviceCost
            });
            
            return serviceCost;
        });
        
        // Calculate account totals and trend
        accountData.totalCost = monthlyValues.reduce((sum, cost) => sum + cost, 0);
        accountData.averageCost = accountData.totalCost / monthlyValues.length;
        
        // Calculate trend (simple: compare first and last month)
        if (monthlyValues.length >= 2) {
            const firstMonth = monthlyValues[0];
            const lastMonth = monthlyValues[monthlyValues.length - 1];
            if (lastMonth > firstMonth * 1.1) {
                accountData.trend = 'increasing';
            } else if (lastMonth < firstMonth * 0.9) {
                accountData.trend = 'decreasing';
            }
        }
        
        accountsData.push(accountData);
        
        // Add to chart datasets
        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
        const color = colors[accountIndex % colors.length];
        
        chartData.datasets.push({
            label: account.name,
            data: monthlyValues,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2,
            fill: false,
            tension: 0.1
        });
        
        // Update total by month
        monthlyValues.forEach((value, index) => {
            totalByMonth[index] += value;
        });
    });
    
    // Add total line to chart
    chartData.datasets.push({
        label: '合計',
        data: totalByMonth,
        borderColor: '#059669',
        backgroundColor: '#059669',
        borderWidth: 3,
        fill: false,
        tension: 0.1,
        borderDash: [5, 5]
    });
    
    return {
        accounts: accountsData,
        chartData: chartData,
        selectedService: selectedService,
        totalByMonth: totalByMonth
    };
}

/**
 * Calculate service cross-analysis data (legacy function)
 * @param {string} selectedService - The selected service to analyze
 * @returns {Array} Analysis data for each account
 */
function calculateServiceCrossAnalysis(selectedService) {
    const analysisData = [];
    
    registeredAccounts.forEach(account => {
        if (!account.data || !account.data.monthlyData) return;
        
        const accountData = {
            accountName: account.name,
            monthlyData: [],
            totalCost: 0,
            averageCost: 0,
            trend: 'stable'
        };
        
        // Extract monthly data for the selected service
        account.data.monthlyData.forEach(monthData => {
            const serviceCost = monthData[selectedService] || 0;
            accountData.monthlyData.push({
                date: monthData.date,
                cost: serviceCost
            });
            accountData.totalCost += serviceCost;
        });
        
        // Calculate average cost
        if (accountData.monthlyData.length > 0) {
            accountData.averageCost = accountData.totalCost / accountData.monthlyData.length;
        }
        
        // Calculate trend
        if (accountData.monthlyData.length >= 2) {
            const firstMonth = accountData.monthlyData[0].cost;
            const lastMonth = accountData.monthlyData[accountData.monthlyData.length - 1].cost;
            
            if (firstMonth > 0) {
                const change = ((lastMonth - firstMonth) / firstMonth) * 100;
                if (change > 5) accountData.trend = 'increasing';
                else if (change < -5) accountData.trend = 'decreasing';
            }
        }
        
        analysisData.push(accountData);
    });
    
    return analysisData;
}

/**
 * Display service account analysis results (for new 2-pane UI)
 * @param {Object} analysisData - Analysis data with account breakdown
 * @param {string} selectedService - The selected service name
 */
/**
 * Display service account analysis results (new 2-pane UI)
 */
function displayServiceAccountAnalysisResults(analysisData, selectedService) {
    const resultsContainer = document.getElementById('serviceCrossAnalysisResults');
    if (!resultsContainer || !analysisData || !analysisData.accounts) return;
    
    const accountsList = analysisData.accounts;
    const chartLabels = analysisData.chartData.labels;
    
    // Create detailed monthly breakdown table
    let tableRows = chartLabels.map((monthLabel, index) => {
        let row = `<tr><td>${monthLabel}</td>`;
        
        // Add cost for each account
        accountsList.forEach(account => {
            const cost = account.monthlyData[index] ? account.monthlyData[index].cost : 0;
            row += `<td>${formatCurrency(cost)}</td>`;
        });
        
        // Add total column
        const total = analysisData.totalByMonth[index];
        row += `<td><strong>${formatCurrency(total)}</strong></td></tr>`;
        
        return row;
    }).join('');
    
    // Create summary row with totals
    let summaryRow = '<tr class="summary-row"><td><strong>合計</strong></td>';
    accountsList.forEach(account => {
        summaryRow += `<td><strong>${formatCurrency(account.totalCost)}</strong></td>`;
    });
    
    const grandTotal = accountsList.reduce((sum, account) => sum + account.totalCost, 0);
    summaryRow += `<td><strong>${formatCurrency(grandTotal)}</strong></td></tr>`;
    
    // Generate table headers
    let headers = '<tr><th>月</th>';
    accountsList.forEach(account => {
        headers += `<th>${escapeHtml(account.accountName)}</th>`;
    });
    headers += '<th>合計</th></tr>';
    
    const tableHTML = `
        <h4>${escapeHtml(selectedService)} サービス - アカウント別月次推移</h4>
        <table class="service-account-table">
            <thead>${headers}</thead>
            <tbody>
                ${tableRows}
                ${summaryRow}
            </tbody>
        </table>
    `;
    
    resultsContainer.innerHTML = tableHTML;
}

/**
 * Update service account analysis chart (for new 2-pane UI)
 * @param {Object} analysisData - Analysis data with account breakdown
 * @param {string} selectedService - The selected service name
 */
function updateServiceAccountAnalysisChart(analysisData, selectedService) {
    const chartContainer = document.querySelector('#serviceCrossAnalysisChart');
    if (!chartContainer || !analysisData) return;
    
    // Clear existing chart
    if (chartInstances.serviceCrossAnalysis) {
        chartInstances.serviceCrossAnalysis.destroy();
    }
    
    // Get total display option
    const showTotalCheckbox = document.getElementById('showTotalInGraph');
    const showTotal = showTotalCheckbox ? showTotalCheckbox.checked : true;
    
    // Create chart configuration for account breakdown
    const config = createServiceAccountChartConfig(analysisData, selectedService, showTotal);
    
    // Create new chart
    const canvas = chartContainer.querySelector('canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        chartInstances.serviceCrossAnalysis = new Chart(ctx, config);
    }
}

/**
 * Display service cross-analysis results (legacy function)
 * @param {Array} analysisData - Analysis data for each account
 * @param {string} selectedService - The selected service name
 */
function displayServiceCrossAnalysisResults(analysisData, selectedService) {
    if (!elements.serviceCrossAnalysisResults || !analysisData.length) return;
    
    // Create summary table
    const tableHTML = `
        <h4>${escapeHtml(selectedService)} サービス利用状況</h4>
        <table>
            <thead>
                <tr>
                    <th>アカウント</th>
                    <th>総コスト</th>
                    <th>月平均コスト</th>
                    <th>トレンド</th>
                </tr>
            </thead>
            <tbody>
                ${analysisData.map(data => `
                    <tr>
                        <td>${escapeHtml(data.accountName)}</td>
                        <td>${formatCurrency(data.totalCost)}</td>
                        <td>${formatCurrency(data.averageCost)}</td>
                        <td class="growth-${data.trend}">${getTrendIcon(data.trend)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    elements.serviceCrossAnalysisResults.innerHTML = tableHTML;
}

/**
 * Update service cross-analysis chart
 * @param {Array} analysisData - Analysis data for each account
 * @param {string} selectedService - The selected service name
 */
function updateServiceCrossAnalysisChart(analysisData, selectedService) {
    if (!elements.serviceCrossAnalysisChart || !analysisData.length) return;
    
    // Create or update chart
    const canvas = elements.serviceCrossAnalysisChart.querySelector('canvas');
    if (canvas && typeof Chart !== 'undefined') {
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart
        if (chartInstances.serviceCrossAnalysis) {
            chartInstances.serviceCrossAnalysis.destroy();
        }
        
        const config = createServiceCrossAnalysisChartConfig(analysisData, selectedService);
        chartInstances.serviceCrossAnalysis = new Chart(ctx, config);
    }
}

/**
 * Clear service cross-analysis results
 */
function clearServiceCrossAnalysisResults() {
    // Clear chart
    if (chartInstances.serviceCrossAnalysis) {
        chartInstances.serviceCrossAnalysis.destroy();
        chartInstances.serviceCrossAnalysis = null;
    }
    
    // Clear results table
    if (elements.serviceCrossAnalysisResults) {
        elements.serviceCrossAnalysisResults.innerHTML = '';
    }
}

/**
 * Setup selection mode toggle event listeners
 */
function setupSelectionModeToggle() {
    const modeRadios = document.querySelectorAll('input[name="selectionMode"]');
    const multiServiceControls = document.getElementById('multiServiceControls');
    const selectionGuideText = document.getElementById('selectionGuideText');
    
    // Setup total display option
    setupTotalDisplayOption();
    
    modeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const newMode = this.value;
            
            // Clear existing selections when switching modes
            if (newMode !== selectionMode) {
                selectedService = null;
                multiSelectedServices.clear();
                clearServiceCrossAnalysisResults();
            }
            
            selectionMode = newMode;
            
            // Show/hide multi-service controls
            if (multiServiceControls) {
                multiServiceControls.style.display = (newMode === 'multiple') ? 'flex' : 'none';
            }
            
            // Update guide text
            if (selectionGuideText) {
                if (newMode === 'multiple') {
                    selectionGuideText.textContent = '💡 クリックで複数選択・解除';
                } else {
                    selectionGuideText.textContent = '💡 クリックで選択切り替え';
                }
            }
            
            // Update UI state
            updateServiceRowSelection();
            updateSelectionStatus();
        });
    });
}

/**
 * Setup total display option event listener
 */
function setupTotalDisplayOption() {
    const showTotalCheckbox = document.getElementById('showTotalInGraph');
    
    if (showTotalCheckbox) {
        showTotalCheckbox.addEventListener('change', function() {
            // Re-render current analysis if any service is selected
            if (selectionMode === 'single' && selectedService) {
                handleServiceCrossAnalysis();
            } else if (selectionMode === 'multiple' && multiSelectedServices.size > 0) {
                handleMultiServiceAnalysis();
            }
        });
    }
}

/**
 * Setup multi-service control buttons
 */
function setupMultiServiceControls() {
    const selectAllBtn = document.getElementById('selectAllServices');
    const clearAllBtn = document.getElementById('clearAllServices');
    
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function() {
            if (selectionMode !== 'multiple') return;
            
            // Select all available services
            const serviceRows = document.querySelectorAll('.service-row');
            serviceRows.forEach(row => {
                const serviceName = row.dataset.service;
                if (serviceName) {
                    multiSelectedServices.add(serviceName);
                }
            });
            
            // Update analysis and UI
            if (multiSelectedServices.size > 0) {
                handleMultiServiceAnalysis();
            }
            updateServiceRowSelection();
            updateSelectionStatus();
        });
    }
    
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function() {
            if (selectionMode !== 'multiple') return;
            
            // Clear all selections
            multiSelectedServices.clear();
            clearServiceCrossAnalysisResults();
            
            // Update UI
            updateServiceRowSelection();
            updateSelectionStatus();
        });
    }
}

/**
 * Handle multi-service analysis (placeholder)
 */
function handleMultiServiceAnalysis() {
    if (multiSelectedServices.size === 0) {
        clearServiceCrossAnalysisResults();
        return;
    }
    
    try {
        console.log('Analyzing multiple services:', Array.from(multiSelectedServices));
        
        // Calculate multi-service analysis data
        const analysisData = calculateMultiServiceAnalysis(Array.from(multiSelectedServices));
        
        // Display results
        displayMultiServiceAnalysisResults(analysisData, Array.from(multiSelectedServices));
        updateMultiServiceAnalysisChart(analysisData, Array.from(multiSelectedServices));
        
    } catch (error) {
        console.error('Error in multi-service analysis:', error);
        showMessage(`複数サービス分析エラー: ${error.message}`, 'error');
    }
}

/**
 * Calculate multi-service analysis data (全アカウント合計)
 * @param {Array} selectedServices - Array of selected service names
 * @returns {Object} Analysis data with multi-service breakdown
 */
function calculateMultiServiceAnalysis(selectedServices) {
    if (!selectedServices || selectedServices.length === 0) {
        return null;
    }

    // Get unique months from all accounts
    const allMonths = new Set();
    registeredAccounts.forEach(account => {
        if (account.data && account.data.monthlyData) {
            account.data.monthlyData.forEach(monthData => {
                if (monthData.date) {
                    allMonths.add(monthData.date);
                }
            });
        }
    });

    // Sort months chronologically
    const sortedMonths = Array.from(allMonths).sort();
    
    // Create chart data structure
    const chartData = {
        labels: sortedMonths.map(date => {
            const monthMatch = date.match(/(\d{4})-(\d{2})/);
            if (monthMatch) {
                return `${monthMatch[1]}/${monthMatch[2]}`;
            }
            return date;
        }),
        datasets: []
    };

    // Create monthly breakdown data for table
    const monthlyBreakdown = [];
    
    // Process each month
    sortedMonths.forEach(month => {
        const monthData = { date: month };
        let monthTotal = 0;
        
        // Calculate total cost for each selected service across all accounts for this month
        selectedServices.forEach(serviceName => {
            let serviceMonthTotal = 0;
            
            registeredAccounts.forEach(account => {
                if (account.data && account.data.monthlyData) {
                    const accountMonthData = account.data.monthlyData.find(data => data.date === month);
                    if (accountMonthData && accountMonthData[serviceName]) {
                        serviceMonthTotal += accountMonthData[serviceName];
                    }
                }
            });
            
            monthData[serviceName] = serviceMonthTotal;
            monthTotal += serviceMonthTotal;
        });
        
        monthData.total = monthTotal;
        monthlyBreakdown.push(monthData);
    });

    // Create chart datasets for each selected service
    const colors = generateColors(selectedServices.length + 1, 'services'); // +1 for total line
    
    selectedServices.forEach((serviceName, index) => {
        const serviceData = monthlyBreakdown.map(month => month[serviceName] || 0);
        
        chartData.datasets.push({
            label: serviceName,
            data: serviceData,
            borderColor: colors[index],
            backgroundColor: colors[index] + '20',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: false
        });
    });

    // Add total line (distinctive styling)
    const totalData = monthlyBreakdown.map(month => month.total || 0);
    chartData.datasets.push({
        label: '合計',
        data: totalData,
        borderColor: '#1e40af',
        backgroundColor: '#1e40af20',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.3,
        fill: false,
        borderDash: [5, 5] // Dashed line for total
    });

    // Calculate service totals and summary statistics
    const serviceTotals = {};
    selectedServices.forEach(serviceName => {
        serviceTotals[serviceName] = monthlyBreakdown.reduce((sum, month) => {
            return sum + (month[serviceName] || 0);
        }, 0);
    });

    const grandTotal = Object.values(serviceTotals).reduce((sum, total) => sum + total, 0);

    return {
        services: selectedServices,
        chartData: chartData,
        monthlyBreakdown: monthlyBreakdown,
        serviceTotals: serviceTotals,
        grandTotal: grandTotal,
        months: sortedMonths
    };
}

/**
 * Display multi-service analysis results (table)
 * @param {Object} analysisData - Analysis data with multi-service breakdown
 * @param {Array} selectedServices - Array of selected service names
 */
function displayMultiServiceAnalysisResults(analysisData, selectedServices) {
    const resultsContainer = document.getElementById('serviceCrossAnalysisResults');
    if (!resultsContainer || !analysisData) return;

    const { monthlyBreakdown, serviceTotals, grandTotal } = analysisData;

    // Create table headers
    let tableHeaders = '<tr><th>月</th>';
    selectedServices.forEach(service => {
        tableHeaders += `<th>${escapeHtml(service)}</th>`;
    });
    tableHeaders += '<th>合計</th></tr>';

    // Create table rows
    const tableRows = monthlyBreakdown.map(monthData => {
        const monthLabel = new Date(monthData.date).toLocaleDateString('ja-JP', { 
            year: 'numeric', 
            month: '2-digit' 
        });
        
        let row = `<tr><td>${monthLabel}</td>`;
        
        selectedServices.forEach(service => {
            const cost = monthData[service] || 0;
            row += `<td>${formatCurrency(cost)}</td>`;
        });
        
        row += `<td><strong>${formatCurrency(monthData.total)}</strong></td></tr>`;
        return row;
    }).join('');

    // Create summary row
    let summaryRow = '<tr class="total-row"><td><strong>合計</strong></td>';
    selectedServices.forEach(service => {
        summaryRow += `<td><strong>${formatCurrency(serviceTotals[service])}</strong></td>`;
    });
    summaryRow += `<td><strong>${formatCurrency(grandTotal)}</strong></td></tr>`;

    const tableHTML = `
        <h4>複数サービス比較分析 - 全アカウント合計</h4>
        <p class="analysis-summary">選択サービス: ${selectedServices.join(', ')} (${selectedServices.length}個)</p>
        <table class="multi-service-table">
            <thead>${tableHeaders}</thead>
            <tbody>
                ${tableRows}
                ${summaryRow}
            </tbody>
        </table>
    `;

    resultsContainer.innerHTML = tableHTML;
}

/**
 * Update multi-service analysis chart
 * @param {Object} analysisData - Analysis data with chart configuration
 * @param {Array} selectedServices - Array of selected service names
 */
function updateMultiServiceAnalysisChart(analysisData, selectedServices) {
    if (!analysisData || !analysisData.chartData) return;

    const chartContainer = document.getElementById('serviceCrossAnalysisChart');
    if (!chartContainer) return;

    // Destroy existing chart
    if (chartInstances.serviceCrossAnalysis) {
        chartInstances.serviceCrossAnalysis.destroy();
        chartInstances.serviceCrossAnalysis = null;
    }

    // Get total display option
    const showTotalCheckbox = document.getElementById('showTotalInGraph');
    const showTotal = showTotalCheckbox ? showTotalCheckbox.checked : true;
    
    // Create chart configuration
    const config = createMultiServiceChartConfig(analysisData, selectedServices, showTotal);

    // Create new chart
    const canvas = chartContainer.querySelector('canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        chartInstances.serviceCrossAnalysis = new Chart(ctx, config);
    }
}

// Make functions available globally for inline event handlers
window.removeAccount = removeAccount;