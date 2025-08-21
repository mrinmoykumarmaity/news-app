// API Configuration
const API_KEY = '78ace3e16c29464981060bfaf3e9ff5b'; // Replace with your NewsAPI key
const BASE_URL = 'https://newsapi.org/v2';

// DOM Elements
const newsContainer = document.getElementById('newsContainer');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const loading = document.getElementById('loading');
const errorElement = document.getElementById('error');
const errorText = document.getElementById('errorText');
const navButtons = document.querySelectorAll('.nav-btn');

// Application State
let currentCategory = '';
let currentQuery = '';
let articles = [];

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    fetchNews(); // Load initial news
});

// Event Listeners Setup
function setupEventListeners() {
    // Search functionality
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Category navigation
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active button
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update category and fetch news
            currentCategory = this.dataset.category;
            currentQuery = ''; // Clear search when changing category
            searchInput.value = '';
            fetchNews();
        });
    });

    // Clear search when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-box') && !e.target.closest('#searchBtn')) {
            // Optional: You can add any cleanup logic here
        }
    });
}

// Search Handler
function handleSearch() {
    const query = searchInput.value.trim();
    if (query) {
        currentQuery = query;
        currentCategory = ''; // Clear category when searching
        updateActiveNavButton('');
        fetchNews();
    }
}

// Update Active Navigation Button
function updateActiveNavButton(category) {
    navButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
}

// Fetch News Function
async function fetchNews() {
    showLoading(true);
    hideError();

    try {
        let url;
        
        if (currentQuery) {
            // Search for specific query
            url = `${BASE_URL}/everything?q=${encodeURIComponent(currentQuery)}&apiKey=${API_KEY}&language=en&sortBy=publishedAt&pageSize=20`;
        } else if (currentCategory) {
            // Fetch by category
            url = `${BASE_URL}/top-headlines?category=${currentCategory}&apiKey=${API_KEY}&language=en&country=us&pageSize=20`;
        } else {
            // Fetch general top headlines
            url = `${BASE_URL}/top-headlines?apiKey=${API_KEY}&language=en&country=us&pageSize=20`;
        }

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'error') {
            throw new Error(data.message || 'Failed to fetch news');
        }

        articles = data.articles || [];
        displayNews(articles);
        
    } catch (error) {
        console.error('Error fetching news:', error);
        showError(getErrorMessage(error));
    } finally {
        showLoading(false);
    }
}

// Display News Function
function displayNews(articles) {
    if (!articles || articles.length === 0) {
        showNoResults();
        return;
    }

    const newsHTML = articles.map(article => createNewsCard(article)).join('');
    newsContainer.innerHTML = newsHTML;
    
    // Add fade-in animation
    newsContainer.classList.add('fade-in');
    
    // Add click handlers to news cards
    addNewsCardListeners();
}

// Create News Card HTML
function createNewsCard(article) {
    const {
        title,
        description,
        urlToImage,
        publishedAt,
        source,
        url,
        author
    } = article;

    // Format date
    const date = new Date(publishedAt);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Handle missing image
    const imageUrl = urlToImage && urlToImage !== 'null' 
        ? urlToImage 
        : 'https://via.placeholder.com/400x200/667eea/ffffff?text=News+Image';

    // Truncate title and description
    const truncatedTitle = title ? truncateText(title, 100) : 'No title available';
    const truncatedDescription = description ? truncateText(description, 150) : 'No description available';

    return `
        <article class="news-card" data-url="${url}">
            <img src="${imageUrl}" alt="${truncatedTitle}" loading="lazy" onerror="handleImageError(this)">
            <div class="card-content">
                <span class="news-source">${source.name || 'Unknown Source'}</span>
                <h2 class="news-title">${truncatedTitle}</h2>
                <p class="news-description">${truncatedDescription}</p>
                <div class="news-meta">
                    <span class="news-date">
                        <i class="far fa-calendar"></i>
                        ${formattedDate}
                    </span>
                    <a href="#" class="read-more">
                        Read More <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        </article>
    `;
}

// Add Event Listeners to News Cards
function addNewsCardListeners() {
    const newsCards = document.querySelectorAll('.news-card');
    newsCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            const url = this.dataset.url;
            if (url && url !== 'null') {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        });
    });
}

// Utility Functions
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function handleImageError(img) {
    img.src = 'https://via.placeholder.com/400x200/667eea/ffffff?text=Image+Not+Available';
}

function showLoading(show) {
    loading.classList.toggle('hidden', !show);
}

function hideError() {
    errorElement.classList.add('hidden');
}

function showError(message) {
    errorText.textContent = message;
    errorElement.classList.remove('hidden');
}

function showNoResults() {
    newsContainer.innerHTML = `
        <div class="no-results">
            <i class="fas fa-search"></i>
            <h3>No articles found</h3>
            <p>Try searching for different keywords or browse different categories.</p>
        </div>
    `;
}

function getErrorMessage(error) {
    if (error.message.includes('429')) {
        return 'API rate limit exceeded. Please try again later.';
    } else if (error.message.includes('401')) {
        return 'Invalid API key. Please check your configuration.';
    } else if (error.message.includes('Failed to fetch')) {
        return 'Network error. Please check your internet connection.';
    } else {
        return error.message || 'An unexpected error occurred. Please try again.';
    }
}

// Performance Optimization: Debounce Search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optional: Add debounced search for better performance
const debouncedSearch = debounce(handleSearch, 300);

// Replace the immediate search with debounced version for keyup events
searchInput.addEventListener('keyup', function(e) {
    if (e.key !== 'Enter' && this.value.length > 2) {
        debouncedSearch();
    }
});

// Local Storage for Preferences (Optional Enhancement)
function savePreferences() {
    const preferences = {
        lastCategory: currentCategory,
        lastQuery: currentQuery
    };
    localStorage.setItem('newsAppPreferences', JSON.stringify(preferences));
}

function loadPreferences() {
    const saved = localStorage.getItem('newsAppPreferences');
    if (saved) {
        const preferences = JSON.parse(saved);
        currentCategory = preferences.lastCategory || '';
        currentQuery = preferences.lastQuery || '';
        
        if (currentQuery) {
            searchInput.value = currentQuery;
        }
        
        updateActiveNavButton(currentCategory);
    }
}

// Save preferences when changing categories or searching
navButtons.forEach(button => {
    button.addEventListener('click', savePreferences);
});

searchBtn.addEventListener('click', savePreferences);