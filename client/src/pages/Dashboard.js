import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { Link } from 'react-router-dom';
import { getWatchlist } from '../services/watchlistService';
import { useAuth } from '../contexts/AuthContext';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MovieIcon from '@mui/icons-material/Movie';
import TvIcon from '@mui/icons-material/Tv';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import LocalMoviesIcon from '@mui/icons-material/LocalMovies';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StarIcon from '@mui/icons-material/Star';
import TimelineIcon from '@mui/icons-material/Timeline';
import AddIcon from '@mui/icons-material/Add';
import AssessmentIcon from '@mui/icons-material/Assessment';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [userWatchlist, setUserWatchlist] = useState([]);
  const [recentlyWatched, setRecentlyWatched] = useState([]);
  const [currentlyWatching, setCurrentlyWatching] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    watching: 0,
    planToWatch: 0,
    paused: 0,
    dropped: 0,
    movies: 0,
    tvShows: 0,
    anime: 0,
    games: 0,
    averageRating: 0,
    completionRate: 0
  });  // Load user's Watchlist data
  useEffect(() => {
    if (isAuthenticated) {
      const loadWatchlistData = async () => {        try {
          const Watchlist = await getWatchlist();
          setUserWatchlist(Watchlist);          // Debug: Log the types and structure being used
          console.log('Watchlist types:', Watchlist.map(item => ({ title: item.title, type: item.type })));
          console.log('Sample Watchlist item:', Watchlist[0]);
          
          // Filter recently added items (last 4)
          // Check for dateAdded, createdAt, or just use reverse order if no date field
          let recent = Watchlist
            .filter(item => item.dateAdded || item.createdAt || item.addedDate)
            .sort((a, b) => {
              const dateA = new Date(a.dateAdded || a.createdAt || a.addedDate);
              const dateB = new Date(b.dateAdded || b.createdAt || b.addedDate);
              return dateB - dateA;
            })
            .slice(0, 4);
          
          // If no items have date fields, just show the last 4 items
          if (recent.length === 0 && Watchlist.length > 0) {
            recent = Watchlist.slice(-4).reverse();
          }
          
          setRecentlyWatched(recent);
          console.log('Recently added items:', recent);
          
          // Filter currently watching items
          const watching = Watchlist
            .filter(item => item.status === 'Watching' || item.status === 'Playing')
            .slice(0, 4);
          setCurrentlyWatching(watching);
          
          // Calculate detailed stats
          const totalItems = Watchlist.length;
          const completed = Watchlist.filter(item => item.status === 'Completed').length;
          const watchingCount = Watchlist.filter(item => item.status === 'Watching' || item.status === 'Playing').length;
          const planToWatch = Watchlist.filter(item => item.status === 'Plan to Watch' || item.status === 'Plan to Play').length;
          const paused = Watchlist.filter(item => item.status === 'Paused').length;
          const dropped = Watchlist.filter(item => item.status === 'Dropped').length;
            // Calculate by type
          const movies = Watchlist.filter(item => item.type === 'Movie' || item.type === 'Movies').length;
          const tvShows = Watchlist.filter(item => item.type === 'TV Show' || item.type === 'TV Shows' || item.type === 'Web Series').length;
          const anime = Watchlist.filter(item => item.type === 'Anime').length;
          const games = Watchlist.filter(item => item.type === 'Game' || item.type === 'Games').length;
          
          // Calculate average rating
          const ratedItems = Watchlist.filter(item => item.rating && item.rating > 0);
          const averageRating = ratedItems.length > 0 
            ? (ratedItems.reduce((sum, item) => sum + item.rating, 0) / ratedItems.length).toFixed(1)
            : 0;
          
          // Calculate completion rate
          const completionRate = totalItems > 0 ? Math.round((completed / totalItems) * 100) : 0;
          
          setStats({
            total: totalItems,
            completed,
            watching: watchingCount,
            planToWatch,
            paused,
            dropped,
            movies,
            tvShows,
            anime,
            games,
            averageRating,
            completionRate
          });
        } catch (error) {
          console.error('Error loading Watchlist data:', error);
          setUserWatchlist([]);
          setRecentlyWatched([]);
          setCurrentlyWatching([]);
        }
      };

      loadWatchlistData();
    }
  }, [isAuthenticated]);

  const getUserDisplayName = () => {
    if (user?.name) {
      return user.name;
    }
    return 'User';
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-hero">
        <div className="hero-content">
          <h1>Welcome back, {getUserDisplayName()}!</h1>
          <p>Continue tracking your favorite shows, movies, anime, and games.</p>
          
          {/* Stats Overview */}
          <div className="stats-overview">
            <div className="stat-item">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Items</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.watching}</div>
              <div className="stat-label">Currently Watching</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.completed}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats.planToWatch}</div>
              <div className="stat-label">Plan to Watch</div>
            </div>
          </div>
        </div>
      </div>      <div className="dashboard-content">
        {/* Statistics Overview */}
        <section className="stats-section">
          <div className="section-header">
            <h2><AssessmentIcon /> Your Statistics</h2>
          </div>
          
          <div className="stats-grid">
            {/* Status Breakdown */}
            <div className="stat-card">
              <div className="stat-card-header">
                <TimelineIcon />
                <h3>Status Breakdown</h3>
              </div>
              <div className="stat-card-content">
                <div className="stat-row">
                  <span className="stat-label">
                    <CheckCircleIcon className="status-icon completed" />
                    Completed
                  </span>
                  <span className="stat-value">{stats.completed}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">
                    <PlayArrowIcon className="status-icon watching" />
                    Currently Watching
                  </span>
                  <span className="stat-value">{stats.watching}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">
                    <ScheduleIcon className="status-icon plan" />
                    Plan to Watch
                  </span>
                  <span className="stat-value">{stats.planToWatch}</span>
                </div>
                {stats.paused > 0 && (
                  <div className="stat-row">
                    <span className="stat-label">
                      <PauseCircleIcon className="status-icon paused" />
                      Paused
                    </span>
                    <span className="stat-value">{stats.paused}</span>
                  </div>
                )}
                {stats.dropped > 0 && (
                  <div className="stat-row">
                    <span className="stat-label">
                      <TrendingDownIcon className="status-icon dropped" />
                      Dropped
                    </span>
                    <span className="stat-value">{stats.dropped}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Content Types */}
            <div className="stat-card">
              <div className="stat-card-header">
                <LocalMoviesIcon />
                <h3>Content Types</h3>
              </div>              <div className="stat-card-content">
                <div className="stat-row">
                  <span className="stat-label">
                    <MovieIcon className="type-icon" />
                    Movies
                  </span>
                  <span className="stat-value">{stats.movies}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">
                    <TvIcon className="type-icon" />
                    TV Shows
                  </span>
                  <span className="stat-value">{stats.tvShows}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">
                    <WhatshotIcon className="type-icon" />
                    Anime
                  </span>
                  <span className="stat-value">{stats.anime}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">
                    <SportsEsportsIcon className="type-icon" />
                    Games
                  </span>
                  <span className="stat-value">{stats.games}</span>
                </div>
                {stats.total === 0 && (
                  <div className="stat-row empty">
                    <span className="stat-label">No content added yet</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Insights */}
            <div className="stat-card">
              <div className="stat-card-header">
                <TrendingUpIcon />
                <h3>Progress Insights</h3>
              </div>
              <div className="stat-card-content">
                <div className="stat-row">
                  <span className="stat-label">
                    <StarIcon className="insight-icon" />
                    Average Rating
                  </span>
                  <span className="stat-value">
                    {stats.averageRating > 0 ? `${stats.averageRating}/10` : 'No ratings yet'}
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">
                    <CheckCircleIcon className="insight-icon" />
                    Completion Rate
                  </span>
                  <span className="stat-value">{stats.completionRate}%</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">
                    <CalendarTodayIcon className="insight-icon" />
                    Total Items
                  </span>
                  <span className="stat-value">{stats.total}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Currently Watching Section */}
        {currentlyWatching.length > 0 && (
          <section className="media-section">
            <div className="section-header">
              <h2>Continue Watching</h2>
              <Link to="/Watchlist" className="view-all">View All</Link>
            </div>            <div className="media-grid">
              {currentlyWatching.map(item => (                <div key={item._id} className="media-card">
                  <div className="media-image" style={{ backgroundImage: `url(${item.poster || item.image || 'https://via.placeholder.com/300x400/333/fff?text=No+Image'})` }}>
                    {/* Always visible year on top right */}
                    {item.year && <span className="media-year-always">{item.year}</span>}
                    
                    {/* Always visible media type on top left */}
                    <span className="media-type-always">{item.type}</span><div className="media-overlay">
                      <div className="overlay-bottom">
                        <span className="media-progress">
                          {typeof item.progress === 'object' && item.progress 
                            ? `${item.progress.current || 0}/${item.progress.total || 0}` 
                            : typeof item.progress === 'string' ? item.progress : 'Not Started'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="media-info">
                    <h3>{item.title}</h3>
                    <div className="media-meta">
                      <div className="media-rating">
                        <span className="star-icon">★</span>
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
          </section>
        )}

        {/* Recently Added Section */}
        {recentlyWatched.length > 0 && (
          <section className="media-section">
            <div className="section-header">
              <h2>Recently Added</h2>
              <Link to="/Watchlist" className="view-all">View All</Link>
            </div>            <div className="media-grid">
              {recentlyWatched.map(item => (
                <div key={item._id} className="media-card">
                  <div className="media-image" style={{ backgroundImage: `url(${item.poster || item.image || 'https://via.placeholder.com/300x400/333/fff?text=No+Image'})` }}>
                    {/* Always visible year on top right */}
                    {item.year && <span className="media-year-always">{item.year}</span>}
                    
                    {/* Always visible media type on top left */}
                    <span className="media-type-always">{item.type}</span>
                      <div className="media-overlay">
                      <div className="overlay-bottom">
                        <span className="media-status">{item.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="media-info">
                    <h3>{item.title}</h3>
                    <div className="media-meta">
                      <div className="media-rating">
                        <span className="star-icon">★</span>
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
          </section>
        )}        {/* Empty State */}
        {userWatchlist.length === 0 && (
          <section className="empty-dashboard">
            <div className="empty-content">
              <LocalMoviesIcon className="empty-icon" />
              <h2>Start Building Your Entertainment Library</h2>
              <p>Discover and track movies, TV shows, anime, and games. Build your personalized Watchlist and never lose track of what you want to watch or play next.</p>
              <Link to="/discover" className="discover-btn">
                <AddIcon /> Discover Content
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
