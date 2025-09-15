const searchInput = document.getElementById("searchInput");
const results = document.getElementById("results");
const loader = document.getElementById("loader");
const noResults = document.getElementById("noResults");
const filterContainer = document.getElementById("filterContainer");
const searchIcon = document.querySelector(".search-icon");

let currentResults = [];
let activeFilters = new Set();

// Modal
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modal-img");
const caption = document.getElementById("caption");
const closeModal = document.querySelector(".close");

// Buscar animes
async function fetchAnime(query) {
  results.innerHTML = "";
  filterContainer.innerHTML = "";
  activeFilters.clear();
  noResults.classList.add("hidden");
  loader.classList.remove("hidden");
  currentResults = [];

  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${query}&limit=20`);
    const data = await res.json();
    loader.classList.add("hidden");

    if (!data.data || data.data.length === 0) {
      noResults.classList.remove("hidden");
      noResults.textContent = "Nenhum anime encontrado";
      return;
    }

    currentResults = data.data;
    displayResults(currentResults);
    createTypeFilters(currentResults);
  } catch (error) {
    loader.classList.add("hidden");
    noResults.classList.remove("hidden");
    noResults.textContent = "Erro ao carregar animes";
    console.error(error);
  }
}

// filtros
function displayResults(animeList) {
  results.innerHTML = "";
  let filtered = animeList;

  if (activeFilters.size > 0) {
    filtered = animeList.filter(a => activeFilters.has(a.type));
  }

  if (filtered.length === 0) {
    noResults.classList.remove("hidden");
    noResults.textContent = "Nenhum anime encontrado";
    return;
  } else {
    noResults.classList.add("hidden");
  }

  filtered.forEach(anime => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <img src="${anime.images.jpg.image_url}" alt="${anime.title}">
      <div class="card-info">
        <h2>${anime.title}</h2>
        <p>📺 Episódios: ${anime.episodes || "N/A"}</p>
        <p>⭐ Nota: ${anime.score || "N/A"}</p>
        <p>📅 Ano: ${anime.year || "?"}</p>
      </div>
    `;

    card.onclick = () => {
      modal.style.display = "block";
      modalImg.src = anime.images.jpg.image_url;
      caption.textContent = anime.title;
    };

    results.appendChild(card);
  });
}

// Criar filtros
function createTypeFilters(animeList) {
  const allowedTypes = ["TV", "Movie", "OVA"];
  const types = [...new Set(animeList.map(a => a.type).filter(t => allowedTypes.includes(t)))];

  filterContainer.innerHTML = "";
  filterContainer.classList.remove("hidden");

  types.forEach(type => {
    const btn = document.createElement("div");
    btn.classList.add("filter-btn");
    btn.textContent = type;

    btn.onclick = () => {
      if (activeFilters.has(type)) {
        activeFilters.delete(type);
        btn.classList.remove("selected");
        btn.textContent = type;
      } else {
        activeFilters.add(type);
        btn.classList.add("selected");
        btn.textContent = type + " ×";
      }
      displayResults(currentResults);
    };

    filterContainer.appendChild(btn);
  });
}

// Eventos
searchIcon.addEventListener("click", () => {
  const query = searchInput.value.trim();
  if (query) fetchAnime(query);
});

searchInput.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    const query = searchInput.value.trim();
    if (query) fetchAnime(query);
  }
});

// Fechar modal
closeModal.onclick = () => {
  modal.style.display = "none";
};

window.onclick = e => {
  if (e.target === modal) modal.style.display = "none";
};
