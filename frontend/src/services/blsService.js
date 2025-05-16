import axios from 'axios';
import moment from 'moment';

// BLS API configuration with provided key
const BLS_API_KEY = process.env.REACT_APP_BLS_API_KEY;
const BLS_BASE_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';

// BLS Series IDs
export const BLS_SERIES = {
  unemployment: {
    id: 'LNS14000000', // Unemployment Rate
    title: 'Unemployment Rate (BLS)'
  },
  cpi: {
    id: 'CUUR0000SA0', // Consumer Price Index - All Urban Consumers
    title: 'Consumer Price Index (BLS)'
  },
  payroll: {
    id: 'CES0000000001', // Total Nonfarm Payroll
    title: 'Nonfarm Payroll (BLS)'
  },
  wages: {
    id: 'CES0500000003', // Average Hourly Earnings
    title: 'Average Hourly Earnings (BLS)'
  }
};

/**
 * Fetch data from BLS API
 * @param {string} seriesId - BLS Series ID
 * @param {Object} options - Optional parameters
 * @returns {Promise} - Promise with processed BLS data
 */
export const fetchBLSData = async (seriesId, options = {}) => {
  try {
    // Calculate default date range (last 2 years)
    const endYear = moment().year();
    const startYear = options.startYear || (endYear - 2);
    
    // Format the request data
    const requestData = {
      seriesid: [seriesId],
      startyear: startYear.toString(),
      endyear: endYear.toString(),
      registrationkey: BLS_API_KEY
    };
    
    // Make the API request
    const response = await axios.post(BLS_BASE_URL, requestData);
    
    // Check for errors
    if (response.data.status !== 'REQUEST_SUCCEEDED') {
      throw new Error(`BLS API Error: ${response.data.message || 'Unknown error'}`);
    }
    
    // Process the data
    const seriesData = response.data.Results.series[0];
    if (!seriesData || !seriesData.data || seriesData.data.length === 0) {
      throw new Error('No data returned from BLS API');
    }
    
    // Parse and sort data
    const parsedData = seriesData.data.map(item => ({
      date: `${item.year}-${item.period.substring(1).padStart(2, '0')}`,
      value: parseFloat(item.value)
    })).sort((a, b) => moment(a.date).valueOf() - moment(b.date).valueOf());
    
    // Calculate the last two values for change calculation
    const currentValue = parsedData[parsedData.length - 1].value;
    const previousValue = parsedData[parsedData.length - 2]?.value || 0;
    
    return {
      title: getBLSSeriesTitle(seriesId),
      data: parsedData.map(item => item.value),
      labels: parsedData.map(item => moment(item.date).format('MMM YYYY')),
      currentValue,
      previousValue,
      change: currentValue - previousValue,
      unit: getBLSSeriesUnit(seriesId),
      source: 'BLS'
    };
  } catch (error) {
    console.error(`Error fetching BLS data for series ${seriesId}:`, error);
    throw error;
  }
};

/**
 * Get the title for a BLS series
 * @param {string} seriesId - BLS Series ID
 * @returns {string} - Series title
 */
const getBLSSeriesTitle = (seriesId) => {
  if (seriesId === BLS_SERIES.unemployment.id) return 'Unemployment Rate';
  if (seriesId === BLS_SERIES.cpi.id) return 'Consumer Price Index';
  if (seriesId === BLS_SERIES.payroll.id) return 'Nonfarm Payroll';
  if (seriesId === BLS_SERIES.wages.id) return 'Average Hourly Earnings';
  return 'BLS Data';
};

/**
 * Get the appropriate unit for a BLS series
 * @param {string} seriesId - BLS Series ID
 * @returns {string} - Unit designation
 */
const getBLSSeriesUnit = (seriesId) => {
  if (seriesId === BLS_SERIES.unemployment.id) return '%';
  if (seriesId === BLS_SERIES.cpi.id) return 'Index';
  if (seriesId === BLS_SERIES.payroll.id) return 'Thousands';
  if (seriesId === BLS_SERIES.wages.id) return '$';
  return '';
};

/**
 * Fetch multiple BLS indicators at once
 * @param {Array} seriesIds - Array of BLS series IDs to fetch
 * @param {Object} options - Optional parameters
 * @returns {Promise<Object>} - Object with processed results for each series
 */
export const fetchMultipleBLSSeries = async (seriesIds, options = {}) => {
  try {
    const promises = seriesIds.map(id => fetchBLSData(id, options));
    const results = await Promise.all(promises);
    
    return results.reduce((acc, result, index) => {
      const seriesKey = seriesIds[index];
      acc[seriesKey] = result;
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching multiple BLS series:', error);
    throw error;
  }
};

// Export BLS datasets
export const BLS_DATASETS = {
  unemployment: {
    id: BLS_SERIES.unemployment,
    title: 'Unemployment Rate (BLS)',
    frequency: 'monthly'
  },
  cpi: {
    id: BLS_SERIES.cpi,
    title: 'Consumer Price Index (BLS)',
    frequency: 'monthly'
  },
  payroll: {
    id: BLS_SERIES.payroll,
    title: 'Nonfarm Payroll (BLS)',
    frequency: 'monthly'
  },
  wages: {
    id: BLS_SERIES.wages,
    title: 'Average Hourly Earnings (BLS)',
    frequency: 'monthly'
  }
};
