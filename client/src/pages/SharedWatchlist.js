import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './SharedWatchlist.css';
import { getSharedWatchlist } from '../services/watchlistService';
import StarIcon from '@mui/icons-material/Star';
import FolderIcon from '@mui/icons-material/Folder';
import MovieIcon from '@mui/icons-material/Movie';
import TvIcon from '@mui/icons-material/Tv';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import AnimationIcon from '@mui/icons-material/Animation';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function SharedWatchlist() {
  const { folderType, shareId, userId } = useParams();
  const [sharedData, setSharedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const loadSharedWatchlist = async () => {
      try {
        setLoading(true);
        const result = await getSharedWatchlist(shareId, userId);
        
        if (result.success) {
          setSharedData(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        console.error('Error loading shared Watchlist:', err);
        setError('Failed to load shared Watchlist');
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      loadSharedWatchlist();
    }
  }, [shareId, userId]);

  const getMediaTypeIcon = (mediaType) => {
    switch (mediaType) {
      case 'Movies':
      case 'Movie':
        return <MovieIcon />;
      case 'Web Series':
      case 'TV Shows':
        return <TvIcon />;
      case 'Anime':
        return <AnimationIcon />;
      case 'Games':
      case 'Game':
        return <SportsEsportsIcon />;
      default:
        return <FolderIcon />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="shared-Watchlist-container">
        <div className="loading-message">
          <h2>Loading shared Watchlist...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-Watchlist-container">
        <div className="error-message">
          <h2>Unable to Load Watchlist</h2>
          <p>{error}</p>
          <Link to="/" className="back-btn">
            <ArrowBackIcon /> Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!sharedData) {
    return (
      <div className="shared-Watchlist-container">
        <div className="error-message">
          <h2>Watchlist Not Found</h2>
          <p>The shared Watchlist you're looking for doesn't exist.</p>
          <Link to="/" className="back-btn">
            <ArrowBackIcon /> Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-Watchlist-container">
      <div className="shared-header">
        <Link to="/" className="back-link">
          <ArrowBackIcon /> Back to Home
        </Link>
        
        <div className="shared-info">          <div className="folder-info">
            <div className="folder-icon-large">
              {getMediaTypeIcon(sharedData.folder?.name || 'Unknown')}
            </div>            <div className="folder-details">
              <h1 className="shared-folder-title">{sharedData.folder?.name || 'Shared Folder'}</h1>              <div className="folder-meta">
                <span className="shared-by">
                  <PersonIcon /> Shared by {sharedData.user?.name || 'User'}
                </span>
                {sharedData.sharedDate && (
                  <span className="shared-date">
                    <AccessTimeIcon /> {formatDate(sharedData.sharedDate)}
                  </span>
                )}
                <span className="item-count">
                  {sharedData.items.length} {sharedData.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="shared-content">
        {sharedData.items.length === 0 ? (
          <div className="empty-shared-list">
            <h3>This folder is empty</h3>
            <p>No items have been added to this folder yet.</p>
          </div>
        ) : (
          <div className="shared-media-grid">
            {sharedData.items.map((item, index) => (
              <div key={index} className="shared-media-card">                <div 
                  className="shared-media-image" 
                  style={{ backgroundImage: `url(${item.poster || item.image})` }}
                >
                  <div className="shared-status-badge">
                    <span className={`shared-status-label status-${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {item.status}
                    </span>
                  </div>
                  
                  <div className="shared-media-overlay">
                    <div className="shared-overlay-bottom">
                      <div className="shared-media-rating">
                        {Array.from({ length: 5 }, (_, i) => (
                          <StarIcon 
                            key={i}
                            className={item.rating && i < Math.round(item.rating / 2) ? 'star filled' : 'star'}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="shared-media-info">
                  <h3 className="shared-media-title">{item.title}</h3>
                  <div className="shared-media-meta">
                    <span className="shared-media-type">{item.type}</span>
                    <span className="shared-rating-value">
                      {item.rating ? `${parseFloat(item.rating).toFixed(1)}/10` : 'Not Rated'}
                    </span>
                  </div>
                  <div className="shared-media-progress">
                    {item.progress && (item.progress.current || item.progress.total) ? 
                      `Progress: ${item.progress.current || 0}/${item.progress.total || 0}` : 
                      'No progress data'
                    }
                  </div>
                  {item.description && (
                    <p className="shared-media-description">
                      {item.description.length > 100 
                        ? `${item.description.substring(0, 100)}...` 
                        : item.description
                      }
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shared-footer">
        <p>Want to create your own Watchlist? <Link to="/signup">Join Watchlist</Link></p>
      </div>
    </div>
  );
}
