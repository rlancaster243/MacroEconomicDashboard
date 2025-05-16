import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import "./App.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import moment from "moment";

// Import services
import { fetchMultipleFredSeries, FRED_SERIES } from "./services/fredService";
import { fetchGDPData, fetchTradeBalanceData } from "./services/beaService";
import { fetchMultipleBLSSeries, BLS_SERIES } from "./services/blsService";
import { 
  fetchWorldBankData, 
  fetchMultipleWorldBankIndicators, 
  WORLD_BANK_DATASETS,
  WORLD_BANK_INDICATORS
} from "./services/worldBankService";

// Import mock data for fallback
import { mockData } from "./mockData";

// Import components
import LoadingSpinner from "./components/LoadingSpinner";
import ScatterPlot, { createScatterData } from "./components/ScatterPlot";
import RadarChart, { createRadarData } from "./components/RadarChart";
import ForecastChart, { generateSimpleForecast } from "./components/ForecastChart";
import CustomDateRangePicker from "./components/CustomDateRangePicker";
import FavoriteIndicators, { useFavorites } from "./components/FavoriteIndicators";
import CustomizableDashboard, { 
  DashboardPanel, 
  useDashboardLayout 
} from "./components/CustomizableDashboard";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// API Configurations
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Helper function to format numbers with proper units
const formatNumber = (value, unit = '') => {
  if (unit === '$' || unit === 'USD') {
    return `$${value.toLocaleString()}`;
  } else if (unit === '%') {
    return `${value.toFixed(1)}%`;
  } else if (unit === '$ Billion') {
    return `$${value.toFixed(1)} B`;
  } else {
    return value.toLocaleString();
  }
};

// Helper function to create chart data
const createChartData = (dataset, color) => {
  if (!dataset) return null;
  
  return {
    labels: dataset.labels,
    datasets: [
      {
        label: dataset.title,
        data: dataset.data,
        borderColor: color,
        backgroundColor: `${color}33`,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };
};

// Chart options
const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
  },
  scales: {
    y: {
      beginAtZero: false,
    },
  },
};

// Header Component
const Header = () => {
  return (
    <header className="bg-indigo-900 text-white shadow-lg py-4">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold">US Macroeconomic Dashboard</h1>
        <p className="text-indigo-200">Real-time economic indicators & trends</p>
      </div>
    </header>
  );
};

// Indicator Card Component
const IndicatorCard = ({ data, color }) => {
  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 animate-pulse" style={{ borderLeftColor: color }}>
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }
  
  const changeClass = data.change >= 0 
    ? "text-green-500" 
    : "text-red-500";
  
  const changeIcon = data.change >= 0 
    ? "↑" 
    : "↓";

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 indicator-card" style={{ borderLeftColor: color }}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-700">{data.title}</h3>
          <p className="text-sm text-gray-500">Source: {data.source}</p>
        </div>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          {data.unit}
        </span>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold">{formatNumber(data.currentValue, data.unit)}</div>
        <div className={`text-sm font-medium ${changeClass} flex items-center mt-1`}>
          {changeIcon} {Math.abs(data.change).toFixed(2)} 
          {data.previousValue !== 0 && (
            <span className="ml-1">
              ({(Math.abs(data.change) / Math.abs(data.previousValue) * 100).toFixed(1)}%)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Dashboard Section Component
const DashboardSection = ({ title, children }) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
      {children}
    </div>
  );
};

// Chart Container Component
const ChartContainer = ({ title, children, isLoading }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-700"></div>
        </div>
      ) : (
        children
      )}
    </div>
  );
};

// Indicators Grid Component
const IndicatorsGrid = ({ indicators, isLoading, favorites }) => {
  const colors = [
    "#3B82F6", // blue-500
    "#10B981", // emerald-500
    "#F59E0B", // amber-500
    "#EF4444", // red-500
    "#8B5CF6", // violet-500
    "#EC4899", // pink-500
    "#06B6D4", // cyan-500
    "#F97316", // orange-500
  ];

  // Show favorite indicators first if available
  const orderedIndicators = Object.keys(indicators).sort((a, b) => {
    const aIsFavorite = favorites.includes(a);
    const bIsFavorite = favorites.includes(b);
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return 0;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {isLoading ? (
        // Skeleton loaders
        Array(8).fill(0).map((_, index) => (
          <IndicatorCard key={index} color={colors[index % colors.length]} />
        ))
      ) : (
        // Actual data
        orderedIndicators.map((key, index) => (
          <IndicatorCard 
            key={key} 
            data={indicators[key]} 
            color={favorites.includes(key) ? "#10B981" : colors[index % colors.length]} 
          />
        ))
      )}
    </div>
  );
};

// Chart Grid Component
const ChartGrid = ({ indicators, isLoading, selectedIndicators }) => {
  const colors = [
    "#3B82F6", // blue-500
    "#10B981", // emerald-500
    "#F59E0B", // amber-500
    "#EF4444", // red-500
    "#8B5CF6", // violet-500
    "#EC4899", // pink-500
    "#06B6D4", // cyan-500
    "#F97316", // orange-500
  ];

  const chartIndicators = selectedIndicators.length > 0 
    ? selectedIndicators 
    : Object.keys(indicators).slice(0, 8);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {chartIndicators.slice(0, 4).map((key, index) => (
        <ChartContainer 
          key={key} 
          title={indicators[key]?.title || 'Loading...'}
          isLoading={isLoading}
        >
          {indicators[key] && (
            <Line 
              data={createChartData(indicators[key], colors[index % colors.length])} 
              options={chartOptions} 
            />
          )}
        </ChartContainer>
      ))}
      {chartIndicators.slice(4).map((key, index) => (
        <ChartContainer 
          key={key} 
          title={indicators[key]?.title || 'Loading...'}
          isLoading={isLoading}
        >
          {indicators[key] && (
            <Bar 
              data={createChartData(indicators[key], colors[(index + 4) % colors.length])} 
              options={chartOptions} 
            />
          )}
        </ChartContainer>
      ))}
    </div>
  );
};

// Comparison Tool Component
const ComparisonTool = ({ indicators, isLoading }) => {
  const [selectedIndicators, setSelectedIndicators] = useState([]);
  const [dateRange, setDateRange] = useState('1year');
  const [comparisonMode, setComparisonMode] = useState('line'); // 'line', 'scatter', 'radar'

  useEffect(() => {
    // Initialize with first two indicators when data is loaded
    if (!isLoading && Object.keys(indicators).length > 0) {
      const indicatorKeys = Object.keys(indicators);
      setSelectedIndicators(indicatorKeys.slice(0, 2));
    }
  }, [isLoading, indicators]);

  const indicatorOptions = Object.keys(indicators).map(key => ({
    value: key,
    label: indicators[key]?.title || key
  }));

  const dateRangeOptions = [
    { value: '3months', label: '3 Months' },
    { value: '6months', label: '6 Months' },
    { value: '1year', label: 'Last Year' },
    { value: '2years', label: 'Last 2 Years' },
  ];

  const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

  // Calculate time range for labels
  const getLabels = () => {
    const dateRangeMap = {
      '3months': 3,
      '6months': 6,
      '1year': 12,
      '2years': 24
    };
    const months = dateRangeMap[dateRange] || 12;
    return [...Array(months)].map((_, i) => moment().subtract(months - i - 1, 'months').format('MMM YYYY'));
  };

  // Create data for line comparison chart
  const createLineComparisonData = () => {
    if (isLoading || selectedIndicators.length === 0) {
      return {
        labels: getLabels(),
        datasets: []
      };
    }

    return {
      labels: getLabels(),
      datasets: selectedIndicators.map((ind, index) => {
        if (!indicators[ind]) return null;
        
        // Adjust data length to match labels length
        const data = indicators[ind].data || [];
        const slicedData = data.slice(-getLabels().length);
        
        // If data length is less than labels length, pad with nulls
        const paddedData = slicedData.length < getLabels().length 
          ? [...Array(getLabels().length - slicedData.length).fill(null), ...slicedData]
          : slicedData;
        
        return {
          label: indicators[ind].title,
          data: paddedData,
          borderColor: colors[index % colors.length],
          backgroundColor: `${colors[index % colors.length]}33`,
          borderWidth: 2,
          fill: false,
          tension: 0.4,
        }
      }).filter(Boolean)
    };
  };

  // Create data for scatter plot comparison
  const createScatterComparisonData = () => {
    if (isLoading || selectedIndicators.length < 2) {
      return { datasets: [] };
    }

    const ind1 = selectedIndicators[0];
    const ind2 = selectedIndicators[1];

    if (!indicators[ind1] || !indicators[ind2]) {
      return { datasets: [] };
    }

    // Get the data for each indicator
    const data1 = indicators[ind1].data || [];
    const data2 = indicators[ind2].data || [];

    // Create points for scatter plot (use minimum length of both datasets)
    const length = Math.min(data1.length, data2.length);
    const points = [];

    for (let i = 0; i < length; i++) {
      points.push({ x: data1[i], y: data2[i] });
    }

    return {
      datasets: [
        {
          label: `${indicators[ind1].title} vs ${indicators[ind2].title}`,
          data: points,
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        }
      ]
    };
  };

  // Create data for radar chart comparison
  const createRadarComparisonData = () => {
    if (isLoading || selectedIndicators.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Normalize data for radar chart (all values from 0-100)
    const normalizedData = selectedIndicators.map(ind => {
      if (!indicators[ind] || !indicators[ind].data) return null;
      
      const data = indicators[ind].data;
      const min = Math.min(...data);
      const max = Math.max(...data);
      const range = max - min;
      
      // Handle case where all values are the same
      if (range === 0) return { ...indicators[ind], normalized: Array(data.length).fill(50) };
      
      // Normalize to 0-100 scale
      const normalized = data.map(val => ((val - min) / range) * 100);
      
      return { ...indicators[ind], normalized };
    }).filter(Boolean);

    // Get the time periods (labels)
    const timeLabels = normalizedData[0]?.labels?.slice(-6) || [];

    // Create datasets for each time period
    return {
      labels: selectedIndicators.map(ind => indicators[ind]?.title || ind),
      datasets: timeLabels.map((label, idx) => {
        // Get the normalized value for each indicator at this time period
        const dataPoints = normalizedData.map(ind => {
          const dataIndex = ind.labels.indexOf(label);
          return dataIndex >= 0 ? ind.normalized[dataIndex] : 0;
        });

        return {
          label,
          data: dataPoints,
          backgroundColor: `${colors[idx % colors.length]}33`,
          borderColor: colors[idx % colors.length],
          borderWidth: 2,
        };
      })
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Indicator Comparison Tool</h3>
      
      {isLoading ? (
        <LoadingSpinner message="Loading comparison data..." />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Indicators (Up to {comparisonMode === 'radar' ? '6' : '2'})
              </label>
              <div className="flex flex-wrap gap-2">
                {indicatorOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      if (selectedIndicators.includes(option.value)) {
                        setSelectedIndicators(selectedIndicators.filter(i => i !== option.value));
                      } else if (
                        (comparisonMode === 'radar' && selectedIndicators.length < 6) ||
                        (comparisonMode !== 'radar' && selectedIndicators.length < 2)
                      ) {
                        setSelectedIndicators([...selectedIndicators, option.value]);
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedIndicators.includes(option.value)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Range
              </label>
              <div className="flex flex-wrap gap-2">
                {dateRangeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setDateRange(option.value)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      dateRange === option.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visualization Type
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setComparisonMode('line')}
                className={`px-3 py-1 rounded-full text-sm ${
                  comparisonMode === 'line'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Line Chart
              </button>
              <button
                onClick={() => {
                  setComparisonMode('scatter');
                  if (selectedIndicators.length > 2) {
                    setSelectedIndicators(selectedIndicators.slice(0, 2));
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm ${
                  comparisonMode === 'scatter'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Scatter Plot
              </button>
              <button
                onClick={() => setComparisonMode('radar')}
                className={`px-3 py-1 rounded-full text-sm ${
                  comparisonMode === 'radar'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Radar Chart
              </button>
            </div>
          </div>
          
          <div className="h-80">
            {comparisonMode === 'line' && (
              <Line 
                data={createLineComparisonData()} 
                options={{
                  ...chartOptions,
                  maintainAspectRatio: false,
                }} 
              />
            )}
            {comparisonMode === 'scatter' && selectedIndicators.length >= 2 && (
              <ScatterPlot 
                data={createScatterComparisonData()} 
                options={{
                  maintainAspectRatio: false,
                  xLabel: indicators[selectedIndicators[0]]?.title,
                  yLabel: indicators[selectedIndicators[1]]?.title,
                }} 
              />
            )}
            {comparisonMode === 'radar' && (
              <RadarChart 
                data={createRadarComparisonData()} 
                options={{
                  maintainAspectRatio: false,
                }} 
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Forecast Component
const ForecastComponent = ({ indicators, isLoading }) => {
  const [selectedIndicator, setSelectedIndicator] = useState('');
  const [forecastPeriods, setForecastPeriods] = useState(6); // Default 6 months

  useEffect(() => {
    // Initialize with first indicator when data is loaded
    if (!isLoading && Object.keys(indicators).length > 0) {
      setSelectedIndicator(Object.keys(indicators)[0]);
    }
  }, [isLoading, indicators]);

  const indicatorOptions = Object.keys(indicators).map(key => ({
    value: key,
    label: indicators[key]?.title || key
  }));

  const generateForecast = () => {
    if (!selectedIndicator || !indicators[selectedIndicator]) {
      return null;
    }

    return generateSimpleForecast(indicators[selectedIndicator], forecastPeriods);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Economic Forecast</h3>
      
      {isLoading ? (
        <LoadingSpinner message="Loading forecast data..." />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Indicator
              </label>
              <div className="flex flex-wrap gap-2">
                {indicatorOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedIndicator(option.value)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedIndicator === option.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Forecast Horizon
              </label>
              <div className="flex flex-wrap gap-2">
                {[3, 6, 12].map(periods => (
                  <button
                    key={periods}
                    onClick={() => setForecastPeriods(periods)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      forecastPeriods === periods
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {periods} {periods === 1 ? 'Period' : 'Periods'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="h-80">
            {selectedIndicator && indicators[selectedIndicator] && (
              <ForecastChart 
                historicalData={indicators[selectedIndicator]} 
                forecastData={generateForecast()}
                options={{
                  maintainAspectRatio: false,
                  xLabel: 'Date',
                  yLabel: `${indicators[selectedIndicator].title} (${indicators[selectedIndicator].unit})`,
                }}
                title={`${indicators[selectedIndicator].title} Forecast - Next ${forecastPeriods} Periods`}
              />
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mt-4 text-sm text-blue-800">
            <p className="font-semibold">About this forecast:</p>
            <p>This is a simple forecasting model based on recent trends in the data. It uses a moving average approach to project future values and estimate confidence intervals. For more accurate forecasts, consider using advanced statistical methods or machine learning techniques.</p>
          </div>
        </>
      )}
    </div>
  );
};

// Heat Map Component
const HeatMap = ({ indicators, isLoading }) => {
  // Dynamically calculate correlation between indicators
  const calculateCorrelation = () => {
    if (isLoading || !indicators || Object.keys(indicators).length === 0) {
      return [];
    }
    
    const indicatorKeys = Object.keys(indicators);
    const result = [];
    
    // For each pair of indicators, calculate correlation
    for (let i = 0; i < indicatorKeys.length; i++) {
      const row = [];
      for (let j = 0; j < indicatorKeys.length; j++) {
        if (i === j) {
          // Perfect correlation with self
          row.push(1.0);
        } else {
          // Simple mock correlation based on the data trend
          // In a real app, you'd use proper statistical methods
          const data1 = indicators[indicatorKeys[i]]?.data || [];
          const data2 = indicators[indicatorKeys[j]]?.data || [];
          
          // Ensure both datasets have data
          if (data1.length === 0 || data2.length === 0) {
            row.push(0);
            continue;
          }
          
          // Use a very simplified correlation approximation
          // Compare the direction of change over time
          let matchingDirections = 0;
          let total = 0;
          
          // Use the minimum length of the two datasets
          const minLength = Math.min(data1.length, data2.length);
          
          for (let k = 1; k < minLength; k++) {
            const dir1 = data1[k] > data1[k-1] ? 1 : -1;
            const dir2 = data2[k] > data2[k-1] ? 1 : -1;
            
            if (dir1 === dir2) matchingDirections++;
            total++;
          }
          
          // Calculate pseudo-correlation (-1 to 1)
          const pseudoCorrelation = total > 0 
            ? (matchingDirections / total) * 2 - 1 
            : 0;
          
          row.push(Math.abs(pseudoCorrelation));
        }
      }
      result.push(row);
    }
    
    return result;
  };

  const correlationData = calculateCorrelation();
  const indicatorNames = Object.keys(indicators).map(key => indicators[key]?.title || key);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Indicator Correlation Heat Map</h3>
      
      {isLoading ? (
        <LoadingSpinner message="Calculating correlations..." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-3 py-2 bg-gray-100"></th>
                {indicatorNames.map((ind, i) => (
                  <th key={i} className="px-3 py-2 text-xs bg-gray-100">{ind}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {correlationData.map((row, i) => (
                <tr key={i}>
                  <th className="px-3 py-2 text-xs text-left bg-gray-100">{indicatorNames[i]}</th>
                  {row.map((value, j) => {
                    // Calculate background color intensity based on correlation
                    const intensity = Math.floor(value * 255);
                    const bgColor = value >= 0.7 
                      ? `rgba(220, 38, 38, ${value})` // Red for high positive correlation
                      : value >= 0.4 
                        ? `rgba(251, 146, 60, ${value})` // Orange for medium positive correlation
                        : `rgba(249, 250, 251, ${Math.max(0.1, value)})`; // Light gray for low correlation
                    
                    return (
                      <td 
                        key={j} 
                        className="px-4 py-2 text-center text-sm" 
                        style={{ backgroundColor: bgColor }}
                      >
                        {value.toFixed(1)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// User Preferences Panel
const UserPreferencesPanel = ({ indicators, favorites, onToggleFavorite, dateRange, onDateRangeChange }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Dashboard Preferences</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-gray-700 mb-3">Favorite Indicators</h4>
          <FavoriteIndicators 
            indicators={indicators} 
            favorites={favorites} 
            onToggleFavorite={onToggleFavorite} 
          />
        </div>
        
        <div>
          <h4 className="font-medium text-gray-700 mb-3">Custom Date Range</h4>
          <CustomDateRangePicker
            onChange={onDateRangeChange}
            initialStartDate={dateRange?.startDate}
            initialEndDate={dateRange?.endDate}
          />
        </div>
      </div>
    </div>
  );
};

// Data Sources Component
const DataSources = () => {
  const sources = [
    { name: "FRED", description: "Federal Reserve Economic Data" },
    { name: "BEA", description: "Bureau of Economic Analysis" },
    { name: "BLS", description: "Bureau of Labor Statistics" },
    { name: "World Bank", description: "World Bank Data" }
  ];
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Data Sources</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sources.map(source => (
          <div key={source.name} className="bg-gray-50 p-3 rounded">
            <h4 className="font-medium text-indigo-700">{source.name}</h4>
            <p className="text-sm text-gray-600">{source.description}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-500 mt-4">Data updated daily. Last update: {moment().format('MMMM D, YYYY')}</p>
    </div>
  );
};

// Customizable Dashboard View
const CustomDashboardView = ({ indicators, isLoading }) => {
  // Initialize dashboard layout
  const defaultLayout = [
    { i: 'gdp', x: 0, y: 0, w: 6, h: 4 },
    { i: 'unemployment', x: 6, y: 0, w: 6, h: 4 },
    { i: 'inflation', x: 0, y: 4, w: 6, h: 4 },
    { i: 'interest', x: 6, y: 4, w: 6, h: 4 },
    { i: 'comparison', x: 0, y: 8, w: 12, h: 6 },
    { i: 'forecast', x: 0, y: 14, w: 12, h: 6 },
  ];
  
  const { layout, saveLayout, addPanel, removePanel } = useDashboardLayout(defaultLayout);
  const [showPanelMenu, setShowPanelMenu] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState({});

  // Chart types for indicators
  const chartTypes = {
    line: 'Line Chart',
    bar: 'Bar Chart',
    radar: 'Radar Chart'
  };

  // Map of available panels
  const availablePanels = [
    { id: 'gdp', title: 'GDP' },
    { id: 'unemployment', title: 'Unemployment' },
    { id: 'inflation', title: 'Inflation' },
    { id: 'interest', title: 'Interest Rates' },
    { id: 'stocks', title: 'Stock Market' },
    { id: 'housing', title: 'Housing' },
    { id: 'trade', title: 'Trade Balance' },
    { id: 'manufacturing', title: 'Manufacturing' },
    { id: 'comparison', title: 'Comparison Tool' },
    { id: 'forecast', title: 'Forecast' },
    { id: 'heatmap', title: 'Correlation Heatmap' },
  ];

  // Handle layout change
  const handleLayoutChange = (newLayout) => {
    saveLayout(newLayout);
  };

  // Add a new panel
  const handleAddPanel = (panelId) => {
    const existingPanel = layout.find(item => item.i === panelId);
    
    if (!existingPanel) {
      const newPanel = {
        i: panelId,
        x: 0,
        y: 0,
        w: 6,
        h: 4
      };
      
      addPanel(newPanel);
    }
    
    setShowPanelMenu(false);
  };

  // Render panel content based on panel ID
  const renderPanelContent = (panelId) => {
    // If it's an indicator panel
    if (indicators[panelId]) {
      const chartType = selectedChartType[panelId] || 'line';
      
      if (chartType === 'line') {
        return (
          <Line 
            data={createChartData(indicators[panelId], '#3B82F6')} 
            options={chartOptions} 
          />
        );
      } else if (chartType === 'bar') {
        return (
          <Bar 
            data={createChartData(indicators[panelId], '#10B981')} 
            options={chartOptions} 
          />
        );
      } else if (chartType === 'radar') {
        return (
          <RadarChart 
            data={createRadarData(
              indicators[panelId].labels.slice(-6),
              [{
                label: indicators[panelId].title,
                data: indicators[panelId].data.slice(-6),
                color: '#8B5CF6'
              }]
            )}
            options={{ responsive: true }}
          />
        );
      }
    }
    
    // Special panels
    switch(panelId) {
      case 'comparison':
        return <ComparisonTool indicators={indicators} isLoading={isLoading} />;
      case 'forecast':
        return <ForecastComponent indicators={indicators} isLoading={isLoading} />;
      case 'heatmap':
        return <HeatMap indicators={indicators} isLoading={isLoading} />;
      default:
        return <div className="flex items-center justify-center h-full">No data available</div>;
    }
  };

  // Get panel title based on panel ID
  const getPanelTitle = (panelId) => {
    if (indicators[panelId]) {
      return indicators[panelId].title;
    }
    
    const panel = availablePanels.find(p => p.id === panelId);
    return panel ? panel.title : 'Dashboard Panel';
  };

  // Handle changing chart type for an indicator panel
  const handleChartTypeChange = (panelId, type) => {
    setSelectedChartType({
      ...selectedChartType,
      [panelId]: type
    });
  };

  // Panel edit menu for indicator panels
  const renderPanelEditMenu = (panelId) => {
    if (!indicators[panelId]) return null;
    
    return (
      <div className="absolute top-12 right-2 z-10 bg-white shadow-lg rounded-lg p-2 border">
        <div className="font-medium text-gray-700 mb-1 text-sm">Chart Type:</div>
        {Object.entries(chartTypes).map(([type, label]) => (
          <button
            key={type}
            onClick={() => handleChartTypeChange(panelId, type)}
            className={`block w-full text-left px-3 py-1 text-sm rounded ${
              (selectedChartType[panelId] || 'line') === type
                ? 'bg-indigo-100 text-indigo-700'
                : 'hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="custom-dashboard mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Customizable Dashboard</h2>
        <button
          onClick={() => setShowPanelMenu(!showPanelMenu)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Panel
        </button>
      </div>
      
      {showPanelMenu && (
        <div className="bg-white shadow-lg rounded-lg p-4 mb-4 border">
          <h3 className="font-medium text-gray-700 mb-2">Available Panels</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {availablePanels.map(panel => {
              const isAlreadyAdded = layout.some(item => item.i === panel.id);
              
              return (
                <button
                  key={panel.id}
                  onClick={() => handleAddPanel(panel.id)}
                  className={`px-3 py-2 text-sm rounded-lg ${
                    isAlreadyAdded
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                  }`}
                  disabled={isAlreadyAdded}
                >
                  {panel.title}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {isLoading ? (
        <LoadingSpinner message="Loading dashboard data..." />
      ) : (
        <CustomizableDashboard
          layout={layout}
          onLayoutChange={handleLayoutChange}
          containerClassName="min-h-[800px]"
        >
          {layout.map(panel => (
            <div key={panel.i} data-grid={panel}>
              <DashboardPanel
                title={getPanelTitle(panel.i)}
                onRemove={() => removePanel(panel.i)}
                onEdit={() => {
                  // Only show edit menu for indicator panels
                  if (indicators[panel.i]) {
                    const currentPanelId = panel.i;
                    setSelectedChartType(prev => ({
                      ...prev,
                      [currentPanelId]: prev[currentPanelId] ? undefined : (prev[currentPanelId] || 'line')
                    }));
                  }
                }}
                className="h-full"
              >
                {selectedChartType[panel.i] !== undefined && renderPanelEditMenu(panel.i)}
                {renderPanelContent(panel.i)}
              </DashboardPanel>
            </div>
          ))}
        </CustomizableDashboard>
      )}
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const [indicators, setIndicators] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 2)),
    endDate: new Date()
  });
  const [viewMode, setViewMode] = useState('standard'); // 'standard' or 'custom'
  
  // Use the favorites custom hook
  const { favorites, toggleFavorite } = useFavorites(['gdpGrowth', 'unemployment']);

  // List of FRED series IDs to fetch
  const indicatorKeys = [
    'gdpGrowth',
    'unemployment',
    'inflationRate',
    'federalFundsRate',
    'sp500',
    'housing',
    'tradeBalance',
    'manufacturing'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Initialize with empty data
        let allData = {};
        
        // Fetch data from FRED API - this is our primary source
        try {
          console.log('Fetching FRED data...');
          const fredData = await fetchMultipleFredSeries(indicatorKeys);
          allData = { ...allData, ...fredData };
          console.log('FRED data fetched successfully');
        } catch (error) {
          console.error('Error fetching FRED data:', error);
        }
        
        // Fetch BEA data
        try {
          console.log('Fetching BEA data...');
          const beaGDP = await fetchGDPData();
          const beaTradeBalance = await fetchTradeBalanceData();
          allData = { 
            ...allData, 
            beaGDP,
            beaTradeBalance 
          };
          console.log('BEA data fetched successfully');
        } catch (error) {
          console.error('Error fetching BEA data:', error);
        }
        
        // Fetch BLS data
        try {
          console.log('Fetching BLS data...');
          // Get array of series IDs for BLS
          const blsSeriesIds = [
            BLS_SERIES.unemployment.id,
            BLS_SERIES.cpi.id,
            BLS_SERIES.wages.id
          ];
          
          // Fetch BLS data
          const blsResults = await fetchMultipleBLSSeries(blsSeriesIds);
          
          // Map results to appropriate keys
          const blsData = {
            blsUnemployment: blsResults[BLS_SERIES.unemployment.id],
            blsCPI: blsResults[BLS_SERIES.cpi.id],
            blsWages: blsResults[BLS_SERIES.wages.id]
          };
          
          allData = { ...allData, ...blsData };
          console.log('BLS data fetched successfully');
        } catch (error) {
          console.error('Error fetching BLS data:', error);
        }
        
        // Fetch World Bank data
        try {
          console.log('Fetching World Bank data...');
          // Get array of indicator IDs for World Bank
          const worldBankIndicatorIds = [
            WORLD_BANK_INDICATORS.gdpGrowth,
            WORLD_BANK_INDICATORS.inflation,
            WORLD_BANK_INDICATORS.manufacturing
          ];
          
          // Fetch World Bank data
          const worldBankResults = await fetchMultipleWorldBankIndicators(worldBankIndicatorIds);
          allData = { ...allData, ...worldBankResults };
          console.log('World Bank data fetched successfully');
        } catch (error) {
          console.error('Error fetching World Bank data:', error);
        }
        
        // If we have at least some data, set it and clear any errors
        if (Object.keys(allData).length > 0) {
          setIndicators(allData);
          setError(null);
          console.log('Data loaded successfully:', Object.keys(allData));
        } else {
          // If we have no data at all, show an error
          setError('Failed to load economic data from any source. Please try again later.');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching economic data:', error);
        setError('Failed to load economic data. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle date range change
  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
    // In a real app, we'd refetch data based on the new date range
    console.log('Date range changed:', newRange);
  };

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Economic Dashboard</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('standard')}
              className={`px-4 py-2 rounded-lg ${
                viewMode === 'standard' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Standard View
            </button>
            <button
              onClick={() => setViewMode('custom')}
              className={`px-4 py-2 rounded-lg ${
                viewMode === 'custom' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Custom View
            </button>
          </div>
        </div>
        
        {viewMode === 'standard' ? (
          <>
            <DashboardSection title="Current Economic Indicators">
              <IndicatorsGrid indicators={indicators} isLoading={isLoading} favorites={favorites} />
            </DashboardSection>
            
            <DashboardSection title="Historical Trends">
              <ChartGrid indicators={indicators} isLoading={isLoading} selectedIndicators={favorites} />
            </DashboardSection>
            
            <DashboardSection title="Advanced Analysis">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ComparisonTool indicators={indicators} isLoading={isLoading} />
                <ForecastComponent indicators={indicators} isLoading={isLoading} />
              </div>
            </DashboardSection>
            
            <DashboardSection title="Your Preferences">
              <UserPreferencesPanel
                indicators={indicators}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
              />
            </DashboardSection>
            
            <DashboardSection title="About the Data">
              <DataSources />
            </DashboardSection>
          </>
        ) : (
          <CustomDashboardView indicators={indicators} isLoading={isLoading} />
        )}
      </main>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;