import axios from 'axios';

// TMDB API setup for Web Series
const TMDB_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkNTg3YmNlYzc3ZWM0MTJjMDhkZjE5MzhiNWE2ZmMxNCIsIm5iZiI6MTc1MDEwODgzMy4wNDMsInN1YiI6IjY4NTA4YWExNzcwNWQ3MTM1YjBjNWYyNSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.-yD3LlppSrvNNwdxHL3727aVThvoFfYf_OVD89l2yMg';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

// Configure axios defaults for TMDB API
const tmdbApi = axios.create({
  baseURL: TMDB_BASE_URL,
  headers: {
    'Authorization': `Bearer ${TMDB_ACCESS_TOKEN}`,
    'Content-Type': 'application/json;charset=utf-8'
  }
});

// Streaming platforms we want to fetch web series from
const STREAMING_PLATFORMS = [
  'Netflix', 'Amazon Prime Video', 'Hulu', 'Disney+', 'HBO Max', 'Apple TV+',
  'Paramount+', 'Peacock', 'Starz', 'Showtime', 'Amazon Studios', 'HBO',
  'FX', 'AMC+', 'Crunchyroll', 'Funimation'
];

// Network IDs for streaming platforms (TMDB specific IDs)
const STREAMING_NETWORK_IDS = {
  213: 'Netflix',
  1024: 'Amazon Prime Video', 
  453: 'Hulu',
  2739: 'Disney+',
  3186: 'HBO Max',
  2552: 'Apple TV+',
  4330: 'Paramount+',
  3353: 'Peacock',
  318: 'Starz',
  67: 'Showtime',
  1027: 'Amazon Studios',
  49: 'HBO',
  88: 'FX',
  4881: 'AMC+',
  1112: 'Crunchyroll',
  1356: 'Funimation'
};

// Helper function to get image URL
const getImageUrl = (path, size = 'w500') => {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
};

// Cache for TV genre mappings
let tvGenreCache = null;

// Helper function to fetch and cache TV genre mappings
const getTVGenreMapping = async () => {
  if (tvGenreCache) {
    return tvGenreCache;
  }
  
  try {
    const response = await tmdbApi.get('/genre/tv/list', {
      params: {
        language: 'en'
      }
    });
    
    if (response.data && response.data.genres) {
      tvGenreCache = response.data.genres.reduce((acc, genre) => {
        acc[genre.id] = genre.name;
        return acc;
      }, {});
      console.log('TV Genre mapping loaded:', tvGenreCache);
      return tvGenreCache;
    }
  } catch (error) {
    console.error('Error fetching TV genre mapping:', error);
    return {};
  }
  
  return {};
};

// Helper function to map genre IDs to names for TV shows
const mapTVGenreIdsToNames = (genreIds, genreMapping) => {
  if (!genreIds || !Array.isArray(genreIds) || !genreMapping) {
    return [];
  }
  return genreIds.map(id => genreMapping[id]).filter(name => name);
};

// Helper function to check if a show is from our streaming platforms
const isFromStreamingPlatform = (show) => {
  if (!show.networks || show.networks.length === 0) return false;
  
  return show.networks.some(network => {
    // Check by network ID
    if (STREAMING_NETWORK_IDS[network.id]) return true;
    
    // Check by network name (case insensitive)
    return STREAMING_PLATFORMS.some(platform => 
      network.name.toLowerCase().includes(platform.toLowerCase()) ||
      platform.toLowerCase().includes(network.name.toLowerCase())
    );
  });
};

// Helper function to get platform name from show networks
const getPlatformName = (networks) => {
  if (!networks || networks.length === 0) return 'Unknown';
  
  for (let network of networks) {
    if (STREAMING_NETWORK_IDS[network.id]) {
      return STREAMING_NETWORK_IDS[network.id];
    }
    
    const matchedPlatform = STREAMING_PLATFORMS.find(platform => 
      network.name.toLowerCase().includes(platform.toLowerCase()) ||
      platform.toLowerCase().includes(network.name.toLowerCase())
    );
    
    if (matchedPlatform) return matchedPlatform;
  }
  
  return networks[0].name;
};

// FIXED: Get popular web series with proper infinite scroll support
export const getPopularTVShows = async (page = 1) => {
  try {
    console.log(`Fetching popular TV shows for page ${page}...`);
    
    // Get genre mapping first
    const genreMapping = await getTVGenreMapping();
    
    // Use TMDB's discover/tv endpoint with popularity sorting for consistent pagination
    const response = await tmdbApi.get('/discover/tv', {
      params: {
        language: 'en-US',
        page: page,
        sort_by: 'popularity.desc',
        vote_count_gte: 10, // Quality filter
        'first_air_date.gte': '2000-01-01', // Shows from 2000 onwards
        with_networks: Object.keys(STREAMING_NETWORK_IDS).join('|') // All streaming platforms
      }
    });
    
    if (!response.data || !response.data.results) {
      console.log('No TV shows found in response');
      return [];
    }
    
    const tvShows = await Promise.all(
      response.data.results.map(async (show) => {
        try {
          // Get additional details for each show to determine platform
          const detailResponse = await tmdbApi.get(`/tv/${show.id}`, {
            params: { language: 'en-US' }
          });
          
          // Only include shows from our streaming platforms
          if (!isFromStreamingPlatform(detailResponse.data)) {
            return null;
          }
          
          const platform = getPlatformName(detailResponse.data.networks);
          
          return {
            id: `tv-${show.id}`,
            title: show.name,
            type: 'Web Series',
            genre: mapTVGenreIdsToNames(show.genre_ids, genreMapping),
            rating: show.vote_average || 0,
            year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : null,
            releaseDate: show.first_air_date,
            image: getImageUrl(show.poster_path),
            banner: getImageUrl(show.backdrop_path, 'original'),
            description: show.overview || '',
            creator: '',
            studio: platform,
            episodes: 0,
            seasons: 0,
            duration: '',
            status: '',
            platform: platform
          };
        } catch (error) {
          console.error(`Error getting details for show ${show.id}:`, error.message);
          return null;
        }
      })
    );
    
    // Filter out null results and return
    const validShows = tvShows.filter(show => show !== null);
    console.log(`Fetched ${validShows.length} TV shows for page ${page}`);
    
    return validShows;
  } catch (error) {
    console.error('Error fetching popular TV shows:', error.response?.data || error.message);
    return [];
  }
};

// ALTERNATIVE: More efficient version without individual API calls
export const getPopularTVShowsFast = async (page = 1) => {
  try {
    console.log(`Fetching popular TV shows (fast) for page ${page}...`);
    
    // Get genre mapping first
    const genreMapping = await getTVGenreMapping();
    
    // Get popular shows without filtering by network first
    const response = await tmdbApi.get('/tv/popular', {
      params: {
        language: 'en-US',
        page: page
      }
    });
    
    if (!response.data || !response.data.results) {
      console.log('No TV shows found in response');
      return [];
    }
    
    // Map all shows first, we'll filter streaming platforms on the frontend if needed
    const tvShows = response.data.results.map(show => ({
      id: `tv-${show.id}`,
      title: show.name,
      type: 'Web Series',
      genre: mapTVGenreIdsToNames(show.genre_ids, genreMapping),
      rating: show.vote_average || 0,
      year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : null,
      releaseDate: show.first_air_date,
      image: getImageUrl(show.poster_path),
      banner: getImageUrl(show.backdrop_path, 'original'),
      description: show.overview || '',
      creator: '',
      studio: 'Unknown', // Will be filled when details are fetched
      episodes: 0,
      seasons: 0,
      duration: '',
      status: '',
      platform: 'Unknown' // Will be filled when details are fetched
    }));
    
    console.log(`Fetched ${tvShows.length} TV shows for page ${page}`);
    return tvShows;
  } catch (error) {
    console.error('Error fetching popular TV shows:', error.response?.data || error.message);
    return [];
  }
};

export const getTVShowDetails = async (tvId) => {
  try {
    const id = tvId.replace('tv-', '');
    
    const response = await tmdbApi.get(`/tv/${id}`, {
      params: {
        language: 'en-US',
        append_to_response: 'credits,similar,external_ids'
      }
    });
    
    const show = response.data;
    
    // Check if this show is from our streaming platforms
    if (!isFromStreamingPlatform(show)) {
      console.log(`Show ${show.name} is not from our target streaming platforms`);
      return null;
    }
    
    const creators = show.created_by.map(creator => creator.name).join(', ') || 'Unknown';
    const releaseYear = show.first_air_date ? new Date(show.first_air_date).getFullYear() : 0;
    const platform = getPlatformName(show.networks);
    
    // Get similar titles from the direct response (no additional API calls)
    const similarTitles = show.similar?.results
      ? show.similar.results.slice(0, 4).map(s => `tv-${s.id}`)
      : [];
    
    return {
      id: `tv-${show.id}`,
      title: show.name,
      type: 'Web Series',
      genre: show.genres.map(g => g.name),
      rating: show.vote_average,
      year: releaseYear,
      releaseDate: show.first_air_date,
      image: getImageUrl(show.poster_path),
      banner: getImageUrl(show.backdrop_path, 'original'),
      description: show.overview,
      creator: creators,
      studio: platform,
      episodes: show.number_of_episodes || 0,
      seasons: show.number_of_seasons || 0,
      duration: show.episode_run_time && show.episode_run_time.length > 0 ? `${show.episode_run_time[0]} min per episode` : 'Unknown',
      status: show.status,
      similarTitles: similarTitles,
      platform: platform
    };
  } catch (error) {
    console.error(`Error fetching web series details for ${tvId}:`, error.response?.data || error.message);
    return null;
  }
};

export const getTrendingTVShows = async () => {
  try {
    console.log('Fetching trending TV shows...');
    
    // Get genre mapping first
    const genreMapping = await getTVGenreMapping();
    
    const response = await tmdbApi.get('/trending/tv/week', {
      params: {
        language: 'en-US'
      }
    });
    
    if (!response.data || !response.data.results) {
      throw new Error('Invalid response from TMDB API');
    }
    
    const tvShows = response.data.results.map(show => ({
      id: `tv-${show.id}`,
      title: show.name,
      type: 'Web Series',
      genre: mapTVGenreIdsToNames(show.genre_ids, genreMapping),
      rating: show.vote_average || 0,
      year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : null,
      releaseDate: show.first_air_date,
      image: getImageUrl(show.poster_path),
      banner: getImageUrl(show.backdrop_path, 'original'),
      description: show.overview || '',
      creator: '',
      studio: '',
      episodes: 0,
      seasons: 0,
      duration: '',
      status: '',
      platform: ''
    }));
    
    console.log(`Found ${tvShows.length} trending TV shows`);
    return tvShows;
  } catch (error) {
    console.error('Error fetching trending TV shows:', error.response?.data || error.message);
    return [];
  }
};

export const searchTVShows = async (query, page = 1) => {
  try {
    console.log(`[DEBUG] Searching TV shows for: "${query}" on page ${page}`);
    
    // Get genre mapping first
    const genreMapping = await getTVGenreMapping();
    
    const response = await tmdbApi.get('/search/tv', {
      params: {
        language: 'en-US',
        query,
        page,
        include_adult: false
      }
    });
    
    console.log(`[DEBUG] TMDB API Response Status: ${response.status}`);
    console.log(`[DEBUG] Found ${response.data?.results?.length || 0} shows for query "${query}"`);
    
    if (!response.data || !response.data.results) {
      console.error('[DEBUG] Invalid response structure:', response.data);
      return [];
    }
    
    const tvShows = response.data.results.map(show => ({
      id: `tv-${show.id}`,
      title: show.name,
      type: 'Web Series',
      genre: mapTVGenreIdsToNames(show.genre_ids, genreMapping),
      rating: show.vote_average || 0,
      year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : null,
      releaseDate: show.first_air_date,
      image: getImageUrl(show.poster_path),
      banner: getImageUrl(show.backdrop_path, 'original'),
      description: show.overview || '',
      creator: '',
      studio: '',
      episodes: 0,
      seasons: 0,
      duration: '',
      status: '',
      platform: ''
    }));
    
    console.log(`[DEBUG] Mapped ${tvShows.length} TV shows for query "${query}"`);
    return tvShows;
  } catch (error) {
    console.error('[ERROR] TV show search failed:', error);
    console.error('[ERROR] Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
};

// Get web series by specific streaming platform
export const getWebSeriesByPlatform = async (platform, page = 1) => {
  try {
    console.log(`Fetching web series from ${platform} for page ${page}...`);
    
    // Get genre mapping first
    const genreMapping = await getTVGenreMapping();
    
    // Find the network ID for the platform
    const networkId = Object.keys(STREAMING_NETWORK_IDS).find(id => 
      STREAMING_NETWORK_IDS[id].toLowerCase() === platform.toLowerCase()
    );
    
    if (!networkId) {
      console.error(`Platform ${platform} not found in streaming networks`);
      return [];
    }
    
    const response = await tmdbApi.get('/discover/tv', {
      params: {
        language: 'en-US',
        page,
        with_networks: networkId,
        sort_by: 'popularity.desc',
        vote_count_gte: 10
      }
    });
    
    if (!response.data?.results) {
      console.log(`No results found for ${platform} on page ${page}`);
      return [];
    }
    
    const webSeries = response.data.results.map(show => ({
      id: `tv-${show.id}`,
      title: show.name,
      type: 'Web Series',
      genre: mapTVGenreIdsToNames(show.genre_ids, genreMapping),
      rating: show.vote_average || 0,
      year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : null,
      releaseDate: show.first_air_date,
      image: getImageUrl(show.poster_path),
      banner: getImageUrl(show.backdrop_path, 'original'),
      description: show.overview || '',
      creator: '',
      studio: platform,
      episodes: 0,
      seasons: 0,
      duration: '',
      status: '',
      platform: platform
    }));
    
    console.log(`Found ${webSeries.length} web series from ${platform} on page ${page}`);
    return webSeries;
  } catch (error) {
    console.error(`Error fetching web series from ${platform}:`, error.response?.data || error.message);
    return [];
  }
};

// Get all available streaming platforms
export const getAvailablePlatforms = () => {
  return STREAMING_PLATFORMS;
};

// Test function to directly test web series search
export const testTVShowSearch = async (query = 'stranger things') => {
  console.log(`[TEST] Testing TV show search with query: "${query}"`);
  try {
    const results = await searchTVShows(query);
    console.log(`[TEST] TV show search successful! Found ${results.length} shows`);
    console.log('[TEST] First 3 results:', results.slice(0, 3));
    return results;
  } catch (error) {
    console.error('[TEST] TV show search failed:', error);
    return [];
  }
};

// Test function to get shows by platform
export const testPlatformShows = async (platform = 'Netflix') => {
  console.log(`[TEST] Testing web series fetch from ${platform}`);
  try {
    const results = await getWebSeriesByPlatform(platform);
    console.log(`[TEST] Platform fetch successful! Found ${results.length} series from ${platform}`);
    console.log('[TEST] First 3 results:', results.slice(0, 3));
    return results;
  } catch (error) {
    console.error(`[TEST] Platform ${platform} fetch failed:`, error);
    return [];
  }
};