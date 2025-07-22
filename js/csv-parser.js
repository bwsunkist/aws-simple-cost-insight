/**
 * CSV Parser Module for AWS Cost Data
 * Pure functions for CSV parsing, data transformation, and normalization
 */

/**
 * Parse CSV string into array of objects
 * @param {string} csvString - Raw CSV content
 * @returns {Array<Object>} Parsed data array
 */
function parseCSVString(csvString) {
    if (!csvString || typeof csvString !== 'string') {
        throw new Error('Invalid CSV string provided');
    }

    const lines = csvString.trim().split('\n');
    if (lines.length < 2) {
        throw new Error('CSV must contain at least header and one data row');
    }

    // Parse header row
    const headers = parseCSVRow(lines[0]);
    
    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) { // Skip empty lines
            try {
                const row = parseCSVRow(lines[i]);
                if (row.length === headers.length) {
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = row[index];
                    });
                    data.push(obj);
                }
            } catch (error) {
                console.warn(`Skipping malformed row ${i + 1}: ${error.message}`);
            }
        }
    }

    return data;
}

/**
 * Parse a single CSV row handling quoted values
 * @param {string} row - CSV row string
 * @returns {Array<string>} Array of cell values
 */
function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < row.length) {
        const char = row[i];
        const nextChar = row[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                current += '"';
                i += 2;
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
                i++;
            }
        } else if (char === ',' && !inQuotes) {
            // Field separator
            result.push(current.trim());
            current = '';
            i++;
        } else {
            current += char;
            i++;
        }
    }

    // Add the last field
    result.push(current.trim());
    return result;
}

/**
 * Transform raw CSV data into normalized cost data structure
 * @param {Array<Object>} rawData - Parsed CSV data
 * @param {string} accountName - Account identifier
 * @returns {Object} Normalized account data
 */
function transformCostData(rawData, accountName) {
    if (!Array.isArray(rawData) || rawData.length === 0) {
        throw new Error('Invalid or empty data array');
    }

    const firstRow = rawData[0];
    const serviceColumns = extractServiceColumns(Object.keys(firstRow));
    
    // Find summary row and date rows
    const summaryRow = rawData.find(row => 
        row['サービス'] && row['サービス'].includes('合計')
    );
    
    const dateRows = rawData.filter(row => 
        row['サービス'] && isValidDateString(row['サービス'])
    );

    if (!summaryRow) {
        throw new Error('Summary row not found in CSV data');
    }

    // Transform data structure
    const transformedData = {
        accountName: accountName,
        services: serviceColumns,
        summary: transformRowData(summaryRow, serviceColumns),
        monthlyData: dateRows.map(row => ({
            date: row['サービス'],
            ...transformRowData(row, serviceColumns)
        })).sort((a, b) => new Date(a.date) - new Date(b.date)),
        totalCost: parseFloat(summaryRow['合計コスト($)'] || 0),
        dataRange: {
            startDate: dateRows.length > 0 ? dateRows[0]['サービス'] : null,
            endDate: dateRows.length > 0 ? dateRows[dateRows.length - 1]['サービス'] : null,
            monthCount: dateRows.length
        }
    };

    return transformedData;
}

/**
 * Extract service column names from CSV headers
 * @param {Array<string>} headers - CSV headers
 * @returns {Array<string>} Service column names
 */
function extractServiceColumns(headers) {
    return headers.filter(header => 
        header.includes('($)') && 
        !header.includes('合計コスト') &&
        header !== 'サービス'
    ).map(header => 
        // Clean service name (remove currency indicator)
        header.replace(/\(\$\)$/, '').trim()
    );
}

/**
 * Transform a single row of data into normalized format
 * @param {Object} row - Raw row data
 * @param {Array<string>} serviceColumns - Service column names
 * @returns {Object} Transformed row data
 */
function transformRowData(row, serviceColumns) {
    const result = {};
    
    serviceColumns.forEach(service => {
        const columnKey = `${service}($)`;
        const value = row[columnKey] || '0';
        result[service] = parseFloat(value) || 0;
    });

    // Add total cost
    result.totalCost = parseFloat(row['合計コスト($)'] || 0);
    
    return result;
}

/**
 * Check if string is a valid date format (YYYY-MM-DD)
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid date format
 */
function isValidDateString(dateString) {
    if (!dateString || typeof dateString !== 'string') return false;
    
    // Match YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    
    // Verify it's a valid date
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

/**
 * Aggregate data from multiple accounts
 * @param {Array<Object>} accountsData - Array of transformed account data
 * @returns {Object} Aggregated multi-account data
 */
function aggregateMultiAccountData(accountsData) {
    if (!Array.isArray(accountsData) || accountsData.length === 0) {
        return {
            accounts: [],
            totalAccounts: 0,
            totalCost: 0,
            services: [],
            monthlyTrends: [],
            serviceAggregation: {}
        };
    }

    // Collect all unique services
    const allServices = new Set();
    accountsData.forEach(account => {
        account.services.forEach(service => allServices.add(service));
    });

    // Collect all unique dates
    const allDates = new Set();
    accountsData.forEach(account => {
        account.monthlyData.forEach(month => allDates.add(month.date));
    });

    const sortedDates = Array.from(allDates).sort();
    const sortedServices = Array.from(allServices).sort();

    // Aggregate by month
    const monthlyTrends = sortedDates.map(date => {
        const monthData = { date, totalCost: 0, serviceBreakdown: {} };
        
        // Initialize service breakdown
        sortedServices.forEach(service => {
            monthData.serviceBreakdown[service] = 0;
        });
        
        accountsData.forEach(account => {
            const monthRecord = account.monthlyData.find(m => m.date === date);
            if (monthRecord) {
                monthData[account.accountName] = monthRecord.totalCost;
                monthData.totalCost += monthRecord.totalCost;
                
                // Aggregate service costs across accounts for this month
                if (monthRecord.services) {
                    Object.entries(monthRecord.services).forEach(([service, cost]) => {
                        if (service !== '合計コスト') {
                            monthData.serviceBreakdown[service] = (monthData.serviceBreakdown[service] || 0) + cost;
                        }
                    });
                }
            } else {
                monthData[account.accountName] = 0;
            }
        });

        return monthData;
    });

    // Aggregate by service with proper validation
    const serviceAggregation = {};
    sortedServices.forEach(service => {
        serviceAggregation[service] = accountsData.reduce((total, account) => {
            const serviceValue = account.summary[service];
            const numValue = parseFloat(serviceValue);
            // Only add valid, finite numbers
            if (!isNaN(numValue) && isFinite(numValue)) {
                return total + Math.max(0, numValue); // Ensure non-negative
            }
            return total;
        }, 0);
    });

    // Calculate account summaries
    const accountSummaries = accountsData.map(account => ({
        name: account.accountName,
        totalCost: account.totalCost,
        monthCount: account.dataRange.monthCount,
        services: account.services.length
    }));

    return {
        accounts: accountSummaries,
        totalAccounts: accountsData.length,
        totalCost: accountsData.reduce((sum, account) => sum + account.totalCost, 0),
        services: sortedServices,
        monthlyTrends,
        serviceAggregation,
        dateRange: {
            startDate: sortedDates[0] || null,
            endDate: sortedDates[sortedDates.length - 1] || null
        }
    };
}

/**
 * Calculate growth rates between periods
 * @param {Array<Object>} monthlyData - Monthly data array
 * @returns {Object} Growth rate calculations
 */
function calculateGrowthRates(monthlyData) {
    if (!Array.isArray(monthlyData) || monthlyData.length < 2) {
        return { monthOverMonth: 0, totalGrowth: 0, trend: 'insufficient_data' };
    }

    const sortedData = monthlyData.sort((a, b) => new Date(a.date) - new Date(b.date));
    const latest = sortedData[sortedData.length - 1];
    const previous = sortedData[sortedData.length - 2];
    const earliest = sortedData[0];

    // Month-over-month growth
    const monthOverMonth = previous.totalCost > 0 
        ? ((latest.totalCost - previous.totalCost) / previous.totalCost) * 100
        : 0;

    // Total period growth
    const totalGrowth = earliest.totalCost > 0
        ? ((latest.totalCost - earliest.totalCost) / earliest.totalCost) * 100
        : 0;

    // Determine trend
    let trend = 'stable';
    if (Math.abs(monthOverMonth) < 1) trend = 'stable';
    else if (monthOverMonth > 0) trend = 'increasing';
    else trend = 'decreasing';

    return {
        monthOverMonth: Math.round(monthOverMonth * 100) / 100,
        totalGrowth: Math.round(totalGrowth * 100) / 100,
        trend,
        latestCost: latest.totalCost,
        previousCost: previous.totalCost
    };
}

/**
 * Calculate total growth rates from aggregated monthly trends
 * @param {Array<Object>} monthlyTrends - Aggregated monthly trends data
 * @returns {Object} Total growth rate calculations
 */
function calculateTotalGrowthRates(monthlyTrends) {
    if (!Array.isArray(monthlyTrends) || monthlyTrends.length < 2) {
        return { monthOverMonth: 0, totalGrowth: 0, trend: 'insufficient_data', latestCost: 0 };
    }

    const sortedData = monthlyTrends.sort((a, b) => new Date(a.date) - new Date(b.date));
    const latest = sortedData[sortedData.length - 1];
    const previous = sortedData[sortedData.length - 2];
    const earliest = sortedData[0];

    // Month-over-month growth for total cost
    const monthOverMonth = previous.totalCost > 0 
        ? ((latest.totalCost - previous.totalCost) / previous.totalCost) * 100
        : 0;

    // Total period growth
    const totalGrowth = earliest.totalCost > 0
        ? ((latest.totalCost - earliest.totalCost) / earliest.totalCost) * 100
        : 0;

    // Determine trend
    let trend = 'stable';
    if (Math.abs(monthOverMonth) < 1) trend = 'stable';
    else if (monthOverMonth > 0) trend = 'increasing';
    else trend = 'decreasing';

    return {
        monthOverMonth: Math.round(monthOverMonth * 100) / 100,
        totalGrowth: Math.round(totalGrowth * 100) / 100,
        trend,
        latestCost: latest.totalCost,
        previousCost: previous.totalCost
    };
}

/**
 * Read CSV file using File API
 * @param {File} file - File object from input
 * @returns {Promise<string>} Promise resolving to CSV content
 */
function readCSVFile(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file provided'));
            return;
        }

        if (file.type && !file.type.includes('csv') && !file.name.endsWith('.csv')) {
            reject(new Error('File must be a CSV file'));
            return;
        }

        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                resolve(event.target.result);
            } catch (error) {
                reject(new Error(`Error reading file: ${error.message}`));
            }
        };

        reader.onerror = () => {
            reject(new Error('Error reading file'));
        };

        reader.readAsText(file, 'UTF-8');
    });
}

/**
 * Extract account name from file name or path
 * @param {string} fileName - File name
 * @returns {string} Account name
 */
function extractAccountName(fileName) {
    if (!fileName) return 'unknown';
    
    // Extract from path like "resources/dev/costs.csv" -> "dev"
    const pathMatch = fileName.match(/(?:^|\/)([^\/]+)\/[^\/]*\.csv$/);
    if (pathMatch) {
        return pathMatch[1];
    }
    
    // Extract from filename like "dev-costs.csv" -> "dev"
    const nameMatch = fileName.match(/^([^-\.]+)/);
    return nameMatch ? nameMatch[1] : fileName.replace(/\.csv$/, '');
}

// Export functions for module use and testing
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment (for testing)
    module.exports = {
        parseCSVString,
        parseCSVRow,
        transformCostData,
        extractServiceColumns,
        transformRowData,
        isValidDateString,
        aggregateMultiAccountData,
        calculateGrowthRates,
        readCSVFile,
        extractAccountName
    };
}