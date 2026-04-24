// ======================
// API Configuration
// ======================
const API_KEY = "330f50bce922dedb5512f27b88ddeed4";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/original";

// ======================
// Global Variables
// ======================
let currentItem;
let bannerInterval;
let trendingMovies = [];

// ======================
// API Fetch Functions
// ======================
async function fetchTrending(type) {
  const res = await fetch(
    `${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`
  );
  const data = await res.json();
  return data.results;
}

async function fetchTrendingAnime() {
  let allResults = [];
  for (let page = 1; page <= 6; page++) {
    const res = await fetch(
      `${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`
    );
    const data = await res.json();
    const filtered = data.results.filter(
      (item) => item.original_language === "ja" && item.genre_ids.includes(16)
    );
    allResults = allResults.concat(filtered);
  }
  return allResults;
}

async function fetchFilipinoMovies() {
  const res = await fetch(
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=tl&sort_by=popularity.desc`
  );
  const data = await res.json();
  return data.results;
}
async function fetchKoreanDramas() {
  const res = await fetch(
    `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_original_language=ko&sort_by=popularity.desc`
  );
  const data = await res.json();
  return data.results;
}
// ======================
// Banner Functions
// ======================
function displayBanner(item) {
  document.getElementById(
    "banner"
  ).style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
  document.getElementById("banner-title").textContent = item.title || item.name;
  document.getElementById("banner-description").textContent = item.overview || "No description available";
}

function startBannerRotation(movies) {
  // Clear any existing interval
  if (bannerInterval) clearInterval(bannerInterval);

  // Display first movie immediately
  displayBanner(movies[0]);

  // Start rotating through movies
  let currentIndex = 1;
  bannerInterval = setInterval(() => {
    displayBanner(movies[currentIndex]);
    currentIndex = (currentIndex + 1) % movies.length;
  }, 8000); // Change every 8 seconds
}

// ======================
// Display Functions
// ======================
function displayList(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  items.forEach((item) => {
    const movieContainer = document.createElement("div");
    movieContainer.className = "movie-item";

    const img = document.createElement("img");
    img.src = item.poster_path
      ? `${IMG_URL}${item.poster_path}`
      : "images/placeholder.jpg";
    img.alt = item.title || item.name;

    const infoContainer = document.createElement("div");
    infoContainer.className = "movie-info";

    const title = document.createElement("div");
    title.className = "movie-title";
    title.textContent = item.title || item.name;

    const year = document.createElement("div");
    year.className = "movie-year";
    const date = item.release_date || item.first_air_date;
    year.textContent = date ? date.split("-")[0] : "N/A";

    infoContainer.appendChild(title);
    infoContainer.appendChild(year);
    movieContainer.appendChild(img);
    movieContainer.appendChild(infoContainer);
    movieContainer.onclick = () => showDetails(item);

    container.appendChild(movieContainer);
  });
}

// ======================
// Modal Functions
// ======================
function showDetails(item) {
  currentItem = item;
  document.getElementById("modal-title").textContent = item.title || item.name;
  document.getElementById("modal-description").textContent = item.overview;
  document.getElementById("modal-image").src = `${IMG_URL}${item.poster_path}`;
  const rating = item.vote_average.toFixed(1);
  document.getElementById("modal-rating").innerHTML = `
    <span style="font-weight: bold; color: white;">IMDb:</span> ${rating}/10
  `;
  
  const serverSelector = document.querySelector('.server-selector');
  if (!document.getElementById('stream-error-message')) {
    const errorMessage = document.createElement('p');
    errorMessage.id = 'stream-error-message';
    errorMessage.style.color = 'white';
    errorMessage.style.marginBottom = '15px';
    errorMessage.style.fontSize = '16px';
    errorMessage.innerHTML = 'If you get any error message when trying to stream, please <strong>Refresh</strong> the page or <strong>Switch</strong> to another streaming server below.';
    serverSelector.parentNode.insertBefore(errorMessage, serverSelector);
  }
  
  changeServer();
  document.getElementById("modal").style.display = "flex";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
  document.getElementById("modal-video").src = "";
}

// ======================
// Video Server Functions
// ======================
function changeServer() {
  const server = document.getElementById("server").value;
  const type = currentItem.media_type === "movie" ? "movie" : "tv";
  let embedURL = "";

  const serverUrls = {
    "vidsrc.cc": `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`,
    "vidsrc.me": `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`,
    "player.videasy.net": `https://player.videasy.net/${type}/${currentItem.id}`,
    multiembed: `https://multiembed.mov/?video_id=${currentItem.id}&tmdb=1&media_type=${type}`,
    "2embed": `https://www.2embed.cc/embed/${currentItem.id}`,
    smashystream: `https://embed.smashystream.com/playere.php?tmdb=${currentItem.id}&type=${type}`,
    superembed: `https://moviesapi.club/${type}/${currentItem.id}`,
    "movie-web": `https://movie-web.app/media/tmdb-${type}-${currentItem.id}`,
    sflix: `https://sflix.to/${type}/${currentItem.id}`,
    "korean-server": `https://asianembed.io/${type}/${currentItem.id}` // Added Korean server
  };


  embedURL = serverUrls[server] || serverUrls["vidsrc.cc"]; // Default fallback
  document.getElementById("modal-video").src = embedURL;
}

// ======================
// Search Functions
// ======================
function openSearchModal() {
  document.getElementById("search-modal").style.display = "flex";
  document.getElementById("search-input").focus();
}

function closeSearchModal() {
  document.getElementById("search-modal").style.display = "none";
  document.getElementById("search-results").innerHTML = "";
}

async function searchTMDB() {
  const query = document.getElementById("search-input").value;
  if (!query.trim()) {
    document.getElementById("search-results").innerHTML = "";
    return;
  }

  const res = await fetch(
    `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`
  );
  const data = await res.json();

  const container = document.getElementById("search-results");
  container.innerHTML = "";
  data.results.forEach((item) => {
    if (!item.poster_path) return;

    const resultItem = document.createElement("div");
    resultItem.className = "search-result-item";

    const img = document.createElement("img");
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.onclick = () => {
      closeSearchModal();
      showDetails(item);
    };

    const title = document.createElement("p");
    title.textContent = item.title || item.name;
    title.className = "search-result-title";

    resultItem.appendChild(img);
    resultItem.appendChild(title);
    container.appendChild(resultItem);
  });
}

// ======================
// Initialization
// ======================
async function init() {
  try {
    trendingMovies = await fetchTrending("movie");
    const tvShows = await fetchTrending("tv");
    const anime = await fetchTrendingAnime();
    const filipinoMovies = await fetchFilipinoMovies();
    const koreanDramas = await fetchKoreanDramas(); // New line

    startBannerRotation(trendingMovies);

    displayList(trendingMovies, "movies-list");
    displayList(tvShows, "tvshows-list");
    displayList(anime, "anime-list");
    displayList(filipinoMovies, "tagalog-list");
    displayList(koreanDramas, "korean-list"); // New line
  } catch (error) {
    console.error("Error initializing app:", error);
  }
}
// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", init);
// Disable Right Click and Developer Tools
// ======================
document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
});

document.addEventListener('keydown', function(e) {
  // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
  if (e.key === 'F12' || 
      (e.ctrlKey && e.shiftKey && e.key === 'I') || 
      (e.ctrlKey && e.shiftKey && e.key === 'J') || 
      (e.ctrlKey && e.key === 'U')) {
    e.preventDefault();
  }
});

// Additional protection against console opening
(function() {
  var blocker = function(e) {
    e.stopPropagation();
    e.preventDefault();
    return false;
  };
  
  // Prevent opening console by right-click inspect
  document.addEventListener('contextmenu', blocker, true);
  
  // Prevent keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') || 
        (e.ctrlKey && e.shiftKey && e.key === 'J') || 
        (e.ctrlKey && e.key === 'U')) {
      blocker(e);
    }
  }, true);
})();
