import axios from 'axios';

// Will be populated with the API key once provided
const BEA_API_KEY = process.env.REACT_APP_BEA_API_KEY || '';
const BEA_BASE_URL = 'https://apps.bea.gov/api/data';

/**
 * Fetch GDP data from BEA API
 * @param {Object} options - Optional parameters
 * @returns {Promise} - Promise with processed GDP data
 */
export const fetchGDPData = async (options = {}) => {
  try {
    // Example BEA API call for GDP data - this will be updated once we have the API key
    const response = await axios.get(BEA_BASE_URL, {
      params: {
        UserID: BEA_API_KEY,
        method: 'GetData',
        datasetname: 'NIPA',
        TableName: 'T10101',
        Frequency: 'Q',
        Year: options.year || 'X', // 'X' for all available years
        Quarter: options.quarter || 'X', // 'X' for all available quarters
        ResultFormat: 'JSON'
      }
    });

    // This is a placeholder for now - will implement proper data processing once we have the API key
    return {
      title: 'GDP (BEA)',
      data: [],
      labels: [],
      currentValue: 0,
      previousValue: 0,
      change: 0,
      unit: '$ Billion',
      source: 'BEA'
    };
  } catch (error) {
    console.error('Error fetching BEA GDP data:', error);
    throw error;
  }
};

/**
 * Fetch Trade Balance data from BEA API
 * @param {Object} options - Optional parameters
 * @returns {Promise} - Promise with processed trade balance data
 */
export const fetchTradeBalanceData = async (options = {}) => {
  try {
    // Example BEA API call for Trade Balance data - this will be updated once we have the API key
    const response = await axios.get(BEA_BASE_URL, {
      params: {
        UserID: BEA_API_KEY,
        method: 'GetData',
        datasetname: 'ITA',
        TableName: 'itable1',
        Frequency: 'M',
        Year: options.year || 'X', // 'X' for all available years
        Month: options.month || 'X', // 'X' for all available months
        ResultFormat: 'JSON'
      }
    });

    // This is a placeholder for now - will implement proper data processing once we have the API key
    return {
      title: 'Trade Balance (BEA)',
      data: [],
      labels: [],
      currentValue: 0,
      previousValue: 0,
      change: 0,
      unit: '$ Billion',
      source: 'BEA'
    };
  } catch (error) {
    console.error('Error fetching BEA Trade Balance data:', error);
    throw error;
  }
};

// Export BEA datasets
export const BEA_DATASETS = {
  gdp: {
    id: 'GDP',
    title: 'Gross Domestic Product (BEA)',
    frequency: 'quarterly'
  },
  tradeBalance: {
    id: 'TRADE',
    title: 'Trade Balance (BEA)',
    frequency: 'monthly'
  }
};
