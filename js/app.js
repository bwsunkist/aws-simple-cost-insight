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
        serviceCompositionChart: document.getElementById('serviceCompositionChart'),
        
        // Analysis section
        analysisSection: document.getElementById('analysisSection'),
        unusedServices: document.getElementById('unusedServices'),
        lowUsageServices: document.getElementById('lowUsageServices'),
        lowUsageThreshold: document.getElementById('lowUsageThreshold'),
        highCostServices: document.getElementById('highCostServices'),
        
        // Chart controls
        trendViewRadios: document.querySelectorAll('input[name="trendView"]'),
        serviceComparisonPeriod: document.getElementById('serviceComparisonPeriod'),
        compositionAccount: document.getElementById('compositionAccount'),
        growthRateTable: document.getElementById('growthRateTable')
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
    elements.trendViewRadios.forEach(radio => {
        radio.addEventListener('change', handleTrendViewChange);
    });
    
    if (elements.serviceComparisonPeriod) {
        elements.serviceComparisonPeriod.addEventListener('change', handleServicePeriodChange);
    }
    
    if (elements.compositionAccount) {
        elements.compositionAccount.addEventListener('change', handleCompositionAccountChange);
    }
    
    // Threshold setting
    if (elements.lowUsageThreshold) {
        elements.lowUsageThreshold.addEventListener('input', handleThresholdChange);
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
                <button class="view-btn" onclick="viewAccountDetails(${index})">詳細</button>
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
    Object.values(chartInstances).forEach(chart => destroyChart(chart));
    chartInstances = {};
    
    // Create monthly trend chart
    const trendViewMode = document.querySelector('input[name="trendView"]:checked')?.value || 'accounts';
    const trendConfig = createMonthlyTrendConfig(aggregatedData, trendViewMode);
    chartInstances.monthlyTrend = new Chart(elements.monthlyTrendChart, trendConfig);
    
    // Create service comparison chart
    const comparisonPeriod = elements.serviceComparisonPeriod?.value || 'total';
    const comparisonConfig = createServiceComparisonConfig(aggregatedData, comparisonPeriod);
    chartInstances.serviceComparison = new Chart(elements.serviceComparisonChart, comparisonConfig);
    
    // Create service composition chart
    const compositionAccount = elements.compositionAccount?.value || 'all';
    const compositionConfig = createServiceCompositionConfig(aggregatedData, compositionAccount);
    chartInstances.serviceComposition = new Chart(elements.serviceCompositionChart, compositionConfig);
    
    // Update composition account options
    updateCompositionAccountOptions();
}

/**
 * Display analysis results
 */
function displayAnalysisResults() {
    if (!aggregatedData) return;
    
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
}

/**
 * Display growth rate table
 */
function displayGrowthRateTable() {
    if (!registeredAccounts.length) return;
    
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
            </tbody>
        </table>
    `;
    
    elements.growthRateTable.innerHTML = tableHTML;
}

/**
 * Handle trend view change
 */
function handleTrendViewChange(event) {
    if (aggregatedData && chartInstances.monthlyTrend) {
        const newConfig = createMonthlyTrendConfig(aggregatedData, event.target.value);
        updateChart(chartInstances.monthlyTrend, newConfig);
    }
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
        const newConfig = createServiceCompositionConfig(aggregatedData, event.target.value);
        updateChart(chartInstances.serviceComposition, newConfig);
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
    if (!aggregatedData || !elements.lowUsageServices) return;
    
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
 * Update composition account select options
 */
function updateCompositionAccountOptions() {
    if (!elements.compositionAccount || !aggregatedData) return;
    
    const options = ['<option value="all">全アカウント</option>'];
    registeredAccounts.forEach(account => {
        options.push(`<option value="${escapeHtml(account.name)}">${escapeHtml(account.name)}</option>`);
    });
    
    elements.compositionAccount.innerHTML = options.join('');
}

/**
 * View account details (placeholder)
 */
function viewAccountDetails(index) {
    const account = registeredAccounts[index];
    if (account) {
        alert(`アカウント詳細: ${account.name}\nファイル: ${account.fileName}\n総コスト: ${formatCurrency(account.data.totalCost)}\n期間: ${account.data.dataRange.monthCount}ヶ月`);
    }
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

// Make functions available globally for inline event handlers
window.viewAccountDetails = viewAccountDetails;
window.removeAccount = removeAccount;