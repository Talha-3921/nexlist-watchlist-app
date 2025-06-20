// Import all services
import * as movieService from './movieService';
import * as tvShowService from './tvShowService';
import * as animeService from './animeService';
import * as gameService from './gameService';
import * as WatchlistService from './watchlistService';
import * as authService from './authService';
import cloudActivityService, { CloudActivityService } from './cloudActivityService';

// Export all services
export {
  movieService,
  tvShowService,
  animeService,
  gameService,
  WatchlistService,
  authService,
  cloudActivityService,
  CloudActivityService
};

// Export test functions for debugging
export const testMovieSearch = movieService.testMovieSearch;
export const testWebSeriesSearch = tvShowService.testTVShowSearch;

// Utility functions
export const getPlaceholderImage = (type) => {
  const placeholders = {
    'Movie': 'https://via.placeholder.com/500x750?text=No+Movie+Poster',
    'Web Series': 'https://via.placeholder.com/500x750?text=No+Series+Poster',
    'Anime': 'https://via.placeholder.com/500x750?text=No+Anime+Poster',
    'Game': 'https://via.placeholder.com/500x750?text=No+Game+Cover'
  };
  
  return placeholders[type] || 'https://via.placeholder.com/500x750?text=No+Image';
};

// Function to get all media types with error handling for each API
export const getAllMedia = async (limit = 20, page = 1) => {
  // Create an object to store results and errors
  const results = {
    movies: [],
    tvShows: [],
    anime: [],
    games: [],
    errors: []
  };
  // For pagination, we need to fetch more items per type to ensure we have enough content
  // Each type should try to get at least 15-20 items to ensure we can meet the limit
  const itemsPerType = Math.max(15, Math.ceil(limit / 3)); // Get more items per type
  
  // For higher pages, we might need to fetch even more to account for APIs that return fewer results
  const pageMultiplier = page > 3 ? 1.5 : 1;
  const adjustedItemsPerType = Math.ceil(itemsPerType * pageMultiplier);
  // Fetch movies
  try {
    const movies = await movieService.getPopularMovies(page);
    results.movies = movies.slice(0, adjustedItemsPerType);
  } catch (error) {
    console.error('Error fetching movies:', error);
    results.errors.push('Failed to load movies');
  }
  // Fetch TV shows
  try {
    const tvShows = await tvShowService.getPopularTVShows(page);
    results.tvShows = tvShows.slice(0, adjustedItemsPerType);
  } catch (error) {
    console.error('Error fetching web series:', error);
    results.errors.push('Failed to load web series');
  }

  // Fetch anime
  try {
    const anime = await animeService.getPopularAnime(page);
    results.anime = anime.slice(0, adjustedItemsPerType);
  } catch (error) {
    console.error('Error fetching anime:', error);
    results.errors.push('Failed to load anime');
  }

  // Fetch games
  try {
    const games = await gameService.getPopularGames(page);
    results.games = games.slice(0, adjustedItemsPerType);
  } catch (error) {
    console.error('Error fetching games:', error);
    results.errors.push('Failed to load games');
  }

  // Combine all media and shuffle for variety
  const allMedia = [
    ...results.movies,
    ...results.tvShows,
    ...results.anime,
    ...results.games
  ];

  // Shuffle the array to mix different types
  const shuffledMedia = allMedia.sort(() => Math.random() - 0.5);

  // Take only the requested limit
  const limitedMedia = shuffledMedia.slice(0, limit);
  // Add placeholder images where needed
  const mediaWithImages = limitedMedia.map(item => {
    if (!item.image) {
      return { ...item, image: getPlaceholderImage(item.type) };
    }
    return item;
  });

  console.log(`[getAllMedia] Page ${page}: Fetched ${mediaWithImages.length} items total`);
  console.log(`[getAllMedia] Breakdown - Movies: ${results.movies.length}, TV: ${results.tvShows.length}, Anime: ${results.anime.length}, Games: ${results.games.length}`);

  return { 
    media: mediaWithImages, 
    errors: results.errors,
    counts: {
      movies: results.movies.length,
      tvShows: results.tvShows.length,
      anime: results.anime.length,
      games: results.games.length,
      total: mediaWithImages.length
    }
  };
};

// Function to get media details based on ID type
export const getMediaDetails = async (id) => {
  if (!id) return null;
  
  if (id.startsWith('movie-')) {
    return await movieService.getMovieDetails(id);
  } else if (id.startsWith('tv-')) {
    return await tvShowService.getTVShowDetails(id);
  } else if (id.startsWith('anime-')) {
    return await animeService.getAnimeDetails(id);
  } else if (id.startsWith('game-')) {
    return await gameService.getGameDetails(id);
  }
  
  return null;
};

// Function to search all media types
export const searchAllMedia = async (query) => {
  if (!query || query.trim() === '') {
    console.log('[SEARCH] Empty query provided');
    return [];
  }
  
  console.log(`[SEARCH] Starting search for: "${query}"`);
  
  // Create an object to store results and errors
  const results = {
    movies: [],
    tvShows: [],
    anime: [],
    games: [],
    errors: []
  };

  // Search movies
  try {
    console.log('[SEARCH] Searching movies...');
    results.movies = await movieService.searchMovies(query);
    console.log(`[SEARCH] Movie search completed: ${results.movies.length} results`);
  } catch (err) {
    console.error('[SEARCH] Movie search error:', err);
    results.errors.push('Failed to search movies');
    results.movies = []; // Ensure it's an array
  }  // Search TV shows
  try {
    console.log('[SEARCH] Searching web series...');
    results.tvShows = await tvShowService.searchTVShows(query);
    console.log(`[SEARCH] Web series search completed: ${results.tvShows.length} results`);
  } catch (err) {
    console.error('[SEARCH] Web series search error:', err);
    results.errors.push('Failed to search web series');
    results.tvShows = []; // Ensure it's an array
  }

  // Search anime
  try {
    console.log('[SEARCH] Searching anime...');
    results.anime = await animeService.searchAnime(query);
    console.log(`[SEARCH] Anime search completed: ${results.anime.length} results`);
  } catch (err) {
    console.error('[SEARCH] Anime search error:', err);
    results.errors.push('Failed to search anime');
    results.anime = []; // Ensure it's an array
  }

  // Search games
  try {
    console.log('[SEARCH] Searching games...');
    results.games = await gameService.searchGames(query);
    console.log(`[SEARCH] Game search completed: ${results.games.length} results`);
  } catch (err) {
    console.error('[SEARCH] Game search error:', err);
    results.errors.push('Failed to search games');
    results.games = []; // Ensure it's an array
  }
  // Combine all results
  const allResults = [
    ...(results.movies || []),
    ...(results.tvShows || []),
    ...(results.anime || []),
    ...(results.games || [])
  ];

  console.log(`[SEARCH] Combined results: ${allResults.length} total items`);
  console.log('[SEARCH] Breakdown:', {
    movies: results.movies?.length || 0,
    tvShows: results.tvShows?.length || 0,
    anime: results.anime?.length || 0,
    games: results.games?.length || 0
  });

  // Add placeholder images where needed
  const resultsWithImages = allResults.map(item => {
    if (!item.image) {
      const itemWithPlaceholder = { ...item, image: getPlaceholderImage(item.type) };
      console.log(`[SEARCH] Added placeholder for ${item.title}`);
      return itemWithPlaceholder;
    }
    return item;
  });

  if (results.errors.length > 0) {
    console.warn('[SEARCH] Some search requests failed:', results.errors);
  }

  console.log(`[SEARCH] Final search results: ${resultsWithImages.length} items`);
  return resultsWithImages;
};
