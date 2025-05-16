import React, { useState, useEffect } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const CustomizableDashboard = ({ 
  children, 
  layout,
  onLayoutChange,
  columns = 12,
  rowHeight = 100,
  containerClassName = '',
  isDraggable = true,
  isResizable = true,
  compactType = 'vertical'
}) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Calculate cols based on screen size
  const getCols = () => {
    if (windowWidth < 768) return 1; // Mobile
    if (windowWidth < 1024) return 2; // Tablet
    return columns; // Desktop
  };
  
  return (
    <div className={`customizable-dashboard ${containerClassName}`}>
      <GridLayout
        className="layout"
        layout={layout}
        cols={getCols()}
        rowHeight={rowHeight}
        width={windowWidth}
        onLayoutChange={onLayoutChange}
        isDraggable={isDraggable}
        isResizable={isResizable}
        compactType={compactType}
        margin={[16, 16]}
      >
        {children}
      </GridLayout>
    </div>
  );
};

// Dashboard Panel Component
export const DashboardPanel = ({ children, className = '', title, onRemove, onEdit }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden flex flex-col ${className}`}>
      <div className="p-3 border-b flex justify-between items-center bg-gray-50">
        <h3 className="text-gray-700 font-medium">{title}</h3>
        <div className="flex items-center space-x-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              aria-label="Edit panel"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onRemove && (
            <button
              onClick={onRemove}
              className="text-gray-400 hover:text-red-500 transition-colors duration-200"
              aria-label="Remove panel"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="p-4 flex-grow overflow-auto">
        {children}
      </div>
    </div>
  );
};

// Custom hook to manage dashboard layout in localStorage
export const useDashboardLayout = (initialLayout = []) => {
  const [layout, setLayout] = useState([]);
  
  // Load layout from localStorage on initial render
  useEffect(() => {
    const storedLayout = localStorage.getItem('dashboardLayout');
    if (storedLayout) {
      try {
        setLayout(JSON.parse(storedLayout));
      } catch (e) {
        console.error('Error parsing dashboard layout from localStorage:', e);
        setLayout(initialLayout);
      }
    } else {
      setLayout(initialLayout);
    }
  }, [initialLayout]);
  
  // Save layout to localStorage when it changes
  const saveLayout = (newLayout) => {
    setLayout(newLayout);
    localStorage.setItem('dashboardLayout', JSON.stringify(newLayout));
  };
  
  // Add a new panel to the layout
  const addPanel = (panel) => {
    const newLayout = [...layout, panel];
    saveLayout(newLayout);
  };
  
  // Remove a panel from the layout
  const removePanel = (panelId) => {
    const newLayout = layout.filter(item => item.i !== panelId);
    saveLayout(newLayout);
  };
  
  // Update a panel in the layout
  const updatePanel = (panelId, updates) => {
    const newLayout = layout.map(item => 
      item.i === panelId ? { ...item, ...updates } : item
    );
    saveLayout(newLayout);
  };
  
  return {
    layout,
    saveLayout,
    addPanel,
    removePanel,
    updatePanel
  };
};

export default CustomizableDashboard;