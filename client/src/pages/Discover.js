import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './Discover.css';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import cloudActivityService, { CloudActivityService } from '../services/cloudActivityService';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ClearIcon from '@mui/icons-material/Clear';
import FolderIcon from '@mui/icons-material/Folder';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import MovieIcon from '@mui/icons-material/Movie';
import TvIcon from '@mui/icons-material/Tv';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import AnimationIcon from '@mui/icons-material/Animation';
import { 
  movieService, 
  tvShowService, 
  animeService, 
  gameService, 
  WatchlistService,
  searchAllMedia,  
  getPlaceholderImage,
  getAllMedia
} from '../services';
import { getCustomFolders, updateWatchlistItem } from '../services/watchlistService';
import { useAuth } from '../contexts/AuthContext';

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mediaItems, setMediaItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: searchParams.get('filter') || 'All',
    genre: 'All',
    year: 'All',
    rating: 'All'
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [mediaCounts, setMediaCounts] = useState({
    movies: 0,
    tvShows: 0,
    anime: 0,
    games: 0,
    total: 0
  });
  const [apiErrors, setApiErrors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [WatchlistItems, setWatchlistItems] = useState([]);
  // Custom folders state
  const [customFolders, setCustomFolders] = useState([]);
  const [folderDropdownOpen, setFolderDropdownOpen] = useState(null);
  const [folderItemAssignments, setFolderItemAssignments] = useState({});

  // Auth context
  const { isAuthenticated } = useAuth();

  // Load Watchlist on component mount
  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        const currentWatchlist = await WatchlistService.getWatchlist();
        setWatchlistItems(currentWatchlist);
      } catch (error) {
        console.error('Error loading Watchlist:', error);
        setWatchlistItems([]);
      }
    };    
    loadWatchlist();
    
    // Load custom folders from cloud only if authenticated
    if (isAuthenticated) {
      loadCustomFolders();
    }
  }, [isAuthenticated]);

  // Load custom folders from cloud
  const loadCustomFolders = async () => {
    if (!isAuthenticated) return;
    
    try {
      const folders = await getCustomFolders();
      const folderNames = folders.map(folder => folder.name);
      setCustomFolders(folderNames);
    } catch (error) {
      console.error('Error loading custom folders from cloud:', error);
      // Fallback: try to load from localStorage for backward compatibility
      try {
        const stored = localStorage.getItem('Watchlist-custom-folders');
        if (stored) {
          const localFolders = JSON.parse(stored);
          setCustomFolders(localFolders);
        }
      } catch (fallbackError) {
        console.error('Error loading from localStorage fallback:', fallbackError);
      }
    }
  };

  // Load data on component mount and handle URL search params
  useEffect(() => {
    const urlSearchQuery = searchParams.get('search');
    if (urlSearchQuery) {
      console.log('URL search query detected:', urlSearchQuery);
      setSearchQuery(urlSearchQuery);
      // Trigger search with URL query
      handleSearchWithQuery(urlSearchQuery);
    } else {
      fetchAllMediaData();
    }  
  }, [searchParams]);

  // Function to fetch all media data
  const fetchAllMediaData = async (page = 1, append = false) => {
    if (!append) {
      setLoading(true);
      setCurrentPage(1);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    setApiErrors([]);
    
    const startTime = Date.now();
    const minLoadingTime = 800; // Minimum 800ms loading for consistent UX
    
    try {
      console.log(`Fetching all media types... page ${page}`);
      const result = await getAllMedia(50, page); // Increase limit to 50 per page
      
      // Ensure minimum loading time for consistent skeleton display
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      if (!append) {
        // Set the media items for first page
        setMediaItems(result.media);
        setCurrentPage(2); // Set next page
      } else {
        // Append new items for subsequent pages
        setMediaItems(prev => [...prev, ...result.media]);
        setCurrentPage(page + 1);
      }
      
      // Check if there are more items to load
      setHasMore(result.media.length === 50);
      
      // Set counts for display (only on first load)
      if (!append) {
        setMediaCounts(result.counts);
      }
      
      // Set any API errors that occurred
      if (result.errors.length > 0) {
        setApiErrors(result.errors);
        // Show the first error as a toast (only on first load)
        if (!append) {
          toast.warning(`Some content couldn't be loaded: ${result.errors[0]}`);
        }
      }
      
      setLoading(false);
      setLoadingMore(false);
      console.log(`Media fetched successfully for page ${page}:`, result.counts);
    } catch (error) {
      console.error('Error fetching all media data:', error);
      setError('Failed to load media data. Please try again later.');
      setLoading(false);
      setLoadingMore(false);
      if (!append) {
        toast.error('Failed to load media data. Please try again later.');
      }    
    }
  };

  // Fetch specific media type
  const fetchMediaByType = useCallback(async (type, page = 1, append = false) => {
    if (!append) {
      setLoading(true);
      setCurrentPage(1);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    setApiErrors([]);
    
    const startTime = Date.now();
    const minLoadingTime = 800; // Minimum 800ms loading for consistent UX
    
    try {
      let result = [];
      console.log(`Fetching media by type: ${type}, page: ${page}`);
      
      switch(type) {
        case 'Movie':
          result = await movieService.getPopularMovies(page);
          break;
        case 'Web Series':
          result = await tvShowService.getPopularTVShows(page);
          break;        
        case 'Anime':
          result = await animeService.getPopularAnime(page);
          break;
        case 'Game':
          result = await gameService.getPopularGames(page);
          break;        
        default:
          // If 'All', fetch everything
          const allResult = await getAllMedia(50, page);
          result = allResult.media;
          setApiErrors(allResult.errors);
          if (allResult.errors.length > 0 && !append) {
            toast.warning(`Some content couldn't be loaded: ${allResult.errors[0]}`);
          }
          
          // Update media counts (only on first load)
          if (!append) {
            setMediaCounts(allResult.counts);
          }
          console.log('All media counts:', allResult.counts);
          console.log(`[All Section] Page ${page}: Got ${result.length} items, hasMore: ${result.length >= 30}`);
          
          // Ensure minimum loading time for consistent skeleton display
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
          
          if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
          }
          
          if (!append) {
            setMediaItems(result);
            setCurrentPage(2);
          } else {
            setMediaItems(prev => [...prev, ...result]);
            setCurrentPage(page + 1);
          }
          
          setHasMore(result.length >= 30); // More flexible - if we get at least 30 items, assume there might be more
          setLoading(false);
          setLoadingMore(false);
          return;
      }
      // Make sure all items have an image, use placeholder if not
      const mediaWithImages = result.map(item => {
        if (!item.image) {
          return { ...item, image: getPlaceholderImage(item.type) };
        }
        return item;
      });
      
      console.log(`Fetched ${mediaWithImages.length} items of type ${type} for page ${page}`);
      
      // Ensure minimum loading time for consistent skeleton display
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      if (!append) {
        setMediaItems(mediaWithImages);
        setCurrentPage(2);
      } else {
        setMediaItems(prev => [...prev, ...mediaWithImages]);
        setCurrentPage(page + 1);
      }
      // Check if there are more items (assuming 20 per page is max for individual types, 50 for all)
      const expectedPageSize = (type === 'All') ? 50 : 20;
      setHasMore(mediaWithImages.length === expectedPageSize);
      
      // Update media counts for the selected type (only on first load)
      if (!append) {
        const newCounts = {
          movies: type === 'Movie' ? mediaWithImages.length : 0,
          tvShows: type === 'Web Series' ? mediaWithImages.length : 0,
          anime: type === 'Anime' ? mediaWithImages.length : 0,
          games: type === 'Game' ? mediaWithImages.length : 0,
          total: mediaWithImages.length
        };        
        setMediaCounts(newCounts);
      }
      
      setLoading(false);
      setLoadingMore(false);
    } catch (error) {
      console.error(`Error fetching ${type} media:`, error);
      setError(`Failed to load ${type} data. Please try again later.`);
      setLoading(false);
      setLoadingMore(false);
      if (!append) {
        toast.error(`Failed to load ${type} data. Please try again later.`);
      }
    }
  }, []);

  // Handle filtering (but not search - search only happens on Enter)
  useEffect(() => {
    let result = [...mediaItems];
    
    // Only apply search filtering if we already have search results loaded
    // (don't filter as user types - wait for Enter key)
    
    // Apply type filter
    if (filters.type !== 'All') {
      result = result.filter(item => item.type === filters.type);
    }
    
    // Apply genre filter
    if (filters.genre !== 'All') {
      result = result.filter(item => 
        item.genre && item.genre.some(g => g === filters.genre)
      );
    }
    
    // Apply year filter
    if (filters.year !== 'All') {
      const yearFilter = parseInt(filters.year);
      result = result.filter(item => item.year === yearFilter);
    }
    
    // Apply rating filter
    if (filters.rating !== 'All') {
      const minRating = parseInt(filters.rating);
      result = result.filter(item => item.rating >= minRating);
    }
    
    setFilteredItems(result);
  }, [mediaItems, filters]); // Removed searchQuery dependency

  // Search all media types
  const handleSearch = async () => {
    console.log('handleSearch called with searchQuery:', searchQuery); // Debug log
    
    if (!searchQuery.trim()) {
      console.log('Empty search query, showing toast...'); // Debug log
      toast.info('Please enter a search query');
      return;
    }
    
    await handleSearchWithQuery(searchQuery.trim());
  };  

  // Helper function to search with a specific query
  const handleSearchWithQuery = async (query) => {
    console.log('Starting search for:', query); // Debug log
    setIsSearching(true);
    setLoading(true);
    setError(null);
    setApiErrors([]);
    
    // Reset pagination state for search
    setCurrentPage(1);
    setHasMore(false); // Disable infinite scroll for search results
    
    try {
      console.log(`Searching for: "${query}"`);
      const results = await searchAllMedia(query);
      console.log('Search results received:', results); // Debug log
      
      // Add placeholder images if needed
      const resultsWithImages = results.map(item => {
        if (!item.image) {
          return { ...item, image: getPlaceholderImage(item.type) };
        }
        return item;
      });
      setMediaItems(resultsWithImages);
      setFilteredItems(resultsWithImages); // Ensure filtered items are updated with search results
      setLoading(false);
      setIsSearching(false);
      
      if (resultsWithImages.length === 0) {
        toast.info(`No results found for "${query}"`);
      } else {
        // Update media counts
        const counts = {
          movies: resultsWithImages.filter(item => item.type === 'Movie').length,
          tvShows: resultsWithImages.filter(item => item.type === 'Web Series').length,
          anime: resultsWithImages.filter(item => item.type === 'Anime').length,
          games: resultsWithImages.filter(item => item.type === 'Game').length,
          total: resultsWithImages.length
        };        
        setMediaCounts(counts);
        
        console.log('Search results:', counts);
      }
    } catch (error) {
      console.error('Error searching media:', error);
      setError('Failed to search. Please try again later.');
      setLoading(false);
      setIsSearching(false);
      toast.error('Search failed. Please try again later.');
    }
  };

  // Get all available genres from data
  const getAllGenres = () => {
    const genres = new Set();
    mediaItems.forEach(item => {
      if (item.genre && Array.isArray(item.genre)) {
        item.genre.forEach(g => genres.add(g));
      }
    });
    return ['All', ...Array.from(genres)].sort();
  };

  // Get all available years from data
  const getAllYears = () => {
    const years = new Set();
    mediaItems.forEach(item => {
      if (item.year) {
        years.add(item.year);
      }
    });
    return ['All', ...Array.from(years)].sort((a, b) => b - a);
  };

  // Load more function for infinite scroll
  const loadMoreMedia = () => {
    if (loadingMore || !hasMore) return;
    
    if (filters.type === 'All') {
      fetchAllMediaData(currentPage, true);
    } else {
      fetchMediaByType(filters.type, currentPage, true);
    }
  };  

  // Infinite scroll detection
  useEffect(() => {
    const handleScroll = () => {
      // Don't trigger infinite scroll if we're in search mode
      if (searchQuery.trim() !== '' || isSearching) {
        return;
      }
      
      // Check if user is near bottom of page (within 200px)
      const scrollPosition = window.innerHeight + document.documentElement.scrollTop;
      const documentHeight = document.documentElement.offsetHeight;
      
      if (scrollPosition >= documentHeight - 200 && !loadingMore && hasMore) {
        loadMoreMedia();
      }
    };    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, currentPage, filters.type]); // Removed searchQuery dependency

  // Reset pagination when filter changes
  const handleTypeChange = (type) => {
    // Clear search query when switching types
    setSearchQuery('');
    setIsSearching(false);
    setFilters(prev => ({ ...prev, type }));
    setCurrentPage(1);
    setHasMore(true); // Re-enable infinite scroll when switching from search
    
    // Update URL to remove search params
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('search');
    setSearchParams(newSearchParams);
    
    if (type === 'All') {
      fetchAllMediaData(1, false);
    } else {
      fetchMediaByType(type, 1, false);
    }
  };  

  // Check if item is in Watchlist
  const isItemInWatchlist = (item) => {
    // Map client type to server type for comparison
    const typeMap = {
      'Movie': 'Movies',
      'TV Show': 'TV Shows',
      'Web Series': 'Web Series',
      'Anime': 'Anime',
      'Game': 'Games'
    };
    
    const mappedType = typeMap[item.type] || item.type;
    
    const found = WatchlistItems.some(WatchlistItem => 
      WatchlistItem.title === item.title && WatchlistItem.type === mappedType
    );
    
    if (item.type === 'Game' || item.type === 'Movie') {
      console.log('Checking if item is in Watchlist (Discover):', {
        title: item.title,
        originalType: item.type,
        mappedType: mappedType,
        found: found,
        WatchlistItemTypes: WatchlistItems.map(wi => wi.type)      
      });
    }
    
    return found;
  };

  // Handle add to Watchlist
  const handleAddToWatchlist = async (item) => {
    try {
      const result = await WatchlistService.addToWatchlist(item);
      
      if (result.success) {        
        // Log Watchlist addition activity
        cloudActivityService.logWatchlistAdd(item.title, item.type);
        
        toast.success(result.message);
        // Refresh Watchlist state
        const currentWatchlist = await WatchlistService.getWatchlist();
        setWatchlistItems(currentWatchlist);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error adding to Watchlist:', error);
      toast.error('Failed to add item to Watchlist');
    }
  };

  // Handle add to custom folder
  const handleAddToFolder = async (item, folderName) => {
    try {
      // Map client type to server type for comparison
      const typeMap = {
        'Movie': 'Movies',
        'TV Show': 'TV Shows',
        'Web Series': 'Web Series',
        'Anime': 'Anime',
        'Game': 'Games'
      };
      
      const mappedType = typeMap[item.type] || item.type;
      
      // First add to Watchlist if not already there
      let WatchlistItem = null;
      if (!isItemInWatchlist(item)) {
        const result = await WatchlistService.addToWatchlist(item);
        if (!result.success) {
          toast.error(result.message);
          return;
        }
        // Refresh Watchlist state and get the newly added item
        const currentWatchlist = await WatchlistService.getWatchlist();
        setWatchlistItems(currentWatchlist);
        // Find the newly added item by title and mapped type
        WatchlistItem = currentWatchlist.find(wItem => 
          wItem.title === item.title && wItem.type === mappedType
        );
      } else {
        // Find existing item in Watchlist
        WatchlistItem = WatchlistItems.find(wItem => 
          wItem.title === item.title && wItem.type === mappedType
        );
      }
      
      // Then assign to folder using the Watchlist item's ID
      if (!WatchlistItem) {
        toast.error('Failed to find item in Watchlist');
        return;
      }
      
      const updatedFolders = [folderName];
      // Update the item in the cloud
      const updateResult = await updateWatchlistItem(WatchlistItem._id, { folders: updatedFolders });
      
      if (updateResult && updateResult.success === true) {
        // Log folder assignment activity
        cloudActivityService.logActivity(
          CloudActivityService.TYPES.Watchlist_UPDATE,
          `Added "${item.title}" to "${folderName}" folder`,
          { itemTitle: item.title, toFolder: folderName }
        );
        
        const updatedAssignments = { ...folderItemAssignments };
        updatedAssignments[WatchlistItem._id] = folderName;
      
        setFolderItemAssignments(updatedAssignments);
        toast.success(`Added to ${folderName} folder`);
      } else {
        console.log('🔴 Failed branch - update result:', updateResult);
        toast.error(updateResult?.message || 'Failed to add to folder');
      }
      setFolderDropdownOpen(null);
    } catch (error) {
      console.error('Error adding to folder:', error);
      toast.error('Failed to add to folder');
    }
  };

  // Toggle folder dropdown
  const toggleFolderDropdown = (itemId) => {
    setFolderDropdownOpen(folderDropdownOpen === itemId ? null : itemId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (folderDropdownOpen && !event.target.closest('.folder-dropdown-container')) {
        setFolderDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [folderDropdownOpen]);

  // Handle search input keypress
  const handleSearchKeyPress = (e) => {
    console.log('Key pressed:', e.key); // Debug log
    if (e.key === 'Enter') {
      console.log('Enter key detected, triggering search...'); // Debug log
      e.preventDefault(); // Prevent form submission
      handleSearch();
    }
  };  

  // Function to retry loading data
  const handleRetry = () => {
    if (filters.type !== 'All') {
      fetchMediaByType(filters.type);
    } else {
      fetchAllMediaData();
    }
  };

  return (
    <div className="discover-container">
      <div className="discover-header">
        <h1>Discover</h1>        
        <div className="search-container">
          <div className="search-box">
            <SearchIcon className="search-icon" />
            <input 
              type="text" 
              placeholder={isSearching ? "Searching..." : "Search titles, genres, descriptions..."} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              disabled={isSearching}
            />
          </div>
          <button 
            className={`advanced-filter-btn ${isAdvancedFilterOpen ? 'active' : ''}`}
            onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
          >
            <TuneIcon /> Filters
          </button>
        </div>
      </div>

      {apiErrors.length > 0 && (
        <div className="api-warnings">
          <ErrorOutlineIcon /> Some content couldn't be loaded:
          <ul>
            {apiErrors.map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </ul>
          <button onClick={handleRetry} className="retry-btn">
            <RefreshIcon /> Retry
          </button>
        </div>
      )}

      <div className="discover-filters">        
        <div className="folder-tabs">
          <div 
            className={`folder-tab ${filters.type === 'All' ? 'active' : ''}`}
            onClick={() => handleTypeChange('All')}
          >
            <div className="folder-icon">
              <FolderIcon />
            </div>
            <h3 className="folder-title">All</h3>
            <span className="folder-count">({mediaCounts.total})</span>
          </div>
          <div 
            className={`folder-tab ${filters.type === 'Movie' ? 'active' : ''}`}
            onClick={() => handleTypeChange('Movie')}
          >
            <div className="folder-icon">
              <MovieIcon />
            </div>
            <h3 className="folder-title">Movies</h3>
            <span className="folder-count">({mediaCounts.movies})</span>
          </div>
          <div 
            className={`folder-tab ${filters.type === 'Web Series' ? 'active' : ''}`}
            onClick={() => handleTypeChange('Web Series')}
          >
            <div className="folder-icon">
              <TvIcon />
            </div>
            <h3 className="folder-title">Web Series</h3>
            <span className="folder-count">({mediaCounts.tvShows})</span>
          </div>
          <div 
            className={`folder-tab ${filters.type === 'Anime' ? 'active' : ''}`}
            onClick={() => handleTypeChange('Anime')}
          >
            <div className="folder-icon">
              <AnimationIcon />
            </div>
            <h3 className="folder-title">Anime</h3>
            <span className="folder-count">({mediaCounts.anime})</span>
          </div>
          <div 
            className={`folder-tab ${filters.type === 'Game' ? 'active' : ''}`}
            onClick={() => handleTypeChange('Game')}
          >
            <div className="folder-icon">
              <SportsEsportsIcon />
            </div>
            <h3 className="folder-title">Games</h3>
            <span className="folder-count">({mediaCounts.games})</span>
          </div>
        </div>
        
        {isAdvancedFilterOpen && (
          <div className="advanced-filters">
            <div className="filter-group">
              <label>Genre</label>
              <select 
                value={filters.genre}
                onChange={(e) => setFilters({...filters, genre: e.target.value})}
              >
                {getAllGenres().map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Year</label>
              <select 
                value={filters.year}
                onChange={(e) => setFilters({...filters, year: e.target.value})}
              >
                {getAllYears().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Rating</label>
              <select 
                value={filters.rating}
                onChange={(e) => setFilters({...filters, rating: e.target.value})}
              >
                <option value="All">All Ratings</option>
                <option value="9">9+ ⭐</option>
                <option value="8">8+ ⭐</option>
                <option value="7">7+ ⭐</option>
                <option value="6">6+ ⭐</option>
              </select>
            </div>
          </div>
        )}
      </div>      

      <div className="discover-content">
        {/* Search Results Indicator */}
        {searchQuery.trim() !== '' && !loading && !error && (
          <div className="search-results-indicator">
            <h3>Search Results for "{searchQuery}" ({filteredItems.length} found)</h3>
            <p>Showing all results. Infinite scroll is disabled during search.</p>
          </div>
        )}
        
        {loading ? (
          <div className="media-grid">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="media-card skeleton-card">
                <div className="media-image skeleton-image">
                  <div className="skeleton-shimmer"></div>
                </div>
                <div className="media-info">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-meta">
                    <div className="skeleton-rating"></div>
                    <div className="skeleton-genres"></div>
                  </div>
                  <div className="skeleton-description"></div>
                  <div className="skeleton-description short"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="error-container">
            <h2>Error Loading Content</h2>
            <p>{error}</p>
            <button onClick={handleRetry} className="reload-btn">
              <RefreshIcon /> Try Again
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="no-results">
            <h2>No results found</h2>
            <p>Try adjusting your search or filters</p>
            <button onClick={handleRetry} className="reload-btn">
              Reset Filters
            </button>
          </div>
        ) : (          
          <div className="media-grid">
            {filteredItems.map(item => (
              <div key={item.id} className="media-card">
                <div className="media-image" style={{ backgroundImage: `url(${item.image})` }}>
                  {/* Always visible year on top right */}
                  {item.year && <span className="media-year-always">{item.year}</span>}
                  
                  {/* Media type on top left - only show when viewing "All" section */}
                  {filters.type === 'All' && (
                    <span className="media-type-always">{item.type}</span>
                  )}                  
                  <div className="media-overlay">
                    <div className="overlay-actions">
                      {/* Custom Folder Button */}
                      <div className="folder-dropdown-container">
                        <button 
                          className="add-to-folder" 
                          onClick={() => toggleFolderDropdown(item.id)}
                          title="Add to custom folder"
                        >
                          <CreateNewFolderIcon />
                        </button>
                        
                        {folderDropdownOpen === item.id && (
                          <div className="folder-dropdown-menu">
                            <div className="folder-dropdown-header">Add to Folder</div>
                            {customFolders.length > 0 ? (
                              customFolders.map(folderName => (
                                <button
                                  key={folderName}
                                  className="folder-option"
                                  onClick={() => handleAddToFolder(item, folderName)}
                                >
                                  <FolderIcon />
                                  {folderName}
                                </button>
                              ))
                            ) : (
                              <div className="no-folders-message">
                                No custom folders found. Create folders in your Watchlist.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Regular Watchlist Button */}
                      {isItemInWatchlist(item) ? (
                        <button 
                          className="add-to-list in-Watchlist" 
                          disabled
                          title="Already in your Watchlist"
                        >
                          <CheckCircleIcon />
                        </button>
                      ) : (
                        <button 
                          className="add-to-list" 
                          onClick={() => handleAddToWatchlist(item)}
                          title="Add to your Watchlist"
                        >
                          <AddIcon />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="media-info">
                  <h3 className="media-title">{item.title}</h3>
                  <div className="media-meta">
                    <div className="media-rating">
                      <StarIcon className="star-icon" />
                      <span>{item.rating ? item.rating.toFixed(1) : 'N/A'}</span>
                    </div>
                    <div className="media-genres">
                      {item.genre && item.genre.length > 0 ? (
                        <>
                          {item.genre.slice(0, 2).join(', ')}
                          {item.genre.length > 2 ? '...' : ''}
                        </>
                      ) : 'No genres'}
                    </div>
                  </div>
                  {item.description && (
                    <div className="media-description">
                      {item.description}
                    </div>
                  )}
                </div>
              </div>
            ))}          
          </div>
        )}
        
        {/* Skeleton cards for loading more content */}
        {loadingMore && (
          <div className="media-grid skeleton-load-more">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="media-card skeleton-card">
                <div className="media-image skeleton-image">
                  <div className="skeleton-shimmer"></div>
                </div>
                <div className="media-info">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-meta">
                    <div className="skeleton-rating"></div>
                    <div className="skeleton-genres"></div>
                  </div>
                  <div className="skeleton-description"></div>
                  <div className="skeleton-description short"></div>
                </div>              
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}