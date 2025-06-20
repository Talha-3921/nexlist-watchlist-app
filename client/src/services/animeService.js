import axios from 'axios';

// Jikan API (Unofficial MyAnimeList API)
const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

// Add delay to prevent rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Anime API services
export const getPopularAnime = async (page = 1) => {
  try {
    console.log('Fetching popular anime...');
    // Jikan API has rate limiting, so add some delay
    const response = await axios.get(`${JIKAN_BASE_URL}/top/anime`, {
      params: {
        page,
        limit: 20
      }
    });
    
    const anime = response.data.data.map(anime => ({
      id: `anime-${anime.mal_id}`,
      title: anime.title,
      type: 'Anime',
      genre: anime.genres?.map(g => g.name) || [],
      rating: anime.score || 0,
      year: anime.year,
      releaseDate: anime.aired?.from,
      image: anime.images?.jpg?.large_image_url,
      banner: anime.images?.jpg?.large_image_url, // Jikan doesn't provide banners
      description: anime.synopsis,
      creator: anime.studios?.length > 0 ? anime.studios[0].name : 'Unknown',
      studio: anime.studios?.length > 0 ? anime.studios[0].name : 'Unknown',
      episodes: anime.episodes,
      seasons: 1, // Not provided by Jikan directly
      duration: anime.duration,
      status: anime.status
    }));
    
    console.log(`Fetched ${anime.length} popular anime`);
    return anime;
  } catch (error) {
    console.error('Error fetching popular anime:', error);
    throw error;
  }
};

export const getAnimeDetails = async (animeId) => {
  try {
    const id = animeId.replace('anime-', '');
    const response = await axios.get(`${JIKAN_BASE_URL}/anime/${id}/full`);
    
    const anime = response.data.data;
    
    // Also get recommendations
    let recommendations = [];
    try {
      const recResponse = await axios.get(`${JIKAN_BASE_URL}/anime/${id}/recommendations`);
      recommendations = recResponse.data.data.slice(0, 4).map(rec => `anime-${rec.entry.mal_id}`);
    } catch (recError) {
      console.error('Error fetching anime recommendations:', recError);
    }
    
    return {
      id: `anime-${anime.mal_id}`,
      title: anime.title,
      type: 'Anime',
      genre: anime.genres.map(g => g.name),
      rating: anime.score || 0,
      year: anime.year,
      releaseDate: anime.aired?.from,
      image: anime.images.jpg.large_image_url,
      banner: anime.images.jpg.large_image_url,
      description: anime.synopsis,
      creator: anime.studios.length > 0 ? anime.studios[0].name : 'Unknown',
      studio: anime.studios.length > 0 ? anime.studios[0].name : 'Unknown',
      episodes: anime.episodes,
      seasons: 1,
      duration: anime.duration,
      status: anime.status,
      similarTitles: recommendations
    };
  } catch (error) {
    console.error(`Error fetching anime details for ${animeId}:`, error);
    return null;
  }
};

export const getSeasonalAnime = async () => {
  try {
    const response = await axios.get(`${JIKAN_BASE_URL}/seasons/now`, {
      params: {
        limit: 20
      }
    });
    
    return response.data.data.map(anime => ({
      id: `anime-${anime.mal_id}`,
      title: anime.title,
      type: 'Anime',
      genre: anime.genres.map(g => g.name),
      rating: anime.score || 0,
      year: anime.year,
      releaseDate: anime.aired?.from,
      image: anime.images.jpg.large_image_url,
      banner: anime.images.jpg.large_image_url,
      description: anime.synopsis,
      creator: anime.studios.length > 0 ? anime.studios[0].name : 'Unknown',
      studio: anime.studios.length > 0 ? anime.studios[0].name : 'Unknown',
      episodes: anime.episodes,
      seasons: 1,
      duration: anime.duration,
      status: anime.status
    }));
  } catch (error) {
    console.error('Error fetching seasonal anime:', error);
    return [];
  }
};

export const searchAnime = async (query) => {
  try {
    console.log(`Searching anime for: "${query}"`);
    // Add a delay to prevent rate limiting
    await delay(500);
    
    const response = await axios.get(`${JIKAN_BASE_URL}/anime`, {
      params: {
        q: query,
        limit: 20
      }
    });
    
    const anime = response.data.data.map(anime => ({
      id: `anime-${anime.mal_id}`,
      title: anime.title,
      type: 'Anime',
      genre: anime.genres?.map(g => g.name) || [],
      rating: anime.score || 0,
      year: anime.year,
      releaseDate: anime.aired?.from,
      image: anime.images?.jpg?.large_image_url,
      banner: anime.images?.jpg?.large_image_url,
      description: anime.synopsis,
      creator: anime.studios?.length > 0 ? anime.studios[0].name : 'Unknown',
      studio: anime.studios?.length > 0 ? anime.studios[0].name : 'Unknown',
      episodes: anime.episodes,
      seasons: 1,
      duration: anime.duration,
      status: anime.status
    }));
    
    console.log(`Found ${anime.length} anime for query "${query}"`);
    return anime;
  } catch (error) {
    console.error('Error searching anime:', error);
    throw error;
  }
};
