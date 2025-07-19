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
                    return `${label}: $${value.toFixed(4)}`;
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
                    return '$' + value.toFixed(4);
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
 * Create line chart configuration for monthly trends
 * @param {Object} data - Aggregated multi-account data
 * @param {string} viewMode - 'accounts' or 'total'
 * @returns {Object} Chart.js configuration
 */
function createMonthlyTrendConfig(data, viewMode = 'accounts') {
    if (!data || !data.monthlyTrends) {
        return createEmptyChartConfig('月次データがありません');
    }

    const datasets = [];
    const labels = data.monthlyTrends.map(trend => 
        new Date(trend.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
    );

    if (viewMode === 'total') {
        // Total cost trend
        datasets.push({
            label: '全体合計',
            data: data.monthlyTrends.map(trend => trend.totalCost),
            borderColor: CHART_COLORS.primary,
            backgroundColor: CHART_COLORS.primary + '20',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6
        });
    } else {
        // Account-wise trends
        data.accounts.forEach((account, index) => {
            datasets.push({
                label: account.name,
                data: data.monthlyTrends.map(trend => trend[account.name] || 0),
                borderColor: CHART_COLORS.accounts[index % CHART_COLORS.accounts.length],
                backgroundColor: CHART_COLORS.accounts[index % CHART_COLORS.accounts.length] + '20',
                fill: false,
                tension: 0.3,
                pointRadius: 3,
                pointHoverRadius: 5
            });
        });
    }

    return {
        type: 'line',
        data: { labels, datasets },
        options: {
            ...CHART_DEFAULTS,
            plugins: {
                ...CHART_DEFAULTS.plugins,
                title: {
                    display: true,
                    text: viewMode === 'total' ? '月次コスト推移（全体）' : '月次コスト推移（アカウント別）',
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

    const services = Object.keys(data.serviceAggregation);
    const values = Object.values(data.serviceAggregation);

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

    const services = Object.keys(serviceData);
    const values = Object.values(serviceData);
    const total = values.reduce((sum, value) => sum + value, 0);

    // Filter out zero values and calculate percentages
    const filteredData = services
        .map((service, index) => ({
            service,
            value: values[index],
            percentage: (values[index] / total) * 100
        }))
        .filter(item => item.value > 0)
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
                            return `${label}: $${value.toFixed(4)} (${percentage}%)`;
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
function formatCurrency(value, decimals = 4) {
    if (typeof value !== 'number' || isNaN(value)) return '$0.0000';
    return '$' + value.toFixed(decimals);
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
        createEmptyChartConfig,
        updateChart,
        destroyChart,
        formatCurrency,
        generateColors
    };
}