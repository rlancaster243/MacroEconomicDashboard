import axios from 'axios';
import moment from 'moment';

// BEA API configuration
const BEA_API_KEY = process.env.REACT_APP_BEA_API_KEY;
const BEA_BASE_URL = 'https://apps.bea.gov/api/data';

/**
 * Fetch GDP data from BEA API
 * @param {Object} options - Optional parameters
 * @returns {Promise} - Promise with processed GDP data
 */
export const fetchGDPData = async (options = {}) => {
  try {
    // Calculate year range (default to last 5 years)
    const currentYear = moment().year();
    const startYear = options.year || (currentYear - 5);
    
    // BEA API call for GDP data
    const response = await axios.get(BEA_BASE_URL, {
      params: {
        UserID: BEA_API_KEY,
        method: 'GetData',
        datasetname: 'NIPA',
        TableName: 'T10101',
        Frequency: 'Q',
        Year: `${startYear},${currentYear}`,
        GeoFips: 'USA',
        ResultFormat: 'JSON'
      }
    });
    
    // Check if we got valid data
    if (!response.data || !response.data.BEAAPI || !response.data.BEAAPI.Results || !response.data.BEAAPI.Results.Data) {
      throw new Error('Invalid response from BEA API');
    }
    
    // Process the data
    const rawData = response.data.BEAAPI.Results.Data;
    
    // Filter to get GDP data (LineNumber 1 is GDP in Table 1.1.1)
    const gdpData = rawData.filter(item => item.LineNumber === '1');
    
    // Sort by year and quarter
    gdpData.sort((a, b) => {
      if (a.TimePeriod === b.TimePeriod) return 0;
      return a.TimePeriod < b.TimePeriod ? -1 : 1;
    });
    
    // Format the data for our dashboard
    const values = gdpData.map(item => parseFloat(item.DataValue));
    const labels = gdpData.map(item => {
      const year = item.Year;
      const quarter = item.Quarter;
      return `${year} Q${quarter}`;
    });
    
    // Calculate change
    const currentValue = values[values.length - 1];
    const previousValue = values[values.length - 2] || 0;
    const change = currentValue - previousValue;
    
    return {
      title: 'GDP (BEA)',
      data: values,
      labels,
      currentValue,
      previousValue,
      change,
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
    // Calculate year range (default to last 2 years)
    const currentYear = moment().year();
    const startYear = options.year || (currentYear - 2);
    
    // BEA API call for International Transactions data
    const response = await axios.get(BEA_BASE_URL, {
      params: {
        UserID: BEA_API_KEY,
        method: 'GetData',
        datasetname: 'ITA',
        TableName: 'ITA-TRADE',
        Frequency: 'Q',
        Year: `${startYear},${currentYear}`,
        AreaOrCountry: 'AllCountries',
        ResultFormat: 'JSON'
      }
    });
    
    // Check if we got valid data
    if (!response.data || !response.data.BEAAPI || !response.data.BEAAPI.Results || !response.data.BEAAPI.Results.Data) {
      throw new Error('Invalid response from BEA API');
    }
    
    // Process the data
    const rawData = response.data.BEAAPI.Results.Data;
    
    // Filter to get trade balance data (using indicator code for balance of goods and services)
    const tradeData = rawData.filter(item => 
      item.Indicator === 'Balance on goods and services' && 
      item.AreaOrCountry === 'All Countries'
    );
    
    // Sort by time period
    tradeData.sort((a, b) => {
      if (a.TimePeriod === b.TimePeriod) return 0;
      return a.TimePeriod < b.TimePeriod ? -1 : 1;
    });
    
    // Format the data for our dashboard
    const values = tradeData.map(item => parseFloat(item.DataValue));
    const labels = tradeData.map(item => {
      const year = item.Year;
      const quarter = item.Quarter;
      return `${year} Q${quarter}`;
    });
    
    // Calculate change
    const currentValue = values[values.length - 1];
    const previousValue = values[values.length - 2] || 0;
    const change = currentValue - previousValue;
    
    return {
      title: 'Trade Balance (BEA)',
      data: values,
      labels,
      currentValue,
      previousValue,
      change,
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
    frequency: 'quarterly'
  }
};
