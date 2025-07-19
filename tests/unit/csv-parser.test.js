/**
 * Unit tests for CSV Parser Module
 */

// Import the module for testing
const {
    parseCSVString,
    parseCSVRow,
    transformCostData,
    extractServiceColumns,
    transformRowData,
    isValidDateString,
    aggregateMultiAccountData,
    calculateGrowthRates,
    extractAccountName
} = require('../../js/csv-parser.js');

describe('CSV Parser Module', () => {
    describe('parseCSVRow', () => {
        test('should parse simple CSV row', () => {
            const row = 'service,value1,value2';
            const result = parseCSVRow(row);
            expect(result).toEqual(['service', 'value1', 'value2']);
        });

        test('should handle quoted values with commas', () => {
            const row = '"Service Name","1,234.56","Another Value"';
            const result = parseCSVRow(row);
            expect(result).toEqual(['Service Name', '1,234.56', 'Another Value']);
        });

        test('should handle escaped quotes', () => {
            const row = '"Value with ""quotes""","Normal Value"';
            const result = parseCSVRow(row);
            expect(result).toEqual(['Value with "quotes"', 'Normal Value']);
        });

        test('should handle empty fields', () => {
            const row = 'field1,,field3';
            const result = parseCSVRow(row);
            expect(result).toEqual(['field1', '', 'field3']);
        });
    });

    describe('parseCSVString', () => {
        test('should parse valid CSV string', () => {
            const csvString = `"サービス","S3($)","CloudWatch($)","合計コスト($)"
"サービス の合計","0.1234","0.0567","0.1801"
"2025-01-01","0.0200","0.0100","0.0300"`;
            
            const result = parseCSVString(csvString);
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                'サービス': 'サービス の合計',
                'S3($)': '0.1234',
                'CloudWatch($)': '0.0567',
                '合計コスト($)': '0.1801'
            });
        });

        test('should throw error for invalid input', () => {
            expect(() => parseCSVString('')).toThrow('Invalid CSV string provided');
            expect(() => parseCSVString(null)).toThrow('Invalid CSV string provided');
            expect(() => parseCSVString('header only')).toThrow('CSV must contain at least header and one data row');
        });

        test('should skip empty lines', () => {
            const csvString = `"サービス","S3($)"
"サービス の合計","0.1234"

"2025-01-01","0.0200"`;
            
            const result = parseCSVString(csvString);
            expect(result).toHaveLength(2);
        });
    });

    describe('extractServiceColumns', () => {
        test('should extract service columns from headers', () => {
            const headers = ['サービス', 'S3($)', 'CloudWatch($)', 'Lambda($)', '合計コスト($)'];
            const result = extractServiceColumns(headers);
            expect(result).toEqual(['S3', 'CloudWatch', 'Lambda']);
        });

        test('should handle empty headers', () => {
            const headers = ['サービス', '合計コスト($)'];
            const result = extractServiceColumns(headers);
            expect(result).toEqual([]);
        });
    });

    describe('isValidDateString', () => {
        test('should validate correct date strings', () => {
            expect(isValidDateString('2025-01-01')).toBe(true);
            expect(isValidDateString('2025-12-31')).toBe(true);
        });

        test('should reject invalid date strings', () => {
            expect(isValidDateString('2025-13-01')).toBe(false);
            expect(isValidDateString('invalid-date')).toBe(false);
            expect(isValidDateString('25-01-01')).toBe(false);
            expect(isValidDateString('')).toBe(false);
            expect(isValidDateString(null)).toBe(false);
        });
    });

    describe('transformRowData', () => {
        test('should transform row data correctly', () => {
            const row = {
                'サービス': '2025-01-01',
                'S3($)': '0.1234',
                'CloudWatch($)': '0.0567',
                '合計コスト($)': '0.1801'
            };
            const serviceColumns = ['S3', 'CloudWatch'];
            
            const result = transformRowData(row, serviceColumns);
            expect(result).toEqual({
                'S3': 0.1234,
                'CloudWatch': 0.0567,
                'totalCost': 0.1801
            });
        });

        test('should handle missing values', () => {
            const row = {
                'サービス': '2025-01-01',
                'S3($)': '',
                'CloudWatch($)': 'invalid',
                '合計コスト($)': '0.1801'
            };
            const serviceColumns = ['S3', 'CloudWatch'];
            
            const result = transformRowData(row, serviceColumns);
            expect(result).toEqual({
                'S3': 0,
                'CloudWatch': 0,
                'totalCost': 0.1801
            });
        });
    });

    describe('transformCostData', () => {
        const sampleData = [
            {
                'サービス': 'サービス の合計',
                'S3($)': '0.1234',
                'CloudWatch($)': '0.0567',
                '合計コスト($)': '0.1801'
            },
            {
                'サービス': '2025-01-01',
                'S3($)': '0.0200',
                'CloudWatch($)': '0.0100',
                '合計コスト($)': '0.0300'
            },
            {
                'サービス': '2025-02-01',
                'S3($)': '0.0180',
                'CloudWatch($)': '0.0120',
                '合計コスト($)': '0.0300'
            }
        ];

        test('should transform cost data correctly', () => {
            const result = transformCostData(sampleData, 'dev');
            
            expect(result.accountName).toBe('dev');
            expect(result.services).toEqual(['S3', 'CloudWatch']);
            expect(result.totalCost).toBe(0.1801);
            expect(result.monthlyData).toHaveLength(2);
            expect(result.summary).toEqual({
                'S3': 0.1234,
                'CloudWatch': 0.0567,
                'totalCost': 0.1801
            });
        });

        test('should throw error for invalid data', () => {
            expect(() => transformCostData([], 'test')).toThrow('Invalid or empty data array');
            expect(() => transformCostData([{ invalid: 'data' }], 'test')).toThrow('Summary row not found');
        });

        test('should sort monthly data by date', () => {
            const unsortedData = [
                {
                    'サービス': 'サービス の合計',
                    'S3($)': '0.1234',
                    '合計コスト($)': '0.1234'
                },
                {
                    'サービス': '2025-03-01',
                    'S3($)': '0.0300',
                    '合計コスト($)': '0.0300'
                },
                {
                    'サービス': '2025-01-01',
                    'S3($)': '0.0100',
                    '合計コスト($)': '0.0100'
                }
            ];
            
            const result = transformCostData(unsortedData, 'test');
            expect(result.monthlyData[0].date).toBe('2025-01-01');
            expect(result.monthlyData[1].date).toBe('2025-03-01');
        });
    });

    describe('calculateGrowthRates', () => {
        test('should calculate growth rates correctly', () => {
            const monthlyData = [
                { date: '2025-01-01', totalCost: 100 },
                { date: '2025-02-01', totalCost: 110 },
                { date: '2025-03-01', totalCost: 120 }
            ];
            
            const result = calculateGrowthRates(monthlyData);
            expect(result.monthOverMonth).toBe(9.09); // (120-110)/110 * 100
            expect(result.totalGrowth).toBe(20); // (120-100)/100 * 100
            expect(result.trend).toBe('increasing');
        });

        test('should handle insufficient data', () => {
            const result = calculateGrowthRates([{ date: '2025-01-01', totalCost: 100 }]);
            expect(result.trend).toBe('insufficient_data');
            expect(result.monthOverMonth).toBe(0);
        });

        test('should handle zero values', () => {
            const monthlyData = [
                { date: '2025-01-01', totalCost: 0 },
                { date: '2025-02-01', totalCost: 100 }
            ];
            
            const result = calculateGrowthRates(monthlyData);
            expect(result.monthOverMonth).toBe(0);
            expect(result.totalGrowth).toBe(0);
        });
    });

    describe('aggregateMultiAccountData', () => {
        const sampleAccountData = [
            {
                accountName: 'dev',
                services: ['S3', 'CloudWatch'],
                summary: { 'S3': 0.1234, 'CloudWatch': 0.0567, totalCost: 0.1801 },
                monthlyData: [
                    { date: '2025-01-01', 'S3': 0.0200, 'CloudWatch': 0.0100, totalCost: 0.0300 }
                ],
                totalCost: 0.1801,
                dataRange: { monthCount: 1 }
            },
            {
                accountName: 'prod',
                services: ['S3', 'EC2'],
                summary: { 'S3': 0.5000, 'EC2': 1.0000, totalCost: 1.5000 },
                monthlyData: [
                    { date: '2025-01-01', 'S3': 0.2500, 'EC2': 0.5000, totalCost: 0.7500 }
                ],
                totalCost: 1.5000,
                dataRange: { monthCount: 1 }
            }
        ];

        test('should aggregate multiple account data', () => {
            const result = aggregateMultiAccountData(sampleAccountData);
            
            expect(result.totalAccounts).toBe(2);
            expect(result.totalCost).toBe(1.6801);
            expect(result.services).toEqual(['CloudWatch', 'EC2', 'S3']);
            expect(result.serviceAggregation['S3']).toBe(0.6234);
            expect(result.monthlyTrends).toHaveLength(1);
            expect(result.monthlyTrends[0]).toEqual({
                date: '2025-01-01',
                totalCost: 1.0800,
                dev: 0.0300,
                prod: 0.7500
            });
        });

        test('should handle empty input', () => {
            const result = aggregateMultiAccountData([]);
            expect(result.totalAccounts).toBe(0);
            expect(result.totalCost).toBe(0);
            expect(result.services).toEqual([]);
        });
    });

    describe('extractAccountName', () => {
        test('should extract account name from file path', () => {
            expect(extractAccountName('resources/dev/costs.csv')).toBe('dev');
            expect(extractAccountName('data/prod/costs.csv')).toBe('prod');
            expect(extractAccountName('/path/to/staging/costs.csv')).toBe('staging');
        });

        test('should extract from simple filename', () => {
            expect(extractAccountName('dev-costs.csv')).toBe('dev');
            expect(extractAccountName('production.csv')).toBe('production');
        });

        test('should handle edge cases', () => {
            expect(extractAccountName('')).toBe('unknown');
            expect(extractAccountName(null)).toBe('unknown');
            expect(extractAccountName('costs.csv')).toBe('costs');
        });
    });
});