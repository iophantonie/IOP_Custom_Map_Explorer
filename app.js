let allCreatureData = {};
let allResourceData = {};
let allPublicSpotsData = {};
let allCaveSpotsData = {};
let allInfoBadgeData = {};
let allObeliskData = {};
let allRegionData = {};
let allPlayerSpawnData = {};
let allExplorerNotesData = [];
let mapConfigs = {};
let currentMapConfig = {};
let highlightedSpotId = null;
let hoveredSpotId = null;
let highlightedCaveSpotId = null;
let hoveredCaveSpotId = null;
let highlightedObeliskId = null;
let hoveredObeliskId = null;
let highlightedZone = null;
let obeliskIcons = {};
let spotIcons = {};
let caveSpotIcons = {};
let resourceIcons = {};
let regionImages = {};
let noteIcon = null;
let resourceTranslations = {};
let creatureTranslations = {};
let infoBadgeTranslations = {};
let alphaVariantConfigs = {};
let globalItemDatabase = {};
let spawnZoneBlocklistData = {};
let spawnSharingConfig = {};
let spawnRarityConfig = {};
let difficultyConfig = {
    "Leicht": { "borderColor": "#22c55e", "bgColor": "rgba(34, 197, 94, 0.2)", "textColor": "#4ade80" },
    "Mittel": { "borderColor": "#eab308", "bgColor": "rgba(234, 179, 8, 0.2)", "textColor": "#facc15" },
    "Schwer": { "borderColor": "#ef4444", "bgColor": "rgba(239, 68, 68, 0.2)", "textColor": "#fca5a5" },
    "Extrem": { "borderColor": "#a21caf", "bgColor": "rgba(162, 28, 175, 0.2)", "textColor": "#e879f9" }
};
let badgeConfig = {};
let blueprintQualityConfig = {};
let pulseAnimationId = null;
let notePulseAnimationId = null;
let highlightPulseAnimationId = null;

let scale = 1;
let panOffset = { x: 0, y: 0 };
let isPanning = false;
let panStart = { x: 0, y: 0 };
const maxScale = 8;
const minScale = 1;
let mapCanvas, mapCtx;
let currentMapKey = 'TheIsland';


const MAP_LAT_MIN = 0; const MAP_LAT_MAX = 100;
const MAP_LON_MIN = 0; const MAP_LON_MAX = 100;
const MAP_LAT_RANGE = MAP_LAT_MAX - MAP_LAT_MIN;
const MAP_LON_RANGE = MAP_LON_MAX - MAP_LON_MIN;

const SPOT_LAT_MIN = 0; const SPOT_LAT_MAX = 100;
const SPOT_LON_MIN = 0; const SPOT_LON_MAX = 100;
const SPOT_LAT_RANGE = SPOT_LAT_MAX - SPOT_LAT_MIN;
const SPOT_LON_RANGE = SPOT_LON_MAX - SPOT_LON_MIN;

const resourceConfig = {
    'Metal': { color: '#b87333' }, 'Crystal': { color: '#ADD8E6' },
    'Obsidian': { color: '#333333' }, 'Oil': { color: '#663399' },
    'Rich Metal': { color: '#DAA520' }, 'Silica Pearls': { color: '#F5F5DC' }
};

const obeliskConfig = {
    'Grüner Obelisk': { color: '#22c55e' },
    'Blauer Obelisk': { color: '#3b82f6' },
    'Roter Obelisk': { color: '#ef4444' }
};

const spawnGroupColors = ['#34D399', '#60A5FA', '#FBBF24', '#F87171', '#A78BFA', '#6EE7B7', '#93C5FD', '#FCD34D', '#FCA5A5', '#C4B5FD'];

let mapNameDisplay, creatureSelect, creatureSearch, mapImage, legendContainer,
    loadingIndicator, regionInfoContainer, resourceControls, iframeToggle, mapIframe,
    mapContainer, liveMapTogglePanel, publicSpotsSlider, spotsToggle, spotsToggleLabel,
    coordsDisplay, generalInfoPanel, caveSpotsCanvas, caveSpotsSlider,
    caveSpotsToggle, caveSpotsToggleLabel, spawnCanvas, resourceCanvas, obeliskCanvas,
    spotsCanvas, clickCanvas, regionCanvas, spawnCtx, resourceCtx, obeliskCtx, spotsCtx, caveSpotsCtx, clickCtx, regionCtx,
    playerSpawnCanvas, playerSpawnCtx,
    notesCanvas, notesCtx,
    tooltipElement, tooltipContentElement;

let cavePattern = null;

function hexToRgba(color, alpha) {
    const tempDiv = document.createElement("div");
    tempDiv.style.color = color;
    document.body.appendChild(tempDiv);
    
    const computedColor = window.getComputedStyle(tempDiv).color;
    document.body.removeChild(tempDiv);
    
    const rgb = computedColor.match(/\d+/g);
    if (rgb) {
        return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
    }
    
    return `rgba(128, 128, 128, ${alpha})`;
}


function getIconUrl(itemName) {
    const trimmedItem = itemName.trim();
    const dbEntry = globalItemDatabase[trimmedItem];
    if (dbEntry && dbEntry.iconUrl) {
        return dbEntry.iconUrl;
    }
    return 'https://placehold.co/32x32/333/FFF?text=?';
}

function populateMapList() {
    const mapList = document.getElementById('map-list');
    mapList.innerHTML = '';
    for (const key in mapConfigs) {
        const map = mapConfigs[key];
        if (map.activated) {
            const li = document.createElement('li');
            li.className = 'map-list-item';
            li.textContent = map.displayName;
            li.dataset.mapKey = key;

            li.addEventListener('click', () => {
                loadMapData(key);
            });
            mapList.appendChild(li);
        }
    }
}

function populateDropdown() {
    const placeholder = creatureSelect.querySelector('option[value=""]');
    creatureSelect.innerHTML = '';
    if (placeholder) {
        creatureSelect.appendChild(placeholder);
    }
    const creatureNames = Object.keys(allCreatureData);
    const translatedNames = creatureNames.map(name => ({
        english: name,
        german: creatureTranslations[name.trim()] || name.trim()
    }));

    translatedNames.sort((a, b) => a.german.localeCompare(b.german));

    translatedNames.forEach(creature => {
        const option = document.createElement('option');
        option.value = creature.english;
        option.textContent = creature.german;
        creatureSelect.appendChild(option);
    });
}

function populateInfoBadges() {
    const container = document.getElementById('info-badge-panel');
    const hr = document.getElementById('info-badge-hr');
    container.innerHTML = '';
    let finalHtml = '';

    const badges = allInfoBadgeData.infoBadges;
    const specialInfo = allInfoBadgeData.specialInfo;

    if (badges && Object.keys(badges).length > 0) {
        let badgesHtml = '<h3 class="text-lg font-bold text-fire-red mb-4">Karteninformationen</h3>';
        const order = ["Kartenart", "Bosse", "Besonderheiten", "Höhlen", "Artefakte", "Öffentliche Farmen & Fallen"];

        badgesHtml += '<div class="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-3">';
        order.forEach(key => {
            if (badges[key] && infoBadgeTranslations[key]) {
                const value = badges[key];
                const displayValue = Array.isArray(value) ? value.join(', ') : value;
                badgesHtml += `<div class="flex items-center text-sm">`;
                badgesHtml += `<span class="info-badge-category flex-shrink-0">${infoBadgeTranslations[key]}</span>`;
                badgesHtml += `<span class="text-white leading-tight">${displayValue}</span>`;
                badgesHtml += `</div>`;
            }
        });
        badgesHtml += '</div>';
        finalHtml += badgesHtml;
    }

    const hasSpecialInfo = specialInfo && (
        (specialInfo.Kategorie && Array.isArray(specialInfo.Liste) && specialInfo.Liste.length > 0) ||
        (Array.isArray(specialInfo.OnEachMap_Liste) && specialInfo.OnEachMap_Liste.length > 0)
    );

    if (finalHtml && hasSpecialInfo) {
        finalHtml += '<hr class="border-gray-700 my-6">';
    }

    if (specialInfo && specialInfo.Kategorie && Array.isArray(specialInfo.Liste) && specialInfo.Liste.length > 0) {
        if (specialInfo.Kategorie === 'S-Kreaturen:') {
            let specialInfoHtml = `<div class="text-center">`;
            specialInfoHtml += `<h3 class="text-lg font-bold text-sky-500 mb-4">S-Kreaturen Vorkommen</h3>`;
            specialInfoHtml += `<div class="flex items-center justify-center flex-wrap gap-2">`;
            
            specialInfo.Liste.forEach(kreatur => {
                specialInfoHtml += `<span class="special-info-category">${kreatur}</span>`;
            });

            specialInfoHtml += `</div></div>`;
            finalHtml += specialInfoHtml;
        } else {
            const listText = specialInfo.Liste.join(', ');
            let specialInfoHtml = `<div>`;
            specialInfoHtml += `<div class="flex items-center text-sm">`;
            specialInfoHtml += `<span class="special-info-category flex-shrink-0">${specialInfo.Kategorie}</span>`;
            specialInfoHtml += `<span class="text-white leading-tight">${listText}</span>`;
            specialInfoHtml += `</div></div>`;
            finalHtml += specialInfoHtml;
        }
    }
    
    if (specialInfo && Array.isArray(specialInfo.OnEachMap_Liste) && specialInfo.OnEachMap_Liste.length > 0) {
        const isFirstSpecialInfo = !(specialInfo.Kategorie && Array.isArray(specialInfo.Liste) && specialInfo.Liste.length > 0);
        const marginTopClass = isFirstSpecialInfo ? '' : 'mt-6';
        let onEachMapHtml = `<div class="${marginTopClass} text-center">`;
        onEachMapHtml += `<h4 class="text-md font-bold text-gray-300 mb-3">Auf jeder Karte:</h4>`;
        onEachMapHtml += `<div class="flex justify-center flex-wrap gap-2">`;
        specialInfo.OnEachMap_Liste.forEach(kreatur => {
            onEachMapHtml += `<span class="inline-block text-cyan-400 border border-cyan-400 rounded-md py-1 px-2 text-sm font-bold bg-cyan-400/10 whitespace-nowrap">${kreatur}</span>`;
        });
        onEachMapHtml += `</div></div>`;
        finalHtml += onEachMapHtml;
    }

    if (finalHtml) {
        container.innerHTML = finalHtml;
        container.style.display = 'block';
        hr.style.display = 'block';
    } else {
        container.style.display = 'none';
        hr.style.display = 'none';
    }
}

function populateGeneralInfo() {
    generalInfoPanel.innerHTML = '';
    const info = allInfoBadgeData.generalInfo;

    if (info && Array.isArray(info) && info.length > 0) {
        const infoContainer = document.createElement('div');
        infoContainer.className = 'text-center p-3 border border-amber-400 rounded-lg transition-shadow duration-300 hover:shadow-[0_0_15px_rgba(245,158,11,0.7)]';
        info.forEach(text => {
            const p = document.createElement('p');
            p.className = 'text-base text-gray-300';
            p.textContent = text;
            infoContainer.appendChild(p);
        });
        generalInfoPanel.appendChild(infoContainer);
    }
}

function updateSelectAllRegionsState() {
    const selectAllCheckbox = document.getElementById('select-all-regions');
    const regionCheckboxes = document.querySelectorAll('#region-controls input[type="checkbox"]');
    if (!selectAllCheckbox || regionCheckboxes.length === 0) return;
    const allChecked = ![...regionCheckboxes].some(cb => !cb.checked);
    selectAllCheckbox.checked = allChecked;
}

function populateRegionControls() {
    const controlsContainer = document.getElementById('region-controls');
    const sectionContainer = document.getElementById('region-section');
    controlsContainer.innerHTML = '';

    if (!allRegionData.regions || allRegionData.regions.length === 0) {
        sectionContainer.style.display = 'none';
        return;
    }
    sectionContainer.style.display = 'block';

    allRegionData.regions.forEach(region => {
        const label = document.createElement('label');
        label.className = 'flex items-center text-white cursor-pointer';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = region.id;
        checkbox.className = 'w-4 h-4 mr-2';
        checkbox.addEventListener('change', () => {
            drawRegions();
            updateSelectAllRegionsState();
        });

        const colorBox = document.createElement('div');
        colorBox.className = 'w-4 h-4 mr-2 rounded-sm';
        colorBox.style.backgroundColor = region.color || '#FFFFFF';

        const span = document.createElement('span');
        span.textContent = region.name;

        label.appendChild(checkbox);
        label.appendChild(colorBox);
        label.appendChild(span);
        controlsContainer.appendChild(label);
    });
    updateSelectAllRegionsState();
}

function populateExplorerNotesControls() {
    const sectionContainer = document.getElementById('notes-section');
    const controlsWrapper = document.getElementById('notes-controls-wrapper');
    const noDataMessage = document.getElementById('notes-no-data');
    const toggleCheckbox = document.getElementById('toggle-all-notes');

    sectionContainer.style.display = 'block';

    if (!allExplorerNotesData || allExplorerNotesData.length === 0) {
        controlsWrapper.style.display = 'none';
        noDataMessage.style.display = 'block';
    } else {
        controlsWrapper.style.display = 'block';
        noDataMessage.style.display = 'none';
        if(toggleCheckbox) toggleCheckbox.checked = false;
    }
}

function populatePlayerSpawnControls() {
    const sectionContainer = document.getElementById('player-spawn-section');
    const controlsWrapper = document.getElementById('player-spawns-controls-wrapper');
    const noDataMessage = document.getElementById('player-spawns-no-data');
    const toggleCheckbox = document.getElementById('toggle-all-player-spawns');

    if (!allPlayerSpawnData.spawnPoints || allPlayerSpawnData.spawnPoints.length === 0) {
        sectionContainer.style.display = 'block';
        controlsWrapper.style.display = 'none';
        noDataMessage.style.display = 'block';
        
        if (allPlayerSpawnData.error) {
            noDataMessage.textContent = allPlayerSpawnData.error;
            noDataMessage.classList.add('text-red-400');
        } else {
            noDataMessage.textContent = 'Keine Spieler-Spawn-Daten für diese Karte konfiguriert.';
            noDataMessage.classList.remove('text-red-400');
        }
        return;
    }

    sectionContainer.style.display = 'block';
    controlsWrapper.style.display = 'block';
    noDataMessage.style.display = 'none';
    noDataMessage.classList.remove('text-red-400');
    if(toggleCheckbox) toggleCheckbox.checked = false;
}

async function preloadRegionImages() {
    regionImages = {};
    if (!allRegionData.regions) return;
    const promises = allRegionData.regions.map(region => {
        return new Promise((resolve) => {
            if (!region.imageUrl) return resolve();
            const img = new Image();
            img.src = region.imageUrl;
            img.onload = () => {
                regionImages[region.id] = img;
                resolve();
            };
            img.onerror = () => resolve();
        });
    });
    await Promise.all(promises);
}

function drawExplorerNotes(pulseScale = 1.0) {
    const width = notesCanvas.width;
    const height = notesCanvas.height;
    notesCtx.clearRect(0, 0, width, height);
    const toggleCheckbox = document.getElementById('toggle-all-notes');

    if (!toggleCheckbox || !toggleCheckbox.checked || !allExplorerNotesData) return;

    notesCtx.save();
    notesCtx.translate(panOffset.x, panOffset.y);
    notesCtx.scale(scale, scale);

    allExplorerNotesData.forEach(note => {
        const x = ((note.lon - MAP_LON_MIN) / MAP_LON_RANGE) * width;
        const y = ((note.lat - MAP_LAT_MIN) / MAP_LAT_RANGE) * height;

        if (noteIcon && noteIcon.complete) {
            const baseSize = 24 / scale;
            const size = baseSize * pulseScale;
            notesCtx.drawImage(noteIcon, x - size / 2, y - size / 2, size, size);
        } else {
            const baseRadius = 5 / scale;
            const radius = baseRadius * pulseScale;
            notesCtx.beginPath();
            notesCtx.arc(x, y, radius, 0, 2 * Math.PI, false);
            notesCtx.fillStyle = '#ef4444';
            notesCtx.fill();
            notesCtx.strokeStyle = 'white';
            notesCtx.lineWidth = 1.5 / scale;
            notesCtx.stroke();
        }
    });

    notesCtx.restore();
}

function drawRegions() {
    const width = regionCanvas.width;
    const height = regionCanvas.height;
    regionCtx.clearRect(0, 0, width, height);
    const checkboxes = document.querySelectorAll('#region-controls input[type="checkbox"]:checked');
    if (checkboxes.length === 0) return;

    regionCtx.save();
    regionCtx.translate(panOffset.x, panOffset.y);
    regionCtx.scale(scale, scale);

    checkboxes.forEach(checkbox => {
        const regionId = checkbox.name;
        const regionData = allRegionData.regions.find(r => r.id === regionId);
        const img = regionImages[regionId];

        if (img && regionData && img.complete) {
            regionCtx.save();
            regionCtx.shadowColor = regionData.color || 'transparent';
            regionCtx.shadowBlur = 20;
            
            regionCtx.drawImage(img, 0, 0, width, height);
            regionCtx.drawImage(img, 0, 0, width, height);
            regionCtx.restore();
        }
    });

    regionCtx.restore();
}

function drawPlayerSpawns() {
    const width = playerSpawnCanvas.width;
    const height = playerSpawnCanvas.height;
    playerSpawnCtx.clearRect(0, 0, width, height);
    const toggleCheckbox = document.getElementById('toggle-all-player-spawns');
    
    if (!toggleCheckbox || !toggleCheckbox.checked || !allPlayerSpawnData.spawnPoints) return;

    playerSpawnCtx.save();
    playerSpawnCtx.translate(panOffset.x, panOffset.y);
    playerSpawnCtx.scale(scale, scale);
    
    allPlayerSpawnData.spawnPoints.forEach(region => {
        playerSpawnCtx.fillStyle = region.color || '#FFFFFF';
        region.locations.forEach(loc => {
            const x = ((loc.lon - MAP_LON_MIN) / MAP_LON_RANGE) * width;
            const y = ((loc.lat - MAP_LAT_MIN) / MAP_LAT_RANGE) * height;
            playerSpawnCtx.beginPath();
            playerSpawnCtx.arc(x, y, 5 / scale, 0, 2 * Math.PI, false);
            playerSpawnCtx.fill();
            playerSpawnCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            playerSpawnCtx.lineWidth = 1 / scale;
            playerSpawnCtx.stroke();
        });
    });
    playerSpawnCtx.restore();
}

function updateSelectAllObelisksState() {
    const selectAllCheckbox = document.getElementById('select-all-obelisks');
    const obeliskCheckboxes = document.querySelectorAll('#obelisk-controls input[type="checkbox"]');
    if (!selectAllCheckbox || obeliskCheckboxes.length === 0) return;
    const allChecked = ![...obeliskCheckboxes].some(cb => !cb.checked);
    selectAllCheckbox.checked = allChecked;
}

function populateObeliskControls() {
    const controlsContainer = document.getElementById('obelisk-controls');
    const sectionContainer = document.getElementById('obelisk-section');
    controlsContainer.innerHTML = '';

    if (!allObeliskData.obelisks || allObeliskData.obelisks.length === 0) {
        sectionContainer.style.display = 'none';
        return;
    }
    sectionContainer.style.display = 'block';

    allObeliskData.obelisks.forEach(obelisk => {
        const label = document.createElement('label');
        label.className = 'flex items-center text-white cursor-pointer';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = obelisk.name;
        checkbox.className = 'w-4 h-4 mr-2';
        checkbox.addEventListener('change', () => {
            drawObelisks();
            updateSelectAllObelisksState();
        });

        const colorCircle = document.createElement('div');
        colorCircle.className = 'w-4 h-4 mr-2 rounded-full';
        colorCircle.style.backgroundColor = obeliskConfig[obelisk.name]?.color || '#FFFFFF';

        const span = document.createElement('span');
        span.textContent = obelisk.name;

        label.appendChild(checkbox);
        label.appendChild(colorCircle);
        label.appendChild(span);
        controlsContainer.appendChild(label);
    });
    updateSelectAllObelisksState();
}


function createCavePattern() {
    const patternCanvas = document.createElement('canvas');
    const pCtx = patternCanvas.getContext('2d');
    const size = 10;
    patternCanvas.width = size; patternCanvas.height = size;
    pCtx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    pCtx.lineWidth = 1;
    pCtx.beginPath();
    pCtx.moveTo(0, size); pCtx.lineTo(size, 0); pCtx.stroke();
    cavePattern = spawnCtx.createPattern(patternCanvas, 'repeat');
}

function populatePublicSpotsSlider(filterType = null) {
    const slider = document.getElementById('public-spots-slider');
    const panel = document.getElementById('public-spots-panel');
    slider.innerHTML = '';
    
    if (!allPublicSpotsData.publicSpots || allPublicSpotsData.publicSpots.length === 0) {
        panel.style.display = 'none';
        return;
    }
    panel.style.display = 'block';

    const filteredSpots = filterType
        ? allPublicSpotsData.publicSpots.filter(spot =>
            spot.infoBadges && spot.infoBadges.some(badge => (badge.type || '').trim().toLowerCase() === filterType)
        )
        : allPublicSpotsData.publicSpots;

    filteredSpots.forEach(spot => {
        const card = document.createElement('div');
        card.id = `spot-card-${spot.id}`;
        card.className = 'public-spot-card snap-start flex-shrink-0 w-80 bg-[#222222] rounded-lg p-4 flex flex-col items-center text-center cursor-pointer border border-gray-700 hover:border-amber-500 transition-all duration-300';
        
        let badgesHtml = '';
        if (spot.infoBadges && spot.infoBadges.length > 0) {
            badgesHtml = '<div class="absolute top-1.5 left-1.5 flex flex-col items-start gap-1">';
            spot.infoBadges.slice(0, 2).forEach(badge => {
                let config;
                const badgeType = (badge.type || '').trim().toLowerCase();
                const badgeColor = badge.color || badge.Color;
                
                if (badgeType === 'miniboss') {
                     config = {
                        borderColor: '#ef4444',
                        bgColor: 'rgba(239, 68, 68, 0.2)',
                        textColor: '#fca5a5'
                    };
                } else if (badgeType === 'farm') {
                    config = { borderColor: 'orange', bgColor: hexToRgba('orange', 0.2), textColor: 'orange' };
                } else if (badgeType === 'falle') {
                    config = { borderColor: 'purple', bgColor: hexToRgba('purple', 0.2), textColor: 'purple' };
                }
                else if (badgeColor) {
                    config = {
                        borderColor: badgeColor,
                        bgColor: hexToRgba(badgeColor, 0.2),
                        textColor: badgeColor
                    };
                } else {
                    config = badgeConfig[badgeType] || { borderColor: '#a0aec0', bgColor: 'rgba(160, 174, 192, 0.2)', textColor: '#e2e8f0' };
                }
                badgesHtml += `<span class="info-badge" style="border-color: ${config.borderColor}; background-color: ${config.bgColor}; color: ${config.textColor};">${badge.text}</span>`;
            });
            badgesHtml += '</div>';
        }
        
        card.innerHTML = `
            <div class="relative w-full h-72 mb-3 overflow-hidden rounded-md">
                <img src="${(spot.images && spot.images[0]) || 'https://placehold.co/200x200/111/FFF?text=Icon'}" alt="${spot.name}" class="w-full h-full object-cover">
                ${badgesHtml}
                <button class="info-button absolute top-1.5 right-1.5 bg-gray-900/60 text-white p-1 rounded-full hover:bg-amber-500 transition-colors focus:outline-none" title="Weitere Infos">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
                </button>
            </div>
            <div>
                <h4 class="font-bold text-amber-400 truncate w-full">${spot.name}</h4>
                <p class="text-xs text-gray-400 mt-2 h-8 overflow-hidden">${spot.shortDescription || ''}</p>
                <p class="text-sm text-gray-300 mt-1">Lat: ${spot.lat.toFixed(2).replace('.',',')} / Lon: ${spot.lon.toFixed(2).replace('.',',')}</p>
            </div>
        `;

        card.addEventListener('click', () => {
            if (highlightedSpotId === spot.id) {
                clearHighlights();
                scale = 1;
                panOffset = { x: 0, y: 0 };
                redrawAll();
            } else {
                if (!spotsToggle.checked) {
                    spotsToggle.checked = true;
                    spotsToggleLabel.textContent = 'Anzeigen';
                }
                
                highlightSpotCard(spot.id);
                highlightSpotMarker(spot.id);
            }
        });


        const infoButton = card.querySelector('.info-button');
        infoButton.addEventListener('click', (e) => {
            e.stopPropagation();
            openPublicSpotModal(spot.id);
        });
        slider.appendChild(card);
    });
}

function populateBadgeFilters() {
    const filterContainer = document.getElementById('public-spots-filter-container');
    filterContainer.innerHTML = '';

    if (!allPublicSpotsData.publicSpots || allPublicSpotsData.publicSpots.length === 0) {
        return;
    }

    const badgeTypes = new Set();
    allPublicSpotsData.publicSpots.forEach(spot => {
        if (spot.infoBadges) {
            spot.infoBadges.forEach(badge => {
                if (badge.type) {
                    badgeTypes.add(badge.type.trim().toLowerCase());
                }
            });
        }
    });

    if (badgeTypes.size === 0) return;

    const allButton = document.createElement('button');
    allButton.textContent = 'Alle';
    allButton.className = 'filter-button active';
    allButton.dataset.filter = 'all';
    allButton.addEventListener('click', () => {
        populatePublicSpotsSlider(null);
        document.querySelectorAll('#public-spots-filter-container .filter-button').forEach(btn => btn.classList.remove('active'));
        allButton.classList.add('active');
    });
    filterContainer.appendChild(allButton);

    badgeTypes.forEach(type => {
        const button = document.createElement('button');
        button.textContent = type;
        button.className = 'filter-button';
        button.dataset.filter = type;
        button.addEventListener('click', () => {
            populatePublicSpotsSlider(type);
            document.querySelectorAll('#public-spots-filter-container .filter-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
        filterContainer.appendChild(button);
    });
}

function openPublicSpotModal(spotId) {
    const spot = allPublicSpotsData.publicSpots.find(s => s.id === spotId);
    if (!spot) return;

    const modalBody = document.getElementById('spot-modal-body');

    let imageSliderHtml = '';
    if(spot.images && spot.images.length > 0) {
        const slides = spot.images.map((imgSrc, index) => `
            <div class="spot-image-slide ${index === 0 ? '' : 'hidden'} w-full h-full flex items-center justify-center p-6">
                <img src="${imgSrc}" class="max-w-full max-h-full object-contain rounded-md border-2 border-red-500 shadow-[0_0_15px_rgba(255,75,62,0.7)] transition-transform duration-300 hover:scale-105">
            </div>
        `).join('');
        const arrows = spot.images.length > 1 ? `
            <button class="spot-image-prev absolute left-2 top-1/2 -translate-y-1/2 bg-gray-800/50 p-2 rounded-full text-red-500 hover:bg-gray-700 border border-red-500 hover:shadow-[0_0_15px_rgba(255,75,62,0.7)] transition-all">&lt;</button>
            <button class="spot-image-next absolute right-2 top-1/2 -translate-y-1/2 bg-gray-800/50 p-2 rounded-full text-red-500 hover:bg-gray-700 border border-red-500 hover:shadow-[0_0_15px_rgba(255,75,62,0.7)] transition-all">&gt;</button>
        ` : '';
        imageSliderHtml = `<div class="relative overflow-hidden rounded-md mb-4 h-96">${slides}${arrows}</div>`;
    }

    modalBody.innerHTML = `
        <h2 class="text-2xl font-bold text-amber-400 mb-4">${spot.name}</h2>
        ${imageSliderHtml}
        <p class="text-gray-300 whitespace-pre-wrap">${spot.longDescription || 'Keine Beschreibung verfügbar.'}</p>
        <p class="text-sm text-gray-400 mt-4">Lat: ${spot.lat.toFixed(2).replace('.',',')} / Lon: ${spot.lon.toFixed(2).replace('.',',')}</p>
    `;
    const modal = document.getElementById('spot-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    if(spot.images && spot.images.length > 1) {
        let currentSlide = 0;
        const slides = modalBody.querySelectorAll('.spot-image-slide');
        const nextBtn = modalBody.querySelector('.spot-image-next');
        const prevBtn = modalBody.querySelector('.spot-image-prev');

        const showSlide = (index) => {
            slides.forEach((slide, i) => {
                slide.classList.toggle('hidden', i !== index);
            });
        };

        nextBtn.addEventListener('click', () => {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        });
        prevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(currentSlide);
        });
    }
}

function closeSpotModal() {
    const modal = document.getElementById('spot-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function handleSearch() {
    const searchTerm = creatureSearch.value.toLowerCase().trim();
    const options = creatureSelect.options;
    let bestMatch = null;
    for (let i = 0; i < options.length; i++) {
        const option = options[i];
        if (option.value === "") {
            option.style.display = "";
            continue;
        }
        const optionText = option.textContent.toLowerCase();
        if (optionText.includes(searchTerm)) {
            option.style.display = "";
            if (!bestMatch) bestMatch = option;
        } else {
            option.style.display = "none";
        }
    }
    if (bestMatch) creatureSelect.value = bestMatch.value;
    else creatureSelect.value = "";
    drawSpawns();
}

async function preloadObeliskIcons() {
    obeliskIcons = {};
    if (!allObeliskData.obelisks) return;
    const promises = allObeliskData.obelisks.map(obelisk => {
        return new Promise((resolve) => {
            if (!obelisk.icon) return resolve();
            const img = new Image();
            img.src = obelisk.icon;
            img.onload = () => {
                obeliskIcons[obelisk.name] = img;
                resolve();
            };
            img.onerror = () => resolve();
        });
    });
    await Promise.all(promises);
}

async function preloadSpotIcons() {
    spotIcons = {};
    if (!allPublicSpotsData.publicSpots) return;
    const promises = allPublicSpotsData.publicSpots.map(spot => {
        return new Promise((resolve) => {
            if (!spot.icon) return resolve();
            const img = new Image();
            img.src = spot.icon;
            img.onload = () => {
                spotIcons[spot.id] = img;
                resolve();
            };
            img.onerror = () => resolve();
        });
    });
    await Promise.all(promises);
}

async function preloadCaveSpotIcons() {
    caveSpotIcons = {};
    if (!allCaveSpotsData.caveSpots) return;
    const promises = allCaveSpotsData.caveSpots.map(spot => {
        return new Promise((resolve) => {
            if (!spot.icon) return resolve();
            const img = new Image();
            img.src = spot.icon;
            img.onload = () => {
                caveSpotIcons[spot.id] = img;
                resolve();
            };
            img.onerror = () => resolve();
        });
    });
    await Promise.all(promises);
}

async function preloadResourceIcons() {
    resourceIcons = {};
    if (!allResourceData) return;
    const promises = Object.keys(allResourceData).map(resourceName => {
        return new Promise((resolve) => {
            const iconUrl = getIconUrl(resourceName);
            if (!iconUrl || iconUrl.includes('placehold.co')) return resolve();
            const img = new Image();
            img.src = iconUrl;
            img.onload = () => {
                resourceIcons[resourceName] = img;
                resolve();
            };
            img.onerror = () => resolve();
        });
    });
    await Promise.all(promises);
}

async function preloadNoteIcon() {
    noteIcon = null;
    const iconUrl = getIconUrl('Explorer Note Icon');
    if (!iconUrl || iconUrl.includes('placehold.co')) return;

    return new Promise((resolve) => {
        const img = new Image();
        img.src = iconUrl;
        img.onload = () => {
            noteIcon = img;
            resolve();
        };
        img.onerror = () => resolve();
    });
}

function drawPublicSpots(highlightPulseScale = 1.5) {
    const width = spotsCanvas.width;
    const height = spotsCanvas.height;
    spotsCtx.clearRect(0, 0, width, height);

    if (!spotsToggle.checked || !allPublicSpotsData.publicSpots) {
        return;
    }
    
    spotsCtx.save();
    spotsCtx.translate(panOffset.x, panOffset.y);
    spotsCtx.scale(scale, scale);

    allPublicSpotsData.publicSpots.forEach(spot => {
        const x = ((spot.lon - SPOT_LON_MIN) / SPOT_LON_RANGE) * width;
        const y = ((spot.lat - SPOT_LAT_MIN) / SPOT_LAT_RANGE) * height;
        spot.screenX = x * scale + panOffset.x;
        spot.screenY = y * scale + panOffset.y;
        spot.screenRadius = 16 * scale;

        const isHighlighted = spot.id === highlightedSpotId;
        const isHovered = spot.id === hoveredSpotId;
        let markerScale = 1.0;
        if (isHovered && !isHighlighted) {
            markerScale = 1.5;
        }
        if (isHighlighted) {
            markerScale = highlightPulseScale;
        }
        const size = 32 * markerScale;
        
        spotsCtx.shadowColor = 'transparent';
        spotsCtx.shadowBlur = 0;
        if (isHighlighted) {
            spotsCtx.shadowColor = '#f59e0b';
            spotsCtx.shadowBlur = 15;
        }

        const icon = spotIcons[spot.id];
        if (icon) {
            spotsCtx.drawImage(icon, x - size / 2, y - size, size, size);
        } else {
            const radius = 8 * markerScale;
            spotsCtx.beginPath();
            spotsCtx.arc(x, y - radius, radius, 0, 2 * Math.PI, false);
            spotsCtx.fillStyle = '#f59e0b';
            spotsCtx.fill();
            spotsCtx.strokeStyle = '#fff';
            spotsCtx.lineWidth = 2;
            spotsCtx.stroke();
        }
    });
    spotsCtx.restore();
}

function drawCaveSpots(highlightPulseScale = 1.5) {
    const width = caveSpotsCanvas.width;
    const height = caveSpotsCanvas.height;
    caveSpotsCtx.clearRect(0, 0, width, height);

    if (!caveSpotsToggle.checked || !allCaveSpotsData.caveSpots) {
        return;
    }
    
    caveSpotsCtx.save();
    caveSpotsCtx.translate(panOffset.x, panOffset.y);
    caveSpotsCtx.scale(scale, scale);

    allCaveSpotsData.caveSpots.forEach(spot => {
        const x = ((spot.lon - SPOT_LON_MIN) / SPOT_LON_RANGE) * width;
        const y = ((spot.lat - SPOT_LAT_MIN) / SPOT_LAT_RANGE) * height;
        spot.screenX = x * scale + panOffset.x;
        spot.screenY = y * scale + panOffset.y;
        spot.screenRadius = 16 * scale;

        const isHighlighted = spot.id === highlightedCaveSpotId;
        const isHovered = spot.id === hoveredCaveSpotId;
        let markerScale = 1.0;
        if (isHovered && !isHighlighted) {
            markerScale = 1.5;
        }
        if (isHighlighted) {
            markerScale = highlightPulseScale;
        }
        const size = 32 * markerScale;
        
        if (isHighlighted) {
            caveSpotsCtx.shadowColor = '#f59e0b';
            caveSpotsCtx.shadowBlur = 15;
        } else {
            caveSpotsCtx.shadowColor = 'transparent';
            caveSpotsCtx.shadowBlur = 0;
        }

        const icon = caveSpotIcons[spot.id];
        if (icon) {
            caveSpotsCtx.drawImage(icon, x - size / 2, y - size, size, size);
        } else {
            const radius = 8 * markerScale;
            caveSpotsCtx.beginPath();
            caveSpotsCtx.arc(x, y - radius, radius, 0, 2 * Math.PI, false);
            caveSpotsCtx.fillStyle = '#f59e0b';
            caveSpotsCtx.fill();
            caveSpotsCtx.strokeStyle = '#fff';
            caveSpotsCtx.lineWidth = 2;
            caveSpotsCtx.stroke();
        }
    });
    caveSpotsCtx.restore();
}

function drawObelisks() {
    const width = obeliskCanvas.width;
    const height = obeliskCanvas.height;
    obeliskCtx.clearRect(0, 0, width, height);

    const checkboxes = document.querySelectorAll('#obelisk-controls input[type="checkbox"]:checked');
    if (checkboxes.length === 0 || !allObeliskData.obelisks) return;

    obeliskCtx.save();
    obeliskCtx.translate(panOffset.x, panOffset.y);
    obeliskCtx.scale(scale, scale);

    const checkedNames = Array.from(checkboxes).map(cb => cb.name);

    allObeliskData.obelisks.forEach(obelisk => {
        if (checkedNames.includes(obelisk.name)) {
            const x = ((obelisk.lon - SPOT_LON_MIN) / SPOT_LON_RANGE) * width;
            const y = ((obelisk.lat - SPOT_LAT_MIN) / SPOT_LAT_RANGE) * height;
            const icon = obeliskIcons[obelisk.name];
            
            const isHighlighted = obelisk.name === highlightedObeliskId;
            const isHovered = obelisk.name === hoveredObeliskId;
            
            const baseScale = 0.15;
            const hoverScale = 1.5;
            const finalScale = (isHighlighted || isHovered) ? baseScale * hoverScale : baseScale;

            obeliskCtx.save();
            if (isHighlighted || isHovered) {
                obeliskCtx.shadowColor = obeliskConfig[obelisk.name]?.color || '#FFFFFF';
                obeliskCtx.shadowBlur = 20;
            }

            if (icon && icon.complete) {
                const dWidth = icon.width * finalScale;
                const dHeight = icon.height * finalScale;
                obelisk.screenX = x * scale + panOffset.x;
                obelisk.screenY = (y - dHeight/2) * scale + panOffset.y;
                obelisk.screenRadius = (dWidth + dHeight) / 4 * scale;
                obeliskCtx.drawImage(icon, x - dWidth / 2, y - dHeight, dWidth, dHeight);
            } else {
                const radius = 10 * ((isHighlighted || isHovered) ? 1.5 : 1.0);
                obelisk.screenX = x * scale + panOffset.x;
                obelisk.screenY = (y-radius) * scale + panOffset.y;
                obelisk.screenRadius = radius * scale;
                obeliskCtx.beginPath();
                obeliskCtx.arc(x, y - radius, radius, 0, 2 * Math.PI, false);
                obeliskCtx.fillStyle = obeliskConfig[obelisk.name]?.color || '#FFFFFF';
                obeliskCtx.fill();
                obeliskCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                obeliskCtx.lineWidth = 2;
                obeliskCtx.stroke();
            }
            obeliskCtx.restore();
        }
    });
    obeliskCtx.restore();
}

function clearHighlights() {
    hideTooltip();
    stopPulseAnimation();
    stopHighlightPulseAnimation();
    highlightedSpotId = null;
    highlightedObeliskId = null;
    highlightedCaveSpotId = null;
    highlightedZone = null;
    document.querySelectorAll('.public-spot-card, .cave-spot-card').forEach(c => c.classList.remove('highlight'));
    regionInfoContainer.innerHTML = '<p class="text-gray-400">Klicke auf eine Spawn-Zone auf der Karte.</p>';
    updateHighlightPreview(null);
    redrawAll();
}

function highlightSpotMarker(spotId) {
    highlightedSpotId = spotId;
    highlightedObeliskId = null;
    highlightedCaveSpotId = null;
    highlightedZone = null;
    updateHighlightPreview(null);
    redrawAll();
    startPulseAnimation();
}

function highlightCaveSpotMarker(spotId) {
    highlightedCaveSpotId = spotId;
    highlightedSpotId = null;
    highlightedObeliskId = null;
    highlightedZone = null;
    updateHighlightPreview(null);
    redrawAll();
    startPulseAnimation();
}

function highlightSpotCard(spotId) {
    document.querySelectorAll('.public-spot-card, .cave-spot-card').forEach(c => c.classList.remove('highlight'));
    const card = document.getElementById(`spot-card-${spotId}`);
    if (card) {
        card.classList.add('highlight');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

function highlightCaveSpotCard(spotId) {
    document.querySelectorAll('.public-spot-card, .cave-spot-card').forEach(c => c.classList.remove('highlight'));
    const card = document.getElementById(`cave-spot-card-${spotId}`);
    if (card) {
        card.classList.add('highlight');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

function handleMapClick(event) {
    hideTooltip();
    const { x, y } = getMapCoordsFromEvent(event);
    const clickRadius = 16 / scale;

    // Check for Public Spots
    if (spotsToggle.checked && allPublicSpotsData.publicSpots) {
        const clickedSpot = [...allPublicSpotsData.publicSpots].reverse().find(spot => {
            const spotX = ((spot.lon - SPOT_LON_MIN) / SPOT_LON_RANGE) * mapCanvas.width;
            const spotY = ((spot.lat - SPOT_LAT_MIN) / SPOT_LAT_RANGE) * mapCanvas.height;
            const distance = Math.sqrt(Math.pow(x - spotX, 2) + Math.pow(y - (spotY - 16 / scale), 2));
            return distance < clickRadius;
        });
        if (clickedSpot) {
            const content = `<h5 class="font-bold text-amber-400">${clickedSpot.name}</h5><p class="text-xs text-gray-400">Lat: ${clickedSpot.lat.toFixed(2).replace('.',',')}, Lon: ${clickedSpot.lon.toFixed(2).replace('.',',')}</p>`;
            const screenX = ((clickedSpot.lon - SPOT_LON_MIN) / SPOT_LON_RANGE) * mapCanvas.width * scale + panOffset.x;
            const screenY = ((clickedSpot.lat - SPOT_LAT_MIN) / SPOT_LAT_RANGE) * mapCanvas.height * scale + panOffset.y;
            showTooltip(content, screenX, screenY - (32 / scale * 1.5));

            if (highlightedSpotId === clickedSpot.id) {
                clearHighlights();
            } else {
                clearHighlights();
                highlightSpotCard(clickedSpot.id);
                highlightSpotMarker(clickedSpot.id);
            }
            return;
        }
    }

    // Check for Cave Spots
    if (caveSpotsToggle.checked && allCaveSpotsData.caveSpots) {
        const clickedCaveSpot = [...allCaveSpotsData.caveSpots].reverse().find(spot => {
            const spotX = ((spot.lon - SPOT_LON_MIN) / SPOT_LON_RANGE) * mapCanvas.width;
            const spotY = ((spot.lat - SPOT_LAT_MIN) / SPOT_LAT_RANGE) * mapCanvas.height;
            const distance = Math.sqrt(Math.pow(x - spotX, 2) + Math.pow(y - (spotY - 16 / scale), 2));
            return distance < clickRadius;
        });
        if (clickedCaveSpot) {
            const content = `<h5 class="font-bold text-amber-400">${clickedCaveSpot.name}</h5><p class="text-xs text-gray-400">Lat: ${clickedCaveSpot.lat.toFixed(2).replace('.',',')}, Lon: ${clickedCaveSpot.lon.toFixed(2).replace('.',',')}</p>`;
            const screenX = ((clickedCaveSpot.lon - SPOT_LON_MIN) / SPOT_LON_RANGE) * mapCanvas.width * scale + panOffset.x;
            const screenY = ((clickedCaveSpot.lat - SPOT_LAT_MIN) / SPOT_LAT_RANGE) * mapCanvas.height * scale + panOffset.y;
            showTooltip(content, screenX, screenY - (32 / scale * 1.5));
            
            if (highlightedCaveSpotId === clickedCaveSpot.id) {
                clearHighlights();
            } else {
                clearHighlights();
                highlightCaveSpotCard(clickedCaveSpot.id);
                highlightCaveSpotMarker(clickedCaveSpot.id);
            }
            return;
        }
    }
    
    // Check for Explorer Notes
    const notesToggle = document.getElementById('toggle-all-notes');
    if (notesToggle && notesToggle.checked && allExplorerNotesData) {
        const clickedNote = [...allExplorerNotesData].reverse().find(note => {
            const noteX = ((note.lon - MAP_LON_MIN) / MAP_LON_RANGE) * mapCanvas.width;
            const noteY = ((note.lat - MAP_LAT_MIN) / MAP_LAT_RANGE) * mapCanvas.height;
            const distance = Math.sqrt(Math.pow(x - noteX, 2) + Math.pow(y - noteY, 2));
            return distance < (12 / scale);
        });

        if (clickedNote) {
            const content = `<h5 class="font-bold text-amber-400">Explorer Notiz</h5><p class="text-xs text-gray-400">Lat: ${clickedNote.lat.toFixed(2).replace('.',',')}, Lon: ${clickedNote.lon.toFixed(2).replace('.',',')}</p>`;
            const screenX = ((clickedNote.lon - MAP_LON_MIN) / MAP_LON_RANGE) * mapCanvas.width * scale + panOffset.x;
            const screenY = ((clickedNote.lat - MAP_LAT_MIN) / MAP_LAT_RANGE) * mapCanvas.height * scale + panOffset.y;
            showTooltip(content, screenX, screenY - (12 / scale * 1.5));
            return;
        }
    }

    // Check for Obelisks
    if (allObeliskData.obelisks) {
        const checkedObeliskNames = Array.from(document.querySelectorAll('#obelisk-controls input:checked')).map(cb => cb.name);
        const visibleObelisks = allObeliskData.obelisks.filter(o => checkedObeliskNames.includes(o.name));
        const clickedObelisk = [...visibleObelisks].reverse().find(obelisk => {
            const icon = obeliskIcons[obelisk.name];
            if (!icon) return false;
            const baseIconWidth = icon.width * 0.15 / scale;
            const baseIconHeight = icon.height * 0.15 / scale;
            const obeliskX = ((obelisk.lon - SPOT_LON_MIN) / SPOT_LON_RANGE) * mapCanvas.width;
            const obeliskY = ((obelisk.lat - SPOT_LAT_MIN) / SPOT_LAT_RANGE) * mapCanvas.height;
            return x > obeliskX - baseIconWidth/2 && x < obeliskX + baseIconWidth/2 && y > obeliskY - baseIconHeight && y < obeliskY;
        });

        if (clickedObelisk) {
            const content = `<h5 class="font-bold text-amber-400">${clickedObelisk.name}</h5><p class="text-xs text-gray-400">Lat: ${clickedObelisk.lat.toFixed(2).replace('.',',')}, Lon: ${clickedObelisk.lon.toFixed(2).replace('.',',')}</p>`;
            const screenX = ((clickedObelisk.lon - SPOT_LON_MIN) / SPOT_LON_RANGE) * mapCanvas.width * scale + panOffset.x;
            const screenY = ((clickedObelisk.lat - SPOT_LAT_MIN) / SPOT_LAT_RANGE) * mapCanvas.height * scale + panOffset.y;
            const dHeight = (obeliskIcons[clickedObelisk.name]?.height || 0) * 0.15;
            showTooltip(content, screenX, screenY - dHeight);

            if (highlightedObeliskId === clickedObelisk.name) {
                clearHighlights();
            } else {
                clearHighlights();
                highlightedObeliskId = clickedObelisk.name;
                redrawAll();
            }
            return;
        }
    }
    
    // Check for Resources
    const resourceCheckboxes = document.querySelectorAll('#resource-controls input[type="checkbox"]:checked');
    if (resourceCheckboxes.length > 0) {
        let foundResource = false;
        for (const checkbox of Array.from(resourceCheckboxes).reverse()) {
            if (foundResource) break;
            const resourceName = checkbox.name;
            const resourceNodes = allResourceData[resourceName];
            if (resourceNodes) {
                const icon = resourceIcons[resourceName];
                const clickedNode = [...resourceNodes].reverse().find(node => {
                    const nodeX = ((node.lon - MAP_LON_MIN) / MAP_LON_RANGE) * mapCanvas.width;
                    const nodeY = ((node.lat - MAP_LAT_MIN) / MAP_LAT_RANGE) * mapCanvas.height;
                    let radius;
                    if (icon && icon.complete) {
                        radius = (12 + (node.size * 2)) / scale / 2;
                    } else {
                        radius = (2 + (node.size * 0.5)) / scale;
                    }
                    const distance = Math.sqrt(Math.pow(x - nodeX, 2) + Math.pow(y - nodeY, 2));
                    return distance < radius;
                });

                if (clickedNode) {
                    const germanName = resourceTranslations[resourceName.trim()] || resourceName.trim();
                    const content = `<h5 class="font-bold text-amber-400">${germanName}</h5><p class="text-xs text-gray-400">Lat: ${clickedNode.lat.toFixed(2).replace('.',',')}, Lon: ${clickedNode.lon.toFixed(2).replace('.',',')}</p>`;
                    const screenX = ((clickedNode.lon - MAP_LON_MIN) / MAP_LON_RANGE) * mapCanvas.width * scale + panOffset.x;
                    const screenY = ((clickedNode.lat - MAP_LAT_MIN) / MAP_LAT_RANGE) * mapCanvas.height * scale + panOffset.y;
                    showTooltip(content, screenX, screenY);
                    foundResource = true;
                }
            }
        }
        if (foundResource) return;
    }

    // Fallback to spawn zone logic
    const selectedCreature = creatureSelect.value;
    if (!selectedCreature) {
        clearHighlights();
        return;
    }

    const lat = MAP_LAT_MIN + (y / mapCanvas.height) * MAP_LAT_RANGE;
    const lon = MAP_LON_MIN + (x / mapCanvas.width) * MAP_LON_RANGE;

    const spawnAreas = allCreatureData[selectedCreature];
    if (!spawnAreas) {
         clearHighlights();
         return;
    }

    const blocklist = spawnZoneBlocklistData[currentMapKey] || [];
    const clickedZones = spawnAreas.filter(area => {
        const isInBounds = lat >= area.min.lat && lat <= area.max.lat &&
                           lon >= area.min.lon && lon <= area.max.lon;
        const isBlocked = blocklist.includes(area.id);
        return isInBounds && !isBlocked;
    });
    
    if (clickedZones.length > 0) {
        const smallestClickedZone = clickedZones.reduce((smallest, current) => {
            const smallestArea = (smallest.max.lat - smallest.min.lat) * (smallest.max.lon - smallest.min.lon);
            const currentArea = (current.max.lat - current.min.lat) * (current.max.lon - current.min.lon);
            return currentArea < smallestArea ? current : smallest;
        });
        clearHighlights();
        displaySpawnInfoForSharedZone(smallestClickedZone);
    } else {
        clearHighlights();
    }
}

function updateSelectAllState() {
    const selectAllCheckbox = document.getElementById('select-all-resources');
    const resourceCheckboxes = document.querySelectorAll('#resource-controls input[type="checkbox"]');
    if (!selectAllCheckbox || resourceCheckboxes.length === 0) return;
    const allChecked = ![...resourceCheckboxes].some(cb => !cb.checked);
    selectAllCheckbox.checked = allChecked;
}

function populateResourceControls() {
    resourceControls.innerHTML = '';
    if (!allResourceData || Object.keys(allResourceData).length === 0) {
         document.getElementById('select-all-resources').parentElement.parentElement.style.display = 'none';
        return;
    };
     document.getElementById('select-all-resources').parentElement.parentElement.style.display = 'block';
    
    const sortedResources = Object.keys(allResourceData).sort((a, b) => {
        const nameA = (resourceTranslations[a.trim()] || a.trim()).toLowerCase();
        const nameB = (resourceTranslations[b.trim()] || b.trim()).toLowerCase();
        return nameA.localeCompare(nameB);
    });

    sortedResources.forEach(resourceName => {
        const label = document.createElement('label');
        label.className = 'flex items-center text-white cursor-pointer';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = resourceName;
        checkbox.className = 'w-4 h-4 mr-2';
        checkbox.addEventListener('change', () => {
            drawResources();
            updateSelectAllState();
        });

        let iconElement;
        const iconUrl = getIconUrl(resourceName);

        if (iconUrl && !iconUrl.includes('placehold.co')) {
            iconElement = document.createElement('img');
            iconElement.src = iconUrl;
            iconElement.alt = resourceName;
            iconElement.className = 'w-4 h-4 mr-2 object-contain';
        } else {
            iconElement = document.createElement('div');
            iconElement.className = 'w-4 h-4 mr-2 rounded-sm';
            iconElement.style.backgroundColor = resourceConfig[resourceName]?.color || '#FFFFFF';
        }
        
        const span = document.createElement('span');
        
        const englishResourceName = resourceName.trim();
        let germanResourceName = '';

        const matchingKey = Object.keys(resourceTranslations).find(key => key.toLowerCase() === englishResourceName.toLowerCase());
        if (matchingKey) {
            germanResourceName = resourceTranslations[matchingKey];
        }
        
        span.textContent = germanResourceName || englishResourceName;

        label.appendChild(checkbox);
        label.appendChild(iconElement);
        label.appendChild(span);
        resourceControls.appendChild(label);
    });
    updateSelectAllState();
}

function populateCaveSpotsSlider(filterArtifact = null) {
    const slider = document.getElementById('cave-spots-slider');
    const panel = document.getElementById('cave-spots-panel');
    slider.innerHTML = '';

    if (!allCaveSpotsData.caveSpots || allCaveSpotsData.caveSpots.length === 0) {
        panel.style.display = 'none';
        return;
    }
    panel.style.display = 'block';
    
    const filteredSpots = filterArtifact
        ? allCaveSpotsData.caveSpots.filter(spot =>
            spot.artifacts && spot.artifacts.some(artifact => artifact.name === filterArtifact)
        )
        : allCaveSpotsData.caveSpots;


    filteredSpots.forEach(spot => {
        const card = document.createElement('div');
        card.id = `cave-spot-card-${spot.id}`;
        card.className = 'cave-spot-card snap-start flex-shrink-0 w-80 bg-[#222222] rounded-lg p-4 flex flex-col items-center text-center cursor-pointer border border-gray-700 hover:border-amber-500 transition-all duration-300';
        
        let difficultyBadgeHtml = '';
        if (spot.difficulty) {
            const diffConfig = difficultyConfig[spot.difficulty] || { borderColor: '#a0aec0', bgColor: 'rgba(160, 174, 192, 0.2)', textColor: '#e2e8f0' };
            difficultyBadgeHtml = `
                <div class="absolute top-1.5 left-1.5 text-xs font-bold p-1 px-2 rounded-md" style="border: 1px solid ${diffConfig.borderColor}; background-color: ${diffConfig.bgColor}; color: ${diffConfig.textColor};">
                    ${spot.difficulty}
                </div>`;
        }

        let artifactHtml = '';
        if (spot.artifacts && spot.artifacts.length > 0) {
                const artifactName = spot.artifacts[0]?.name || 'Unbekannt';
                if(artifactName && artifactName.trim() !== '') {
                    artifactHtml = `<div class="mt-2 py-1 px-2 border border-red-500 rounded-md text-red-400 text-sm w-full">
                        ${artifactName}
                    </div>`;
                }
        }

        let artifactIconsHtml = '';
        if(spot.artifacts) {
            spot.artifacts.forEach(artifact => {
                const iconUrl = artifact.iconUrl;
                if(iconUrl) {
                    artifactIconsHtml += `<img src="${iconUrl}" class="w-16 h-16 object-contain">`;
                }
            });
        }


        card.innerHTML = `
            <div class="relative w-full h-72 mb-3 overflow-hidden rounded-md">
                <img src="${(spot.images && spot.images[0]) || 'https://placehold.co/200x200/111/FFF?text=Icon'}" alt="${spot.name}" class="w-full h-full object-cover">
                ${difficultyBadgeHtml}
                <button class="info-button absolute top-1.5 right-1.5 bg-gray-900/60 text-white p-1 rounded-full hover:bg-amber-500 transition-colors focus:outline-none" title="Weitere Infos">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
                </button>
                <div class="absolute bottom-1.5 right-1.5 flex space-x-2">
                    ${artifactIconsHtml}
                </div>
            </div>
            <div class="flex flex-col items-center justify-center w-full">
                <h4 class="font-bold text-amber-400 text-xl">${spot.name}</h4>
                <hr class="w-full border-gray-600 my-1">
                ${artifactHtml}
                ${spot.recommendedlevel ? `<p class="text-sm text-gray-400 mt-2">Empfohlenes Level: ${spot.recommendedlevel}</p>` : ''}
                <p class="text-sm text-gray-300 ${!spot.recommendedlevel ? 'mt-2' : ''}">Lat: ${spot.lat.toFixed(2).replace('.',',')} / Lon: ${spot.lon.toFixed(2).replace('.',',')}</p>
            </div>
        `;

        card.addEventListener('click', () => {
            if (highlightedCaveSpotId === spot.id) {
                clearHighlights();
                scale = 1;
                panOffset = { x: 0, y: 0 };
                redrawAll();
            } else {
                if (!caveSpotsToggle.checked) {
                    caveSpotsToggle.checked = true;
                    caveSpotsToggleLabel.textContent = 'Anzeigen';
                }
                highlightCaveSpotCard(spot.id);
                highlightCaveSpotMarker(spot.id);
            }
        });
        
        const infoButton = card.querySelector('.info-button');
        infoButton.addEventListener('click', (e) => {
            e.stopPropagation();
            openCaveSpotModal(spot.id);
        });
        slider.appendChild(card);
    });
}

function populateArtifactFilters() {
    const filterContainer = document.getElementById('cave-spots-filter-container');
    filterContainer.innerHTML = '';

    if (!allCaveSpotsData.caveSpots || allCaveSpotsData.caveSpots.length === 0) {
        return;
    }

    const artifactNames = new Set();
    allCaveSpotsData.caveSpots.forEach(spot => {
        if (spot.artifacts) {
            spot.artifacts.forEach(artifact => {
                if (artifact.name) {
                    artifactNames.add(artifact.name);
                }
            });
        }
    });

    if (artifactNames.size === 0) return;

    const allButton = document.createElement('button');
    allButton.textContent = 'Alle Höhlen';
    allButton.className = 'filter-button active';
    allButton.addEventListener('click', () => {
        populateCaveSpotsSlider(null);
        document.querySelectorAll('#cave-spots-filter-container .filter-button').forEach(btn => btn.classList.remove('active'));
        allButton.classList.add('active');
    });
    filterContainer.appendChild(allButton);

    artifactNames.forEach(name => {
        const button = document.createElement('button');
        button.textContent = name;
        button.className = 'filter-button';
        button.addEventListener('click', () => {
            populateCaveSpotsSlider(name);
            document.querySelectorAll('#cave-spots-filter-container .filter-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
        filterContainer.appendChild(button);
    });
}


function closeCaveSpotModal() {
    const modal = document.getElementById('cave-spot-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function openCaveSpotModal(spotId) {
    const spot = allCaveSpotsData.caveSpots.find(s => s.id === spotId);
    if (!spot) return;

    const modalContent = document.getElementById('cave-spot-modal-content');
    
    const tabData = {
        equipment: { title: 'Empfohlene Ausrüstung', items: spot.equipment || [] },
        tames: { title: 'Empfohlene Reittiere', items: spot.tames || [] },
        strategy: { title: 'Empfohlene Strategie', items: spot.strategy || [] },
        resources: { title: 'Höhlen Ressourcen', items: spot.resources || [] },
        creatures: { title: 'Höhlen Gegner', items: spot.creatures || [] },
        blueprints: { title: 'Höhlen Blueprints', items: spot.blueprints || [] }
    };

        let artifactHtml = '';
        if (spot.artifacts && spot.artifacts.length > 0) {
            spot.artifacts.forEach(artifact => {
                const artifactName = artifact.name || 'Unbekannt';
                if (artifactName.trim() !== '') {
                    artifactHtml += `
                        <div class="mt-2 py-1 px-2 border border-red-500 rounded-md text-red-400 text-sm w-full">
                            ${artifactName}
                        </div>`;
                }
            });
        }


      let specialInfosHtml = '';
    if (spot.specialinfos && spot.specialinfos.length > 0) {
        specialInfosHtml = `
        <div class="mt-6 p-4 border border-amber-400 rounded-lg" style="box-shadow: 0 0 15px rgba(245, 158, 11, 0.5);">
            <h3 class="text-xl font-semibold text-amber-400 mb-2">Besondere Informationen</h3>
            ${spot.specialinfos.map(info => `<p class="text-gray-300 whitespace-pre-wrap mb-2">${info}</p>`).join('')}
        </div>`;
    }

    let imageSliderHtml = '';
    if(spot.images && spot.images.length > 0) {
        const slides = spot.images.map((imgSrc, index) => `
            <div class="cave-image-slide ${index === 0 ? '' : 'hidden'} w-full h-full flex items-center justify-center p-4">
                <img src="${imgSrc}" class="max-w-full max-h-full object-contain rounded-md border-2 border-red-500 shadow-[0_0_15px_rgba(255,75,62,0.7)] transition-transform duration-300 hover:scale-105">
            </div>
        `).join('');
        const arrows = spot.images.length > 1 ? `
            <button class="cave-image-prev absolute left-2 top-1/2 -translate-y-1/2 bg-gray-800/50 p-2 rounded-full text-red-500 hover:bg-gray-700 border border-red-500 hover:shadow-[0_0_15px_rgba(255,75,62,0.7)] transition-all">&lt;</button>
            <button class="cave-image-next absolute right-2 top-1/2 -translate-y-1/2 bg-gray-800/50 p-2 rounded-full text-red-500 hover:bg-gray-700 border border-red-500 hover:shadow-[0_0_15px_rgba(255,75,62,0.7)] transition-all">&gt;</button>
        ` : '';
        imageSliderHtml = `<div class="relative overflow-hidden rounded-md mb-4 h-96">${slides}${arrows}</div>`;
    }


    modalContent.innerHTML = `
        <div class="p-6">
              ${imageSliderHtml}
            <div class="flex justify-between items-start mb-2">
                <div>
                    <h2 class="text-3xl font-bold text-amber-400 mb-2">${spot.name}</h2>
                     <p class="text-gray-400">Lat: ${spot.lat.toFixed(2).replace('.',',')} / Lon: ${spot.lon.toFixed(2).replace('.',',')} | Schwierigkeit: ${spot.difficulty} | Empf. Level: ${spot.recommendedlevel || 'N/A'}</p>
                </div>
                <div class="text-right">
                   ${artifactHtml}
                </div>
            </div>
             <hr class="border-gray-700 my-4">
            
            <div id="cave-tabs-container">
                <div class="flex border-b border-gray-700 mb-4 overflow-x-auto scrollbar-hide">
                    <button data-tab="equipment" class="cave-tab active">Empfohlene Ausrüstung</button>
                    <button data-tab="tames" class="cave-tab">Empfohlene Reittiere</button>
                    <button data-tab="strategy" class="cave-tab">Empfohlene Strategie</button>
                    <button data-tab="resources" class="cave-tab">Höhlen Ressourcen</button>
                    <button data-tab="creatures" class="cave-tab">Höhlen Gegner</button>
                    <button data-tab="blueprints" class="cave-tab">Höhlen Blueprints</button>
                </div>
                <div id="cave-tab-content" class="min-h-[160px] text-gray-300"></div>
            </div>

            <hr class="border-gray-700 my-4">
            <div class="mt-6">
                <h3 class="text-xl font-semibold text-white mb-2">Beschreibung</h3>
                <p class="text-gray-300 whitespace-pre-wrap">${spot.description}</p>
            </div>
            ${specialInfosHtml}
        </div>
    `;

    const modal = document.getElementById('cave-spot-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    const tabsContainer = modalContent.querySelector('#cave-tabs-container');
    let activeTab = 'equipment';

    const renderTabContent = () => {
        const contentEl = tabsContainer.querySelector('#cave-tab-content');
        const data = tabData[activeTab];

        if (!data || data.items.length === 0) {
            contentEl.innerHTML = `<div class="flex items-center justify-center h-full pt-10"><p class="text-gray-500">Keine Einträge für diese Kategorie vorhanden.</p></div>`;
            return;
        }
        
        let contentHtml = `<h3 class="text-xl font-semibold text-fire-red mb-2">${data.title}</h3>`;

        if (activeTab === 'strategy') {
            contentHtml += `<div class="space-y-2 text-base text-gray-300">`;
            contentHtml += data.items.map(paragraph => `<p>${paragraph}</p>`).join('');
            contentHtml += `</div>`;
        } else if (activeTab === 'blueprints') {
            const blueprintItemsHtml = data.items.map(item => {
                const qualityKey = Object.keys(blueprintQualityConfig).find(key => key.toLowerCase() === item.quality.toLowerCase());
                const qualityConfig = blueprintQualityConfig[qualityKey] || { borderColor: '#a0aec0' };
                const qualityColor = qualityConfig.borderColor;
                const iconUrl = getIconUrl(item.name.trim());
                
                return `
                    <div class="snap-start flex-shrink-0 w-28 flex flex-col items-center gap-2">
                        <span class="text-xs font-bold truncate w-full text-center" style="color: ${qualityColor}; text-shadow: 0 0 5px ${qualityColor};">${item.name}</span>
                        <div class="w-24 h-24 p-1 rounded-md flex items-center justify-center" style="border: 2px solid ${qualityColor}; background-color: rgba(0,0,0,0.3); box-shadow: 0 0 10px ${qualityColor};">
                            <img src="${iconUrl}" class="max-w-full max-h-full object-contain" alt="${item.name}" title="${item.name} (${item.quality})">
                        </div>
                    </div>
                `;
            }).join('');

            contentHtml += `
                <div class="relative flex justify-center items-center">
                    <button id="blueprint-slider-prev" class="absolute left-0 top-1/2 -translate-y-1/2 bg-gray-800/50 hover:bg-gray-800 p-2 rounded-full z-10 text-amber-400 transition-all duration-300 border border-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.7)]"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg></button>
                    <div id="blueprint-slider" class="flex items-start overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide gap-4 px-12 py-2">
                        ${blueprintItemsHtml}
                    </div>
                    <button id="blueprint-slider-next" class="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-800/50 hover:bg-gray-800 p-2 rounded-full z-10 text-amber-400 transition-all duration-300 border border-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.7)]"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg></button>
                </div>
            `;
        } else {
            contentHtml += `<ul class="space-y-1 list-none p-0">`;
            contentHtml += data.items.map(item => {
                const englishName = item.trim();
                let displayName = englishName;
                let iconLookupName = englishName;

                if (activeTab === 'resources') {
                    const matchingKey = Object.keys(resourceTranslations).find(key => key.toLowerCase() === englishName.toLowerCase());
                    if(matchingKey) displayName = resourceTranslations[matchingKey];
                } else if (activeTab === 'creatures' || activeTab === 'tames') {
                    const matchingKey = Object.keys(creatureTranslations).find(key => key.toLowerCase() === englishName.toLowerCase());
                    if(matchingKey) displayName = creatureTranslations[matchingKey];
                }
                
                const iconUrl = getIconUrl(iconLookupName);
                return `<li class="flex items-center text-base"><img src="${iconUrl}" class="w-5 h-5 mr-2 object-contain"/>${displayName}</li>`;
            }).join('');
            contentHtml += `</ul>`;
        }
        contentEl.innerHTML = contentHtml;
        
        const blueprintSlider = contentEl.querySelector('#blueprint-slider');
        if (blueprintSlider) {
            const prevBtn = contentEl.querySelector('#blueprint-slider-prev');
            const nextBtn = contentEl.querySelector('#blueprint-slider-next');
            if (prevBtn && nextBtn) {
                prevBtn.addEventListener('click', () => { blueprintSlider.scrollBy({ left: -128, behavior: 'smooth' }); });
                nextBtn.addEventListener('click', () => { blueprintSlider.scrollBy({ left: 128, behavior: 'smooth' }); });
            }
        }
    };

    const tabButtons = tabsContainer.querySelectorAll('.cave-tab');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            activeTab = button.dataset.tab;
            renderTabContent();
        });
    });

    renderTabContent();
    

    if(spot.images && spot.images.length > 1) {
        let currentSlide = 0;
        const slides = modalContent.querySelectorAll('.cave-image-slide');
        const nextBtn = modalContent.querySelector('.cave-image-next');
        const prevBtn = modalContent.querySelector('.cave-image-prev');

        const showSlide = (index) => {
            slides.forEach((slide, i) => {
                slide.classList.toggle('hidden', i !== index);
            });
        };

        nextBtn.addEventListener('click', () => {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        });
        prevBtn.addEventListener('click', () => {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(currentSlide);
        });
    }
}


function drawResources() {
    const width = resourceCanvas.width;
    const height = resourceCanvas.height;
    resourceCtx.clearRect(0, 0, width, height);
    const checkboxes = document.querySelectorAll('#resource-controls input[type="checkbox"]:checked');
    
    if (checkboxes.length === 0) return;

    resourceCtx.save();
    resourceCtx.translate(panOffset.x, panOffset.y);
    resourceCtx.scale(scale, scale);
    
    checkboxes.forEach(checkbox => {
        const resourceName = checkbox.name;
        if (allResourceData[resourceName]) {
            const icon = resourceIcons[resourceName];
            
            allResourceData[resourceName].forEach(node => {
                const x = ((node.lon - MAP_LON_MIN) / MAP_LON_RANGE) * width;
                const y = ((node.lat - MAP_LAT_MIN) / MAP_LAT_RANGE) * height;

                if (icon && icon.complete) {
                    const dynamicIconSize = (12 + (node.size * 2)) / scale;
                    resourceCtx.drawImage(icon, x - dynamicIconSize / 2, y - dynamicIconSize / 2, dynamicIconSize, dynamicIconSize);
                } else {
                    const radius = (2 + (node.size * 0.5)) / scale;
                    resourceCtx.beginPath();
                    resourceCtx.arc(x, y, radius, 0, 2 * Math.PI, false);
                    resourceCtx.fillStyle = resourceConfig[resourceName]?.color || '#FFFFFF';
                    resourceCtx.fill();
                    resourceCtx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                    resourceCtx.lineWidth = 1 / scale;
                    resourceCtx.stroke();
                }
            });
        }
    });
    resourceCtx.restore();
}

function getSpawnRarityColor(area) {
    const chance = typeof area.chance === 'number' ? area.chance : 0.5;
    const weight = typeof area.weight === 'number' ? area.weight : 1;
    const score = chance * weight;

    if (score > 0.3) return spawnRarityConfig['Extrem selten'].color;
    if (score > 0.15) return spawnRarityConfig['Sehr selten'].color;
    if (score > 0.07) return spawnRarityConfig['Selten'].color;
    if (score > 0.03) return spawnRarityConfig['Gelegentlich'].color;
    if (score > 0.01) return spawnRarityConfig['Häufig'].color;
    return spawnRarityConfig['Sehr häufig'].color;
}

function generateLegend() {
    legendContainer.innerHTML = '';
    for (const key in spawnRarityConfig) {
        const item = spawnRarityConfig[key];
        const legendItem = document.createElement('div');
        legendItem.className = 'flex items-center mr-4 mb-2 text-sm';
        legendItem.innerHTML = `<div class="w-4 h-4 mr-2 rounded-sm border border-white/20" style="background-color: ${item.color};"></div><span>${key}</span>`;
        legendContainer.appendChild(legendItem);
    }
     const caveLegendItem = document.createElement('div');
    caveLegendItem.className = 'flex items-center mr-4 mb-2 text-sm';
    const caveColorBox = document.createElement('div');
    caveColorBox.className = 'w-4 h-4 mr-2 rounded-sm border border-white/20';
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 16; tempCanvas.height = 16;
    const tempCtx = tempCanvas.getContext('2d');
    if (cavePattern) {
        tempCtx.fillStyle = cavePattern;
        tempCtx.fillRect(0,0,16,16);
    }
    caveColorBox.style.backgroundImage = `url(${tempCanvas.toDataURL()})`;
    caveLegendItem.appendChild(caveColorBox);
    const caveText = document.createElement('span');
    caveText.textContent = 'Höhlenspawn';
    caveLegendItem.appendChild(caveText);
    legendContainer.appendChild(caveLegendItem);
}

function drawSpawns() {
    const width = spawnCanvas.width;
    const height = spawnCanvas.height;
    spawnCtx.clearRect(0, 0, width, height);

    const selectedCreature = creatureSelect.value;
    if (!selectedCreature) {
        clickCanvas.style.cursor = 'grab';
        return;
    }
    clickCanvas.style.cursor = 'pointer';

    spawnCtx.save();
    spawnCtx.translate(panOffset.x, panOffset.y);
    spawnCtx.scale(scale, scale);
    
    const spawnAreas = allCreatureData[selectedCreature];
    if (!spawnAreas || spawnAreas.length === 0) {
        spawnCtx.restore();
        return;
    }
    
    spawnAreas.forEach(area => {
        const blocklist = spawnZoneBlocklistData[currentMapKey] || [];
        if (blocklist.includes(area.id)) {
            return;
        }
        const x = ((area.min.lon - MAP_LON_MIN) / MAP_LON_RANGE) * width;
        const y = ((area.min.lat - MAP_LAT_MIN) / MAP_LAT_RANGE) * height;
        const w = ((area.max.lon - area.min.lon) / MAP_LON_RANGE) * width;
        const h = ((area.max.lat - area.min.lat) / MAP_LAT_RANGE) * height;

        spawnCtx.fillStyle = getSpawnRarityColor(area);
        spawnCtx.fillRect(x, y, w, h);

        if (area.isCave) {
            spawnCtx.fillStyle = cavePattern;
            spawnCtx.fillRect(x, y, w, h);
        }
    });
    spawnCtx.restore();
}

function updateHighlightPreview(zone = null) {
    const previewContainer = document.getElementById('highlight-preview');
    const regionContent = document.getElementById('region-info-content');
    
    if (zone && !regionContent.classList.contains('collapsed')) {
         previewContainer.innerHTML = `
            <div class="p-2 bg-gray-900 border border-amber-400 rounded-md">
                <p class="text-center text-sm text-amber-300">Ausgewählte Zone:</p>
                <p class="text-center text-xs text-gray-400">
                    Lat: ${zone.min.lat.toFixed(1)}-${zone.max.lat.toFixed(1)}, Lon: ${zone.min.lon.toFixed(1)}-${zone.max.lon.toFixed(1)}
                </p>
            </div>`;
        previewContainer.style.display = 'block';
    } else {
        previewContainer.style.display = 'none';
        previewContainer.innerHTML = '';
    }
}

function displaySpawnInfoForSharedZone(clickedZone) {
    highlightedZone = clickedZone;
    const selectedCreature = creatureSelect.value.trim();
    const creaturesInThisZone = [];
    const zoneId = clickedZone.id;

    for (const creatureName in allCreatureData) {
        const spawnAreas = allCreatureData[creatureName];
        const matchingArea = spawnAreas.find(area => area.id === zoneId);

        if (matchingArea) {
            creaturesInThisZone.push({
                name: creatureName.trim(),
                weight: matchingArea.weight || 0
            });
        }
    }

    if (creaturesInThisZone.length === 0) {
        regionInfoContainer.innerHTML = '<p class="text-gray-400">Keine Kreaturen-Informationen für diese spezifische Zone gefunden.</p>';
        updateHighlightPreview(null);
    } else {
         const totalWeight = creaturesInThisZone.reduce((sum, creature) => sum + creature.weight, 0);

        let infoHtml = creaturesInThisZone
            .sort((a, b) => {
                const aIsSelected = a.name === selectedCreature;
                const bIsSelected = b.name === selectedCreature;
                if (aIsSelected && !bIsSelected) return -1;
                if (!aIsSelected && bIsSelected) return 1;
                return b.weight - a.weight;
            })
            .map(creature => {
                const chance = totalWeight > 0 ? ((creature.weight / totalWeight) * 100).toFixed(1) : '0.0';
                const germanName = creatureTranslations[creature.name] || creature.name;
                const isSelected = creature.name === selectedCreature;
                const highlightClass = isSelected ? 'highlight' : '';
                const iconUrl = getIconUrl(creature.name);
                
                return `
                    <div class="sidebar-list-item ${highlightClass}">
                        <div class="flex items-center">
                            <img src="${iconUrl}" class="w-5 h-5 mr-2 object-contain"/>
                            <span>${germanName}</span>
                        </div>
                        <span class="font-bold">${chance.replace('.',',')}%</span>
                    </div>`;
            })
            .join('');

        regionInfoContainer.innerHTML = infoHtml;
        updateHighlightPreview(clickedZone);
        startHighlightPulseAnimation();
    }
}

function resetUI() {
    creatureSearch.value = '';
    creatureSelect.innerHTML = '<option selected value="">-- Bitte auswählen --</option>';
    resourceControls.innerHTML = '';
    document.getElementById('obelisk-controls').innerHTML = '';
    document.getElementById('region-controls').innerHTML = '';
    document.getElementById('public-spots-filter-container').innerHTML = '';
    document.getElementById('cave-spots-filter-container').innerHTML = '';
    
    const notesToggle = document.getElementById('toggle-all-notes');
    if (notesToggle) notesToggle.checked = false;

    publicSpotsSlider.innerHTML = '';
    caveSpotsSlider.innerHTML = '';
    document.getElementById('info-badge-panel').innerHTML = '';
    generalInfoPanel.innerHTML = '';
    regionInfoContainer.innerHTML = '<p class="text-gray-400">Klicke auf eine Spawn-Zone, um Details anzuzeigen.</p>';
    spotsToggle.checked = false;
    spotsToggleLabel.textContent = 'Verstecken';
    caveSpotsToggle.checked = false;
    caveSpotsToggleLabel.textContent = 'Verstecken';
    [mapCtx, spawnCtx, resourceCtx, spotsCtx, clickCtx, obeliskCtx, caveSpotsCtx, regionCtx, playerSpawnCtx, notesCtx].forEach(ctx => {
        if(ctx) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    });
}

async function fetchData(url, type) {
    if (!url || url.trim() === '') return null;
    try {
        const response = await fetch(url, { cache: 'no-cache' });
        if (!response.ok) {
            console.warn(`HTTP-Fehler ${response.status} beim Laden von ${url}`);
            return null;
        }
        let text = await response.text();
        if (text.trim() === '') {
            console.warn(`Leere Antwort empfangen von ${url}`);
            return null;
        }
        
        const cleanedText = text.replace(/^\uFEFF/, '').replace(/\u00A0/g, ' ');

        return JSON.parse(cleanedText);
    } catch (e) {
        console.error(`Fehler beim Laden oder Parsen der ${type}-JSON von ${url}:`, e);
        return null;
    }
}


function enrichCreatureData(data) {
    const enrichedData = JSON.parse(JSON.stringify(data));

    for (const creatureName in enrichedData) {
        enrichedData[creatureName].forEach(area => {
            area.id = `lat${area.min.lat.toFixed(2)}-${area.max.lat.toFixed(2)}_lon${area.min.lon.toFixed(2)}-${area.max.lon.toFixed(2)}`;
        });
    }

    for (const mainCreature in spawnSharingConfig) {
        if (enrichedData[mainCreature]) {
            const sharedCreatures = spawnSharingConfig[mainCreature];
            const totalShares = sharedCreatures.length + 1;

            enrichedData[mainCreature].forEach(area => {
                area.weight /= totalShares;
            });

            sharedCreatures.forEach(sharedCreature => {
                if (!enrichedData[sharedCreature]) {
                    enrichedData[sharedCreature] = [];
                }
                const sharedSpawns = JSON.parse(JSON.stringify(enrichedData[mainCreature]));
                enrichedData[sharedCreature].push(...sharedSpawns);
            });
        }
    }

    const alphaVariantKey = currentMapConfig.alphaVariantKey || 'Default';
    const activeAlphaConfig = alphaVariantConfigs[alphaVariantKey] || alphaVariantConfigs['Default'];

    if (activeAlphaConfig && Object.keys(activeAlphaConfig).length > 0) {
        for (const normalCreature in activeAlphaConfig) {
            const matchingEnrichedKey = Object.keys(enrichedData).find(key => key.trim().toLowerCase() === normalCreature.trim().toLowerCase());
            
            if (matchingEnrichedKey) {
                const alphaCreature = activeAlphaConfig[normalCreature];
                if (!enrichedData[alphaCreature]) {
                    enrichedData[alphaCreature] = [];
                }
                
                const newAlphaSpawns = [];
                enrichedData[matchingEnrichedKey].forEach(area => {
                    const alphaArea = JSON.parse(JSON.stringify(area));
                    alphaArea.weight = area.weight * 0.05;
                    newAlphaSpawns.push(alphaArea);
                    area.weight *= 0.95;
                });

                enrichedData[alphaCreature].push(...newAlphaSpawns);
            }
        }
    }

    return enrichedData;
}


async function loadMapData(mapKey) {
    currentMapKey = mapKey;
    const liveMapWasActive = iframeToggle ? iframeToggle.checked : false;
    currentMapConfig = mapConfigs[mapKey];
    if (!currentMapConfig) return;

    document.querySelectorAll('#map-list .map-list-item').forEach(item => {
        item.classList.toggle('active', item.dataset.mapKey === mapKey);
    });

    loadingIndicator.textContent = `Lade Daten für ${currentMapConfig.displayName}...`;
    loadingIndicator.style.display = 'block';
    resetUI();
    mapNameDisplay.textContent = currentMapConfig.displayName;
    mapImage.src = currentMapConfig.mapImageUrl;
    
    // This function will be called once the map image is loaded.
    mapImage.onload = async () => {
        try {
            // Fetch all data sources for the selected map in parallel.
            const [creatureJson, resourceJson, spotsJson, infoBadgeJson, obeliskJson, regionJson, caveSpotsJson, playerSpawnJson, notesJson] = await Promise.all([
                fetchData(currentMapConfig.creatureDataUrl, 'Kreaturen'),
                fetchData(currentMapConfig.resourceDataUrl, 'Ressourcen'),
                fetchData(currentMapConfig.publicSpotsDataUrl, 'Orte'),
                fetchData(currentMapConfig.infoBadgeUrl, 'Info Badges'),
                fetchData(currentMapConfig.obeliskDataUrl, 'Obelisken'),
                fetchData(currentMapConfig.regionDataUrl, 'Regionen'),
                fetchData(currentMapConfig.caveSpotsDataUrl, 'Höhlen'),
                fetchData(currentMapConfig.playerSpawnDataUrl, 'Spieler-Spawns'),
                fetchData(currentMapConfig.notesDataUrl, 'Explorer Notizen')
            ]);

            let rawCreatureData = creatureJson?.dinoSpawns || {};
            allCreatureData = enrichCreatureData(rawCreatureData);

            allResourceData = resourceJson?.resources || {};
            allPublicSpotsData = spotsJson || { publicSpots: [] };
            allInfoBadgeData = infoBadgeJson || { infoBadges: {} };
            allObeliskData = obeliskJson || { obelisks: [] };
            allRegionData = regionJson || { regions: [] };
            allCaveSpotsData = caveSpotsJson || { caveSpots: [] };
            
            if (Array.isArray(notesJson)) {
                allExplorerNotesData = notesJson;
            } else if (notesJson && Array.isArray(notesJson.notes)) {
                allExplorerNotesData = notesJson.notes;
            } else if (notesJson && typeof notesJson.notes === 'object' && notesJson.notes !== null) {
                allExplorerNotesData = Object.values(notesJson.notes);
            } else {
                allExplorerNotesData = [];
            }
            
            if (playerSpawnJson === null) {
                allPlayerSpawnData = {
                    spawnPoints: [],
                    error: 'Datei konnte nicht geladen werden. Prüfe die URL in der Konfiguration.'
                };
            } else if (playerSpawnJson && Array.isArray(playerSpawnJson.spawnPoints)) {
                if (playerSpawnJson.spawnPoints.length > 0 && Array.isArray(playerSpawnJson.spawnPoints[0])) {
                    const transformedData = playerSpawnJson.spawnPoints.map((locations, index) => ({
                        regionName: `Zone ${index + 1}`,
                        locations: locations,
                        color: spawnGroupColors[index % spawnGroupColors.length]
                    }));
                    allPlayerSpawnData = { spawnPoints: transformedData };
                } else {
                    playerSpawnJson.spawnPoints.forEach((region, index) => {
                        if (!region.color) {
                            region.color = spawnGroupColors[index % spawnGroupColors.length];
                        }
                    });
                    allPlayerSpawnData = playerSpawnJson;
                }
            } else {
                allPlayerSpawnData = {
                    spawnPoints: [],
                    error: 'Datei hat ein ungültiges Format. Erwartet: { "spawnPoints": [...] }'
                };
                console.warn('Spieler-Spawn-Daten geladen, aber im falschen Format.', playerSpawnJson);
            }
            
            // Populate UI elements now that data is available
            populateGeneralInfo();
            populateInfoBadges();
            populateDropdown();
            populateResourceControls();
            populateObeliskControls();
            populateRegionControls();
            populatePlayerSpawnControls();
            populateExplorerNotesControls();
            populatePublicSpotsSlider();
            populateBadgeFilters();
            populateCaveSpotsSlider();
            populateArtifactFilters();
            await Promise.all([preloadSpotIcons(), preloadObeliskIcons(), preloadCaveSpotIcons(), preloadRegionImages(), preloadResourceIcons(), preloadNoteIcon()]);
            
            iframeToggle.checked = liveMapWasActive;
            mapIframe.src = currentMapConfig.iframeUrl || 'about:blank';
            toggleLiveMapView(liveMapWasActive);

            handleResize();
            loadingIndicator.style.display = 'none';
        } catch (error) {
            console.error("Daten konnten nicht geladen werden:", error);
            loadingIndicator.textContent = `Ein kritischer Fehler ist aufgetreten: ${error.message}`;
        }
    };
    
    mapImage.onerror = () => {
        loadingIndicator.textContent = 'Fehler: Kartenbild konnte nicht geladen werden.';
    };
}

function toggleLiveMapView(isChecked) {
    const canvases = [mapCanvas, spawnCanvas, resourceCanvas, spotsCanvas, clickCanvas, obeliskCanvas, caveSpotsCanvas, regionCanvas, playerSpawnCanvas, notesCanvas];
    const resourceCheckboxes = document.querySelectorAll('#resource-controls input[type="checkbox"]');
    const resourceLabels = document.querySelectorAll('#resource-controls label');
    const obeliskCheckboxes = document.querySelectorAll('#obelisk-controls input[type="checkbox"]');
    const obeliskLabels = document.querySelectorAll('#obelisk-controls label');
    const regionCheckboxes = document.querySelectorAll('#region-controls input[type="checkbox"]');
    const regionLabels = document.querySelectorAll('#region-controls label');
    const playerSpawnToggle = document.getElementById('toggle-all-player-spawns');
    const playerSpawnLabel = playerSpawnToggle ? playerSpawnToggle.parentElement : null;
    const notesToggle = document.getElementById('toggle-all-notes');
    const notesLabel = notesToggle ? notesToggle.parentElement : null;
    const selectAllResourcesCheckbox = document.getElementById('select-all-resources');
    const selectAllResourcesLabel = selectAllResourcesCheckbox.parentElement;
    const selectAllObelisksCheckbox = document.getElementById('select-all-obelisks');
    const selectAllObelisksLabel = selectAllObelisksCheckbox.parentElement;
    const selectAllRegionsCheckbox = document.getElementById('select-all-regions');
    const selectAllRegionsLabel = selectAllRegionsCheckbox.parentElement;
    
    if (isChecked) {
        mapContainer.classList.add('iframe-active');
        liveMapTogglePanel.classList.add('iframe-active');
        mapIframe.style.display = 'block';
        canvases.forEach(canvas => canvas.style.display = 'none');
        coordsDisplay.style.display = 'none';

        creatureSearch.value = '';
        creatureSearch.disabled = true;
        creatureSelect.value = '';
        creatureSelect.disabled = true;
        
        resourceCheckboxes.forEach(checkbox => { checkbox.checked = false; checkbox.disabled = true; });
        resourceLabels.forEach(label => label.classList.add('opacity-50', 'cursor-not-allowed'));
        selectAllResourcesCheckbox.disabled = true;
        selectAllResourcesLabel.classList.add('opacity-50', 'cursor-not-allowed');

        obeliskCheckboxes.forEach(checkbox => { checkbox.checked = false; checkbox.disabled = true; });
        obeliskLabels.forEach(label => label.classList.add('opacity-50', 'cursor-not-allowed'));
        selectAllObelisksCheckbox.disabled = true;
        selectAllObelisksLabel.classList.add('opacity-50', 'cursor-not-allowed');
        
        regionCheckboxes.forEach(checkbox => { checkbox.checked = false; checkbox.disabled = true; });
        regionLabels.forEach(label => label.classList.add('opacity-50', 'cursor-not-allowed'));
        selectAllRegionsCheckbox.disabled = true;
        selectAllRegionsLabel.classList.add('opacity-50', 'cursor-not-allowed');
        
        if (playerSpawnToggle) {
            playerSpawnToggle.checked = false;
            playerSpawnToggle.disabled = true;
        }
        if (playerSpawnLabel) {
            playerSpawnLabel.classList.add('opacity-50', 'cursor-not-allowed');
        }
        if (notesToggle) {
            notesToggle.checked = false;
            notesToggle.disabled = true;
        }
        if (notesLabel) {
            notesLabel.classList.add('opacity-50', 'cursor-not-allowed');
        }

        spotsToggle.checked = false;
        spotsToggle.disabled = true;
        spotsToggleLabel.textContent = 'Verstecken';
        spotsToggle.parentElement.classList.add('opacity-50', 'cursor-not-allowed');

        caveSpotsToggle.checked = false;
        caveSpotsToggle.disabled = true;
        caveSpotsToggleLabel.textContent = 'Verstecken';
        caveSpotsToggle.parentElement.classList.add('opacity-50', 'cursor-not-allowed');

    } else {
        mapContainer.classList.remove('iframe-active');
        liveMapTogglePanel.classList.remove('iframe-active');
        mapIframe.style.display = 'none';
        canvases.forEach(canvas => canvas.style.display = 'block');
        coordsDisplay.style.display = 'flex';

        creatureSearch.disabled = false;
        creatureSelect.disabled = false;
        resourceCheckboxes.forEach(checkbox => checkbox.disabled = false);
        resourceLabels.forEach(label => label.classList.remove('opacity-50', 'cursor-not-allowed'));
        selectAllResourcesCheckbox.disabled = false;
        selectAllResourcesLabel.classList.remove('opacity-50', 'cursor-not-allowed');

        obeliskCheckboxes.forEach(checkbox => checkbox.disabled = false);
        obeliskLabels.forEach(label => label.classList.remove('opacity-50', 'cursor-not-allowed'));
        selectAllObelisksCheckbox.disabled = false;
        selectAllObelisksLabel.classList.remove('opacity-50', 'cursor-not-allowed');

        regionCheckboxes.forEach(checkbox => checkbox.disabled = false);
        regionLabels.forEach(label => label.classList.remove('opacity-50', 'cursor-not-allowed'));
        selectAllRegionsCheckbox.disabled = false;
        selectAllRegionsLabel.classList.remove('opacity-50', 'cursor-not-allowed');

        if (playerSpawnToggle) {
            playerSpawnToggle.disabled = false;
        }
        if (playerSpawnLabel) {
            playerSpawnLabel.classList.remove('opacity-50', 'cursor-not-allowed');
        }
        if (notesToggle) {
            notesToggle.disabled = false;
        }
        if (notesLabel) {
            notesLabel.classList.remove('opacity-50', 'cursor-not-allowed');
        }

        spotsToggle.disabled = false;
        spotsToggle.parentElement.classList.remove('opacity-50', 'cursor-not-allowed');
        
        caveSpotsToggle.disabled = false;
        caveSpotsToggle.parentElement.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    redrawAll();
}

async function handleResize() {
    const containerWidth = mapContainer.clientWidth;
    const containerHeight = mapContainer.clientHeight;
    const size = Math.min(containerWidth, containerHeight);

     const allCanvases = [mapCanvas, spawnCanvas, resourceCanvas, spotsCanvas, clickCanvas, obeliskCanvas, caveSpotsCanvas, regionCanvas, playerSpawnCanvas, notesCanvas];
    
    allCanvases.forEach(canvas => {
        if (size > 0) {
            canvas.width = size;
            canvas.height = size;

            canvas.style.width = `${size}px`;
            canvas.style.height = `${size}px`;
            canvas.style.left = `${(containerWidth - size) / 2}px`;
            canvas.style.top = `${(containerHeight - size) / 2}px`;
        }
    });
    
    scale = 1;
    panOffset = { x: 0, y: 0 };
    redrawAll();
    clickCtx.clearRect(0,0,clickCanvas.width, clickCanvas.height);
}

async function initializeApp() {
    // These are global configurations needed for the app to start.
    const mapConfigsUrl = 'https://raw.githubusercontent.com/iophantonie/iophantonie-IOP_Custom_Map_Explorer.github.io/main/MapConfigs/MapConfigs.jsn';
    const translationsUrl = 'https://raw.githubusercontent.com/iophantonie/iophantonie-IOP_Custom_Map_Explorer.github.io/main/Translation_Datenbank/translationdb.jsn';
    const alphaListUrl = 'https://raw.githubusercontent.com/iophantonie/iophantonie-IOP_Custom_Map_Explorer.github.io/main/Alpha_Listen_Datenbank/alphalistdb.jsn';
    const itemDbUrl = 'https://raw.githubusercontent.com/iophantonie/iophantonie-IOP_Custom_Map_Explorer.github.io/refs/heads/main/Icon_Datenbank/Icondb.jsn';
    const blocklistUrl = 'https://raw.githubusercontent.com/iophantonie/iophantonie-IOP_Custom_Map_Explorer.github.io/refs/heads/main/Blocked_Zones_Datenbank/blockedzonesdb.jsn';
    const spawnSharingUrl = 'https://raw.githubusercontent.com/iophantonie/iophantonie-IOP_Custom_Map_Explorer.github.io/refs/heads/main/SpawnSharingConfig/spawnsharing.jsn';
    const spawnRarityUrl = 'https://raw.githubusercontent.com/iophantonie/iophantonie-IOP_Custom_Map_Explorer.github.io/refs/heads/main/Spawn_Rarity_Configs/SpawnRarityConfig.jsn';
    const badgeConfigUrl = 'https://raw.githubusercontent.com/iophantonie/iophantonie-IOP_Custom_Map_Explorer.github.io/refs/heads/main/StructureConfigs/PublicSpotBadgesConfig/PSInfobadgedb.jsn';
    const blueprintQualityConfigUrl = 'https://raw.githubusercontent.com/iophantonie/iophantonie-IOP_Custom_Map_Explorer.github.io/refs/heads/main/BluePrintQualityDatenbank/blueprintqualitydb.jsn';


    const [configsData, translationsData, alphaListsData, itemDbData, blocklistData, spawnSharingData, spawnRarityData, badgeConfigData, blueprintQualityConfigData] = await Promise.all([
        fetchData(mapConfigsUrl, 'Map Configs'),
        fetchData(translationsUrl, 'Translations'),
        fetchData(alphaListUrl, 'Alpha Lists'),
        fetchData(itemDbUrl, 'Item DB'),
        fetchData(blocklistUrl, 'Spawn Zone Blocklist'),
        fetchData(spawnSharingUrl, 'Spawn Sharing Config'),
        fetchData(spawnRarityUrl, 'Spawn Rarity Config'),
        fetchData(badgeConfigUrl, 'Badge Config'),
        fetchData(blueprintQualityConfigUrl, 'Blueprint Quality Config')
    ]);
    
    mapConfigs = configsData || {};
    if (translationsData) {
        resourceTranslations = translationsData.Ressourcen || {};
        creatureTranslations = translationsData.Kreaturen || {};
        infoBadgeTranslations = translationsData.InfoBadges || {};
    }
    alphaVariantConfigs = alphaListsData || {};
    spawnZoneBlocklistData = blocklistData || {};
    spawnSharingConfig = spawnSharingData || {};
    spawnRarityConfig = spawnRarityData || {};
    badgeConfig = badgeConfigData || {};
    blueprintQualityConfig = blueprintQualityConfigData || {};
    
    if (itemDbData) {
        globalItemDatabase = {
            ...itemDbData.Items,
            ...itemDbData.Ressourcen,
            ...itemDbData.Kreaturen,
            ...(itemDbData.notes || {})
        };
    }
    
    populateMapList();
    createCavePattern();
    generateLegend();
    // Load the default map data. Other maps will be loaded on-demand when clicked.
    await loadMapData('TheIsland');
}

function redrawAll() {
    requestAnimationFrame(() => {
        drawMapImage();
        drawRegions();
        drawResources();
        drawSpawns();
        if (pulseAnimationId === null) {
            drawPublicSpots();
            drawCaveSpots();
        }
        drawObelisks();
        drawPlayerSpawns();
        if (notePulseAnimationId === null) {
            drawExplorerNotes();
        }
    });
}

function drawMapImage() {
    mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    mapCtx.save();
    mapCtx.translate(panOffset.x, panOffset.y);
    mapCtx.scale(scale, scale);
    if (mapImage.complete && mapImage.naturalHeight !== 0) {
      mapCtx.drawImage(mapImage, 0, 0, mapCanvas.width, mapCanvas.height);
    }
    mapCtx.restore();
}

function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function getMapCoordsFromEvent(e) {
     const { x, y } = getMousePos(clickCanvas, e);
     return {
        x: (x - panOffset.x) / scale,
        y: (y - panOffset.y) / scale
    };
}

function handleZoom(e) {
    e.preventDefault();
    const { x, y } = getMousePos(clickCanvas, e);
    const zoom = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(minScale, Math.min(maxScale, scale * zoom));

    const worldX = (x - panOffset.x) / scale;
    const worldY = (y - panOffset.y) / scale;

    panOffset.x = x - worldX * newScale;
    panOffset.y = y - worldY * newScale;
    scale = newScale;

    panOffset.x = Math.min(0, Math.max(mapCanvas.width * (1 - scale), panOffset.x));
    panOffset.y = Math.min(0, Math.max(mapCanvas.height * (1 - scale), panOffset.y));
    
    hideTooltip();
    clickCtx.clearRect(0, 0, clickCanvas.width, clickCanvas.height);
    redrawAll();
}

function startPan(e) {
    hideTooltip();
    isPanning = true;
    panStart.x = e.clientX - panOffset.x;
    panStart.y = e.clientY - panOffset.y;
    clickCanvas.style.cursor = 'grabbing';
}

function pan(e) {
    if (!isPanning) return;
    e.preventDefault();
    const newX = e.clientX - panStart.x;
    const newY = e.clientY - panStart.y;
    panOffset.x = Math.min(0, Math.max(mapCanvas.width * (1 - scale), newX));
    panOffset.y = Math.min(0, Math.max(mapCanvas.height * (1 - scale), newY));
    redrawAll();
}

function endPan() {
    isPanning = false;
    clickCanvas.style.cursor = 'grab';
}

function pulseAnimationLoop() {
    if (!highlightedSpotId && !highlightedCaveSpotId) {
        stopPulseAnimation();
        redrawAll();
        return;
    }
    const pulseFactor = (Math.sin(Date.now() / 250) + 1) / 2;
    const dynamicScale = 1.5 + (pulseFactor * 0.4);

    if (highlightedSpotId) {
        drawPublicSpots(dynamicScale);
    }
    if (highlightedCaveSpotId) {
        drawCaveSpots(dynamicScale);
    }

    pulseAnimationId = requestAnimationFrame(pulseAnimationLoop);
}

function startPulseAnimation() {
    if (pulseAnimationId === null) {
        pulseAnimationId = requestAnimationFrame(pulseAnimationLoop);
    }
}

function stopPulseAnimation() {
    if (pulseAnimationId !== null) {
        cancelAnimationFrame(pulseAnimationId);
        pulseAnimationId = null;
    }
}

function highlightPulseAnimationLoop() {
    if (!highlightedZone) {
        stopHighlightPulseAnimation();
        return;
    }
    clickCtx.clearRect(0, 0, clickCanvas.width, clickCanvas.height);

    const pulseFactor = (Math.sin(Date.now() / 250) + 1) / 2;
    const dynamicAlpha = 0.2 + (pulseFactor * 0.3);
    
    clickCtx.save();
    clickCtx.translate(panOffset.x, panOffset.y);
    clickCtx.scale(scale, scale);

    const zone = highlightedZone;
    const x = ((zone.min.lon - MAP_LON_MIN) / MAP_LON_RANGE) * clickCanvas.width;
    const y = ((zone.min.lat - MAP_LAT_MIN) / MAP_LAT_RANGE) * clickCanvas.height;
    const w = ((zone.max.lon - zone.min.lon) / MAP_LON_RANGE) * clickCanvas.width;
    const h = ((zone.max.lat - zone.min.lat) / MAP_LAT_RANGE) * clickCanvas.height;

    clickCtx.fillStyle = `rgba(245, 158, 11, ${dynamicAlpha})`;
    clickCtx.fillRect(x, y, w, h);

    clickCtx.strokeStyle = '#f59e0b';
    clickCtx.lineWidth = 2 / scale;
    clickCtx.strokeRect(x, y, w, h);

    clickCtx.restore();

    highlightPulseAnimationId = requestAnimationFrame(highlightPulseAnimationLoop);
}

function startHighlightPulseAnimation() {
    if (highlightPulseAnimationId === null) {
        highlightPulseAnimationId = requestAnimationFrame(highlightPulseAnimationLoop);
    }
}

function stopHighlightPulseAnimation() {
    if (highlightPulseAnimationId !== null) {
        cancelAnimationFrame(highlightPulseAnimationId);
        highlightPulseAnimationId = null;
        clickCtx.clearRect(0, 0, clickCanvas.width, clickCanvas.height);
    }
}

function notePulseAnimationLoop() {
    if (!document.getElementById('toggle-all-notes').checked) {
        stopNotePulseAnimation();
        return;
    }
    const pulseFactor = (Math.sin(Date.now() / 400) + 1) / 2;
    const dynamicScale = 0.9 + (pulseFactor * 0.2);

    drawExplorerNotes(dynamicScale);

    notePulseAnimationId = requestAnimationFrame(notePulseAnimationLoop);
}

function startNotePulseAnimation() {
    if (notePulseAnimationId === null) {
        notePulseAnimationId = requestAnimationFrame(notePulseAnimationLoop);
    }
}

function stopNotePulseAnimation() {
    if (notePulseAnimationId !== null) {
        cancelAnimationFrame(notePulseAnimationId);
        notePulseAnimationId = null;
        drawExplorerNotes();
    }
}

function zoomToSpot(lat, lon, zoomLevel = 4) {
    if (iframeToggle.checked) return;

    const width = mapCanvas.width;
    const height = mapCanvas.height;
    
    scale = Math.max(minScale, Math.min(maxScale, zoomLevel));
    
    const worldX = ((lon - SPOT_LON_MIN) / SPOT_LON_RANGE) * width;
    const worldY = ((lat - SPOT_LAT_MIN) / SPOT_LAT_RANGE) * height;

    panOffset.x = (width / 2) - (worldX * scale);
    panOffset.y = (height / 2) - (worldY * scale);

    panOffset.x = Math.min(0, Math.max(width * (1 - scale), panOffset.x));
    panOffset.y = Math.min(0, Math.max(height * (1 - scale), panOffset.y));

    redrawAll();
}

function showTooltip(content, screenX, screenY) {
    if (!tooltipElement || !tooltipContentElement) return;
    tooltipContentElement.innerHTML = content;
    
    const mapRect = mapContainer.getBoundingClientRect();
    
    tooltipElement.style.left = `${screenX}px`;
    tooltipElement.style.top = `${screenY - 15}px`;
    tooltipElement.classList.remove('hidden');

    // Adjust position if tooltip goes out of bounds
    const tooltipRect = tooltipElement.getBoundingClientRect();
    
    let finalLeft = screenX;
    if (tooltipRect.left < mapRect.left) {
        finalLeft = screenX + (mapRect.left - tooltipRect.left) + 10;
    } else if (tooltipRect.right > mapRect.right) {
        finalLeft = screenX - (tooltipRect.right - mapRect.right) - 10;
    }
    tooltipElement.style.left = `${finalLeft}px`;
}

function hideTooltip() {
    if (tooltipElement) {
        tooltipElement.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    
    mapNameDisplay = document.getElementById('map-name');
    creatureSelect = document.getElementById('creature-select');
    creatureSearch = document.getElementById('creature-search');
    mapImage = document.getElementById('map-image');
    legendContainer = document.getElementById('legend');
    loadingIndicator = document.getElementById('loading-indicator');
    regionInfoContainer = document.getElementById('region-info');
    resourceControls = document.getElementById('resource-controls');
    iframeToggle = document.getElementById('iframe-toggle');
    mapIframe = document.getElementById('map-iframe');
    mapContainer = document.querySelector('.map-container');
    liveMapTogglePanel = document.getElementById('live-map-toggle-panel');
    publicSpotsSlider = document.getElementById('public-spots-slider');
    spotsToggle = document.getElementById('spots-toggle');
    spotsToggleLabel = document.getElementById('spots-toggle-label');
    coordsDisplay = document.getElementById('coords-display');
    generalInfoPanel = document.getElementById('general-info-panel');
    caveSpotsCanvas = document.getElementById('cave-spots-canvas');
    caveSpotsSlider = document.getElementById('cave-spots-slider');
    caveSpotsToggle = document.getElementById('cave-spots-toggle');
    caveSpotsToggleLabel = document.getElementById('cave-spots-toggle-label');
    spawnCanvas = document.getElementById('spawn-canvas');
    resourceCanvas = document.getElementById('resource-canvas');
    obeliskCanvas = document.getElementById('obelisk-canvas');
    spotsCanvas = document.getElementById('spots-canvas');
    clickCanvas = document.getElementById('click-canvas');
    mapCanvas = document.getElementById('map-canvas');
    playerSpawnCanvas = document.getElementById('player-spawn-canvas');
    notesCanvas = document.getElementById('notes-canvas');
    tooltipElement = document.getElementById('map-tooltip');
    tooltipContentElement = document.getElementById('tooltip-content');

    spawnCtx = spawnCanvas.getContext('2d');
    resourceCtx = resourceCanvas.getContext('2d');
    obeliskCtx = obeliskCanvas.getContext('2d');
    spotsCtx = spotsCanvas.getContext('2d');
    caveSpotsCtx = caveSpotsCanvas.getContext('2d');
    clickCtx = clickCanvas.getContext('2d');
    mapCtx = mapCanvas.getContext('2d');
    regionCanvas = document.getElementById('region-canvas');
    regionCtx = regionCanvas.getContext('2d');
    playerSpawnCtx = playerSpawnCanvas.getContext('2d');
    notesCtx = notesCanvas.getContext('2d');

    
    const mapListHeader = document.getElementById('map-list-header');
    const mapListContent = document.getElementById('map-list-content');
    const mapListArrow = document.getElementById('map-list-arrow');
    const regionSpawnsHeader = document.getElementById('region-spawns-header');
    const regionInfoContent = document.getElementById('region-info-content');
    const regionSpawnsArrow = document.getElementById('region-spawns-arrow');

    
    mapListHeader.addEventListener('click', () => {
        mapListContent.classList.toggle('collapsed');
        mapListArrow.classList.toggle('collapsed');
    });

    regionSpawnsHeader.addEventListener('click', () => {
        regionInfoContent.classList.toggle('collapsed');
        regionSpawnsArrow.classList.toggle('collapsed');
        if (!regionInfoContent.classList.contains('collapsed')) {
            updateHighlightPreview(highlightedZone);
            if(highlightedZone) startHighlightPulseAnimation();
        } else {
            stopHighlightPulseAnimation();
        }
    });

    
    const rightSidebarSections = [
        { headerId: 'resources-header', contentId: 'resources-content', arrowId: 'resources-arrow' },
        { headerId: 'obelisks-header', contentId: 'obelisks-content', arrowId: 'obelisks-arrow' },
        { headerId: 'regions-header', contentId: 'regions-content', arrowId: 'regions-arrow' },
        { headerId: 'player-spawns-header', contentId: 'player-spawns-content', arrowId: 'player-spawns-arrow' },
        { headerId: 'notes-header', contentId: 'notes-content', arrowId: 'notes-arrow' }
    ];

    rightSidebarSections.forEach(section => {
        const header = document.getElementById(section.headerId);
        const content = document.getElementById(section.contentId);
        const arrow = document.getElementById(section.arrowId);
        if (header && content && arrow) {
            header.addEventListener('click', () => {
                content.classList.toggle('collapsed');
                arrow.classList.toggle('collapsed');
            });
        }
    });

    creatureSelect.addEventListener('change', () => {
        clickCtx.clearRect(0,0,clickCanvas.width,clickCanvas.height);
        clearHighlights();
        redrawAll();
    });
    creatureSearch.addEventListener('input', handleSearch);
    
    iframeToggle.addEventListener('change', () => {
        toggleLiveMapView(iframeToggle.checked);
    });

    spotsToggle.addEventListener('change', () => {
        if (spotsToggle.checked) {
            spotsToggleLabel.textContent = 'Anzeigen';
        } else {
            spotsToggleLabel.textContent = 'Verstecken';
            clearHighlights();
        }
        redrawAll();
    });

    caveSpotsToggle.addEventListener('change', () => {
        if (caveSpotsToggle.checked) {
            caveSpotsToggleLabel.textContent = 'Anzeigen';
        } else {
            caveSpotsToggleLabel.textContent = 'Verstecken';
            clearHighlights();
        }
        redrawAll();
    });

    const selectAllResources = document.getElementById('select-all-resources');
    if (selectAllResources) {
        selectAllResources.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            document.querySelectorAll('#resource-controls input[type="checkbox"]').forEach(cb => cb.checked = isChecked);
            redrawAll();
        });
    }

    const selectAllObelisks = document.getElementById('select-all-obelisks');
    if(selectAllObelisks) {
        selectAllObelisks.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            document.querySelectorAll('#obelisk-controls input[type="checkbox"]').forEach(cb => cb.checked = isChecked);
            redrawAll();
        });
    }
    
    const selectAllRegions = document.getElementById('select-all-regions');
    if(selectAllRegions) {
        selectAllRegions.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            document.querySelectorAll('#region-controls input[type="checkbox"]').forEach(cb => cb.checked = isChecked);
            redrawAll();
        });
    }

    const toggleAllPlayerSpawns = document.getElementById('toggle-all-player-spawns');
    if(toggleAllPlayerSpawns) {
        toggleAllPlayerSpawns.addEventListener('change', drawPlayerSpawns);
    }
    
    const toggleAllNotes = document.getElementById('toggle-all-notes');
    if(toggleAllNotes) {
        toggleAllNotes.addEventListener('change', () => {
            if (toggleAllNotes.checked) {
                startNotePulseAnimation();
            } else {
                stopNotePulseAnimation();
            }
        });
    }

    const sliderPrev = document.getElementById('slider-prev');
    if(sliderPrev) {
        sliderPrev.addEventListener('click', () => {
            publicSpotsSlider.scrollBy({ left: -266, behavior: 'smooth' });
        });
    }
    
    const sliderNext = document.getElementById('slider-next');
    if(sliderNext) {
        sliderNext.addEventListener('click', () => {
            publicSpotsSlider.scrollBy({ left: 266, behavior: 'smooth' });
        });
    }

    document.getElementById('spot-modal-close').addEventListener('click', closeSpotModal);
    
    const caveSliderPrev = document.getElementById('cave-slider-prev');
    if(caveSliderPrev) {
        caveSliderPrev.addEventListener('click', () => {
            caveSpotsSlider.scrollBy({ left: -266, behavior: 'smooth' });
        });
    }

    const caveSliderNext = document.getElementById('cave-slider-next');
    if(caveSliderNext) {
        caveSliderNext.addEventListener('click', () => {
            caveSpotsSlider.scrollBy({ left: 266, behavior: 'smooth' });
        });
    }

    document.getElementById('cave-spot-modal-close').addEventListener('click', closeCaveSpotModal);

    clickCanvas.addEventListener('click', handleMapClick);
    clickCanvas.addEventListener('wheel', handleZoom, { passive: false });
    clickCanvas.addEventListener('mousedown', startPan);
    clickCanvas.addEventListener('mousemove', (e) => {
        if (isPanning) {
            pan(e);
            return;
        }
        const { x, y } = getMapCoordsFromEvent(e);
        const clickRadius = 16;
        const lat = MAP_LAT_MIN + (y / mapCanvas.height) * MAP_LAT_RANGE;
        const lon = MAP_LON_MIN + (x / mapCanvas.width) * MAP_LON_RANGE;
        const coordsEl = document.getElementById('coords-display');

        coordsEl.querySelector('#lat-display').innerHTML = `Lat: <span class="font-bold text-amber-300">${lat.toFixed(2)}</span>`;
        coordsEl.querySelector('#lon-display').innerHTML = `Lon: <span class="font-bold text-amber-300">${lon.toFixed(2)}</span>`;

        let currentlyHoveredSpot = null;
        if (spotsToggle.checked && allPublicSpotsData.publicSpots) {
            currentlyHoveredSpot = [...allPublicSpotsData.publicSpots].reverse().find(spot => {
                 const spotX = ((spot.lon - SPOT_LON_MIN) / SPOT_LON_RANGE) * mapCanvas.width;
                const spotY = ((spot.lat - SPOT_LAT_MIN) / SPOT_LAT_RANGE) * mapCanvas.height;
                const distance = Math.sqrt(Math.pow(x - spotX, 2) + Math.pow(y - (spotY - 16), 2));
                return distance < clickRadius;
            })?.id || null;
        }
        if (hoveredSpotId !== currentlyHoveredSpot) {
            hoveredSpotId = currentlyHoveredSpot;
            redrawAll();
        }

        let currentlyHoveredObelisk = null;
        if (allObeliskData.obelisks) {
            const checkedObeliskNames = Array.from(document.querySelectorAll('#obelisk-controls input:checked')).map(cb => cb.name);
            const visibleObelisks = allObeliskData.obelisks.filter(o => checkedObeliskNames.includes(o.name));
            
            currentlyHoveredObelisk = [...visibleObelisks].reverse().find(obelisk => {
                const baseIconWidth = obeliskIcons[obelisk.name] ? obeliskIcons[obelisk.name].width * 0.15 : 20;
                const baseIconHeight = obeliskIcons[obelisk.name] ? obeliskIcons[obelisk.name].height * 0.15 : 20;
                const obeliskX = ((obelisk.lon - SPOT_LON_MIN) / SPOT_LON_RANGE) * mapCanvas.width;
                const obeliskY = ((obelisk.lat - SPOT_LAT_MIN) / SPOT_LAT_RANGE) * mapCanvas.height;
                return x > obeliskX - baseIconWidth/2 && x < obeliskX + baseIconWidth/2 && y > obeliskY - baseIconHeight && y < obeliskY;
            })?.name || null;
        }
        if (hoveredObeliskId !== currentlyHoveredObelisk) {
            hoveredObeliskId = currentlyHoveredObelisk;
            redrawAll();
        }

        let currentlyHoveredCaveSpot = null;
        if (caveSpotsToggle.checked && allCaveSpotsData.caveSpots) {
            currentlyHoveredCaveSpot = [...allCaveSpotsData.caveSpots].reverse().find(spot => {
                const spotX = ((spot.lon - SPOT_LON_MIN) / SPOT_LON_RANGE) * mapCanvas.width;
                const spotY = ((spot.lat - SPOT_LAT_MIN) / SPOT_LAT_RANGE) * mapCanvas.height;
                const distance = Math.sqrt(Math.pow(x - spotX, 2) + Math.pow(y - (spotY - 16), 2));
                return distance < clickRadius;
            })?.id || null;
        }
        if (hoveredCaveSpotId !== currentlyHoveredCaveSpot) {
            hoveredCaveSpotId = currentlyHoveredCaveSpot;
            redrawAll();
        }

    });
    clickCanvas.addEventListener('mouseup', endPan);
    clickCanvas.addEventListener('mouseleave', () => {
         endPan();
         const coordsEl = document.getElementById('coords-display');
         
         coordsEl.querySelector('#lat-display').innerHTML = `Lat: <span class="font-bold text-amber-300">0.00</span>`;
         coordsEl.querySelector('#lon-display').innerHTML = `Lon: <span class="font-bold text-amber-300">0.00</span>`;

         if (hoveredSpotId !== null || hoveredObeliskId !== null || hoveredCaveSpotId !== null) {
                hoveredSpotId = null;
                hoveredObeliskId = null;
                hoveredCaveSpotId = null;
                redrawAll();
         }
    });

    window.addEventListener('resize', handleResize);
    
    initializeApp();
});

document.addEventListener('contextmenu', event => event.preventDefault());
