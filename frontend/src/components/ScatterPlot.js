import React from 'react';
import { Scatter } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  LinearScale, 
  PointElement, 
  Tooltip, 
  Legend 
} from 'chart.js';

// Register required Chart.js components
ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

const ScatterPlot = ({ data, options, title }) => {
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
            const point = context.dataset.data[context.dataIndex];
            return `${context.dataset.label}: (${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: false,
        title: {
          display: true,
          text: options?.xLabel || 'X Axis',
        }
      },
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: options?.yLabel || 'Y Axis',
        }
      }
    }
  };
  
  return (
    <div className="scatter-plot-container">
      <Scatter 
        data={data} 
        options={{ ...defaultOptions, ...options }} 
      />
    </div>
  );
};

// Helper function to create scatter plot data
export const createScatterData = (xData, yData, label, color) => {
  if (!xData || !yData || xData.length !== yData.length) {
    console.error('Invalid data for scatter plot');
    return {
      datasets: []
    };
  }
  
  return {
    datasets: [
      {
        label: label || 'Dataset',
        data: xData.map((x, i) => ({ x, y: yData[i] })),
        backgroundColor: color || 'rgba(75, 192, 192, 0.5)',
      }
    ]
  };
};

export default ScatterPlot;