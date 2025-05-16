import axios from 'axios';
import moment from 'moment';

// World Bank API doesn't require authentication
const WORLD_BANK_BASE_URL = 'https://api.worldbank.org/v2';

// Country code for United States
const US_COUNTRY_CODE = 'USA';

// World Bank indicator codes
export const WORLD_BANK_INDICATORS = {
  gdp: 'NY.GDP.MKTP.CD', // GDP (current US$)
  gdpGrowth: 'NY.GDP.MKTP.KD.ZG', // GDP growth (annual %)
  inflation: 'FP.CPI.TOTL.ZG', // Inflation, consumer prices (annual %)
  unemployment: 'SL.UEM.TOTL.ZS', // Unemployment, total (% of total labor force)
  exports: 'NE.EXP.GNFS.ZS', // Exports of goods and services (% of GDP)
  imports: 'NE.IMP.GNFS.ZS', // Imports of goods and services (% of GDP)
  manufacturing: 'NV.IND.MANF.ZS', // Manufacturing, value added (% of GDP)
  fdi: 'BX.KLT.DINV.WD.GD.ZS' // Foreign direct investment, net inflows (% of GDP)
};

/**
 * Fetch data from World Bank API
 * @param {string} indicator - World Bank indicator code
 * @param {Object} options - Optional parameters
 * @returns {Promise} - Promise with processed World Bank data
 */
export const fetchWorldBankData = async (indicator, options = {}) => {
  try {
    // Default to last 10 years of data
    const params = {
      format: 'json',
      per_page: options.limit || 10,
      date: options.dateRange || '2010:2023'
    };
    
    // Make API request
    const response = await axios.get(
      `${WORLD_BANK_BASE_URL}/country/${US_COUNTRY_CODE}/indicator/${indicator}`,
      { params }
    );
    
    // World Bank API returns an array with metadata at index 0 and data at index 1
    if (!response.data || !response.data[1] || response.data[1].length === 0) {
      throw new Error('No data returned from World Bank API');
    }
    
    // Process the data (sorting chronologically)
    const processedData = response.data[1]
      .filter(item => item.value !== null)
      .sort((a, b) => parseInt(a.date) - parseInt(b.date));
    
    // Extract values and dates
    const values = processedData.map(item => parseFloat(item.value));
    const dates = processedData.map(item => item.date);
    
    // Calculate change
    const currentValue = values[values.length - 1];
    const previousValue = values[values.length - 2] || 0;
    
    return {
      title: getWorldBankIndicatorTitle(indicator),
      data: values,
      labels: dates,
      currentValue,
      previousValue,
      change: currentValue - previousValue,
      unit: getWorldBankIndicatorUnit(indicator),
      source: 'World Bank'
    };
  } catch (error) {
    console.error(`Error fetching World Bank data for indicator ${indicator}:`, error);
    throw error;
  }
};

/**
 * Fetch multiple World Bank indicators
 * @param {Array} indicators - Array of World Bank indicator codes
 * @param {Object} options - Optional parameters
 * @returns {Promise<Object>} - Object with processed results for each indicator
 */
export const fetchMultipleWorldBankIndicators = async (indicators, options = {}) => {
  try {
    const promises = indicators.map(indicator => fetchWorldBankData(indicator, options));
    const results = await Promise.all(promises);
    
    return results.reduce((acc, result, index) => {
      const indicatorKey = `worldBank_${indicators[index].replace(/\./g, '_')}`;
      acc[indicatorKey] = result;
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching multiple World Bank indicators:', error);
    throw error;
  }
};

/**
 * Get the title for a World Bank indicator
 * @param {string} indicator - World Bank indicator code
 * @returns {string} - Indicator title
 */
const getWorldBankIndicatorTitle = (indicator) => {
  switch(indicator) {
    case WORLD_BANK_INDICATORS.gdp:
      return 'GDP';
    case WORLD_BANK_INDICATORS.gdpGrowth:
      return 'GDP Growth Rate';
    case WORLD_BANK_INDICATORS.inflation:
      return 'Inflation Rate';
    case WORLD_BANK_INDICATORS.unemployment:
      return 'Unemployment Rate';
    case WORLD_BANK_INDICATORS.exports:
      return 'Exports (% of GDP)';
    case WORLD_BANK_INDICATORS.imports:
      return 'Imports (% of GDP)';
    case WORLD_BANK_INDICATORS.manufacturing:
      return 'Manufacturing (% of GDP)';
    case WORLD_BANK_INDICATORS.fdi:
      return 'Foreign Direct Investment';
    default:
      return 'World Bank Data';
  }
};

/**
 * Get the appropriate unit for a World Bank indicator
 * @param {string} indicator - World Bank indicator code
 * @returns {string} - Unit designation
 */
const getWorldBankIndicatorUnit = (indicator) => {
  switch(indicator) {
    case WORLD_BANK_INDICATORS.gdp:
      return '$';
    case WORLD_BANK_INDICATORS.gdpGrowth:
    case WORLD_BANK_INDICATORS.inflation:
    case WORLD_BANK_INDICATORS.unemployment:
    case WORLD_BANK_INDICATORS.exports:
    case WORLD_BANK_INDICATORS.imports:
    case WORLD_BANK_INDICATORS.manufacturing:
    case WORLD_BANK_INDICATORS.fdi:
      return '%';
    default:
      return '';
  }
};

// Export World Bank datasets
export const WORLD_BANK_DATASETS = {
  gdp: {
    id: WORLD_BANK_INDICATORS.gdp,
    title: 'GDP (World Bank)',
    frequency: 'annual'
  },
  gdpGrowth: {
    id: WORLD_BANK_INDICATORS.gdpGrowth,
    title: 'GDP Growth Rate (World Bank)',
    frequency: 'annual'
  },
  inflation: {
    id: WORLD_BANK_INDICATORS.inflation,
    title: 'Inflation Rate (World Bank)',
    frequency: 'annual'
  },
  unemployment: {
    id: WORLD_BANK_INDICATORS.unemployment,
    title: 'Unemployment Rate (World Bank)',
    frequency: 'annual'
  },
  manufacturing: {
    id: WORLD_BANK_INDICATORS.manufacturing,
    title: 'Manufacturing (% of GDP)',
    frequency: 'annual'
  }
};
