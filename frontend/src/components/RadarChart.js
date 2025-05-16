import React from 'react';
import { Radar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  RadialLinearScale, 
  PointElement, 
  LineElement, 
  Filler, 
  Tooltip, 
  Legend 
} from 'chart.js';

// Register required Chart.js components
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const RadarChart = ({ data, options, title }) => {
  const defaultOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: !!title,
        text: title || '',
      }
    },
    scale: {
      ticks: {
        beginAtZero: true
      }
    }
  };
  
  return (
    <div className="radar-chart-container">
      <Radar 
        data={data} 
        options={{ ...defaultOptions, ...options }} 
      />
    </div>
  );
};

// Helper function to create radar chart data
export const createRadarData = (labels, datasets) => {
  if (!labels || !datasets || datasets.length === 0) {
    console.error('Invalid data for radar chart');
    return {
      labels: [],
      datasets: []
    };
  }
  
  return {
    labels,
    datasets: datasets.map(set => ({
      label: set.label || 'Dataset',
      data: set.data,
      backgroundColor: `${set.color}33` || 'rgba(75, 192, 192, 0.2)',
      borderColor: set.color || 'rgba(75, 192, 192, 1)',
      borderWidth: 2,
    }))
  };
};

export default RadarChart;