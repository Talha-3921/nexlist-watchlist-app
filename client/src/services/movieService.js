import axios from 'axios';

// TMDB API setup
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

// Helper function to check if the poster_path is valid
const getImageUrl = (path, size = 'w500') => {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
};

// Cache for genre mappings
let genreCache = null;

// Helper function to fetch and cache genre mappings
const getGenreMapping = async () => {
  if (genreCache) {
    return genreCache;
  }
  
  try {
    const response = await tmdbApi.get('/genre/movie/list', {
      params: {
        language: 'en'
      }
    });
    
    if (response.data && response.data.genres) {
      genreCache = response.data.genres.reduce((acc, genre) => {
        acc[genre.id] = genre.name;
        return acc;
      }, {});
      console.log('Genre mapping loaded:', genreCache);
      return genreCache;
    }
  } catch (error) {
    console.error('Error fetching genre mapping:', error);
    return {};
  }
  
  return {};
};

// Helper function to map genre IDs to names
const mapGenreIdsToNames = (genreIds, genreMapping) => {
  if (!genreIds || !Array.isArray(genreIds) || !genreMapping) {
    return [];
  }
  return genreIds.map(id => genreMapping[id]).filter(name => name);
};

// Movie API services
export const getPopularMovies = async (page = 1) => {
  try {
    console.log('Fetching popular movies...');
    
    // Get genre mapping first
    const genreMapping = await getGenreMapping();
    
    const response = await tmdbApi.get('/movie/popular', {
      params: {
        language: 'en-US',
        page
      }
    });
    
    if (!response.data || !response.data.results) {
      throw new Error('Invalid response from TMDB API');
    }
    
    const movies = response.data.results.map(movie => ({
      id: `movie-${movie.id}`,
      title: movie.title,
      type: 'Movie',
      genre: mapGenreIdsToNames(movie.genre_ids, genreMapping),
      rating: movie.vote_average,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
      releaseDate: movie.release_date,
      image: getImageUrl(movie.poster_path),
      banner: getImageUrl(movie.backdrop_path, 'original'),
      description: movie.overview,
      creator: '', // We'll fill this from movie details
      studio: '', // We'll fill this from movie details
      duration: '', // We'll fill this from movie details
      status: 'Released'
    }));
    
    console.log(`Fetched ${movies.length} popular movies`);
    return movies;
  } catch (error) {
    console.error('Error fetching popular movies:', error.response?.data || error.message);
    throw error;
  }
};

export const getMovieDetails = async (movieId) => {
  try {
    const id = movieId.replace('movie-', '');
    const response = await tmdbApi.get(`/movie/${id}`, {
      params: {
        language: 'en-US',
        append_to_response: 'credits,similar'
      }
    });
    
    const movie = response.data;
    const director = movie.credits?.crew?.find(person => person.job === 'Director');
    
    return {
      id: `movie-${movie.id}`,
      title: movie.title,
      type: 'Movie',
      genre: movie.genres.map(g => g.name),
      rating: movie.vote_average,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
      releaseDate: movie.release_date,
      image: getImageUrl(movie.poster_path),
      banner: getImageUrl(movie.backdrop_path, 'original'),
      description: movie.overview,
      creator: director ? director.name : 'Unknown',
      studio: movie.production_companies.length > 0 ? movie.production_companies[0].name : 'Unknown',
      duration: `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`,
      status: movie.status,
      similarTitles: movie.similar?.results.slice(0, 4).map(m => `movie-${m.id}`) || []
    };
  } catch (error) {
    console.error(`Error fetching movie details for ${movieId}:`, error.response?.data || error.message);
    return null;
  }
};

export const getTrendingMovies = async () => {
  try {
    // Get genre mapping first
    const genreMapping = await getGenreMapping();
    
    const response = await tmdbApi.get('/trending/movie/week', {
      params: {
        language: 'en-US'
      }
    });
    
    if (!response.data || !response.data.results) {
      throw new Error('Invalid response from TMDB API');
    }
    
    return response.data.results.map(movie => ({
      id: `movie-${movie.id}`,
      title: movie.title,
      type: 'Movie',
      genre: mapGenreIdsToNames(movie.genre_ids, genreMapping),
      rating: movie.vote_average,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
      releaseDate: movie.release_date,
      image: getImageUrl(movie.poster_path),
      banner: getImageUrl(movie.backdrop_path, 'original'),
      description: movie.overview,
      creator: '',
      studio: '',
      duration: '',
      status: 'Released'
    }));
  } catch (error) {
    console.error('Error fetching trending movies:', error.response?.data || error.message);
    return [];
  }
};

export const searchMovies = async (query, page = 1) => {
  try {
    console.log(`[DEBUG] Searching movies for: "${query}" on page ${page}`);
    console.log(`[DEBUG] Using API base URL: ${TMDB_BASE_URL}`);
    
    // Get genre mapping first
    const genreMapping = await getGenreMapping();
    
    const response = await tmdbApi.get('/search/movie', {
      params: {
        language: 'en-US',
        query,
        page,
        include_adult: false
      }
    });
    
    console.log(`[DEBUG] TMDB API Response Status: ${response.status}`);
    console.log(`[DEBUG] TMDB API Response Data:`, response.data);
    
    if (!response.data || !response.data.results) {
      console.error('[DEBUG] Invalid response structure:', response.data);
      throw new Error('Invalid response from TMDB API');
    }
    
    const movies = response.data.results.map(movie => {
      const mappedMovie = {
        id: `movie-${movie.id}`,
        title: movie.title,
        type: 'Movie',
        genre: mapGenreIdsToNames(movie.genre_ids, genreMapping),
        rating: movie.vote_average || 0,
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
        releaseDate: movie.release_date,
        image: getImageUrl(movie.poster_path),
        banner: getImageUrl(movie.backdrop_path, 'original'),
        description: movie.overview || '',
        creator: '',
        studio: '',
        duration: '',
        status: 'Released'
      };
      console.log(`[DEBUG] Mapped movie:`, mappedMovie);
      return mappedMovie;
    });
    
    console.log(`[DEBUG] Found ${movies.length} movies for query "${query}"`);
    console.log(`[DEBUG] Total results available: ${response.data.total_results}`);
    return movies;
  } catch (error) {
    console.error('[ERROR] Movie search failed:', error);
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

// Test function to directly test movie search
export const testMovieSearch = async (query = 'batman') => {
  console.log(`[TEST] Testing movie search with query: "${query}"`);
  try {
    const results = await searchMovies(query);
    console.log(`[TEST] Search successful! Found ${results.length} movies`);
    console.log('[TEST] First 3 results:', results.slice(0, 3));
    return results;
  } catch (error) {
    console.error('[TEST] Search failed:', error);
    return [];
  }
};
