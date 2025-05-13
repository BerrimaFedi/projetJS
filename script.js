// Met à jour l'heure et la date affichées
function updateClock() {
    const now = new Date();

    // Formatage de l'heure en format 24h
    const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    // Formatage de la date en format britannique (jour/mois/année)
    const dateString = now.toLocaleDateString('en-GB');

    // Affichage dans les éléments HTML
    document.getElementById('time').textContent = timeString;
    document.getElementById('date').textContent = dateString;
}

updateClock(); // Affiche immédiatement l'heure
setInterval(updateClock, 1000); // Met à jour toutes les secondes

// Initialisation de la carte Leaflet centrée sur [20, 0] avec un zoom de 2
const map = L.map('map').setView([20, 0], 2);

// Chargement de la couche de tuiles Carto Voyager
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
}).addTo(map);

// Récupération des éléments HTML utilisés dans l'application
const elements = {
    memoriesList: document.getElementById('memories-list'),
    locationType: document.getElementById('location-type'),
    addMemoryBtn: document.getElementById('add-memory-btn'),
    memoryModal: document.getElementById('memory-modal'),
    locationNameModal: document.getElementById('location-name-modal'),
    locationNameInput: document.getElementById('location-name-input'),
    locationTypeLabel: document.getElementById('location-type-label'),
    saveLocationBtn: document.getElementById('save-location-btn'),
    memoryLocation: document.getElementById('memory-location'),
    memoryDate: document.getElementById('memory-date'),
    memoryPhoto: document.getElementById('memory-photo'),
    memoryNotes: document.getElementById('memory-notes'),
    saveMemoryBtn: document.getElementById('save-memory-btn'),
    closeButtons: document.querySelectorAll('.close'),
    stats: {
        country: document.getElementById('country-count'),
        city: document.getElementById('city-count'),
        memory: document.getElementById('memory-count')
    }
};

// Chargement des souvenirs depuis le localStorage ou tableau vide
let memories = JSON.parse(localStorage.getItem('travelMemories')) || [];
let currentLocation = null; // Stocke temporairement l’emplacement sélectionné

// Écouteurs d’événement pour les boutons
elements.addMemoryBtn.addEventListener('click', openMemoryModal);
elements.saveLocationBtn.addEventListener('click', saveLocationName);
elements.saveMemoryBtn.addEventListener('click', saveMemory);
elements.closeButtons.forEach(btn => {
    btn.addEventListener('click', closeAllModals);
});

// Gestion du clic sur la carte
map.on('click', function(e) {
    // Sauvegarde de la position et du type de lieu sélectionné
    currentLocation = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        type: elements.locationType.value
    };
    
    // Affichage du type et ouverture du modal de nom du lieu
    elements.locationTypeLabel.textContent = currentLocation.type;
    elements.locationNameInput.value = '';
    elements.locationNameModal.style.display = 'block';
});

// Sauvegarde du nom de l'emplacement sélectionné
function saveLocationName() {
    const locationName = elements.locationNameInput.value.trim();
    if (!locationName) return;

    // Ajout du nom au currentLocation et affichage du formulaire de souvenir
    currentLocation.name = locationName;
    elements.locationNameModal.style.display = 'none';
    elements.memoryLocation.value = locationName;
    elements.memoryModal.style.display = 'block';
}

// Ouvre le formulaire pour ajouter un souvenir
function openMemoryModal() {
    if (!currentLocation) {
        alert('Please select a location on the map first');
        return;
    }
    elements.memoryDate.value = new Date().toISOString().split('T')[0]; // Date du jour
    elements.memoryModal.style.display = 'block';
}

// Sauvegarde d’un souvenir
function saveMemory() {
    const memory = {
        id: Date.now(), // Identifiant unique
        location: currentLocation,
        date: elements.memoryDate.value,
        notes: elements.memoryNotes.value,
        photo: elements.memoryPhoto.value
    };

    // Ajout au tableau et enregistrement dans le localStorage
    memories.push(memory);
    localStorage.setItem('travelMemories', JSON.stringify(memories));

    renderMemories(); // Réaffiche les souvenirs
    updateStats(); // Met à jour les statistiques
    closeAllModals(); // Ferme les modals
}

// Affiche tous les souvenirs enregistrés
function renderMemories() {
    elements.memoriesList.innerHTML = '';

    // Si aucun souvenir, afficher un message
    if (memories.length === 0) {
        elements.memoriesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-compass"></i>
                <p>No memories yet. Start by clicking on the map!</p>
            </div>
        `;
        return;
    }

    // Tri des souvenirs par date décroissante
    memories.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(memory => {
        const memoryCard = document.createElement('div');
        memoryCard.className = 'memory-card';

        // Ajout de la photo si disponible
        const photoHTML = memory.photo ? `<img src="${memory.photo}" class="memory-photo">` : '';
        const icon = memory.location.type === 'country' ? 'fa-globe-americas' : 'fa-city';

        // Contenu HTML de la carte souvenir
        memoryCard.innerHTML = `
            <h3><i class="fas ${icon}"></i> ${memory.location.name}</h3>
            <div class="memory-date">${new Date(memory.date).toLocaleDateString()}</div>
            <div class="memory-notes">${memory.notes}</div>
            ${photoHTML}
        `;

        elements.memoriesList.appendChild(memoryCard);

        // Marqueur sur la carte avec popup
        if (memory.location.lat && memory.location.lng) {
            const marker = L.marker([memory.location.lat, memory.location.lng]).addTo(map);
            marker.bindPopup(`
                <h3>${memory.location.name}</h3>
                <div>${memory.date}</div>
                ${memory.notes.substring(0, 50)}...
            `);
        }
    });
}

// Met à jour les statistiques de pays, villes et souvenirs
function updateStats() {
    const countries = new Set();
    const cities = new Set();

    memories.forEach(memory => {
        memory.location.type === 'country' 
            ? countries.add(memory.location.name) 
            : cities.add(memory.location.name);
    });

    elements.stats.country.textContent = countries.size;
    elements.stats.city.textContent = cities.size;
    elements.stats.memory.textContent = memories.length;
}

// Ferme tous les modals ouverts
function closeAllModals() {
    elements.memoryModal.style.display = 'none';
    elements.locationNameModal.style.display = 'none';
}

// Initialisation : affiche les souvenirs et les stats au chargement
renderMemories();
updateStats();
