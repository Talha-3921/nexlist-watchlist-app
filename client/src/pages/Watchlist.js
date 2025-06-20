import React, { useState, useEffect } from 'react';
import './Watchlist.css';
import { Link } from 'react-router-dom';
import { getWatchlist, removeFromWatchlist, updateWatchlistItem, shareFolder, getShareUrl, getFolderByName, getCustomFolders, createCustomFolder, deleteCustomFolder } from '../services/watchlistService';
import { useAuth } from '../contexts/AuthContext';
import cloudActivityService, { CloudActivityService } from '../services/cloudActivityService';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FilterListIcon from '@mui/icons-material/FilterList';
import MovieIcon from '@mui/icons-material/Movie';
import TvIcon from '@mui/icons-material/Tv';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import AnimationIcon from '@mui/icons-material/Animation';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ShareIcon from '@mui/icons-material/Share';
import LinkIcon from '@mui/icons-material/Link';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import InstagramIcon from '@mui/icons-material/Instagram';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { toast } from 'react-toastify';

export default function Watchlist() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [groupedItems, setGroupedItems] = useState({});
  const [activeTab, setActiveTab] = useState('Movies');
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [statusFilter, setStatusFilter] = useState('All');
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  
  // Custom folders state
  const [customFolders, setCustomFolders] = useState([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderItemAssignments, setFolderItemAssignments] = useState({});
  
  // Default media types that are always present
  const defaultMediaTypes = ['Movies', 'TV Shows', 'Web Series', 'Anime', 'Games'];
  
  // Helper function to get icon for media type
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
  };  // Custom folder management functions
  const loadCustomFolders = async () => {
    if (!isAuthenticated) return;
    
    try {
      // Load custom folders from cloud
      const folders = await getCustomFolders();
      const folderNames = folders.map(folder => folder.name);
      setCustomFolders(folderNames);
        // Create folder assignments based on items' folders array
      const assignments = {};
      // Ensure items is an array before processing
      const safeItems = Array.isArray(items) ? items : [];
      safeItems.forEach(item => {
        if (item.folders && item.folders.length > 0) {
          // Use the first custom folder if multiple are assigned
          const customFolder = item.folders.find(f => folderNames.includes(f));
          if (customFolder) {
            assignments[item._id] = customFolder;
          }
        }
      });
      setFolderItemAssignments(assignments);
      
    } catch (error) {
      console.error('Error loading custom folders from cloud:', error);
      // Fallback: try to load from localStorage for backward compatibility
      try {
        const stored = localStorage.getItem('Watchlist-custom-folders');
        if (stored) {
          const localFolders = JSON.parse(stored);
          setCustomFolders(localFolders);
          
          // If we have local folders, migrate them to cloud
          for (const folderName of localFolders) {
            await createCustomFolder({ name: folderName });
          }
          
          // Clear localStorage after successful migration
          localStorage.removeItem('Watchlist-custom-folders');
          localStorage.removeItem('Watchlist-folder-assignments');
          
          // Reload from cloud after migration
          await loadCustomFolders();
        }
      } catch (migrationError) {
        console.error('Error during migration:', migrationError);
      }
    }
  };
    const saveCustomFolders = async (folders) => {
    // This function is no longer needed as folders are managed individually through API
    // Keeping for backward compatibility but folders should be created/deleted via API calls
    console.warn('saveCustomFolders called - use createCustomFolder/deleteCustomFolder instead');
  };
  
  const saveFolderAssignments = async (assignments) => {
    // This function is no longer needed as assignments are managed through item updates
    // Keeping for backward compatibility but assignments should be updated via updateWatchlistItem
    console.warn('saveFolderAssignments called - use handleMoveItemToFolder instead');
  };    const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }
    
    if (defaultMediaTypes.includes(newFolderName) || customFolders.includes(newFolderName)) {
      toast.error('A folder with this name already exists');
      return;
    }
    
    try {
      const result = await createCustomFolder({ name: newFolderName.trim() });
      
      if (result.success) {        // Log folder creation activity
        cloudActivityService.logFolderCreate(newFolderName.trim());
        
        // Update local state
        const updatedFolders = [...customFolders, newFolderName.trim()];
        setCustomFolders(updatedFolders);
        setNewFolderName('');
        setIsCreatingFolder(false);
        setActiveTab(newFolderName.trim());
        toast.success('Folder created successfully');
      } else {
        toast.error(result.message || 'Failed to create folder');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    }
  };
    const handleDeleteFolder = async (folderName) => {
    if (defaultMediaTypes.includes(folderName)) {
      toast.error('Cannot delete default folders');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete the "${folderName}" folder? Items in this folder will be moved back to their default categories.`)) {
      try {
        // First, get the folder ID from the cloud folders
        const cloudFolders = await getCustomFolders();
        const folderToDelete = cloudFolders.find(f => f.name === folderName);
        
        if (!folderToDelete) {
          toast.error('Folder not found');
          return;
        }
        
        const result = await deleteCustomFolder(folderToDelete._id);
          if (result.success) {          // Log folder deletion activity
          cloudActivityService.logFolderDelete(folderName);
          
          // Update local state
          const updatedFolders = customFolders.filter(f => f !== folderName);
          setCustomFolders(updatedFolders);
          
          // Remove assignments from local state
          const updatedAssignments = { ...folderItemAssignments };
          Object.keys(updatedAssignments).forEach(itemId => {
            if (updatedAssignments[itemId] === folderName) {
              delete updatedAssignments[itemId];
            }
          });
          setFolderItemAssignments(updatedAssignments);
          
          // Switch to default tab if current tab was deleted
          if (activeTab === folderName) {
            setActiveTab('Movies');
          }
          
          // Reload Watchlist to reflect changes
          await loadWatchlist();
          
          toast.success('Folder deleted successfully');
        } else {
          toast.error(result.message || 'Failed to delete folder');
        }
      } catch (error) {
        console.error('Error deleting folder:', error);
        toast.error('Failed to delete folder');
      }
    }
  };
    const handleMoveItemToFolder = async (itemId, targetFolder) => {
    try {
      const item = items.find(i => i._id === itemId);
      if (!item) {
        toast.error('Item not found');
        return;
      }
      
      let updatedFolders = [];
      
      if (defaultMediaTypes.includes(targetFolder)) {
        // Moving back to default category, remove from custom folders
        updatedFolders = [];
      } else {
        // Assigning to custom folder, replace any existing custom folder assignment
        updatedFolders = [targetFolder];
      }
      
      // Update the item in the cloud
      const result = await updateWatchlistItem(itemId, { folders: updatedFolders });      if (result.success) {
        // Log the folder assignment activity
        const itemTitle = item.title || 'Unknown Item';
        if (defaultMediaTypes.includes(targetFolder)) {
          // Item moved back to default category
          const previousFolder = folderItemAssignments[itemId];
          if (previousFolder) {
            await cloudActivityService.logFolderItemRemove(itemTitle, previousFolder);
          }
        } else {
          // Item assigned to custom folder
          const previousFolder = folderItemAssignments[itemId];
          if (previousFolder && previousFolder !== targetFolder) {
            await cloudActivityService.logFolderItemMove(itemTitle, previousFolder, targetFolder);
          } else if (!previousFolder) {
            await cloudActivityService.logFolderItemAdd(itemTitle, targetFolder);
          }
        }
        
        // Update local state
        const updatedAssignments = { ...folderItemAssignments };
        
        if (defaultMediaTypes.includes(targetFolder)) {
          delete updatedAssignments[itemId];
        } else {
          updatedAssignments[itemId] = targetFolder;
        }
        
        setFolderItemAssignments(updatedAssignments);
        
        // Update the items array
        const updatedItems = items.map(i => 
          i._id === itemId ? { ...i, folders: updatedFolders } : i
        );
        setItems(updatedItems);
        
        toast.success('Item moved successfully');
      } else {
        toast.error(result.message || 'Failed to move item');
      }
    } catch (error) {
      console.error('Error moving item to folder:', error);
      toast.error('Failed to move item');
    }
  };  // Load user's actual Watchlist
  const loadWatchlist = async () => {
    if (isAuthenticated) {
      console.log('Starting to load watchlist for authenticated user');
      try {
        const userWatchlist = await getWatchlist();
        console.log('Loaded Watchlist:', userWatchlist); // Debug log
        
        // Check image/poster fields for each item
        if (Array.isArray(userWatchlist)) {
          setItems(userWatchlist);
          userWatchlist.forEach((item, index) => {
            console.log(`Item ${index} (${item.title}):`, {
              poster: item.poster,
              image: item.image,
              hasImage: !!(item.poster || item.image)
            });
          });
        }
          // Ensure we always have an array
        const WatchlistArray = Array.isArray(userWatchlist) ? userWatchlist : [];
        setItems(WatchlistArray);
          // Clean up folder assignments with the loaded items
        const cleanedAssignments = cleanupFolderAssignments(WatchlistArray, folderItemAssignments);
        if (JSON.stringify(cleanedAssignments) !== JSON.stringify(folderItemAssignments)) {
          console.log('Cleaning up folder assignments:', cleanedAssignments);
          setFolderItemAssignments(cleanedAssignments);
        }
      } catch (error) {
        console.error('Error loading Watchlist:', error);
        setItems([]);
      }
    } else {
      setItems([]);
    }
  };  // Load Watchlist and custom folders when component mounts or user changes
  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated) {
        console.log('User is authenticated, loading watchlist data...');
        try {
          await loadWatchlist();
          console.log('Watchlist loaded successfully');
        } catch (error) {
          console.error('Error in loadData:', error);
          toast.error('Failed to load your watchlist. Please try again later.');
        }
      } else {
        console.log('User is not authenticated, skipping data load');
        setItems([]);
      }
    };
    
    loadData();
  }, [isAuthenticated]);

  // Load custom folders after items are loaded
  useEffect(() => {
    if (isAuthenticated && items.length >= 0) { // Check for >= 0 to include empty arrays
      loadCustomFolders();
    }
  }, [isAuthenticated, items]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.filter-container')) {
        setShowStatusFilter(false);
      }
      if (!event.target.closest('.share-container')) {
        setShowShareDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Group items by media type and custom folders
  useEffect(() => {
    // Ensure items is always an array
    const safeItems = Array.isArray(items) ? items : [];
    let filteredItems = safeItems;
    
    // Apply status filter
    if (statusFilter !== 'All') {
      filteredItems = safeItems.filter(item => item.status === statusFilter);
    }
    
    // Ensure filteredItems is an array before calling reduce
    if (!Array.isArray(filteredItems)) {
      filteredItems = [];    }
    
    // Start with default grouping
    const grouped = filteredItems.reduce((acc, item) => {
      // ALWAYS add item to its default category first
      let type = item.type; // Use the type directly from server
      
      // The server now sends the correct types: 'Movies', 'TV Shows', 'Web Series', 'Anime', 'Games'
      // No need for additional mapping
      
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(item);
      
      // ALSO check if item is assigned to a custom folder and add it there too
      const assignedFolder = folderItemAssignments[item._id];
      
      if (assignedFolder && customFolders.includes(assignedFolder)) {
        // Item is also assigned to a custom folder - add it there as well
        if (!acc[assignedFolder]) {
          acc[assignedFolder] = [];
        }
        acc[assignedFolder].push(item);
      }
      
      return acc;
    }, {});
    
    // Add empty custom folders to ensure they appear in tabs
    customFolders.forEach(folderName => {
      if (!grouped[folderName]) {
        grouped[folderName] = [];
      }
    });
    
    setGroupedItems(grouped);
    
    // Set first available tab as active if current active tab has no items or doesn't exist
    const availableTabs = [...defaultMediaTypes, ...customFolders].filter(tab => 
      grouped[tab] !== undefined
    );
    
    if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [items, activeTab, statusFilter, customFolders, folderItemAssignments]);

  // Listen for storage changes from other tabs/components
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'Watchlist-Watchlist') {
        try {
          const newWatchlist = JSON.parse(e.newValue || '[]');
          setItems(Array.isArray(newWatchlist) ? newWatchlist : []);
        } catch (error) {
          console.error('Error parsing updated Watchlist:', error);
          setItems([]);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };  const handleEdit = (item) => {
    setEditingItem(item);
    
    // Format progress depending on its type
    let progressValue = '';
    if (typeof item.progress === 'object' && item.progress) {
      progressValue = `${item.progress.current || 0}/${item.progress.total || 0}`;
    } else if (typeof item.progress === 'string') {
      progressValue = item.progress;
    }
    
    setEditForm({
      status: item.status,
      rating: item.rating || 0,
      progress: progressValue
    });
  };const handleEditSave = async () => {
    try {
      // Parse progress string into object if needed
      let progressValue = editForm.progress;
      if (editForm.status === 'Completed') {
        progressValue = 'Completed';
      } else if (typeof progressValue === 'string' && progressValue.includes('/')) {
        const [current, total] = progressValue.split('/').map(val => parseInt(val.trim()) || 0);
        progressValue = { current, total };
      }

      const updates = {
        status: editForm.status,
        rating: editForm.status === 'Completed' ? editForm.rating : null,
        progress: progressValue,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      
      const result = await updateWatchlistItem(editingItem._id, updates);
      if (result.success) {
        // Log the update activities
        const itemTitle = editingItem.title || 'Unknown Item';
        
        // Log status change if it changed
        if (editingItem.status !== editForm.status) {
          cloudActivityService.logMediaStatusChange(itemTitle, editingItem.status, editForm.status);
        }
        
        // Log rating if it was added/changed
        if (editForm.status === 'Completed' && editForm.rating && editForm.rating !== editingItem.rating) {
          cloudActivityService.logMediaRate(itemTitle, editForm.rating);
        }        // Log general update if other fields changed
        if (editingItem.progress !== editForm.progress) {
          // Format progress to string before logging
          let progressString = '';
          if (typeof editForm.progress === 'object' && editForm.progress) {
            progressString = `${editForm.progress.current || 0}/${editForm.progress.total || 0}`;
          } else if (typeof editForm.progress === 'string') {
            progressString = editForm.progress;
          }
          
          cloudActivityService.logActivity(
            cloudActivityService.TYPES.Watchlist_UPDATE,
            `Updated progress for "${itemTitle}"`,
            { itemTitle, newProgress: progressString }
          );
        }
        
        loadWatchlist(); // Reload the Watchlist
        setEditingItem(null);
        setEditForm({});
      } else {
        alert('Failed to update item: ' + result.message);
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item: ' + error.message);
    }
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setEditForm({});
  };
  const handleStarClick = (rating) => {
    setEditForm(prev => ({ ...prev, rating }));
  };
    const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to completely remove this item from your Watchlist? This will delete it from all folders.')) {
      try {
        // Find the item to get its details before deleting
        const itemToDelete = items.find(item => item._id === id);
        
        const result = await removeFromWatchlist(id);
        if (result.success) {
          // Log the removal activity
          if (itemToDelete) {
            cloudActivityService.logWatchlistRemove(itemToDelete.title, itemToDelete.type);
          }
          
          loadWatchlist(); // Reload the Watchlist
        } else {
          alert('Failed to remove item: ' + result.message);
        }
      } catch (error) {
        console.error('Error removing item:', error);
        alert('Failed to remove item: ' + error.message);
      }
    }
  };  const handleMarkComplete = async (id) => {
    try {
      const updates = { 
        status: 'Completed', 
        progress: 'Completed',
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      
      const result = await updateWatchlistItem(id, updates);
      if (result.success) {
        loadWatchlist(); // Reload the Watchlist
      } else {
        alert('Failed to update item: ' + result.message);
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item: ' + error.message);
    }
  };const handleMarkWatching = async (id) => {
    try {
      const item = items.find(item => item._id === id);
      const updates = { 
        status: item?.type === 'Games' ? 'Playing' : 'Watching',
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      
      const result = await updateWatchlistItem(id, updates);
      if (result.success) {
        loadWatchlist(); // Reload the Watchlist
      } else {
        alert('Failed to update item: ' + result.message);
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item: ' + error.message);
    }
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setShowStatusFilter(false);
  };

  // Get all unique statuses from the items
  const getAvailableStatuses = () => {
    const safeItems = Array.isArray(items) ? items : [];
    const statuses = [...new Set(safeItems.map(item => item.status))];
    return ['All', ...statuses.sort()];
  };  // Fallback clipboard function for mobile devices
  const copyToClipboardFallback = (text) => {
    return new Promise((resolve, reject) => {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
          .then(() => resolve(true))
          .catch(() => {
            // If modern API fails, use fallback
            fallbackCopyMethod(text, resolve, reject);
          });
      } else {
        // Use fallback method directly
        fallbackCopyMethod(text, resolve, reject);
      }
    });
  };

  const fallbackCopyMethod = (text, resolve, reject) => {
    try {
      // Create a temporary textarea element
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      
      // Select and copy the text
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        resolve(true);
      } else {
        reject(new Error('Copy command failed'));
      }
    } catch (err) {
      reject(err);
    }
  };

  // Share functionality
  const handleShare = async (platform) => {
    try {
      const activeItems = groupedItems[activeTab] || [];
      
      if (activeItems.length === 0) {
        toast.error('Cannot share an empty folder');
        setShowShareDropdown(false);
        return;
      }

      let shareResult;
      
      // Share folder (works for both default and custom folders now)
      shareResult = await shareFolder(activeTab);
        
      if (shareResult.success) {
        // Log folder sharing activity
        cloudActivityService.logFolderShare(activeTab, shareResult.shareId || shareResult.shareUrl);
        
        const baseShareUrl = shareResult.shareUrl;
        let finalUrl = baseShareUrl;
        
        switch (platform) {
          case 'copy':
            try {
              await copyToClipboardFallback(baseShareUrl);
              toast.success('Link copied to clipboard!');
            } catch (clipboardError) {
              console.error('Clipboard error:', clipboardError);
              // Show the URL to user as last resort
              toast.error('Could not copy automatically. Share URL: ' + baseShareUrl);
            }
            break;
          case 'whatsapp':
            finalUrl = `https://wa.me/?text=${encodeURIComponent(`Check out my ${activeTab} Watchlist: ${baseShareUrl}`)}`;
            window.open(finalUrl, '_blank');
            toast.success('Opening WhatsApp...');
            break;
          case 'instagram':
            // For Instagram, try to copy first, then open
            try {
              await copyToClipboardFallback(baseShareUrl);
              window.open('https://www.instagram.com/direct/inbox/', '_blank');
              toast.success('Link copied! Instagram chat opened - paste the link to share.');
            } catch (clipboardError) {
              console.error('Clipboard error for Instagram:', clipboardError);
              // Still open Instagram but inform user about manual copy
              window.open('https://www.instagram.com/direct/inbox/', '_blank');
              toast.error('Could not copy automatically. Please manually copy: ' + baseShareUrl);
            }
            break;
          default:
            try {
              await copyToClipboardFallback(baseShareUrl);
              toast.success('Link copied to clipboard!');
            } catch (clipboardError) {
              console.error('Clipboard error:', clipboardError);
              toast.error('Could not copy automatically. Share URL: ' + baseShareUrl);
            }
        }
      } else {
        toast.error(shareResult.message);
      }
    } catch (error) {
      console.error('Error sharing folder:', error);
      toast.error('Failed to share folder');
    }
    
    setShowShareDropdown(false);
  };

  // Handle removing item from a folder only, not from the watchlist
  const handleRemoveFromFolder = async (itemId) => {
    if (window.confirm('Are you sure you want to remove this item from the current folder?')) {
      try {
        const item = items.find(i => i._id === itemId);
        if (!item) {
          toast.error('Item not found');
          return;
        }
        
        // If we're in a custom folder, update the item to remove it from this folder
        if (!defaultMediaTypes.includes(activeTab)) {
          // Update the item in the cloud to remove the folder assignment
          const result = await updateWatchlistItem(itemId, { folders: [] });
          
          if (result.success) {
            // Log the folder removal activity
            const itemTitle = item.title || 'Unknown Item';
            await cloudActivityService.logFolderItemRemove(itemTitle, activeTab);
            
            // Update local state
            const updatedAssignments = { ...folderItemAssignments };
            delete updatedAssignments[itemId];
            setFolderItemAssignments(updatedAssignments);
            
            // Update the items array
            const updatedItems = items.map(i => 
              i._id === itemId ? { ...i, folders: [] } : i
            );
            setItems(updatedItems);
            
            toast.success('Item removed from folder successfully');
          } else {
            toast.error(result.message || 'Failed to remove item from folder');
          }
        }
      } catch (error) {
        console.error('Error removing item from folder:', error);
        toast.error('Failed to remove item from folder');
      }
    }
  };
  // Function to clean up folder assignments and ensure correct ID format
  const cleanupFolderAssignments = (WatchlistItems, currentAssignments) => {
    const cleanedAssignments = {};
    
    // Only keep assignments that match actual Watchlist item IDs
    Object.keys(currentAssignments).forEach(assignmentId => {
      const matchingItem = WatchlistItems.find(item => 
        item._id === assignmentId || item.id === assignmentId
      );
      
      if (matchingItem) {
        // Always use the _id format
        cleanedAssignments[matchingItem._id] = currentAssignments[assignmentId];
      }
    });
    
    return cleanedAssignments;
  };

  return (
    <div className="Watchlist-container">
      <div className="Watchlist-header">
        <h1>Your Watchlist</h1>
        <div className="Watchlist-actions">
          <div className="filter-container">
            <button 
              className={`filter-btn ${statusFilter !== 'All' ? 'active-filter' : ''}`}
              onClick={() => setShowStatusFilter(!showStatusFilter)}
            >
              <FilterListIcon /> 
              {statusFilter !== 'All' ? `Filter: ${statusFilter}` : 'Filter by Status'}
            </button>
            {showStatusFilter && (
              <div className="dropdown-menu filter-menu">
                <div className="filter-section">
                  <h3>Status</h3>
                  <div className="filter-options">
                    {getAvailableStatuses().map(status => (
                      <button
                        key={status}
                        className={`filter-option ${statusFilter === status ? 'active' : ''}`}
                        onClick={() => handleStatusFilterChange(status)}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="share-container">
            <button 
              className="share-btn"
              onClick={() => setShowShareDropdown(!showShareDropdown)}
              disabled={!groupedItems[activeTab] || groupedItems[activeTab].length === 0}
            >
              <ShareIcon /> Share {activeTab}
            </button>
            {showShareDropdown && (
              <div className="dropdown-menu share-menu">
                <div className="share-header">Share "{activeTab}" folder</div>
                <button
                  className="share-option"
                  onClick={() => handleShare('copy')}
                >
                  <ContentCopyIcon />
                  Copy Link
                </button>
                <button
                  className="share-option"
                  onClick={() => handleShare('whatsapp')}
                >
                  <WhatsAppIcon />
                  WhatsApp
                </button>
                <button
                  className="share-option"
                  onClick={() => handleShare('instagram')}
                >
                  <InstagramIcon />
                  Instagram Chat
                </button>
              </div>
            )}
          </div>

          <Link to="/discover" className="add-media-btn">
            <AddIcon /> Add Media
          </Link>
        </div>
      </div>

      <div className="Watchlist-content">
        {Object.keys(groupedItems).length === 0 ? (
          <div className="empty-list">
            <h2>No items found</h2>
            <p>Start building your Watchlist by discovering new content</p>
            <Link to="/discover" className="discover-btn">Discover Media</Link>
          </div>
        ) : (
          <>
            {/* Folder Tabs */}
            <div className="folder-tabs">
              {Object.keys(groupedItems).map(mediaType => (
                <div 
                  key={mediaType} 
                  className={`folder-tab ${activeTab === mediaType ? 'active' : ''}`}
                  onClick={() => handleTabChange(mediaType)}
                >
                  <div className="folder-icon">
                    {getMediaTypeIcon(mediaType)}
                  </div>
                  <h3 className="folder-title">{mediaType}</h3>
                  <span className="folder-count">({groupedItems[mediaType].length})</span>
                  
                  {/* Delete button for custom folders */}
                  {!defaultMediaTypes.includes(mediaType) && (
                    <button
                      className="delete-folder-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(mediaType);
                      }}
                      title="Delete folder"
                    >
                      <DeleteIcon />
                    </button>
                  )}
                </div>
              ))}
              
              {/* Create New Folder Button */}
              <div 
                className="folder-tab create-folder-tab"
                onClick={() => setIsCreatingFolder(true)}
              >
                <div className="folder-icon">
                  <CreateNewFolderIcon />
                </div>
                <h3 className="folder-title">New Folder</h3>
              </div>
            </div>

            {/* Create Folder Modal */}
            {isCreatingFolder && (
              <div className="create-folder-modal-overlay">
                <div className="create-folder-modal">
                  <div className="modal-header">
                    <h3>Create New Folder</h3>
                    <button 
                      className="close-btn"
                      onClick={() => {
                        setIsCreatingFolder(false);
                        setNewFolderName('');
                      }}
                    >
                      <CancelIcon />
                    </button>
                  </div>
                  
                  <div className="modal-content">
                    <input
                      type="text"
                      placeholder="Enter folder name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                      autoFocus
                    />
                  </div>
                  
                  <div className="modal-actions">
                    <button 
                      className="cancel-btn"
                      onClick={() => {
                        setIsCreatingFolder(false);
                        setNewFolderName('');
                      }}
                    >
                      <CancelIcon /> Cancel
                    </button>
                    <button 
                      className="create-btn"
                      onClick={handleCreateFolder}
                    >
                      <SaveIcon /> Create Folder
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Active Tab Content */}
            {groupedItems[activeTab] && (
              <div className="tab-content">
                <div className="media-grid">
                  {groupedItems[activeTab].map(item => (
                    <div key={item.id} className="media-card">                      <div 
                        className="media-image" 
                        style={{ 
                          backgroundImage: `url(${item.poster || item.image || 'https://via.placeholder.com/300x450?text=No+Image'})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        {/* Status badge always visible */}
                        <div className="status-badge">
                          <span className={`status-label status-${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {item.status}
                          </span>
                        </div>
                        
                        <div className="media-overlay">
                          <div className="overlay-bottom">
                            <div className="media-rating">
                              {Array.from({ length: 5 }, (_, i) => (
                                <StarIcon 
                                  key={i}
                                  className={item.rating && i < Math.round(item.rating / 2) ? 'star filled' : 'star'}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>                        <div className="media-info">
                        <h3 className="media-title">{item.title}</h3>
                        <div className="media-meta">                          <span className="media-progress">
                            {typeof item.progress === 'object' && item.progress 
                              ? `${item.progress.current || 0}/${item.progress.total || 0}` 
                              : typeof item.progress === 'string' ? item.progress : 'Not Started'}
                          </span>
                          <span className="rating-value">
                            {item.rating ? `${parseFloat(item.rating).toFixed(1)}/10` : 'Not Rated'}
                          </span>
                        </div>
                        <div className="media-updated">
                          Last updated: {new Date(item.lastUpdated).toLocaleDateString()}
                        </div>
                        
                        {/* Action buttons moved to media-info section */}                        <div className="media-actions">
                          {item.status !== 'Completed' && (                            <button 
                              className="action-btn complete-btn" 
                              title="Mark as Complete"
                              onClick={() => handleMarkComplete(item._id)}
                            >
                              <CheckCircleIcon />
                            </button>
                          )}
                          
                          {(item.status === 'Plan to Watch' || item.status === 'Plan to Play' || item.status === 'On Hold') && (
                            <button 
                              className="action-btn play-btn" 
                              title="Start Watching/Playing"
                              onClick={() => handleMarkWatching(item._id)}
                            >
                              <PlayArrowIcon />
                            </button>
                          )}
                          
                          <button 
                            className="action-btn edit-btn" 
                            title="Edit"
                            onClick={() => handleEdit(item)}
                          >
                            <EditIcon />
                          </button>
                          
                          {/* Show different delete buttons based on folder type */}
                          {defaultMediaTypes.includes(activeTab) ? (
                            <button 
                              className="action-btn delete-btn" 
                              title="Remove from Watchlist"
                              onClick={() => handleDelete(item._id)}
                            >
                              <DeleteIcon />
                            </button>
                          ) : (
                            <button 
                              className="action-btn delete-btn" 
                              title="Remove from Folder"
                              onClick={() => handleRemoveFromFolder(item._id)}
                            >
                              <DeleteIcon />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="edit-modal-header">
              <h3>Edit: {editingItem.title}</h3>
              <button className="close-btn" onClick={handleEditCancel}>×</button>
            </div>
            
            <div className="edit-modal-content">
              <div className="form-group">
                <label>Status</label>
                <select 
                  value={editForm.status} 
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  className="status-select"
                >                  {editingItem.type === 'Games' ? (
                    <>
                      <option value="Plan to Play">Plan to Play</option>
                      <option value="Playing">Playing</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Dropped">Dropped</option>
                    </>
                  ) : (
                    <>
                      <option value="Plan to Watch">Plan to Watch</option>
                      <option value="Watching">Watching</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Dropped">Dropped</option>
                    </>
                  )}
                </select>
              </div>

              {editForm.status === 'Completed' && (
                <div className="form-group">
                  <label>Rating</label>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(star => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${star <= editForm.rating ? 'filled' : ''}`}
                        onClick={() => handleStarClick(star)}
                      >
                        <StarIcon />
                      </button>
                    ))}
                  </div>
                  <span className="rating-text">{editForm.rating ? `${parseFloat(editForm.rating).toFixed(1)}/10` : '0/10'}</span>
                </div>
              )}

              {editForm.status !== 'Completed' && editForm.status !== 'Plan to Watch' && editForm.status !== 'Plan to Play' && editForm.status !== 'Dropped' && (
                <div className="form-group">
                  <label>Progress</label>
                  <input
                    type="text" 
                    value={editForm.progress}
                    onChange={(e) => setEditForm(prev => ({ ...prev, progress: e.target.value }))}
                    placeholder="e.g., 15/26 episodes"
                    className="progress-input"
                  />
                </div>
              )}
            </div>

            <div className="edit-modal-actions">
              <button className="cancel-btn" onClick={handleEditCancel}>Cancel</button>
              <button className="save-btn" onClick={handleEditSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}