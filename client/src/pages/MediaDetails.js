import React, { useState, useEffect } from 'react';
import './MediaDetails.css';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { addToWatchlist, removeFromWatchlist, isInWatchlist, getWatchlist } from '../services/watchlistService';
import { useAuth } from '../contexts/AuthContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ShareIcon from '@mui/icons-material/Share';

// Combine all data from different pages for demonstration
const allMediaData = [
  // From Discover.js
  {
    id: 101,
    title: 'Demon Slayer',
    type: 'Anime',
    genre: ['Action', 'Fantasy', 'Adventure'],
    rating: 8.7,
    year: 2019,
    releaseDate: '2019-04-06',
    image: 'https://m.media-amazon.com/images/M/MV5BZjZjNzI5MDctY2Y4YS00NmM4LTljMmItZTFkOTExNGI3ODRhXkEyXkFqcGdeQXVyNjc3MjQzNTI@._V1_.jpg',
    banner: 'https://m.media-amazon.com/images/M/MV5BZjZjNzI5MDctY2Y4YS00NmM4LTljMmItZTFkOTExNGI3ODRhXkEyXkFqcGdeQXVyNjc3MjQzNTI@._V1_.jpg',
    description: 'A family is attacked by demons and only two members survive - Tanjiro and his sister Nezuko, who is turning into a demon slowly. Tanjiro sets out to become a demon slayer to avenge his family and cure his sister.',
    creator: 'Koyoharu Gotouge',
    studio: 'Ufotable',
    episodes: 26,
    seasons: 2,
    duration: '25 min per episode',
    status: 'Ongoing',
    similarTitles: [102, 103, 203]
  },
  {
    id: 102,
    title: 'Attack on Titan',
    type: 'Anime',
    genre: ['Action', 'Drama', 'Fantasy'],
    rating: 9.0,
    year: 2013,
    releaseDate: '2013-04-07',
    image: 'https://flxt.tmsimg.com/assets/p10701949_b_v8_ah.jpg',
    banner: 'https://flxt.tmsimg.com/assets/p10701949_b_v8_ah.jpg',
    description: 'After his hometown is destroyed and his mother is killed, young Eren Jaeger vows to cleanse the earth of the giant humanoid Titans that have brought humanity to the brink of extinction.',
    creator: 'Hajime Isayama',
    studio: 'Wit Studio, MAPPA',
    episodes: 87,
    seasons: 4,
    duration: '25 min per episode',
    status: 'Completed',
    similarTitles: [101, 103, 203]
  },
  {
    id: 103,
    title: 'Jujutsu Kaisen',
    type: 'Anime',
    genre: ['Action', 'Fantasy'],
    rating: 8.6,
    year: 2020,
    releaseDate: '2020-10-03',
    image: 'https://m.media-amazon.com/images/M/MV5BMTMwMDM4N2EtOTJiYy00OTQ0LThlZDYtYWUwOWFlY2IxZGVjXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_.jpg',
    banner: 'https://m.media-amazon.com/images/M/MV5BMTMwMDM4N2EtOTJiYy00OTQ0LThlZDYtYWUwOWFlY2IxZGVjXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_.jpg',
    description: 'A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman school to be able to locate the demon\'s other body parts and thus exorcise himself.',
    creator: 'Gege Akutami',
    studio: 'MAPPA',
    episodes: 24,
    seasons: 2,
    duration: '24 min per episode',
    status: 'Ongoing',
    similarTitles: [101, 102, 203]
  },
  
  // TV Shows
  {
    id: 201,
    title: 'Breaking Bad',
    type: 'TV Show',
    genre: ['Crime', 'Drama', 'Thriller'],
    rating: 9.5,
    year: 2008,
    releaseDate: '2008-01-20',
    image: 'https://m.media-amazon.com/images/M/MV5BYmQ4YWMxYjUtNjZmYi00MDQ1LWFjMjMtNjA5ZDdiYjdiODU5XkEyXkFqcGdeQXVyMTMzNDExODE5._V1_.jpg',
    banner: 'https://m.media-amazon.com/images/M/MV5BYmQ4YWMxYjUtNjZmYi00MDQ1LWFjMjMtNjA5ZDdiYjdiODU5XkEyXkFqcGdeQXVyMTMzNDExODE5._V1_.jpg',
    description: 'A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family\'s future.',
    creator: 'Vince Gilligan',
    studio: 'AMC',
    episodes: 62,
    seasons: 5,
    duration: '49 min per episode',
    status: 'Completed',
    similarTitles: [202, 203, 302]
  },
  {
    id: 202,
    title: 'Stranger Things',
    type: 'TV Show',
    genre: ['Drama', 'Fantasy', 'Horror'],
    rating: 8.7,
    year: 2016,
    releaseDate: '2016-07-15',
    image: 'https://m.media-amazon.com/images/M/MV5BMDZkYmVhNjMtNWU4MC00MDQxLWE3MjYtZGMzZWI1ZjhlOWJmXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg',
    banner: 'https://m.media-amazon.com/images/M/MV5BMDZkYmVhNjMtNWU4MC00MDQxLWE3MjYtZGMzZWI1ZjhlOWJmXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg',
    description: 'When a young boy disappears, his mother, a police chief and his friends must confront terrifying supernatural forces in order to get him back.',
    creator: 'The Duffer Brothers',
    studio: 'Netflix',
    episodes: 34,
    seasons: 4,
    duration: '50 min per episode',
    status: 'Ongoing',
    similarTitles: [201, 203, 101]
  },
  {
    id: 203,
    title: 'House of the Dragon',
    type: 'TV Show',
    genre: ['Action', 'Adventure', 'Drama'],
    rating: 8.5,
    year: 2022,
    releaseDate: '2022-08-21',
    image: 'https://m.media-amazon.com/images/M/MV5BZjBiOGIyY2YtOTA3OC00YzY1LThkYjktMGRkYTNhNTExY2I2XkEyXkFqcGdeQXVyMTEyMjM2NDc2._V1_.jpg',
    banner: 'https://m.media-amazon.com/images/M/MV5BZjBiOGIyY2YtOTA3OC00YzY1LThkYjktMGRkYTNhNTExY2I2XkEyXkFqcGdeQXVyMTEyMjM2NDc2._V1_.jpg',
    description: 'An internal succession war within House Targaryen at the height of its power, 172 years before the birth of Daenerys Targaryen.',
    creator: 'Ryan Condal, George R.R. Martin',
    studio: 'HBO',
    episodes: 10,
    seasons: 1,
    duration: '60 min per episode',
    status: 'Ongoing',
    similarTitles: [201, 202, 301]
  },
  
  // Movies
  {
    id: 301,
    title: 'Interstellar',
    type: 'Movie',
    genre: ['Adventure', 'Drama', 'Sci-Fi'],
    rating: 8.6,
    year: 2014,
    releaseDate: '2014-11-07',
    image: 'https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg',
    banner: 'https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg',
    description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
    creator: 'Christopher Nolan',
    studio: 'Paramount Pictures',
    duration: '2h 49m',
    status: 'Released',
    similarTitles: [302, 303, 401]
  },
  {
    id: 302,
    title: 'Dune',
    type: 'Movie',
    genre: ['Action', 'Adventure', 'Drama'],
    rating: 8.0,
    year: 2021,
    releaseDate: '2021-10-22',
    image: 'https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_FMjpg_UX1000_.jpg',
    banner: 'https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_FMjpg_UX1000_.jpg',
    description: 'Feature adaptation of Frank Herbert\'s science fiction novel about the son of a noble family entrusted with the protection of the most valuable asset and most vital element in the galaxy.',
    creator: 'Denis Villeneuve',
    studio: 'Warner Bros. Pictures',
    duration: '2h 35m',
    status: 'Released',
    similarTitles: [301, 303, 203]
  },
  {
    id: 303,
    title: 'Oppenheimer',
    type: 'Movie',
    genre: ['Biography', 'Drama', 'History'],
    rating: 8.4,
    year: 2023,
    releaseDate: '2023-07-21',
    image: 'https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjUtN2M1MS00MTQ2LTk2ODgtNzc2M2QyZGE5NTVjXkEyXkFqcGdeQXVyNzAwMjU2MTY@._V1_.jpg',
    banner: 'https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjUtN2M1MS00MTQ2LTk2ODgtNzc2M2QyZGE5NTVjXkEyXkFqcGdeQXVyNzAwMjU2MTY@._V1_.jpg',
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
    creator: 'Christopher Nolan',
    studio: 'Universal Pictures',
    duration: '3h 0m',
    status: 'Released',
    similarTitles: [301, 302, 201]
  },
  
  // Games
  {
    id: 401,
    title: 'The Witcher 3',
    type: 'Game',
    genre: ['RPG', 'Action', 'Open World'],
    rating: 9.7,
    year: 2015,
    releaseDate: '2015-05-19',
    image: 'https://image.api.playstation.com/vulcan/img/rnd/202009/2913/TQKAd8U6hnIFQIpV5nTjjtL1.png',
    banner: 'https://image.api.playstation.com/vulcan/img/rnd/202009/2913/TQKAd8U6hnIFQIpV5nTjjtL1.png',
    description: 'As war rages on throughout the Northern Realms, you take on the greatest contract of your life — tracking down the Child of Prophecy, a living weapon that can alter the shape of the world.',
    creator: 'CD Projekt Red',
    studio: 'CD Projekt',
    duration: '50+ hours',
    platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'],
    status: 'Released',
    similarTitles: [402, 403, 301]
  },
  {
    id: 402,
    title: 'Elden Ring',
    type: 'Game',
    genre: ['RPG', 'Action', 'Open World'],
    rating: 9.3,
    year: 2022,
    releaseDate: '2022-02-25',
    image: 'https://image.api.playstation.com/vulcan/ap/rnd/202110/2000/phvVT0qZfcRms5qDAk0SI3CM.png',
    banner: 'https://image.api.playstation.com/vulcan/ap/rnd/202110/2000/phvVT0qZfcRms5qDAk0SI3CM.png',
    description: 'THE NEW FANTASY ACTION RPG. Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between.',
    creator: 'FromSoftware',
    studio: 'Bandai Namco',
    duration: '60+ hours',
    platforms: ['PC', 'PlayStation', 'Xbox'],
    status: 'Released',
    similarTitles: [401, 403, 101]
  },
  {
    id: 403,
    title: 'Baldur\'s Gate 3',
    type: 'Game',
    genre: ['RPG', 'Strategy', 'Adventure'],
    rating: 9.5,
    year: 2023,
    releaseDate: '2023-08-03',
    image: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/capsule_616x353.jpg',
    banner: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/capsule_616x353.jpg',
    description: 'Gather your party, and return to the Forgotten Realms in a tale of fellowship and betrayal, sacrifice and survival, and the lure of absolute power.',
    creator: 'Larian Studios',
    studio: 'Larian Studios',
    duration: '100+ hours',
    platforms: ['PC', 'PlayStation'],
    status: 'Released',
    similarTitles: [401, 402, 301]
  }
];

export default function MediaDetails() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [similarMedia, setSimilarMedia] = useState([]);
  useEffect(() => {
    const loadMediaDetails = async () => {
      // In a real app, this would be an API call
      const mediaId = parseInt(id);
      const foundMedia = allMediaData.find(item => item.id === mediaId);
      
      if (foundMedia) {
        setMedia(foundMedia);
          // Check if this media is in user's Watchlist using the service
        if (isAuthenticated) {
          try {
            console.log('Checking if media is in Watchlist:', foundMedia.title, foundMedia.type);
            const inList = await isInWatchlist(foundMedia);
            console.log('Media in Watchlist result:', inList);
            setInWatchlist(inList);
          } catch (error) {
            console.error('Error checking Watchlist status:', error);
            setInWatchlist(false);
          }
        }
        
        // Get similar media
        if (foundMedia.similarTitles && foundMedia.similarTitles.length > 0) {
          const similar = foundMedia.similarTitles.map(similarId => 
            allMediaData.find(item => item.id === similarId)
          ).filter(Boolean);
          setSimilarMedia(similar);
        }
          setLoading(false);
      } else {
        toast.error('Media not found');
        setLoading(false);
      }
    };

    loadMediaDetails();
  }, [id, isAuthenticated]);  const handleAddToWatchlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to your Watchlist');
      return;
    }
    
    try {
      const result = await addToWatchlist(media);
      if (result.success) {
        setInWatchlist(true);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error adding to Watchlist:', error);
      toast.error('Failed to add to Watchlist');
    }
  };const handleRemoveFromWatchlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to manage your Watchlist');
      return;
    }
      try {
      // Map client type to server type for comparison
      const typeMap = {
        'Movie': 'Movies',
        'TV Show': 'TV Shows',
        'Web Series': 'Web Series',
        'Anime': 'Anime',
        'Game': 'Games'
      };
      
      const mappedType = typeMap[media.type] || media.type;
      
      // Find the Watchlist item by title and mapped type to get its ID
      const Watchlist = await getWatchlist();
      const WatchlistItem = Watchlist.find(item => 
        item.title === media.title && item.type === mappedType
      );
      
      if (WatchlistItem) {
        const result = await removeFromWatchlist(WatchlistItem._id);
        if (result.success) {
          setInWatchlist(false);
          toast.info(result.message);
        } else {
          toast.error(result.message);
        }
      } else {
        toast.error('Item not found in Watchlist');
      }
    } catch (error) {
      console.error('Error removing from Watchlist:', error);
      toast.error('Failed to remove from Watchlist');
    }
  };

  const handleRateMedia = (rating) => {
    // In a real app, this would be an API call
    setUserRating(rating);
    toast.success(`You rated ${media.title} ${rating}/10`);
  };

  const handleShare = () => {
    // In a real app, this would copy a link or open a share dialog
    navigator.clipboard.writeText(window.location.href);
    toast.info('Link copied to clipboard');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading media details...</p>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="not-found-container">
        <h1>Media Not Found</h1>
        <p>The media you're looking for doesn't exist or has been removed.</p>
        <Link to="/discover" className="back-link">
          <ArrowBackIcon /> Back to Discover
        </Link>
      </div>
    );
  }

  return (
    <div className="media-details-container">
      <div 
        className="media-banner" 
        style={{ backgroundImage: `url(${media.banner})` }}
      >
        <div className="banner-content">
          <Link to="/discover" className="back-btn">
            <ArrowBackIcon /> Back
          </Link>
          
          <div className="media-main-info">
            <h1>{media.title}</h1>
            <div className="media-meta-info">
              <span className="media-year">{media.year}</span>
              <span className="media-type">{media.type}</span>
              {media.duration && <span className="media-duration">{media.duration}</span>}
              <div className="media-rating">
                <StarIcon className="star-icon" />
                <span>{media.rating.toFixed(1)}</span>
              </div>
            </div>
            
            <div className="media-actions">
              <button className="play-btn">
                <PlayArrowIcon /> Watch Trailer
              </button>
              
              {inWatchlist ? (
                <button className="in-list-btn" onClick={handleRemoveFromWatchlist}>
                  <CheckIcon /> In Your List
                </button>
              ) : (
                <button className="add-btn" onClick={handleAddToWatchlist}>
                  <AddIcon /> Add to List
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="media-content">
        <div className="media-details-grid">
          <div className="media-main-content">
            <div className="media-description">
              <h2>Overview</h2>
              <p>{media.description}</p>
            </div>
            
            <div className="media-genres">
              {media.genre.map((genre, index) => (
                <span key={index} className="genre-tag">{genre}</span>
              ))}
            </div>
            
            <div className="media-creator-info">
              <div className="info-item">
                <span className="info-label">Creator</span>
                <span className="info-value">{media.creator}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Studio</span>
                <span className="info-value">{media.studio}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Release Date</span>
                <span className="info-value">{new Date(media.releaseDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Status</span>
                <span className="info-value">{media.status}</span>
              </div>              
              {media.type === 'Anime' || media.type === 'Web Series' ? (
                <>
                  <div className="info-item">
                    <span className="info-label">Episodes</span>
                    <span className="info-value">{media.episodes}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Seasons</span>
                    <span className="info-value">{media.seasons}</span>
                  </div>
                </>
              ) : media.type === 'Game' ? (
                <div className="info-item">
                  <span className="info-label">Platforms</span>
                  <span className="info-value">{media.platforms.join(', ')}</span>
                </div>
              ) : null}
            </div>
            
            <div className="user-interaction">
              <div className="user-rating">
                <h3>Rate this {media.type}</h3>
                <div className="star-rating">
                  {[...Array(10)].map((_, index) => {
                    const ratingValue = index + 1;
                    return (
                      <label key={index}>
                        <input 
                          type="radio" 
                          name="rating" 
                          value={ratingValue}
                          onClick={() => handleRateMedia(ratingValue)}
                        />
                        {ratingValue <= (hover || userRating) ? (
                          <StarIcon 
                            className="star"
                            onMouseEnter={() => setHover(ratingValue)}
                            onMouseLeave={() => setHover(0)}
                          />
                        ) : (
                          <StarBorderIcon 
                            className="star"
                            onMouseEnter={() => setHover(ratingValue)}
                            onMouseLeave={() => setHover(0)}
                          />
                        )}
                      </label>
                    );
                  })}
                  <span className="rating-number">{userRating ? userRating : ''}</span>
                </div>
              </div>
              
              <div className="share-buttons">
                <button className="like-btn">
                  <ThumbUpIcon /> Like
                </button>
                <button className="dislike-btn">
                  <ThumbDownIcon /> Dislike
                </button>
                <button className="share-btn" onClick={handleShare}>
                  <ShareIcon /> Share
                </button>
              </div>
            </div>
          </div>
          
          <div className="media-sidebar">
            <img src={media.image} alt={media.title} className="media-poster" />
            
            <div className="progress-section">
              <h3>Your Progress</h3>
              {inWatchlist ? (
                <div className="progress-tracker">                  {media.type === 'Anime' || media.type === 'Web Series' ? (
                    <div className="episode-tracker">
                      <label>Episodes Watched</label>
                      <div className="episode-input">
                        <input type="number" min="0" max={media.episodes} defaultValue="0" />
                        <span>/ {media.episodes}</span>
                      </div>
                    </div>
                  ) : media.type === 'Game' ? (
                    <div className="game-tracker">
                      <label>Hours Played</label>
                      <input type="number" min="0" defaultValue="0" />
                    </div>
                  ) : (
                    <div className="movie-tracker">
                      <label>Status</label>
                      <select defaultValue="plan">
                        <option value="plan">Plan to Watch</option>
                        <option value="watching">Currently Watching</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  )}
                  
                  <button className="update-progress-btn">Update Progress</button>
                </div>
              ) : (
                <div className="not-in-list-message">
                  <p>Add this {media.type.toLowerCase()} to your list to track your progress</p>
                  <button className="add-small-btn" onClick={handleAddToWatchlist}>
                    <AddIcon /> Add to List
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {similarMedia.length > 0 && (
          <div className="similar-media-section">
            <h2>You Might Also Like</h2>
            <div className="similar-media-grid">
              {similarMedia.map(item => (
                <Link to={`/media/${item.id}`} key={item.id} className="similar-media-card">
                  <div className="similar-media-image" style={{ backgroundImage: `url(${item.image})` }}>
                    <div className="similar-media-overlay">
                      <div className="similar-media-rating">
                        <StarIcon className="star-icon" />
                        <span>{item.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="similar-media-info">
                    <h3>{item.title}</h3>
                    <div className="similar-media-meta">
                      <span>{item.year}</span>
                      <span>{item.type}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
