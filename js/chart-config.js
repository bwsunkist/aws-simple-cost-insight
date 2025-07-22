/**
 * Chart.js Configuration Module
 * Chart initialization, common settings, and data transformation functions
 */

/**
 * Common chart colors for consistent theming
 */
const CHART_COLORS = {
    primary: '#667eea',
    secondary: '#764ba2', 
    success: '#48bb78',
    danger: '#e53e3e',
    warning: '#ed8936',
    info: '#3182ce',
    light: '#f7fafc',
    dark: '#2d3748',
    accounts: [
        '#667eea', // Primary blue
        '#48bb78', // Green
        '#ed8936', // Orange
        '#e53e3e', // Red
        '#3182ce', // Blue
        '#764ba2', // Purple
        '#38b2ac', // Teal
        '#d69e2e'  // Yellow
    ],
    services: [
        '#ff6384', // Red
        '#36a2eb', // Blue
        '#ffce56', // Yellow
        '#4bc0c0', // Teal
        '#9966ff', // Purple
        '#ff9f40', // Orange
        '#ff6384', // Pink
        '#c9cbcf'  // Gray
    ]
};

/**
 * Common chart configuration defaults
 */
const CHART_DEFAULTS = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        intersect: false,
        mode: 'index'
    },
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                usePointStyle: true,
                padding: 15,
                font: {
                    size: 12
                }
            }
        },
        tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: CHART_COLORS.primary,
            borderWidth: 1,
            cornerRadius: 6,
            displayColors: true,
            callbacks: {
                label: function(context) {
                    const label = context.dataset.label || '';
                    const value = context.parsed.y || context.parsed;
                    
                    // Handle invalid values in tooltip
                    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
                        return `${label}: $0`;
                    }
                    
                    return `${label}: $${Math.round(Math.max(0, value)).toLocaleString()}`;
                }
            }
        }
    },
    scales: {
        x: {
            grid: {
                display: false
            },
            ticks: {
                font: {
                    size: 11
                }
            }
        },
        y: {
            beginAtZero: true,
            grid: {
                color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
                font: {
                    size: 11
                },
                callback: function(value) {
                    // Handle invalid values in tick formatting
                    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
                        return '$0';
                    }
                    return '$' + Math.round(Math.max(0, value)).toLocaleString();
                }
            }
        }
    }
};

/**
 * Initialize Chart.js with global defaults
 */
function initializeChartDefaults() {
    if (typeof Chart !== 'undefined') {
        // Set global defaults
        Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        Chart.defaults.font.size = 12;
        Chart.defaults.color = CHART_COLORS.dark;
        
        // Register required components
        Chart.register(
            Chart.LineController,
            Chart.BarController, 
            Chart.PieController,
            Chart.LineElement,
            Chart.BarElement,
            Chart.PointElement,
            Chart.ArcElement,
            Chart.CategoryScale,
            Chart.LinearScale,
            Chart.Title,
            Chart.Tooltip,
            Chart.Legend
        );
    }
}

/**
 * Create line chart configuration for monthly trends showing all accounts and total
 * @param {Object} data - Aggregated multi-account data
 * @returns {Object} Chart.js configuration
 */
function createMonthlyTrendConfig(data) {
    if (!data || !data.monthlyTrends) {
        return createEmptyChartConfig('月次データがありません');
    }

    const datasets = [];
    const labels = data.monthlyTrends.map(trend => 
        new Date(trend.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
    );

    // Add individual account trends
    data.accounts.forEach((account, index) => {
        datasets.push({
            label: account.name,
            data: data.monthlyTrends.map(trend => trend[account.name] || 0),
            borderColor: CHART_COLORS.accounts[index % CHART_COLORS.accounts.length],
            backgroundColor: CHART_COLORS.accounts[index % CHART_COLORS.accounts.length] + '20',
            fill: false,
            tension: 0.3,
            pointRadius: 3,
            pointHoverRadius: 5,
            borderWidth: 2
        });
    });

    // Add total cost trend with distinctive styling
    datasets.push({
        label: '全体合計',
        data: data.monthlyTrends.map(trend => trend.totalCost),
        borderColor: CHART_COLORS.primary,
        backgroundColor: CHART_COLORS.primary + '15',
        fill: false,
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 3,
        borderDash: [5, 5] // Dashed line for total
    });

    return {
        type: 'line',
        data: { labels, datasets },
        options: {
            ...CHART_DEFAULTS,
            plugins: {
                ...CHART_DEFAULTS.plugins,
                title: {
                    display: true,
                    text: '月次コスト推移（アカウント別 + 全体合計）',
                    font: { size: 14, weight: 'bold' }
                }
            }
        }
    };
}

/**
 * Create bar chart configuration for service comparison
 * @param {Object} data - Aggregated multi-account data  
 * @param {string} period - 'latest' or 'total'
 * @returns {Object} Chart.js configuration
 */
function createServiceComparisonConfig(data, period = 'latest') {
    if (!data || !data.serviceAggregation) {
        return createEmptyChartConfig('サービスデータがありません');
    }

    // Filter out invalid values and ensure numeric values
    const validServiceData = {};
    Object.entries(data.serviceAggregation).forEach(([service, value]) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && isFinite(numValue)) {
            validServiceData[service] = Math.max(0, numValue); // Ensure non-negative
        }
    });

    if (Object.keys(validServiceData).length === 0) {
        return createEmptyChartConfig('有効なサービスデータがありません');
    }

    const services = Object.keys(validServiceData);
    const values = Object.values(validServiceData);

    const datasets = [{
        label: period === 'latest' ? '最新月のコスト' : '全期間合計コスト',
        data: values,
        backgroundColor: CHART_COLORS.services.slice(0, services.length),
        borderColor: CHART_COLORS.services.slice(0, services.length).map(color => color),
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false
    }];

    return {
        type: 'bar',
        data: { 
            labels: services,
            datasets 
        },
        options: {
            ...CHART_DEFAULTS,
            plugins: {
                ...CHART_DEFAULTS.plugins,
                title: {
                    display: true,
                    text: 'サービス別コスト比較',
                    font: { size: 14, weight: 'bold' }
                }
            },
            scales: {
                ...CHART_DEFAULTS.scales,
                x: {
                    ...CHART_DEFAULTS.scales.x,
                    ticks: {
                        ...CHART_DEFAULTS.scales.x.ticks,
                        maxRotation: 45,
                        minRotation: 0
                    }
                }
            }
        }
    };
}


/**
 * Create empty chart configuration for error states
 * @param {string} message - Error message to display
 * @returns {Object} Chart.js configuration
 */
function createEmptyChartConfig(message = 'データがありません') {
    return {
        type: 'bar',
        data: {
            labels: [''],
            datasets: [{
                data: [0],
                backgroundColor: CHART_COLORS.light,
                borderColor: CHART_COLORS.light
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false },
                title: {
                    display: true,
                    text: message,
                    color: CHART_COLORS.dark,
                    font: { size: 14 }
                }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    };
}

/**
 * Update existing chart with new data
 * @param {Chart} chartInstance - Existing Chart.js instance
 * @param {Object} newConfig - New chart configuration
 */
function updateChart(chartInstance, newConfig) {
    if (!chartInstance || !newConfig) return;

    chartInstance.data = newConfig.data;
    chartInstance.options = newConfig.options;
    chartInstance.update('active');
}

/**
 * Destroy chart instance safely
 * @param {Chart} chartInstance - Chart.js instance to destroy
 */
function destroyChart(chartInstance) {
    if (chartInstance && typeof chartInstance.destroy === 'function') {
        chartInstance.destroy();
    }
}

/**
 * Format currency value for display
 * @param {number} value - Numeric value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted currency string
 */
function formatCurrency(value, decimals = 0) {
    // Handle invalid values
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
        return '$0';
    }
    
    // Ensure non-negative value
    const safeValue = Math.max(0, value);
    return '$' + Math.round(safeValue).toLocaleString();
}

/**
 * Create bar chart configuration for reduction effect comparison
 * @param {Array} reductionData - Account reduction effect data
 * @returns {Object} Chart.js configuration
 */
function createReductionEffectChartConfig(reductionData) {
    if (!reductionData || reductionData.length === 0) {
        return createEmptyChartConfig('削減効果データがありません');
    }

    const labels = reductionData.map(data => data.accountName);
    const reductionAmounts = reductionData.map(data => data.reductionAmount);
    const reductionPercentages = reductionData.map(data => data.reductionPercentage);

    return {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '削減額 ($)',
                    data: reductionAmounts,
                    backgroundColor: reductionAmounts.map(amount => 
                        amount >= 0 ? 'rgba(72, 187, 120, 0.7)' : 'rgba(229, 62, 62, 0.7)'
                    ),
                    borderColor: reductionAmounts.map(amount => 
                        amount >= 0 ? 'rgba(72, 187, 120, 1)' : 'rgba(229, 62, 62, 1)'
                    ),
                    borderWidth: 1,
                    yAxisID: 'y',
                },
                {
                    label: '削減率 (%)',
                    data: reductionPercentages,
                    type: 'line',
                    borderColor: CHART_COLORS.primary,
                    backgroundColor: CHART_COLORS.primary + '20',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    yAxisID: 'y1',
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: 'アカウント別削減効果比較',
                    font: { size: 14, weight: 'bold' }
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    ...CHART_DEFAULTS.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const datasetLabel = context.dataset.label || '';
                            const value = context.parsed.y;
                            if (datasetLabel.includes('削減額')) {
                                return `${datasetLabel}: ${value >= 0 ? '+' : ''}${formatCurrency(Math.abs(value))}`;
                            } else {
                                return `${datasetLabel}: ${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 11 } }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: '削減額 ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: '削減率 (%)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    };
}

/**
 * Create period comparison chart configuration
 * @param {Array} periodData - Period comparison data
 * @returns {Object} Chart.js configuration
 */
function createPeriodComparisonChartConfig(periodData) {
    if (!periodData || periodData.length === 0) {
        return createEmptyChartConfig('期間比較データがありません');
    }

    const labels = periodData.map(data => data.accountName);
    const totalCosts = periodData.map(data => data.totalCost);
    const avgMonthlyCosts = periodData.map(data => data.avgMonthlyCost);

    return {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '期間内総コスト ($)',
                    data: totalCosts,
                    backgroundColor: 'rgba(102, 126, 234, 0.7)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 1,
                    yAxisID: 'y',
                },
                {
                    label: '月平均コスト ($)',
                    data: avgMonthlyCosts,
                    type: 'line',
                    borderColor: CHART_COLORS.warning,
                    backgroundColor: CHART_COLORS.warning + '20',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    yAxisID: 'y1',
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: '期間指定コスト比較',
                    font: { size: 14, weight: 'bold' }
                },
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    ...CHART_DEFAULTS.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const datasetLabel = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${datasetLabel}: ${formatCurrency(value)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 11 } }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: '総コスト ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: '月平均コスト ($)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    };
}

/**
 * Create service stacked chart configuration
 * @param {Object} data - Aggregated multi-account data
 * @param {string} accountFilter - 'all' or specific account name
 * @param {number} topServicesCount - Number of top services to show individually (1-10)
 * @returns {Object} Chart.js configuration
 */
function createServiceStackedConfig(data, accountFilter = 'all', topServicesCount = 5) {
    if (!data || !data.monthlyTrends) {
        return createEmptyChartConfig('月次データがありません');
    }

    // Get monthly data for stacked chart
    const monthlyData = getStackedMonthlyData(data, accountFilter, topServicesCount);
    
    if (!monthlyData.labels.length) {
        return createEmptyChartConfig('表示するデータがありません');
    }

    const { labels, datasets } = monthlyData;

    return {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: `月次サービス別コスト積み上げ ${accountFilter === 'all' ? '(全アカウント)' : `(${accountFilter})`}`,
                    font: { size: 14, weight: 'bold' }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    ...CHART_DEFAULTS.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const datasetLabel = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${datasetLabel}: ${formatCurrency(value)}`;
                        },
                        footer: function(tooltipItems) {
                            let total = 0;
                            tooltipItems.forEach(item => total += item.parsed.y);
                            return `合計: ${formatCurrency(total)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: { font: { size: 11 } }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'コスト ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    };
}

/**
 * Get monthly data for stacked chart
 * @param {Object} data - Aggregated data
 * @param {string} accountFilter - Account filter
 * @param {number} topServicesCount - Number of top services
 * @returns {Object} Labels and datasets for chart
 */
function getStackedMonthlyData(data, accountFilter, topServicesCount) {
    // Get all service names and calculate total costs
    const serviceMap = new Map();
    
    // Collect service data from monthly trends
    data.monthlyTrends.forEach(trend => {
        const monthData = getMonthDataForAccount(data, trend.date, accountFilter);
        
        Object.entries(monthData.services || {}).forEach(([service, cost]) => {
            if (service !== '合計コスト') {
                const currentTotal = serviceMap.get(service) || 0;
                serviceMap.set(service, currentTotal + cost);
            }
        });
    });

    // Sort services by total cost and get top N
    const sortedServices = Array.from(serviceMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, topServicesCount)
        .map(entry => entry[0]);

    // Add "その他" if there are more services
    const showOthers = serviceMap.size > topServicesCount;
    if (showOthers) {
        sortedServices.push('その他');
    }

    // Create labels (months)
    const labels = data.monthlyTrends.map(trend => 
        new Date(trend.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
    );

    // Create datasets for each service
    const colors = generateColors(sortedServices.length, 'services');
    const datasets = sortedServices.map((service, index) => {
        const monthlyValues = data.monthlyTrends.map(trend => {
            const monthData = getMonthDataForAccount(data, trend.date, accountFilter);
            
            if (service === 'その他') {
                // Calculate "others" cost
                let othersTotal = 0;
                Object.entries(monthData.services || {}).forEach(([serviceName, cost]) => {
                    if (serviceName !== '合計コスト' && !sortedServices.slice(0, -1).includes(serviceName)) {
                        othersTotal += cost;
                    }
                });
                return othersTotal;
            } else {
                return monthData.services?.[service] || 0;
            }
        });

        return {
            label: service,
            data: monthlyValues,
            backgroundColor: colors[index],
            borderColor: colors[index],
            borderWidth: 1
        };
    });

    return { labels, datasets };
}

/**
 * Get month data for specific account or all accounts
 * @param {Object} data - Aggregated data
 * @param {string} date - Month date
 * @param {string} accountFilter - Account filter
 * @returns {Object} Month data with services
 */
function getMonthDataForAccount(data, date, accountFilter) {
    if (accountFilter === 'all') {
        // Aggregate all accounts for this month
        const monthData = { services: {} };
        
        data.accounts.forEach(account => {
            const accountMonthData = getAccountMonthData(account.name, date);
            if (accountMonthData) {
                // Convert direct service properties to services object
                Object.entries(accountMonthData).forEach(([key, cost]) => {
                    if (key !== 'date' && key !== 'totalCost' && typeof cost === 'number') {
                        monthData.services[key] = (monthData.services[key] || 0) + cost;
                    }
                });
            }
        });
        
        return monthData;
    } else {
        // Get specific account data and convert to services format
        const accountMonthData = getAccountMonthData(accountFilter, date);
        if (!accountMonthData) return { services: {} };
        
        const services = {};
        Object.entries(accountMonthData).forEach(([key, cost]) => {
            if (key !== 'date' && key !== 'totalCost' && typeof cost === 'number') {
                services[key] = cost;
            }
        });
        
        return { services };
    }
}

/**
 * Get specific account's month data
 * @param {string} accountName - Account name
 * @param {string} date - Month date
 * @returns {Object|null} Month data
 */
function getAccountMonthData(accountName, date) {
    // Find the account in registered accounts
    const account = registeredAccounts.find(acc => acc.name === accountName);
    if (!account || !account.data.monthlyData) return null;
    
    // Find the month data
    return account.data.monthlyData.find(month => month.date === date);
}

/**
 * Generate chart colors for dynamic datasets
 * @param {number} count - Number of colors needed
 * @param {string} type - 'accounts' or 'services'
 * @returns {Array} Array of color strings
 */
function generateColors(count, type = 'services') {
    const baseColors = CHART_COLORS[type] || CHART_COLORS.services;
    const colors = [];
    
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    
    return colors;
}

/**
 * Get colors for service composition chart with special handling for "その他"
 * @param {Array} data - Filtered data array
 * @param {number} topServicesCount - Number of top services
 * @returns {Array} Array of color strings
 */
function getCompositionColors(data, topServicesCount) {
    const colors = [];
    const othersColor = '#d1d5db'; // Light gray for "その他"
    
    data.forEach((item, index) => {
        if (item.service === 'その他') {
            colors.push(othersColor);
        } else {
            colors.push(CHART_COLORS.services[index % CHART_COLORS.services.length]);
        }
    });
    
    return colors;
}

/**
 * Create 100% stacked bar chart configuration for account comparison
 * @param {Object} data - Aggregated multi-account data
 * @param {number} topServicesCount - Number of top services to show individually (1-10)
 * @returns {Object} Chart configuration for 100% stacked bar chart
 */
function createAccountComparisonChartConfig(data, topServicesCount = 5) {
    if (!data || !data.accounts || data.accounts.length === 0) {
        return createEmptyChartConfig('アカウントデータがありません');
    }

    // Collect all services across all accounts
    const allServices = new Set();
    const accountsData = [];

    // Process each account
    data.accounts.forEach(account => {
        const accountServiceData = getAccountServiceData(account.name, data);
        
        if (!accountServiceData || Object.keys(accountServiceData).length === 0) {
            return; // Skip accounts with no data
        }

        // Filter out invalid values
        const validServiceData = {};
        Object.entries(accountServiceData).forEach(([service, value]) => {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && isFinite(numValue) && numValue > 0) {
                validServiceData[service] = numValue;
                allServices.add(service);
            }
        });

        if (Object.keys(validServiceData).length > 0) {
            accountsData.push({
                account: account.name,
                services: validServiceData
            });
        }
    });

    if (accountsData.length === 0) {
        return createEmptyChartConfig('有効なデータがありません');
    }

    // New algorithm: Union of top services per account
    // Step 1: Get top services from each account individually
    const servicesPerAccount = Math.max(2, Math.ceil(topServicesCount / accountsData.length));
    const importantServicesSet = new Set();
    
    accountsData.forEach(account => {
        // Get top services for this account
        const accountServices = Object.entries(account.services)
            .sort(([,a], [,b]) => b - a)
            .slice(0, servicesPerAccount)
            .map(([service]) => service);
        
        // Add to important services set
        accountServices.forEach(service => importantServicesSet.add(service));
    });
    
    // Step 2: Calculate totals for important services only
    const serviceTotals = {};
    importantServicesSet.forEach(service => {
        serviceTotals[service] = accountsData.reduce((sum, account) => {
            return sum + (account.services[service] || 0);
        }, 0);
    });

    // Step 3: Sort important services by total value
    const sortedImportantServices = Object.entries(serviceTotals)
        .sort(([,a], [,b]) => b - a)
        .map(([service]) => service);
    
    // Step 4: Select final top services and others
    // Fix: Ensure we show exactly topServicesCount services PLUS Others separately
    const topServices = sortedImportantServices.slice(0, topServicesCount);
    const otherImportantServices = sortedImportantServices.slice(topServicesCount);
    
    // Step 5: Add remaining services that weren't in any account's top list
    const remainingServices = [];
    allServices.forEach(service => {
        if (!importantServicesSet.has(service)) {
            const total = accountsData.reduce((sum, account) => {
                return sum + (account.services[service] || 0);
            }, 0);
            if (total > 0) {
                remainingServices.push(service);
            }
        }
    });
    
    // Combine other important services + remaining services for "Others"
    const otherServices = [...otherImportantServices, ...remainingServices];

    // Create datasets for each service
    const datasets = [];
    // Always allocate colors for topServicesCount + 1 (for Others), even if Others might be empty
    const colors = generateColors(topServices.length + 1);

    // Add datasets for top services
    topServices.forEach((service, index) => {
        const serviceData = accountsData.map(account => {
            const total = Object.values(account.services).reduce((sum, val) => sum + val, 0);
            const serviceValue = account.services[service] || 0;
            return total > 0 ? (serviceValue / total) * 100 : 0;
        });

        datasets.push({
            label: service,
            data: serviceData,
            backgroundColor: colors[index],
            borderColor: colors[index],
            borderWidth: 1
        });
    });

    // Always add dataset for "その他", even if empty (to maintain UI consistency)
    const othersData = accountsData.map(account => {
        const total = Object.values(account.services).reduce((sum, val) => sum + val, 0);
        const othersValue = otherServices.reduce((sum, service) => {
            return sum + (account.services[service] || 0);
        }, 0);
        return total > 0 ? (othersValue / total) * 100 : 0;
    });

    datasets.push({
        label: 'その他',
        data: othersData,
        backgroundColor: '#9CA3AF',
        borderColor: '#9CA3AF',
        borderWidth: 1
    });

    // Calculate total costs for each account
    const accountTotals = accountsData.map(account => {
        const total = Object.values(account.services).reduce((sum, val) => sum + val, 0);
        return total;
    });

    // Calculate overall totals using the same service selection as individual accounts
    const overallServiceTotals = {};
    importantServicesSet.forEach(service => {
        overallServiceTotals[service] = accountsData.reduce((sum, account) => {
            return sum + (account.services[service] || 0);
        }, 0);
    });
    
    // Add remaining services to overall totals
    allServices.forEach(service => {
        if (!overallServiceTotals[service]) {
            const total = accountsData.reduce((sum, account) => {
                return sum + (account.services[service] || 0);
            }, 0);
            if (total > 0) {
                overallServiceTotals[service] = total;
            }
        }
    });

    // Use the same top services as individual accounts for consistency
    const overallTopServices = topServices;
    const overallOtherServices = Object.keys(overallServiceTotals).filter(service => 
        !topServices.includes(service)
    );

    // Calculate overall total
    const grandTotal = Object.values(overallServiceTotals).reduce((sum, val) => sum + val, 0);

    // Add overall total data to datasets
    overallTopServices.forEach((service, index) => {
        if (datasets[index]) {
            const serviceTotal = overallServiceTotals[service];
            const overallPercentage = grandTotal > 0 ? (serviceTotal / grandTotal) * 100 : 0;
            datasets[index].data.push(overallPercentage);
        }
    });

    // Always add others data to maintain consistency (even if 0%)
    const othersTotal = overallOtherServices.reduce((sum, service) => {
        return sum + (overallServiceTotals[service] || 0);
    }, 0);
    const othersPercentage = grandTotal > 0 ? (othersTotal / grandTotal) * 100 : 0;
    datasets[datasets.length - 1].data.push(othersPercentage);

    // Create labels array including overall total
    const labels = [
        ...accountsData.map((account, index) => {
            const total = accountTotals[index];
            return `${account.account}\n${formatCurrency(total)}`;
        }),
        `全体合計\n${formatCurrency(grandTotal)}`
    ];

    // Update accountTotals to include grand total for tooltip calculations
    const allTotals = [...accountTotals, grandTotal];

    return {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'x',
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'アカウント',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        display: true,
                        color: '#f1f5f9'
                    },
                    title: {
                        display: true,
                        text: '構成比 (%)',
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: function(context) {
                            const dataIndex = context[0].dataIndex;
                            const total = allTotals[dataIndex];
                            
                            if (dataIndex >= accountsData.length) {
                                // Overall total bar
                                return `全体合計 (総額: ${formatCurrency(total)})`;
                            } else {
                                // Individual account bar
                                const account = accountsData[dataIndex];
                                return `${account.account} (総額: ${formatCurrency(total)})`;
                            }
                        },
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const percentage = context.parsed.y;
                            const dataIndex = context.dataIndex;
                            const total = allTotals[dataIndex];
                            const actualValue = (percentage / 100) * total;
                            return `${label}: ${percentage.toFixed(1)}% (${formatCurrency(actualValue)})`;
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            }
        }
    };
}

/**
 * Create line chart configuration for multi-account service trends
 * Shows account totals plus top service trends across all accounts
 * @param {Object} data - Aggregated multi-account data
 * @param {string} accountName - Target account name (if empty, shows all accounts)
 * @param {number} topServicesCount - Number of top services to show individually
 * @returns {Object} Chart configuration for line chart
 */
function createAccountServiceTrendConfig(data, accountName, topServicesCount = 5) {
    if (!data || !data.monthlyTrends || data.monthlyTrends.length === 0) {
        return createEmptyChartConfig('月次データがありません');
    }

    // If no account specified, show all accounts + top services
    const showAllAccounts = !accountName || accountName === '';
    
    if (!showAllAccounts) {
        // Single account mode (existing functionality)
        const targetAccount = data.accounts.find(acc => acc.name === accountName);
        if (!targetAccount) {
            return createEmptyChartConfig(`アカウント「${accountName}」が見つかりません`);
        }
    }

    // Create monthly labels
    const labels = data.monthlyTrends.map(trend => 
        new Date(trend.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
    );

    // Build datasets
    const datasets = [];

    if (showAllAccounts) {
        // All accounts mode: show all account totals + top services across all accounts
        
        // Add account total lines first
        data.accounts.forEach((account, index) => {
            const accountData = data.monthlyTrends.map(trend => trend[account.name] || 0);
            const color = CHART_COLORS.accounts[index % CHART_COLORS.accounts.length];
            
            datasets.push({
                label: `${account.name}`,
                data: accountData,
                borderColor: color,
                backgroundColor: color + '20',
                borderWidth: 3,
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.3,
                fill: false
            });
        });

        // Add overall total line
        const totalData = data.monthlyTrends.map(trend => trend.totalCost);
        datasets.push({
            label: '全体合計',
            data: totalData,
            borderColor: CHART_COLORS.primary,
            backgroundColor: CHART_COLORS.primary + '20',
            borderWidth: 4,
            pointRadius: 6,
            pointHoverRadius: 8,
            tension: 0.3,
            fill: false,
            borderDash: [5, 5]
        });

        // Calculate top services across all accounts
        const serviceMap = new Map();
        data.accounts.forEach(account => {
            Object.entries(account.summary || {}).forEach(([service, cost]) => {
                if (service !== '合計コスト') {
                    const currentTotal = serviceMap.get(service) || 0;
                    serviceMap.set(service, currentTotal + cost);
                }
            });
        });

        // Get top services
        const sortedServices = Array.from(serviceMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, topServicesCount)
            .map(entry => entry[0]);
        
        // Add "その他" for remaining services
        const otherServices = Array.from(serviceMap.keys()).filter(service => 
            !sortedServices.includes(service)
        );
        if (otherServices.length > 0) {
            sortedServices.push('その他');
        }

        // Add service trend lines
        const serviceColors = generateColors(sortedServices.length, 'services');
        sortedServices.forEach((service, index) => {
            const serviceData = data.monthlyTrends.map(trend => {
                if (service === 'その他') {
                    return otherServices.reduce((sum, otherService) => {
                        return sum + (trend.serviceBreakdown?.[otherService] || 0);
                    }, 0);
                } else {
                    return trend.serviceBreakdown?.[service] || 0;
                }
            });

            const color = service === 'その他' ? '#9CA3AF' : serviceColors[index];
            
            datasets.push({
                label: service,
                data: serviceData,
                borderColor: color,
                backgroundColor: color + '20',
                borderWidth: 1.5,
                pointRadius: 3,
                pointHoverRadius: 5,
                tension: 0.3,
                fill: false,
                borderDash: service === 'その他' ? [3, 3] : undefined
            });
        });

    } else {
        // Single account mode (existing functionality)
        const accountServicesByMonth = data.monthlyTrends.map(trend => {
            const monthData = getMonthDataForAccount(data, trend.date, accountName);
            return monthData.services || {};
        });

        // Calculate total costs for each service across all months
        const serviceMap = new Map();
        accountServicesByMonth.forEach(monthServices => {
            Object.entries(monthServices).forEach(([service, cost]) => {
                if (service !== '合計コスト') {
                    const currentTotal = serviceMap.get(service) || 0;
                    serviceMap.set(service, currentTotal + cost);
                }
            });
        });

        // Get top services for this account
        const sortedServices = Array.from(serviceMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, topServicesCount)
            .map(entry => entry[0]);
        
        // Always add "その他" for remaining services
        const otherServices = Array.from(serviceMap.keys()).filter(service => 
            !sortedServices.includes(service)
        );
        if (otherServices.length > 0) {
            sortedServices.push('その他');
        }

        // Generate colors - account total gets a distinct color, services get standard colors
        const totalColor = CHART_COLORS.accounts[0]; // Use account color for total
        const serviceColors = generateColors(sortedServices.length, 'services');

        // Add account total line (prominent)
        const totalData = data.monthlyTrends.map(trend => {
            const monthData = getMonthDataForAccount(data, trend.date, accountName);
            return Object.values(monthData.services || {})
                .reduce((sum, cost) => sum + cost, 0);
        });

        datasets.push({
            label: `${accountName} 合計`,
            data: totalData,
            borderColor: totalColor,
            backgroundColor: totalColor + '20',
            borderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8,
            tension: 0.3,
            fill: false
        });

        // Add individual service lines (thinner)
        sortedServices.forEach((service, index) => {
            const serviceData = accountServicesByMonth.map(monthServices => {
                if (service === 'その他') {
                    // Calculate "others" total
                    return otherServices.reduce((sum, otherService) => {
                        return sum + (monthServices[otherService] || 0);
                    }, 0);
                } else {
                    return monthServices[service] || 0;
                }
            });

            const color = service === 'その他' ? '#9CA3AF' : serviceColors[index];
            
            datasets.push({
                label: service,
                data: serviceData,
                borderColor: color,
                backgroundColor: color + '20',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: false,
            borderDash: service === 'その他' ? [5, 5] : undefined // Dashed line for "Others"
        });
    });

    return {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: showAllAccounts ? 
                        'アカウント別コスト推移 + 上位サービス別詳細' : 
                        `${accountName} アカウント - サービス別コスト推移`,
                    font: { size: 14, weight: 'bold' }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 11 },
                        generateLabels: function(chart) {
                            const original = Chart.defaults.plugins.legend.labels.generateLabels;
                            const labels = original.call(this, chart);
                            
                            // Put account total first, then services
                            labels.sort((a, b) => {
                                if (a.text.includes('合計')) return -1;
                                if (b.text.includes('合計')) return 1;
                                if (a.text === 'その他') return 1;
                                if (b.text === 'その他') return -1;
                                return 0;
                            });
                            
                            return labels;
                        }
                    }
                },
                tooltip: {
                    ...CHART_DEFAULTS.plugins.tooltip,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            const datasetLabel = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${datasetLabel}: ${formatCurrency(value)}`;
                        },
                        afterBody: function(context) {
                            if (context.length > 1) {
                                const totalValue = context.find(item => 
                                    item.dataset.label.includes('合計')
                                )?.parsed.y || 0;
                                
                                const serviceValues = context.filter(item => 
                                    !item.dataset.label.includes('合計')
                                );
                                
                                if (serviceValues.length > 0 && totalValue > 0) {
                                    return serviceValues.map(item => {
                                        const percentage = ((item.parsed.y / totalValue) * 100).toFixed(1);
                                        return `  ${item.dataset.label}: ${percentage}%`;
                                    });
                                }
                            }
                            return [];
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 11 } }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'コスト ($)',
                        font: { size: 12, weight: 'bold' }
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    };
}

/**
 * Get service data for a specific account
 * @param {string} accountName - Account name
 * @param {Object} data - Aggregated data
 * @returns {Object} Service cost data for the account
 */
function getAccountServiceData(accountName, data) {
    // Find the account in registered accounts
    const account = registeredAccounts.find(acc => acc.name === accountName);
    if (!account || !account.data.monthlyData || account.data.monthlyData.length === 0) {
        return {};
    }
    
    // Get the latest month's data (assuming monthlyData is sorted chronologically)
    const latestMonthData = account.data.monthlyData[account.data.monthlyData.length - 1];
    if (!latestMonthData) {
        return {};
    }
    
    // Convert month data to service data format
    const serviceData = {};
    Object.entries(latestMonthData).forEach(([key, value]) => {
        if (key !== 'date' && key !== 'totalCost' && typeof value === 'number' && value > 0) {
            serviceData[key] = value;
        }
    });
    
    return serviceData;
}

// Export functions for module use and testing
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment (for testing)
    module.exports = {
        CHART_COLORS,
        CHART_DEFAULTS,
        initializeChartDefaults,
        createMonthlyTrendConfig,
        createServiceComparisonConfig,
        createServiceStackedConfig,
        createReductionEffectChartConfig,
        createPeriodComparisonChartConfig,
        createEmptyChartConfig,
        updateChart,
        destroyChart,
        formatCurrency,
        generateColors,
        createAccountComparisonChartConfig,
        createAccountServiceTrendConfig,
        getAccountServiceData
    };
}