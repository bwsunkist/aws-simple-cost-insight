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
 * Create pie chart configuration for service composition
 * @param {Object} data - Aggregated multi-account data
 * @param {string} accountFilter - 'all' or specific account name
 * @returns {Object} Chart.js configuration
 */
function createServiceCompositionConfig(data, accountFilter = 'all') {
    if (!data || !data.serviceAggregation) {
        return createEmptyChartConfig('構成比データがありません');
    }

    let serviceData = data.serviceAggregation;
    let titleText = 'サービス別構成比（全アカウント）';

    // Filter by specific account if requested
    if (accountFilter !== 'all') {
        // This would need account-specific data - for now use aggregated
        titleText = `サービス別構成比（${accountFilter}）`;
    }

    // Filter out invalid values and ensure numeric values
    const validServiceData = {};
    Object.entries(serviceData).forEach(([service, value]) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && isFinite(numValue) && numValue > 0) {
            validServiceData[service] = numValue;
        }
    });

    if (Object.keys(validServiceData).length === 0) {
        return createEmptyChartConfig('有効なサービスデータがありません');
    }

    const services = Object.keys(validServiceData);
    const values = Object.values(validServiceData);
    const total = values.reduce((sum, value) => sum + value, 0);

    if (total <= 0) {
        return createEmptyChartConfig('合計コストが0です');
    }

    // Calculate percentages with proper validation
    const filteredData = services
        .map((service, index) => {
            const value = values[index];
            const percentage = (value / total) * 100;
            return {
                service,
                value,
                percentage: isFinite(percentage) ? percentage : 0
            };
        })
        .filter(item => item.value > 0 && isFinite(item.percentage))
        .sort((a, b) => b.value - a.value);

    return {
        type: 'pie',
        data: {
            labels: filteredData.map(item => `${item.service} (${item.percentage.toFixed(1)}%)`),
            datasets: [{
                data: filteredData.map(item => item.value),
                backgroundColor: CHART_COLORS.services.slice(0, filteredData.length),
                borderColor: '#fff',
                borderWidth: 2,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: { size: 11 }
                    }
                },
                title: {
                    display: true,
                    text: titleText,
                    font: { size: 14, weight: 'bold' }
                },
                tooltip: {
                    ...CHART_DEFAULTS.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: $${Math.round(value).toLocaleString()} (${percentage}%)`;
                        }
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

// Export functions for module use and testing
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment (for testing)
    module.exports = {
        CHART_COLORS,
        CHART_DEFAULTS,
        initializeChartDefaults,
        createMonthlyTrendConfig,
        createServiceComparisonConfig,
        createServiceCompositionConfig,
        createServiceStackedConfig,
        createReductionEffectChartConfig,
        createPeriodComparisonChartConfig,
        createEmptyChartConfig,
        updateChart,
        destroyChart,
        formatCurrency,
        generateColors
    };
}