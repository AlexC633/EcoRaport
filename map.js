let map;
let markerCluster;
let cachedReports = [];

function initMap() {
    map = L.map('map', { zoomControl: true }).setView([44.8565, 24.8697], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    markerCluster = L.markerClusterGroup({
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true
    });
    map.addLayer(markerCluster);

    setupFilterEvents();
}

function updateMarkers(reports) {
    if (!map || !markerCluster) return;

    if (reports && cachedReports.length === 0) {
        cachedReports = reports;
    }

    markerCluster.clearLayers();

    reports.forEach(r => {
        const lat = parseFloat(r.latitude);
        const lng = parseFloat(r.longitude);

        if (!isNaN(lat) && !isNaN(lng)) {
            const rank = getRankInfo(r.profiles?.points || 0);
            const esteRezolvat = r.status === 'Rezolvat' || r.status === 'resolved';
            const statusColor = esteRezolvat ? '#10b981' : '#ef4444'; 
            const statusText = esteRezolvat ? 'REZOLVAT' : 'ÎN AȘTEPTARE';
            
            const marker = L.marker([lat, lng]);
            
            // Cream containerul principal al popup-ului ca element DOM nativ
            const container = document.createElement('div');
            container.style.textAlign = 'center';
            container.style.minWidth = '180px';
            container.style.fontFamily = 'sans-serif';
            container.style.padding = '5px';

            container.innerHTML = `
                <img src="${r.image_url}" style="width:100%; border-radius:12px; margin-bottom:8px; object-fit: cover; height: 110px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <p style="margin: 0 0 4px 0; font-weight: 900; font-size: 13px; text-transform: uppercase; color: #1e293b;">
                    ${sanitize(r.profiles?.username || 'Anonim')}
                </p>
                <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 10px; color: ${rank.color};">
                    RANK: ${rank.name}
                </p>
                <div style="border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 4px;">
                    <span style="font-size: 9px; font-weight: 900; text-transform: uppercase; color: #64748b;">Status:</span>
                    <p style="margin: 2px 0 0 0; font-weight: 900; font-size: 12px; color: ${statusColor};">
                        ${statusText}
                    </p>
                </div>
            `;

            // Dacă incidentul nu este rezolvat construim și legam butoanele de vot direct prin DOM
            if (!esteRezolvat) {
                const votingDiv = document.createElement('div');
                votingDiv.style.marginTop = '8px';
                votingDiv.style.borderTop = '1px dashed #e2e8f0';
                votingDiv.style.paddingTop = '8px';

                votingDiv.innerHTML = `<p style="margin: 0 0 6px 0; font-size: 8px; font-weight: 900; color: #64748b; text-transform: uppercase;">Validare Comunitară:</p>`;

                const btnFlex = document.createElement('div');
                btnFlex.style.display = 'flex';
                btnFlex.style.gap = '4px';
                btnFlex.style.justifyContent = 'center';

                // Creare buton Confirm
                const btnConfirm = document.createElement('button');
                btnConfirm.innerText = '✓ Confirm';
                btnConfirm.style.cssText = "background: #10b981; color: white; border: none; padding: 4px 8px; font-size: 8px; font-weight: bold; border-radius: 6px; cursor: pointer; text-transform: uppercase;";
                btnConfirm.onclick = () => window.submitCommunityVote(r.id, 'confirm');

                // Creare buton Fake
                const btnFake = document.createElement('button');
                btnFake.innerText = '⚠ Fake';
                btnFake.style.cssText = "background: #ef4444; color: white; border: none; padding: 4px 8px; font-size: 8px; font-weight: bold; border-radius: 6px; cursor: pointer; text-transform: uppercase;";
                btnFake.onclick = () => window.submitCommunityVote(r.id, 'fake');

                btnFlex.appendChild(btnConfirm);
                btnFlex.appendChild(btnFake);
                votingDiv.appendChild(btnFlex);
                container.appendChild(votingDiv);
            }
            
            marker.bindPopup(container);
            markerCluster.addLayer(marker);
        }
    });
}

function setupFilterEvents() {
    const btnAll = document.getElementById('filter-all');
    const btnPending = document.getElementById('filter-pending');
    const btnResolved = document.getElementById('filter-resolved');

    const setActiveButton = (activeBtn, otherBtns) => {
        if (activeBtn) activeBtn.className = "px-3 py-1.5 rounded-lg bg-emerald-600 text-white transition-all";
        otherBtns.forEach(b => {
            if (b) b.className = "px-3 py-1.5 rounded-lg text-emerald-500 hover:text-emerald-300 transition-all";
        });
    };

    if (btnAll) {
        btnAll.onclick = () => {
            setActiveButton(btnAll, [btnPending, btnResolved]);
            updateMarkers(cachedReports);
        };
    }

    if (btnPending) {
        btnPending.onclick = () => {
            setActiveButton(btnPending, [btnAll, btnResolved]);
            const filtered = cachedReports.filter(r => r.status !== 'Rezolvat' && r.status !== 'resolved');
            updateMarkers(filtered);
        };
    }

    if (btnResolved) {
        btnResolved.onclick = () => {
            setActiveButton(btnResolved, [btnAll, btnPending]);
            const filtered = cachedReports.filter(r => r.status === 'Rezolvat' || r.status === 'resolved');
            updateMarkers(filtered);
        };
    }
}