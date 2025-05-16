import React, { useState, useEffect } from 'react';

const FavoriteIndicators = ({ indicators, onToggleFavorite, favorites }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter indicators based on search term
  const filteredIndicators = Object.keys(indicators).filter(key => {
    const indicator = indicators[key];
    if (!indicator) return false;
    
    const title = indicator.title?.toLowerCase() || '';
    const source = indicator.source?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return title.includes(search) || source.includes(search) || key.includes(search);
  });
  
  return (
    <div className="favorites-container">
      <div className="mb-4">
        <div className="relative rounded-md shadow-sm">
          <input
            type="text"
            className="form-input py-3 px-4 block w-full leading-5 rounded-md transition duration-150 ease-in-out sm:text-sm sm:leading-5 bg-gray-100 focus:bg-white"
            placeholder="Search indicators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
        {filteredIndicators.map(key => {
          const indicator = indicators[key];
          const isFavorite = favorites.includes(key);
          
          return (
            <div 
              key={key}
              className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md flex justify-between items-center ${
                isFavorite ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
              }`}
              onClick={() => onToggleFavorite(key)}
            >
              <div>
                <h4 className={`font-medium ${isFavorite ? 'text-indigo-700' : 'text-gray-700'}`}>
                  {indicator.title}
                </h4>
                <p className="text-xs text-gray-500">Source: {indicator.source}</p>
              </div>
              
              <button
                className={`w-6 h-6 flex items-center justify-center rounded-full ${
                  isFavorite ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isFavorite ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </button>
            </div>
          );
        })}
        
        {filteredIndicators.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No indicators match your search.
          </div>
        )}
      </div>
    </div>
  );
};

// Custom hook to manage favorites in localStorage
export const useFavorites = (initialFavorites = []) => {
  const [favorites, setFavorites] = useState([]);
  
  // Load favorites from localStorage on initial render
  useEffect(() => {
    const storedFavorites = localStorage.getItem('favoriteIndicators');
    if (storedFavorites) {
      try {
        setFavorites(JSON.parse(storedFavorites));
      } catch (e) {
        console.error('Error parsing favorites from localStorage:', e);
        setFavorites(initialFavorites);
      }
    } else {
      setFavorites(initialFavorites);
    }
  }, [initialFavorites]);
  
  // Toggle an indicator in favorites
  const toggleFavorite = (indicatorId) => {
    setFavorites(prevFavorites => {
      const newFavorites = prevFavorites.includes(indicatorId)
        ? prevFavorites.filter(id => id !== indicatorId)
        : [...prevFavorites, indicatorId];
      
      // Save to localStorage
      localStorage.setItem('favoriteIndicators', JSON.stringify(newFavorites));
      
      return newFavorites;
    });
  };
  
  return { favorites, toggleFavorite };
};

export default FavoriteIndicators;