/**
 * Chart Configuration Tests
 * Unit tests for chart-config.js functions
 */

const {
    CHART_COLORS,
    CHART_DEFAULTS,
    createMonthlyTrendConfig,
    createServiceComparisonConfig,
    createServiceCompositionConfig,
    createEmptyChartConfig,
    formatCurrency,
    generateColors
} = require('../js/chart-config.js');

describe('Chart Configuration Module', () => {
    
    // Test data
    const mockAggregatedData = {
        accounts: [
            { name: 'dev' },
            { name: 'staging' },
            { name: 'prod' }
        ],
        monthlyTrends: [
            {
                date: '2025-01-01',
                totalCost: 100.50,
                dev: 25.20,
                staging: 30.30,
                prod: 45.00
            },
            {
                date: '2025-02-01', 
                totalCost: 120.75,
                dev: 28.50,
                staging: 35.25,
                prod: 57.00
            },
            {
                date: '2025-03-01',
                totalCost: 95.25,
                dev: 22.75,
                staging: 28.50,
                prod: 44.00
            }
        ],
        serviceAggregation: {
            'S3': 45.20,
            'CloudWatch': 15.30,
            'Lambda': 25.45,
            'EC2': 67.80,
            'RDS': 12.25
        }
    };

    describe('CHART_COLORS constants', () => {
        test('should contain required color properties', () => {
            expect(CHART_COLORS).toHaveProperty('primary');
            expect(CHART_COLORS).toHaveProperty('accounts');
            expect(CHART_COLORS).toHaveProperty('services');
            expect(Array.isArray(CHART_COLORS.accounts)).toBe(true);
            expect(Array.isArray(CHART_COLORS.services)).toBe(true);
        });

        test('should have sufficient colors for accounts and services', () => {
            expect(CHART_COLORS.accounts.length).toBeGreaterThanOrEqual(8);
            expect(CHART_COLORS.services.length).toBeGreaterThanOrEqual(8);
        });
    });

    describe('CHART_DEFAULTS configuration', () => {
        test('should have responsive and maintainAspectRatio settings', () => {
            expect(CHART_DEFAULTS.responsive).toBe(true);
            expect(CHART_DEFAULTS.maintainAspectRatio).toBe(false);
        });

        test('should have plugins configuration', () => {
            expect(CHART_DEFAULTS.plugins).toHaveProperty('legend');
            expect(CHART_DEFAULTS.plugins).toHaveProperty('tooltip');
            expect(CHART_DEFAULTS.plugins.tooltip.callbacks).toHaveProperty('label');
        });

        test('should have scales configuration', () => {
            expect(CHART_DEFAULTS.scales).toHaveProperty('x');
            expect(CHART_DEFAULTS.scales).toHaveProperty('y');
            expect(CHART_DEFAULTS.scales.y.beginAtZero).toBe(true);
        });
    });

    describe('createMonthlyTrendConfig()', () => {
        test('should create valid chart config for accounts view', () => {
            const config = createMonthlyTrendConfig(mockAggregatedData, 'accounts');
            
            expect(config.type).toBe('line');
            expect(config.data).toHaveProperty('labels');
            expect(config.data).toHaveProperty('datasets');
            expect(config.data.datasets).toHaveLength(3); // dev, staging, prod
            expect(config.data.labels).toHaveLength(3); // 3 months
        });

        test('should create valid chart config for total view', () => {
            const config = createMonthlyTrendConfig(mockAggregatedData, 'total');
            
            expect(config.type).toBe('line');
            expect(config.data.datasets).toHaveLength(1); // total only
            expect(config.data.datasets[0].label).toBe('全体合計');
            expect(config.data.datasets[0].data).toEqual([100.50, 120.75, 95.25]);
        });

        test('should handle empty data gracefully', () => {
            const config = createMonthlyTrendConfig(null);
            
            expect(config.type).toBe('bar'); // empty chart
            expect(config.options.plugins.title.text).toBe('月次データがありません');
        });

        test('should handle missing monthlyTrends', () => {
            const invalidData = { accounts: [] };
            const config = createMonthlyTrendConfig(invalidData);
            
            expect(config.options.plugins.title.text).toBe('月次データがありません');
        });

        test('should format dates correctly in labels', () => {
            const config = createMonthlyTrendConfig(mockAggregatedData, 'accounts');
            
            expect(config.data.labels).toEqual(['1/1', '2/1', '3/1']);
        });

        test('should assign different colors to each account', () => {
            const config = createMonthlyTrendConfig(mockAggregatedData, 'accounts');
            
            const colors = config.data.datasets.map(dataset => dataset.borderColor);
            expect(new Set(colors).size).toBe(3); // 3 unique colors
        });
    });

    describe('createServiceComparisonConfig()', () => {
        test('should create valid bar chart config', () => {
            const config = createServiceComparisonConfig(mockAggregatedData, 'total');
            
            expect(config.type).toBe('bar');
            expect(config.data).toHaveProperty('labels');
            expect(config.data).toHaveProperty('datasets');
            expect(config.data.datasets).toHaveLength(1);
        });

        test('should include all services from aggregation', () => {
            const config = createServiceComparisonConfig(mockAggregatedData, 'latest');
            
            expect(config.data.labels).toEqual(['S3', 'CloudWatch', 'Lambda', 'EC2', 'RDS']);
            expect(config.data.datasets[0].data).toEqual([45.20, 15.30, 25.45, 67.80, 12.25]);
        });

        test('should handle empty service data', () => {
            const config = createServiceComparisonConfig(null);
            
            expect(config.options.plugins.title.text).toBe('サービスデータがありません');
        });

        test('should assign different colors to each service', () => {
            const config = createServiceComparisonConfig(mockAggregatedData);
            
            expect(config.data.datasets[0].backgroundColor).toHaveLength(5); // 5 services
            expect(config.data.datasets[0].borderColor).toHaveLength(5);
        });
    });

    describe('createServiceCompositionConfig()', () => {
        test('should create valid pie chart config', () => {
            const config = createServiceCompositionConfig(mockAggregatedData, 'all');
            
            expect(config.type).toBe('pie');
            expect(config.data).toHaveProperty('labels');
            expect(config.data).toHaveProperty('datasets');
            expect(config.data.datasets).toHaveLength(1);
        });

        test('should calculate percentages correctly', () => {
            const config = createServiceCompositionConfig(mockAggregatedData);
            const total = 45.20 + 15.30 + 25.45 + 67.80 + 12.25; // 166.00
            
            // Labels should include percentages
            expect(config.data.labels[0]).toMatch(/\(\d+\.\d%\)/);
            
            // Data should match service values
            expect(config.data.datasets[0].data).toEqual([45.20, 15.30, 25.45, 67.80, 12.25]);
        });

        test('should filter out zero values', () => {
            const dataWithZeros = {
                ...mockAggregatedData,
                serviceAggregation: {
                    'S3': 45.20,
                    'CloudWatch': 0,
                    'Lambda': 25.45,
                    'EC2': 0,
                    'RDS': 12.25
                }
            };
            
            const config = createServiceCompositionConfig(dataWithZeros);
            
            expect(config.data.labels).toHaveLength(3); // Only non-zero services
            expect(config.data.datasets[0].data).toEqual([45.20, 25.45, 12.25]);
        });

        test('should sort services by value descending', () => {
            const config = createServiceCompositionConfig(mockAggregatedData);
            const values = config.data.datasets[0].data;
            
            // Should be sorted: EC2 (67.80), S3 (45.20), Lambda (25.45), CloudWatch (15.30), RDS (12.25)
            expect(values).toEqual([67.80, 45.20, 25.45, 15.30, 12.25]);
        });

        test('should handle account-specific filter', () => {
            const config = createServiceCompositionConfig(mockAggregatedData, 'dev');
            
            expect(config.options.plugins.title.text).toBe('サービス別構成比（dev）');
        });
    });

    describe('createEmptyChartConfig()', () => {
        test('should create valid empty chart with default message', () => {
            const config = createEmptyChartConfig();
            
            expect(config.type).toBe('bar');
            expect(config.options.plugins.title.text).toBe('データがありません');
            expect(config.options.plugins.legend.display).toBe(false);
            expect(config.options.plugins.tooltip.enabled).toBe(false);
        });

        test('should use custom message when provided', () => {
            const customMessage = 'カスタムエラーメッセージ';
            const config = createEmptyChartConfig(customMessage);
            
            expect(config.options.plugins.title.text).toBe(customMessage);
        });

        test('should hide scales and interactivity', () => {
            const config = createEmptyChartConfig();
            
            expect(config.options.scales.x.display).toBe(false);
            expect(config.options.scales.y.display).toBe(false);
        });
    });

    describe('formatCurrency()', () => {
        test('should format numbers correctly with default 4 decimals', () => {
            expect(formatCurrency(123.456789)).toBe('$123.4568');
            expect(formatCurrency(0)).toBe('$0.0000');
            expect(formatCurrency(1000.1)).toBe('$1000.1000');
        });

        test('should format with custom decimal places', () => {
            expect(formatCurrency(123.456, 2)).toBe('$123.46');
            expect(formatCurrency(123.456, 0)).toBe('$123');
        });

        test('should handle invalid inputs', () => {
            expect(formatCurrency(null)).toBe('$0.0000');
            expect(formatCurrency(undefined)).toBe('$0.0000');
            expect(formatCurrency('invalid')).toBe('$0.0000');
            expect(formatCurrency(NaN)).toBe('$0.0000');
        });

        test('should handle negative numbers', () => {
            expect(formatCurrency(-123.45)).toBe('$-123.4500');
        });
    });

    describe('generateColors()', () => {
        test('should generate correct number of colors for services', () => {
            const colors = generateColors(5, 'services');
            
            expect(colors).toHaveLength(5);
            expect(colors.every(color => typeof color === 'string')).toBe(true);
        });

        test('should generate correct number of colors for accounts', () => {
            const colors = generateColors(3, 'accounts');
            
            expect(colors).toHaveLength(3);
            expect(colors.every(color => CHART_COLORS.accounts.includes(color))).toBe(true);
        });

        test('should cycle colors when count exceeds available colors', () => {
            const colors = generateColors(10, 'services');
            
            expect(colors).toHaveLength(10);
            // First color should repeat after cycling through available colors
            expect(colors[0]).toBe(colors[8]); // Assuming 8 service colors
        });

        test('should default to services colors for unknown type', () => {
            const colors = generateColors(3, 'unknown');
            
            expect(colors).toHaveLength(3);
            expect(colors.every(color => CHART_COLORS.services.includes(color))).toBe(true);
        });

        test('should handle zero count', () => {
            const colors = generateColors(0);
            
            expect(colors).toHaveLength(0);
            expect(Array.isArray(colors)).toBe(true);
        });
    });
});