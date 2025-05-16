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

// Mock data (to be replaced with actual API calls)
const mockData = {
  gdp: {
    title: "GDP Growth Rate",
    data: [2.1, 2.2, 1.8, 1.1, 0.2, 0.1, 0.5, 1.3, 1.9, 2.3, 2.7, 2.9],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: 2.9,
    change: 0.2,
    unit: "%",
    source: "FRED"
  },
  unemployment: {
    title: "Unemployment Rate",
    data: [4.2, 4.1, 4.0, 3.9, 3.9, 3.8, 3.7, 3.7, 3.6, 3.7, 3.8, 3.7],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: 3.7,
    change: -0.1,
    unit: "%",
    source: "BLS"
  },
  inflation: {
    title: "Inflation (CPI)",
    data: [2.9, 3.0, 3.1, 3.2, 3.3, 3.4, 3.3, 3.2, 3.1, 3.0, 2.9, 2.8],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: 2.8,
    change: -0.1,
    unit: "%",
    source: "BLS"
  },
  interestRate: {
    title: "Federal Funds Rate",
    data: [5.25, 5.25, 5.25, 5.25, 5.25, 5.25, 5.25, 5.25, 5.25, 5.0, 4.75, 4.5],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: 4.5,
    change: -0.25,
    unit: "%",
    source: "FRED"
  },
  stockMarket: {
    title: "S&P 500",
    data: [4200, 4250, 4300, 4350, 4400, 4450, 4500, 4550, 4600, 4650, 4700, 4750],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: 4750,
    change: 50,
    unit: "",
    source: "FRED"
  },
  housing: {
    title: "Median Home Price",
    data: [380000, 382000, 385000, 387000, 390000, 392000, 395000, 398000, 400000, 403000, 405000, 408000],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: 408000,
    change: 3000,
    unit: "$",
    source: "FRED"
  },
  tradeBalance: {
    title: "Trade Balance",
    data: [-65, -63, -62, -60, -58, -57, -55, -54, -52, -51, -49, -48],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: -48,
    change: 1,
    unit: "$ Billion",
    source: "BEA"
  },
  manufacturing: {
    title: "Manufacturing PMI",
    data: [49, 48.5, 48.8, 49.2, 49.5, 50.1, 50.3, 50.5, 50.8, 51.2, 51.5, 51.8],
    labels: [...Array(12)].map((_, i) => moment().subtract(12 - i, 'months').format('MMM YYYY')),
    currentValue: 51.8,
    change: 0.3,
    unit: "",
    source: "World Bank"
  }
};

// Helper function to create chart data
const createChartData = (dataset, color) => {
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
  const changeClass = data.change >= 0 
    ? "text-green-500" 
    : "text-red-500";
  
  const changeIcon = data.change >= 0 
    ? "↑" 
    : "↓";

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border-l-4" style={{ borderLeftColor: color }}>
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
        <div className="text-2xl font-bold">{data.currentValue}</div>
        <div className={`text-sm font-medium ${changeClass} flex items-center mt-1`}>
          {changeIcon} {Math.abs(data.change)} ({(Math.abs(data.change) / (data.currentValue - data.change) * 100).toFixed(1)}%)
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
const ChartContainer = ({ children }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full">
      {children}
    </div>
  );
};

// Indicators Grid Component
const IndicatorsGrid = () => {
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

  const indicators = Object.keys(mockData);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {indicators.map((key, index) => (
        <IndicatorCard key={key} data={mockData[key]} color={colors[index % colors.length]} />
      ))}
    </div>
  );
};

// Chart Grid Component
const ChartGrid = () => {
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

  const indicators = Object.keys(mockData);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {indicators.slice(0, 4).map((key, index) => (
        <ChartContainer key={key}>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{mockData[key].title}</h3>
          <Line 
            data={createChartData(mockData[key], colors[index % colors.length])} 
            options={chartOptions} 
          />
        </ChartContainer>
      ))}
      {indicators.slice(4).map((key, index) => (
        <ChartContainer key={key}>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{mockData[key].title}</h3>
          <Bar 
            data={createChartData(mockData[key], colors[(index + 4) % colors.length])} 
            options={chartOptions} 
          />
        </ChartContainer>
      ))}
    </div>
  );
};

// Comparison Tool Component
const ComparisonTool = () => {
  const [indicators, setIndicators] = useState(['gdp', 'unemployment']);
  const [dateRange, setDateRange] = useState('1year');

  const indicatorOptions = Object.keys(mockData).map(key => ({
    value: key,
    label: mockData[key].title
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
  const comparisonData = {
    labels: getLabels(),
    datasets: indicators.map((ind, index) => ({
      label: mockData[ind].title,
      data: mockData[ind].data.slice(-getLabels().length),
      borderColor: colors[index % colors.length],
      backgroundColor: `${colors[index % colors.length]}33`,
      borderWidth: 2,
      fill: false,
      tension: 0.4,
    }))
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Indicator Comparison Tool</h3>
      
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
                  if (indicators.includes(option.value)) {
                    setIndicators(indicators.filter(i => i !== option.value));
                  } else if (indicators.length < 2) {
                    setIndicators([...indicators, option.value]);
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm ${
                  indicators.includes(option.value)
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
          data={comparisonData} 
          options={{
            ...chartOptions,
            maintainAspectRatio: false,
          }} 
        />
      </div>
    </div>
  );
};

// Heat Map Component
const HeatMap = () => {
  // Sample correlation data between indicators
  const correlationData = [
    [1.0, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1],
    [0.7, 1.0, 0.8, 0.6, 0.5, 0.4, 0.3, 0.2],
    [0.6, 0.8, 1.0, 0.7, 0.6, 0.5, 0.4, 0.3],
    [0.5, 0.6, 0.7, 1.0, 0.7, 0.6, 0.5, 0.4],
    [0.4, 0.5, 0.6, 0.7, 1.0, 0.7, 0.6, 0.5],
    [0.3, 0.4, 0.5, 0.6, 0.7, 1.0, 0.7, 0.6],
    [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 1.0, 0.7],
    [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 1.0]
  ];

  const indicators = Object.keys(mockData).map(key => mockData[key].title);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Indicator Correlation Heat Map</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-3 py-2 bg-gray-100"></th>
              {indicators.map((ind, i) => (
                <th key={i} className="px-3 py-2 text-xs bg-gray-100">{ind}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {correlationData.map((row, i) => (
              <tr key={i}>
                <th className="px-3 py-2 text-xs text-left bg-gray-100">{indicators[i]}</th>
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
  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <DashboardSection title="Current Economic Indicators">
          <IndicatorsGrid />
        </DashboardSection>
        
        <DashboardSection title="Historical Trends">
          <ChartGrid />
        </DashboardSection>
        
        <DashboardSection title="Comparison & Analysis">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ComparisonTool />
            <HeatMap />
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