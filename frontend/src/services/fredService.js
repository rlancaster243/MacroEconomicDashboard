import axios from 'axios';

const FRED_API_KEY = process.env.REACT_APP_FRED_API_KEY;
const FRED_BASE_URL = 'https://api.stlouisfed.org/fred/series';

// Helper function to format dates for FRED API
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Get end date (today) and start date (1 year ago)
const getDefaultDates = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(endDate.getFullYear() - 2); // 2 years of data
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
};

// Fetch data for a specific FRED series
export const fetchFredSeries = async (seriesId, options = {}) => {
  const { startDate, endDate } = options.dates || getDefaultDates();
  
  try {
    // First fetch the series information
    const seriesResponse = await axios.get(`${FRED_BASE_URL}`, {
      params: {
        series_id: seriesId,
        api_key: FRED_API_KEY,
        file_type: 'json'
      }
    });
    
    // Then fetch the observation data
    const observationsResponse = await axios.get(`${FRED_BASE_URL}/observations`, {
      params: {
        series_id: seriesId,
        api_key: FRED_API_KEY,
        file_type: 'json',
        observation_start: startDate,
        observation_end: endDate,
        sort_order: 'asc',
        frequency: options.frequency || 'monthly'
      }
    });
    
    const seriesData = seriesResponse.data.seriess[0];
    const observations = observationsResponse.data.observations;
    
    return {
      title: seriesData.title,
      id: seriesId,
      frequency: seriesData.frequency_short,
      units: seriesData.units,
      data: observations.map(obs => ({
        date: obs.date,
        value: parseFloat(obs.value) || 0
      }))
    };
  } catch (error) {
    console.error(`Error fetching FRED series ${seriesId}:`, error);
    throw error;
  }
};

// Economic Indicators mapping to FRED series IDs
export const FRED_SERIES = {
  gdp: {
    id: 'GDP',
    title: 'Gross Domestic Product',
    frequency: 'quarterly'
  },
  gdpGrowth: {
    id: 'A191RL1Q225SBEA',
    title: 'Real GDP Growth Rate',
    frequency: 'quarterly'
  },
  unemployment: {
    id: 'UNRATE',
    title: 'Unemployment Rate',
    frequency: 'monthly'
  },
  inflation: {
    id: 'CPIAUCSL', 
    title: 'Consumer Price Index',
    frequency: 'monthly'
  },
  inflationRate: {
    id: 'CPIAUCSL_PC1',
    title: 'Inflation Rate (CPI, YoY Change)',
    frequency: 'monthly'
  },
  federalFundsRate: {
    id: 'FEDFUNDS',
    title: 'Federal Funds Rate',
    frequency: 'monthly'
  },
  sp500: {
    id: 'SP500',
    title: 'S&P 500 Index',
    frequency: 'daily'
  },
  housing: {
    id: 'MSPUS',
    title: 'Median Sales Price of Houses',
    frequency: 'quarterly'
  },
  tradeBalance: {
    id: 'BOPGSTB',
    title: 'Trade Balance of Goods and Services',
    frequency: 'monthly'
  },
  manufacturing: {
    id: 'IPMAN',
    title: 'Industrial Production: Manufacturing',
    frequency: 'monthly'
  }
};

// Function to calculate percent change between observations
export const calculatePercentChange = (data) => {
  if (!data || data.length < 2) return 0;
  
  const latestValue = parseFloat(data[data.length - 1].value);
  const previousValue = parseFloat(data[data.length - 2].value);
  
  if (isNaN(latestValue) || isNaN(previousValue) || previousValue === 0) return 0;
  
  return ((latestValue - previousValue) / previousValue) * 100;
};

// Process FRED data for our dashboard
export const processFredData = (fredData) => {
  if (!fredData || !fredData.data || fredData.data.length === 0) {
    return null;
  }
  
  const observations = fredData.data;
  const values = observations.map(obs => parseFloat(obs.value) || 0);
  const dates = observations.map(obs => obs.date);
  
  const currentValue = values[values.length - 1];
  const previousValue = values[values.length - 2];
  const change = currentValue - previousValue;
  
  return {
    title: fredData.title,
    data: values,
    labels: dates,
    currentValue: currentValue,
    previousValue: previousValue,
    change: change,
    unit: fredData.units || '',
    source: 'FRED'
  };
};

// Fetch multiple FRED indicators at once
export const fetchMultipleFredSeries = async (seriesIds, options = {}) => {
  try {
    const promises = seriesIds.map(id => 
      fetchFredSeries(id, { 
        ...options,
        frequency: FRED_SERIES[id]?.frequency || options.frequency || 'monthly'
      })
    );
    
    const results = await Promise.all(promises);
    
    return results.reduce((acc, result, index) => {
      const seriesKey = seriesIds[index];
      acc[seriesKey] = processFredData(result);
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching multiple FRED series:', error);
    throw error;
  }
};
