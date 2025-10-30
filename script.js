const searchInput = document.getElementById("searchInput");
const results = document.getElementById("results");
const loader = document.getElementById("loader");
const noResults = document.getElementById("noResults");
const filterContainer = document.getElementById("filterContainer");
const searchIcon = document.querySelector(".search-icon");
const micBtn = document.getElementById("mic");
const installBtn = document.getElementById("installBtn");

let currentResults = [];
let activeFilters = new Set();
let deferredPrompt = null;

// ---------- MODAL ----------
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modal-img");
const caption = document.getElementById("caption");
const closeModal = document.querySelector(".close");

// ---------- BUSCAR ANIMES ----------
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

    // 🔔 Notificação persistente sempre que houver resultados
    showPersistentNotification(`Encontrados ${currentResults.length} animes!`, "Confira os resultados da sua busca!");

  } catch (error) {
    loader.classList.add("hidden");
    noResults.classList.remove("hidden");
    noResults.textContent = "Erro ao carregar animes";
    console.error(error);
  }
}

// ---------- EXIBIÇÃO DE RESULTADOS ----------
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

// ---------- CRIAR FILTROS ----------
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

// ---------- EVENTOS DE BUSCA ----------
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

// ---------- MODAL ----------
closeModal.onclick = () => { modal.style.display = "none"; };
window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

// ---------- MICROFONE ----------
if (micBtn) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    micBtn.style.display = "none";
    console.warn("Reconhecimento de voz não suportado neste navegador.");
  } else {
    let recognition = null;
    let listening = false;

    micBtn.addEventListener("click", () => {
      if (!recognition) {
        recognition = new SpeechRecognition();
        recognition.lang = "pt-BR";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => { listening = true; micBtn.classList.add("listening"); };
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          searchInput.value = transcript;
          const query = searchInput.value.trim();
          if (query) fetchAnime(query);
        };
        recognition.onerror = (event) => console.error("Erro no reconhecimento de voz:", event.error);
        recognition.onend = () => { listening = false; micBtn.classList.remove("listening"); };
      }

      if (!listening) recognition.start();
      else recognition.stop();
    });
  }
}

// ---------- PWA INSTALL ----------
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = "block";
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log("Instalação:", outcome);
  deferredPrompt = null;
  installBtn.style.display = "none";
});

// ---------- SERVICE WORKER REGISTRATION ----------
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js")
      .then(() => console.log("✅ Service Worker registrado!"))
      .catch(err => console.error("❌ Erro ao registrar SW:", err));
  });
}

// ---------- FUNÇÃO DE NOTIFICAÇÃO PERSISTENTE ----------
function showPersistentNotification(title, body) {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

  Notification.requestPermission().then(permission => {
    if (permission === "granted") {
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          reg.showNotification(title, {
            body: body,
            icon: "assets/ichigo.jpg",
            vibrate: [100, 50, 100]
          });
        }
      });
    }
  });
}
