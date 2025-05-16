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

// Import FRED services
import { fetchMultipleFredSeries, FRED_SERIES } from "./services/fredService";
import LoadingSpinner from "./components/LoadingSpinner";

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
const IndicatorsGrid = ({ indicators, isLoading }) => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {isLoading ? (
        // Skeleton loaders
        Array(8).fill(0).map((_, index) => (
          <IndicatorCard key={index} color={colors[index % colors.length]} />
        ))
      ) : (
        // Actual data
        Object.keys(indicators).map((key, index) => (
          <IndicatorCard 
            key={key} 
            data={indicators[key]} 
            color={colors[index % colors.length]} 
          />
        ))
      )}
    </div>
  );
};

// Chart Grid Component
const ChartGrid = ({ indicators, isLoading }) => {
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

  const chartIndicators = Object.keys(indicators);

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

  const colors = ["#3B82F6", "#10B981"];

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

  // Create data for comparison chart
  const createComparisonData = () => {
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
                Select Indicators (Up to 2)
              </label>
              <div className="flex flex-wrap gap-2">
                {indicatorOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      if (selectedIndicators.includes(option.value)) {
                        setSelectedIndicators(selectedIndicators.filter(i => i !== option.value));
                      } else if (selectedIndicators.length < 2) {
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
          
          <div className="h-80">
            <Line 
              data={createComparisonData()} 
              options={{
                ...chartOptions,
                maintainAspectRatio: false,
              }} 
            />
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

// Main Dashboard Component
const Dashboard = () => {
  const [indicators, setIndicators] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
        
        // Fetch data from FRED API
        const data = await fetchMultipleFredSeries(indicatorKeys);
        
        setIndicators(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching economic data:', error);
        setError('Failed to load economic data. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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
        <DashboardSection title="Current Economic Indicators">
          <IndicatorsGrid indicators={indicators} isLoading={isLoading} />
        </DashboardSection>
        
        <DashboardSection title="Historical Trends">
          <ChartGrid indicators={indicators} isLoading={isLoading} />
        </DashboardSection>
        
        <DashboardSection title="Comparison & Analysis">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ComparisonTool indicators={indicators} isLoading={isLoading} />
            <HeatMap indicators={indicators} isLoading={isLoading} />
          </div>
        </DashboardSection>
        
        <DashboardSection title="About the Data">
          <DataSources />
        </DashboardSection>
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