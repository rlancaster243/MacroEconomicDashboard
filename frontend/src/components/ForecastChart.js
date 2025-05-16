import React from 'react';
import { Line } from 'react-chartjs-2';

const ForecastChart = ({ historicalData, forecastData, options, title }) => {
  const chartData = {
    labels: [...historicalData.labels, ...forecastData.labels],
    datasets: [
      {
        label: 'Historical Data',
        data: [...historicalData.data, ...Array(forecastData.data.length).fill(null)],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        pointRadius: 3,
        borderWidth: 2,
        fill: true,
      },
      {
        label: 'Forecast',
        data: [...Array(historicalData.data.length).fill(null), ...forecastData.data],
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderDash: [5, 5],
        pointRadius: 3,
        borderWidth: 2,
        fill: true,
      },
      // Optional: Confidence intervals
      ...(forecastData.upperBound ? [{
        label: 'Upper Bound',
        data: [...Array(historicalData.data.length).fill(null), ...forecastData.upperBound],
        borderColor: 'rgba(255, 99, 132, 0.5)',
        backgroundColor: 'transparent',
        borderDash: [2, 2],
        pointRadius: 0,
        borderWidth: 1,
        fill: false,
      }] : []),
      ...(forecastData.lowerBound ? [{
        label: 'Lower Bound',
        data: [...Array(historicalData.data.length).fill(null), ...forecastData.lowerBound],
        borderColor: 'rgba(255, 99, 132, 0.5)',
        backgroundColor: 'transparent',
        borderDash: [2, 2],
        pointRadius: 0,
        borderWidth: 1,
        fill: '-1', // Fill between upper and lower bounds
      }] : [])
    ]
  };

  const defaultOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: !!title,
        text: title || '',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const datasetLabel = context.dataset.label || '';
            const value = context.parsed.y;
            if (value === null) return datasetLabel + ': No data';
            return datasetLabel + ': ' + value.toFixed(2);
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: options?.xLabel || 'Time',
        }
      },
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: options?.yLabel || 'Value',
        }
      }
    }
  };

  return (
    <div className="forecast-chart-container">
      <Line 
        data={chartData} 
        options={{ ...defaultOptions, ...options }} 
      />
    </div>
  );
};

// Helper function to generate a simple forecast
export const generateSimpleForecast = (historicalData, periods = 6) => {
  if (!historicalData || !historicalData.data || historicalData.data.length < 2) {
    console.error('Insufficient data for forecasting');
    return {
      labels: [],
      data: [],
      upperBound: [],
      lowerBound: []
    };
  }
  
  const data = historicalData.data;
  const labels = historicalData.labels;
  
  // Simple moving average calculation
  const movingAverageWindow = Math.min(6, Math.floor(data.length / 2));
  const recentValues = data.slice(-movingAverageWindow);
  const avgChange = recentValues.map((val, i) => 
    i > 0 ? val - recentValues[i - 1] : 0
  ).slice(1).reduce((sum, change) => sum + change, 0) / (movingAverageWindow - 1);
  
  // Generate forecast values
  const lastValue = data[data.length - 1];
  const lastDate = new Date(labels[labels.length - 1]);
  const forecast = Array(periods).fill(0).map((_, i) => lastValue + avgChange * (i + 1));
  
  // Generate forecast dates (assume monthly data)
  const forecastLabels = Array(periods).fill(0).map((_, i) => {
    const date = new Date(lastDate);
    date.setMonth(date.getMonth() + i + 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  });
  
  // Simple confidence bounds (increase spread over time)
  const volatility = Math.sqrt(
    recentValues.map((val, i) => 
      i > 0 ? Math.pow(val - recentValues[i - 1] - avgChange, 2) : 0
    ).slice(1).reduce((sum, diff) => sum + diff, 0) / (movingAverageWindow - 1)
  );
  
  const upperBound = forecast.map((val, i) => val + volatility * Math.sqrt(i + 1));
  const lowerBound = forecast.map((val, i) => val - volatility * Math.sqrt(i + 1));
  
  return {
    labels: forecastLabels,
    data: forecast,
    upperBound,
    lowerBound
  };
};

export default ForecastChart;