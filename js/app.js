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
        unusedServices: document.getElementById('unusedServices'),
        lowUsageServices: document.getElementById('lowUsageServices'),
        lowUsageThreshold: document.getElementById('lowUsageThreshold'),
        highCostServices: document.getElementById('highCostServices'),
        
        // Reduction effect comparison - simplified month selection
        reductionEffectChart: document.getElementById('reductionEffectChart'),
        reductionEffectTable: document.getElementById('reductionEffectTable'),
        baseMonth: document.getElementById('baseMonth'),
        targetMonth: document.getElementById('targetMonth'),
        executeComparison: document.getElementById('executeComparison'),
        
        // Period comparison
        startDate: document.getElementById('startDate'),
        endDate: document.getElementById('endDate'),
        comparePeriodBtn: document.getElementById('comparePeriodBtn'),
        periodComparisonChart: document.getElementById('periodComparisonChart'),
        periodComparisonTable: document.getElementById('periodComparisonTable'),
        
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
    if (elements.lowUsageThreshold) {
        elements.lowUsageThreshold.addEventListener('input', handleThresholdChange);
    }
    
    // Reduction effect comparison - simplified month selection
    if (elements.executeComparison) {
        elements.executeComparison.addEventListener('click', handleMonthComparison);
    }
    
    // Period comparison
    if (elements.startDate) {
        elements.startDate.addEventListener('change', validatePeriodSelection);
    }
    if (elements.endDate) {
        elements.endDate.addEventListener('change', validatePeriodSelection);
    }
    if (elements.comparePeriodBtn) {
        elements.comparePeriodBtn.addEventListener('click', handlePeriodComparison);
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
    
    // Create account service trend chart
    displayAccountServiceTrendChart();
    
    // Update account options for service trend chart
    updateAccountServiceTrendOptions();
}

/**
 * Display analysis results
 */
function displayAnalysisResults() {
    if (!aggregatedData || !aggregatedData.serviceAggregation) return;
    
    // Unused services (zero cost)
    const unusedServices = Object.entries(aggregatedData.serviceAggregation)
        .filter(([service, cost]) => cost === 0)
        .map(([service]) => service);
    
    elements.unusedServices.innerHTML = unusedServices.length > 0 
        ? `<ul class="service-list">${unusedServices.map(service => `<li>${escapeHtml(service)}</li>`).join('')}</ul>`
        : '<p>未使用サービスはありません</p>';
    
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
    
    // Reduction effect comparison
    displayReductionEffectComparison();
    
    // Initialize period comparison controls
    validatePeriodSelection();
    
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
    if (!aggregatedData || !aggregatedData.serviceAggregation || !elements.lowUsageServices) return;
    
    const threshold = parseFloat(elements.lowUsageThreshold?.value || 0.01);
    const lowUsageServices = Object.entries(aggregatedData.serviceAggregation)
        .filter(([service, cost]) => cost > 0 && cost < threshold)
        .sort(([,a], [,b]) => a - b);
    
    elements.lowUsageServices.innerHTML = lowUsageServices.length > 0
        ? `<ul class="service-list">${lowUsageServices.map(([service, cost]) => 
            `<li>${escapeHtml(service)} <span class="service-cost">${formatCurrency(cost)}</span></li>`
          ).join('')}</ul>`
        : `<p>閾値 $${threshold.toFixed(2)} 以下のサービスはありません</p>`;
}

/**
 * Display reduction effect comparison
 */
function displayReductionEffectComparison() {
    if (!registeredAccounts.length || !elements.reductionEffectTable) return;
    
    const baseline = elements.comparisonBaseline?.value || 'first-month';
    const reductionData = calculateReductionEffects(baseline);
    
    // Update table
    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>アカウント</th>
                    <th>基準コスト</th>
                    <th>最新コスト</th>
                    <th>削減額</th>
                    <th>削減率</th>
                    <th>効果</th>
                </tr>
            </thead>
            <tbody>
                ${reductionData.map(data => `
                    <tr>
                        <td>${escapeHtml(data.accountName)}</td>
                        <td>${formatCurrency(data.baselineCost)}</td>
                        <td>${formatCurrency(data.latestCost)}</td>
                        <td class="${data.reductionAmount >= 0 ? 'reduction-effect-positive' : 'reduction-effect-negative'}">
                            ${data.reductionAmount >= 0 ? '+' : ''}${formatCurrency(Math.abs(data.reductionAmount))}
                        </td>
                        <td class="${data.reductionPercentage >= 0 ? 'reduction-effect-positive' : 'reduction-effect-negative'}">
                            ${data.reductionPercentage >= 0 ? '+' : ''}${data.reductionPercentage.toFixed(1)}%
                        </td>
                        <td>${getReductionEffectIcon(data.reductionPercentage)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    elements.reductionEffectTable.innerHTML = tableHTML;
    
    // Update chart if needed
    updateReductionEffectChart(reductionData);
}

/**
 * Calculate reduction effects for all accounts
 */
function calculateReductionEffects(baseline) {
    return registeredAccounts.map(account => {
        const monthlyData = account.data.monthlyData;
        if (!monthlyData || monthlyData.length < 2) {
            return {
                accountName: account.name,
                baselineCost: 0,
                latestCost: 0,
                reductionAmount: 0,
                reductionPercentage: 0
            };
        }
        
        const sortedData = monthlyData.sort((a, b) => new Date(a.date) - new Date(b.date));
        const latestCost = sortedData[sortedData.length - 1].totalCost;
        
        let baselineCost;
        switch (baseline) {
            case 'first-month':
                baselineCost = sortedData[0].totalCost;
                break;
            case 'peak-month':
                baselineCost = Math.max(...sortedData.map(d => d.totalCost));
                break;
            case 'previous-month':
                baselineCost = sortedData.length > 1 ? sortedData[sortedData.length - 2].totalCost : latestCost;
                break;
            default:
                baselineCost = sortedData[0].totalCost;
        }
        
        const reductionAmount = baselineCost - latestCost;
        const reductionPercentage = baselineCost > 0 ? (reductionAmount / baselineCost) * 100 : 0;
        
        return {
            accountName: account.name,
            baselineCost,
            latestCost,
            reductionAmount,
            reductionPercentage
        };
    });
}

/**
 * Get reduction effect icon
 */
function getReductionEffectIcon(percentage) {
    if (percentage > 10) return '🎯'; // Excellent reduction
    if (percentage > 5) return '✅'; // Good reduction  
    if (percentage > 0) return '📉'; // Some reduction
    if (percentage === 0) return '➡️'; // No change
    return '📈'; // Cost increase
}

/**
 * Handle comparison baseline change
 */
function handleComparisonBaselineChange(event) {
    const isCustomPeriod = event.target.value === 'custom-period';
    
    // Show/hide custom period controls
    if (elements.customPeriodControls) {
        elements.customPeriodControls.style.display = isCustomPeriod ? 'block' : 'none';
    }
    
    if (isCustomPeriod) {
        // Initialize period selectors with available dates
        initializePeriodSelectors();
    } else if (registeredAccounts.length > 0) {
        displayReductionEffectComparison();
    }
}

/**
 * Initialize month selectors with available dates
 */
function initializePeriodSelectors() {
    if (!aggregatedData || !aggregatedData.monthlyTrends) return;
    
    const availableDates = aggregatedData.monthlyTrends.map(trend => trend.date).sort();
    
    // Clear existing options and populate month selectors
    const selectors = [elements.baseMonth, elements.targetMonth];
    
    selectors.forEach(selector => {
        if (selector) {
            selector.innerHTML = '<option value="">選択してください</option>';
            availableDates.forEach(date => {
                const option = document.createElement('option');
                option.value = date;
                option.textContent = formatDateForDisplay(date);
                selector.appendChild(option);
            });
        }
    });
    
    // Set default to previous month comparison (if we have at least 2 months)
    if (availableDates.length >= 2) {
        // Base month: second to last month (previous month)
        if (elements.baseMonth) elements.baseMonth.value = availableDates[availableDates.length - 2];
        
        // Target month: last month (current month)
        if (elements.targetMonth) elements.targetMonth.value = availableDates[availableDates.length - 1];
        
        // Execute default comparison automatically
        handleMonthComparison();
    }
}

/**
 * Handle month comparison execution
 */
function handleMonthComparison() {
    if (!validateMonthSelection()) return;
    
    const baseMonth = elements.baseMonth.value;
    const targetMonth = elements.targetMonth.value;
    
    // Create period objects for single month comparison
    const basePeriod = {
        start: baseMonth,
        end: baseMonth
    };
    const targetPeriod = {
        start: targetMonth,
        end: targetMonth
    };
    
    const reductionData = calculateCustomPeriodReduction(basePeriod, targetPeriod);
    displayCustomPeriodResults(reductionData, basePeriod, targetPeriod);
}

/**
 * Validate month selection
 */
function validateMonthSelection() {
    const requiredFields = [elements.baseMonth, elements.targetMonth];
    
    for (const field of requiredFields) {
        if (!field || !field.value) {
            alert('ベース月と対象月を選択してください。');
            return false;
        }
    }
    
    // No additional validation needed for single month selection
    return true;
}

/**
 * Calculate reduction effect for custom periods
 */
function calculateCustomPeriodReduction(basePeriod, targetPeriod) {
    if (!registeredAccounts.length) return [];
    
    return registeredAccounts.map(account => {
        // Access the correct data structure - registeredAccounts contains data property
        const accountData = account.data || account;
        const baseCost = calculatePeriodCost(accountData, basePeriod.start, basePeriod.end);
        const targetCost = calculatePeriodCost(accountData, targetPeriod.start, targetPeriod.end);
        
        const difference = targetCost - baseCost;
        const percentage = baseCost > 0 ? ((difference / baseCost) * 100) : 0;
        
        return {
            accountName: account.name || account.accountName,
            baseCost,
            targetCost,
            difference,
            percentage,
            trend: getReductionEffectIcon(percentage)
        };
    });
}

/**
 * Calculate cost for a specific period
 */
function calculatePeriodCost(account, startDate, endDate) {
    let totalCost = 0;
    
    if (!account || !account.monthlyData) {
        console.warn('Invalid account data:', account);
        return 0;
    }
    
    account.monthlyData.forEach(monthData => {
        if (monthData.date >= startDate && monthData.date <= endDate) {
            totalCost += monthData.totalCost;
        }
    });
    
    return totalCost;
}

/**
 * Display custom period comparison results
 */
function displayCustomPeriodResults(reductionData, basePeriod, targetPeriod) {
    if (!elements.reductionEffectTable) return;
    
    const baseLabel = formatPeriodLabel(basePeriod);
    const targetLabel = formatPeriodLabel(targetPeriod);
    
    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>アカウント</th>
                    <th>ベース期間コスト<br>(${baseLabel})</th>
                    <th>対象期間コスト<br>(${targetLabel})</th>
                    <th>差額</th>
                    <th>変化率</th>
                    <th>効果</th>
                </tr>
            </thead>
            <tbody>
                ${reductionData.map(data => `
                    <tr>
                        <td>${escapeHtml(data.accountName)}</td>
                        <td>${formatCurrency(data.baseCost)}</td>
                        <td>${formatCurrency(data.targetCost)}</td>
                        <td>${data.difference >= 0 ? '+' : ''}${formatCurrency(data.difference, 0, true)}</td>
                        <td>${data.percentage >= 0 ? '+' : ''}${data.percentage.toFixed(1)}%</td>
                        <td>${data.trend}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    elements.reductionEffectTable.innerHTML = tableHTML;
    
    // Update chart if available
    updateReductionEffectChart(reductionData);
}

/**
 * Format period label for display
 */
function formatPeriodLabel(period) {
    if (period.start === period.end) {
        return formatDateForDisplay(period.start);
    }
    return `${formatDateForDisplay(period.start)} 〜 ${formatDateForDisplay(period.end)}`;
}

/**
 * Format date for display (YYYY-MM-DD to YYYY年MM月)
 */
function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月`;
}

/**
 * Update reduction effect chart
 */
function updateReductionEffectChart(reductionData) {
    if (!elements.reductionEffectChart || !reductionData.length) return;
    
    // Create or update chart
    const canvas = elements.reductionEffectChart.querySelector('canvas');
    if (canvas && typeof Chart !== 'undefined') {
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart
        if (chartInstances.reductionEffect) {
            chartInstances.reductionEffect.destroy();
        }
        
        const config = createReductionEffectChartConfig(reductionData);
        chartInstances.reductionEffect = new Chart(ctx, config);
    }
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
    
    const options = ['<option value="" selected>全アカウント</option>'];
    registeredAccounts.forEach(account => {
        options.push(`<option value="${escapeHtml(account.name)}">${escapeHtml(account.name)}</option>`);
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
 * Validate period selection
 */
function validatePeriodSelection() {
    if (!elements.startDate || !elements.endDate || !elements.comparePeriodBtn) return;
    
    const startDate = elements.startDate.value;
    const endDate = elements.endDate.value;
    const hasData = registeredAccounts.length > 0;
    
    const isValid = startDate && endDate && startDate <= endDate && hasData;
    elements.comparePeriodBtn.disabled = !isValid;
    
    // Set min/max based on available data
    if (aggregatedData && aggregatedData.dateRange) {
        const dataStart = aggregatedData.dateRange.startDate.substring(0, 7); // YYYY-MM format
        const dataEnd = aggregatedData.dateRange.endDate.substring(0, 7);
        
        if (!elements.startDate.min) {
            elements.startDate.min = dataStart;
            elements.startDate.max = dataEnd;
        }
        if (!elements.endDate.min) {
            elements.endDate.min = dataStart;
            elements.endDate.max = dataEnd;
        }
    }
}

/**
 * Handle period comparison
 */
async function handlePeriodComparison() {
    if (!registeredAccounts.length || !elements.startDate.value || !elements.endDate.value) {
        showMessage('期間を選択してください', 'error');
        return;
    }
    
    try {
        // Show loading state
        elements.comparePeriodBtn.disabled = true;
        elements.comparePeriodBtn.textContent = '比較中...';
        
        const startDate = elements.startDate.value + '-01'; // Add day to make it a full date
        const endDate = elements.endDate.value + '-01';
        
        console.log('Comparing periods:', startDate, 'to', endDate);
        
        // Calculate period comparison data
        const comparisonData = calculatePeriodComparison(startDate, endDate);
        
        // Display results
        displayPeriodComparisonResults(comparisonData);
        
        showMessage('期間比較分析が完了しました', 'success');
        
    } catch (error) {
        console.error('Error in period comparison:', error);
        showMessage(`期間比較エラー: ${error.message}`, 'error');
    } finally {
        // Reset button state
        elements.comparePeriodBtn.disabled = false;
        elements.comparePeriodBtn.textContent = '期間比較実行';
        validatePeriodSelection();
    }
}

/**
 * Calculate period comparison data
 */
function calculatePeriodComparison(startDate, endDate) {
    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate).getTime();
    
    return registeredAccounts.map(account => {
        const monthlyData = account.data.monthlyData || [];
        
        // Filter data within the specified period
        const periodData = monthlyData.filter(month => {
            const monthTime = new Date(month.date).getTime();
            return monthTime >= startTime && monthTime <= endTime;
        });
        
        if (periodData.length === 0) {
            return {
                accountName: account.name,
                totalCost: 0,
                avgMonthlyCost: 0,
                monthCount: 0,
                services: {},
                trend: 'no-data'
            };
        }
        
        // Calculate statistics for the period
        const totalCost = periodData.reduce((sum, month) => sum + month.totalCost, 0);
        const avgMonthlyCost = totalCost / periodData.length;
        
        // Aggregate services for the period
        const services = {};
        periodData.forEach(month => {
            if (month.services) {
                Object.entries(month.services).forEach(([service, cost]) => {
                    services[service] = (services[service] || 0) + cost;
                });
            }
        });
        
        // Calculate trend
        let trend = 'stable';
        if (periodData.length >= 2) {
            const firstMonth = periodData[0].totalCost;
            const lastMonth = periodData[periodData.length - 1].totalCost;
            const change = ((lastMonth - firstMonth) / firstMonth) * 100;
            
            if (change > 5) trend = 'increasing';
            else if (change < -5) trend = 'decreasing';
        }
        
        return {
            accountName: account.name,
            totalCost,
            avgMonthlyCost,
            monthCount: periodData.length,
            services,
            trend,
            startDate,
            endDate
        };
    });
}

/**
 * Display period comparison results
 */
function displayPeriodComparisonResults(comparisonData) {
    if (!elements.periodComparisonTable || !comparisonData.length) return;
    
    // Create summary table
    const tableHTML = `
        <h4>期間サマリー (${comparisonData[0].startDate.substring(0, 7)} 〜 ${comparisonData[0].endDate.substring(0, 7)})</h4>
        <table>
            <thead>
                <tr>
                    <th>アカウント</th>
                    <th>期間内総コスト</th>
                    <th>月平均コスト</th>
                    <th>対象月数</th>
                    <th>トレンド</th>
                </tr>
            </thead>
            <tbody>
                ${comparisonData.map(data => `
                    <tr>
                        <td>${escapeHtml(data.accountName)}</td>
                        <td>${formatCurrency(data.totalCost)}</td>
                        <td>${formatCurrency(data.avgMonthlyCost)}</td>
                        <td>${data.monthCount}ヶ月</td>
                        <td class="growth-${data.trend}">${getTrendIcon(data.trend)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    elements.periodComparisonTable.innerHTML = tableHTML;
    
    // Update chart
    updatePeriodComparisonChart(comparisonData);
}

/**
 * Update period comparison chart
 */
function updatePeriodComparisonChart(comparisonData) {
    if (!elements.periodComparisonChart || !comparisonData.length) return;
    
    // Create or update chart
    const canvas = elements.periodComparisonChart.querySelector('canvas');
    if (canvas && typeof Chart !== 'undefined') {
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart
        if (chartInstances.periodComparison) {
            chartInstances.periodComparison.destroy();
        }
        
        const config = createPeriodComparisonChartConfig(comparisonData);
        chartInstances.periodComparison = new Chart(ctx, config);
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

// Make functions available globally for inline event handlers
window.removeAccount = removeAccount;