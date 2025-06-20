import axios from 'axios';

// RAWG Game API
const RAWG_API_KEY = '61c957b378d04603955f086dedde0753'; // This is a public API key for demo purposes
const RAWG_BASE_URL = 'https://api.rawg.io/api';

// Helper function to convert RAWG rating (0-5) to standard rating (0-10)
const convertRating = (rawgRating) => {
  if (!rawgRating || rawgRating === 0) return 0;
  // Convert 0-5 scale to 0-10 scale and round to 1 decimal place
  return Math.round((rawgRating * 2) * 10) / 10;
};

// Helper function to generate description when none is available
const generateGameDescription = (game) => {
  if (game.description_raw) {
    return game.description_raw;
  }
  
  if (game.description) {
    // Remove HTML tags and limit length
    return game.description.replace(/<[^>]*>/g, '').slice(0, 200) + '...';
  }
  
  // Generate a descriptive fallback
  let description = `${game.name} is a`;
  
  if (game.genres?.length > 0) {
    description += ` ${game.genres.map(g => g.name).join(', ')} game`;
  } else {
    description += ` video game`;
  }
  
  if (game.released) {
    description += ` released in ${new Date(game.released).getFullYear()}`;
  }
  
  if (game.developers?.length > 0) {
    description += ` developed by ${game.developers[0].name}`;
  }
  
  if (game.publishers?.length > 0) {
    description += ` and published by ${game.publishers[0].name}`;
  }
  
  if (game.platforms?.length > 0) {
    const platformNames = game.platforms.slice(0, 3).map(p => p.platform.name);
    description += `. Available on ${platformNames.join(', ')}`;
    if (game.platforms.length > 3) {
      description += ` and more platforms`;
    }
  }
    if (game.rating && game.rating > 0) {
    description += `. This game has received a rating of ${convertRating(game.rating)}/10`;
  }
  
  description += '.';
  return description;
};

// Game API services
export const getPopularGames = async (page = 1) => {
  try {
    console.log('Fetching popular games...');
    const response = await axios.get(`${RAWG_BASE_URL}/games`, {
      params: {
        key: RAWG_API_KEY,
        page,
        page_size: 20,
        ordering: '-rating'      }
    });
    
    const games = response.data.results.map(game => ({
      id: `game-${game.id}`,
      title: game.name,
      type: 'Game',
      genre: game.genres?.map(g => g.name) || [],
      rating: convertRating(game.rating),
      year: game.released ? new Date(game.released).getFullYear() : null,
      releaseDate: game.released,
      image: game.background_image,
      banner: game.background_image,
      description: generateGameDescription(game),
      creator: game.developers?.length > 0 ? game.developers[0].name : 'Unknown',
      studio: game.publishers?.length > 0 ? game.publishers[0].name : 'Unknown',
      duration: game.playtime > 0 ? `${game.playtime}+ hours` : 'Unknown',
      platforms: game.platforms?.map(p => p.platform.name) || [],
      status: 'Released'
    }));
    
    console.log(`Fetched ${games.length} popular games`);
    return games;
  } catch (error) {
    console.error('Error fetching popular games:', error);
    throw error;
  }
};

export const getGameDetails = async (gameId) => {
  try {
    const id = gameId.replace('game-', '');
    const response = await axios.get(`${RAWG_BASE_URL}/games/${id}`, {
      params: {
        key: RAWG_API_KEY
      }
    });
    
    const game = response.data;
    
    // Get similar games
    let similarGames = [];
    try {
      const similarResponse = await axios.get(`${RAWG_BASE_URL}/games/${id}/game-series`, {
        params: {
          key: RAWG_API_KEY
        }
      });
      similarGames = similarResponse.data.results.slice(0, 4).map(g => `game-${g.id}`);
    } catch (similarError) {
      console.error('Error fetching similar games:', similarError);
    }      return {
      id: `game-${game.id}`,
      title: game.name,
      type: 'Game',
      genre: game.genres.map(g => g.name),
      rating: convertRating(game.rating),
      year: game.released ? new Date(game.released).getFullYear() : null,
      releaseDate: game.released,
      image: game.background_image,
      banner: game.background_image,
      description: generateGameDescription(game),
      creator: game.developers?.length > 0 ? game.developers[0].name : 'Unknown',
      studio: game.publishers?.length > 0 ? game.publishers[0].name : 'Unknown',
      duration: game.playtime > 0 ? `${game.playtime}+ hours` : 'Unknown',
      platforms: game.platforms?.map(p => p.platform.name) || [],
      status: 'Released',
      similarTitles: similarGames
    };
  } catch (error) {
    console.error(`Error fetching game details for ${gameId}:`, error);
    return null;
  }
};

export const getNewReleasedGames = async () => {
  try {
    const currentDate = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(currentDate.getMonth() - 3);
    
    const response = await axios.get(`${RAWG_BASE_URL}/games`, {
      params: {
        key: RAWG_API_KEY,
        dates: `${threeMonthsAgo.toISOString().split('T')[0]},${currentDate.toISOString().split('T')[0]}`,
        ordering: '-released',
        page_size: 20
      }
    });      return response.data.results.map(game => ({
      id: `game-${game.id}`,
      title: game.name,
      type: 'Game',
      genre: game.genres.map(g => g.name),
      rating: convertRating(game.rating),
      year: game.released ? new Date(game.released).getFullYear() : null,
      releaseDate: game.released,
      image: game.background_image,
      banner: game.background_image,
      description: generateGameDescription(game),
      creator: game.developers?.length > 0 ? game.developers[0].name : 'Unknown',
      studio: game.publishers?.length > 0 ? game.publishers[0].name : 'Unknown',
      duration: game.playtime > 0 ? `${game.playtime}+ hours` : 'Unknown',
      platforms: game.platforms?.map(p => p.platform.name) || [],
      status: 'Released'
    }));
  } catch (error) {
    console.error('Error fetching new released games:', error);
    return [];
  }
};

export const searchGames = async (query) => {
  try {
    console.log(`Searching games for: "${query}"`);
    const response = await axios.get(`${RAWG_BASE_URL}/games`, {
      params: {
        key: RAWG_API_KEY,
        search: query,
        page_size: 20
      }
    });      const games = response.data.results.map(game => ({
      id: `game-${game.id}`,
      title: game.name,
      type: 'Game',
      genre: game.genres?.map(g => g.name) || [],
      rating: convertRating(game.rating),
      year: game.released ? new Date(game.released).getFullYear() : null,
      releaseDate: game.released,
      image: game.background_image,
      banner: game.background_image,
      description: generateGameDescription(game),
      creator: game.developers?.length > 0 ? game.developers[0].name : 'Unknown',
      studio: game.publishers?.length > 0 ? game.publishers[0].name : 'Unknown',
      duration: game.playtime > 0 ? `${game.playtime}+ hours` : 'Unknown',
      platforms: game.platforms?.map(p => p.platform.name) || [],
      status: 'Released'
    }));
    
    console.log(`Found ${games.length} games for query "${query}"`);
    return games;
  } catch (error) {
    console.error('Error searching games:', error);
    throw error;
  }
};
