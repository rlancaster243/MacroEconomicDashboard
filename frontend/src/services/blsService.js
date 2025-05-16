import axios from 'axios';
import moment from 'moment';

// Will be populated with the API key once provided
const BLS_API_KEY = process.env.REACT_APP_BLS_API_KEY || '';
const BLS_BASE_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';

// BLS Series IDs
const BLS_SERIES = {
  unemployment: 'LNS14000000', // Unemployment Rate
  cpi: 'CUUR0000SA0', // Consumer Price Index - All Urban Consumers
  payroll: 'CES0000000001', // Total Nonfarm Payroll
  wages: 'CES0500000003' // Average Hourly Earnings
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
    const startYear = endYear - 2;
    
    // Format the request data
    const requestData = {
      seriesid: [seriesId],
      startyear: options.startYear || startYear,
      endyear: options.endYear || endYear,
      registrationkey: BLS_API_KEY
    };
    
    // Make the API request
    const response = await axios.post(BLS_BASE_URL, requestData);
    
    // Check for errors
    if (response.data.status !== 'REQUEST_SUCCEEDED') {
      throw new Error(`BLS API Error: ${response.data.message}`);
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
  switch(seriesId) {
    case BLS_SERIES.unemployment:
      return 'Unemployment Rate';
    case BLS_SERIES.cpi:
      return 'Consumer Price Index';
    case BLS_SERIES.payroll:
      return 'Nonfarm Payroll';
    case BLS_SERIES.wages:
      return 'Average Hourly Earnings';
    default:
      return 'BLS Data';
  }
};

/**
 * Get the appropriate unit for a BLS series
 * @param {string} seriesId - BLS Series ID
 * @returns {string} - Unit designation
 */
const getBLSSeriesUnit = (seriesId) => {
  switch(seriesId) {
    case BLS_SERIES.unemployment:
      return '%';
    case BLS_SERIES.cpi:
      return 'Index';
    case BLS_SERIES.payroll:
      return 'Thousands';
    case BLS_SERIES.wages:
      return '$';
    default:
      return '';
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
