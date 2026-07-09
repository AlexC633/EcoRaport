let userCoords = null;
let userData = null;
let isUsernameValid = false;
let isPasswordValid = false;
let isPhotoVerified = false;

// Actualizează elementul mic de imagine 
function updateNavbarAvatar(user) {
    const authBtn = document.getElementById('auth-trigger');
    if (!authBtn) return;
    
    if (user.avatar_url) {
        authBtn.innerHTML = `<img src="${user.avatar_url}" class="w-full h-full object-cover rounded-full border border-emerald-500/40">`;
    } else {
        authBtn.innerHTML = `<i class="fas fa-user-circle text-lg"></i>`;
    }
}

// Logica de randare a datelor in profil
async function openUserProfile() {
    if (!userData) return;

    try {
        const stats = await fetchUserStats(userData.id);
        const currentPoints = userData.points || 0;
        const rank = getRankInfo(currentPoints);
        
        document.getElementById('menu-username').innerText = sanitize(userData.username);
        
        const rankEl = document.getElementById('menu-rank');
        rankEl.innerText = `RANK: ${rank.name}`;
        rankEl.style.color = rank.color;

        document.getElementById('menu-avatar').src = userData.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=" + userData.username;

        let prevLevelPoints = 0;
        let nextLevelPoints = 50;

        if (currentPoints < 50) {
            prevLevelPoints = 0;
            nextLevelPoints = 50;
        } else if (currentPoints < 100) {
            prevLevelPoints = 50;
            nextLevelPoints = 100;
        } else if (currentPoints < 200) {
            prevLevelPoints = 100;
            nextLevelPoints = 200;
        } else if (currentPoints < 400) {
            prevLevelPoints = 200;
            nextLevelPoints = 400;
        } else {
            prevLevelPoints = 400;
            nextLevelPoints = currentPoints;
        }

        let procent = 100;
        if (nextLevelPoints !== prevLevelPoints) {
            procent = ((currentPoints - prevLevelPoints) / (nextLevelPoints - prevLevelPoints)) * 100;
        }
        
        procent = Math.min(Math.max(procent, 0), 100);
        document.getElementById('menu-progress-bar').style.width = `${procent}%`;
        document.getElementById('menu-progress-text').innerText = `${currentPoints} / ${nextLevelPoints} PCT`;

        document.getElementById('stat-total-reports').innerText = stats.total_reports;
        document.getElementById('stat-resolved-reports').innerText = stats.resolved_reports;

        // Obtinem istoricul personal
        const { data: userReports } = await supabaseClient
            .from('reports')
            .select('*')
            .eq('user_id', userData.id)
            .order('created_at', { ascending: false });

        const totalRapoarte = userReports ? userReports.length : 0;

        // Randam insignele
        const badgesContainer = document.getElementById('badges-container');
        if (badgesContainer) {
            const areExifValid = userReports ? userReports.some(r => r.is_verified === true) : false;
            
            const badgeList = [
                { id: 'b1', name: 'Rookie', icon: 'fa-baby', active: totalRapoarte >= 1, desc: 'Primul raport trimis' },
                { id: 'b2', name: 'Cyber Eco', icon: 'fa-fingerprint', active: areExifValid, desc: 'EXIF 100% Validat' },
                { id: 'b3', name: 'Elite', icon: 'fa-shield-alt', active: currentPoints >= 100, desc: 'Minim 100 PCT obținute' },
                { id: 'b4', name: 'Guardian', icon: 'fa-globe-europe', active: currentPoints >= 400, desc: 'Salvator al planetei' }
            ];

            badgesContainer.innerHTML = badgeList.map(b => `
                <div class="flex flex-col items-center p-1 text-center group relative">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center text-sm mb-1 transition-all ${b.active ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-slate-900 text-slate-700 border border-slate-800'}">
                        <i class="fas ${b.icon}"></i>
                    </div>
                    <span class="text-[7px] font-black uppercase ${b.active ? 'text-slate-300' : 'text-slate-600'}">${b.name}</span>
                </div>
            `).join('');
        }

        // Randam lista din istoric
        const historyList = document.getElementById('my-reports-list');
        if (historyList) {
            if (!userReports || userReports.length === 0) {
                historyList.innerHTML = `<p class="text-[10px] text-emerald-700 font-bold uppercase text-center py-4">Fără activitate.</p>`;
            } else {
                historyList.innerHTML = userReports.map(r => {
                    const esteRezolvat = r.status === 'Rezolvat' || r.status === 'resolved';
                    return `
                        <div class="flex items-center gap-3 p-2 bg-[#14241C] rounded-xl border border-emerald-900/10">
                            <img src="${r.image_url}" class="w-8 h-8 object-cover rounded-lg">
                            <div class="flex-1 min-w-0">
                                <p class="text-[9px] font-black text-slate-300 truncate">Incident #${r.id.toString().substring(0, 5)}</p>
                            </div>
                            <span class="text-[7px] font-black uppercase px-2 py-1 rounded-md ${esteRezolvat ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}">
                                ${esteRezolvat ? 'Rezolvat' : 'Activ'}
                            </span>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (err) {
        console.error("Eroare la incarcare profil:", err);
    }
    toggleModal('user-menu-overlay', true);
}

// 2. FUNCTIA WINDOW.ONLOAD PENTRU EVENIMENTE PRINCIPALE

window.onload = async () => {
    try {
        userData = await getSession();
    } catch (e) {
        console.log("Sesiune inexistentă");
    }
    
    if (typeof initMap === "function") initMap();
    await loadLiveNews();

    try {
        const reports = await fetchAllReports();
        if (reports && typeof updateMarkers === "function") updateMarkers(reports);
    } catch (e) {
        console.error(e);
    }

    if (userData) {
        const rank = getRankInfo(userData.points || 0);
        const authBtn = document.getElementById('auth-trigger');
        if (authBtn) authBtn.style.color = rank.color;
        updateNavbarAvatar(userData);
    }

    navigator.geolocation.getCurrentPosition(pos => {
        userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (typeof map !== 'undefined' && map) map.setView([userCoords.lat, userCoords.lng], 15);
    }, err => console.warn("GPS inactiv"));

    const bind = (id, fn) => {
        const el = document.getElementById(id);
        if (el) el.onclick = fn;
    };

    // Evenimente Navigare 
    bind('auth-trigger', () => { userData ? openUserProfile() : toggleModal('auth-overlay', true); });
    bind('btn-close-auth', () => toggleModal('auth-overlay', false));
    bind('close-menu', () => toggleModal('user-menu-overlay', false));
    
    bind('leaderboard-trigger', () => { openLeaderboard(); }); // Aici apelează leaderboard
    bind('close-stats', () => toggleModal('stats-page', false));

    bind('rewards-trigger', () => { openRewardsMarketplace(); }); // Aici apelează rewards
    bind('close-rewards', () => toggleModal('rewards-page', false));

    bind('go-to-reg', () => { document.getElementById('login-form').classList.add('hidden'); document.getElementById('register-form').classList.remove('hidden'); });
    bind('go-to-login', () => { document.getElementById('register-form').classList.add('hidden'); document.getElementById('login-form').classList.remove('hidden'); });

    // Schimbare imagine profil cu încărcare brută în bucket-ul 'avatars'
    const avatarContainer = document.getElementById('avatar-container');
    const avatarInput = document.getElementById('avatar-file-input');
    if (avatarContainer && avatarInput) {
        avatarContainer.onclick = () => avatarInput.click();
        avatarInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file || !userData) return;
            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${userData.id}_${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabaseClient.storage.from('avatars').upload(fileName, file, { cacheControl: '3600', upsert: true });
                if (uploadError) throw uploadError;

                const { data: urlData } = supabaseClient.storage.from('avatars').getPublicUrl(fileName);
                const publicUrl = urlData.publicUrl;

                await supabaseClient.from('profiles').update({ avatar_url: publicUrl }).eq('id', userData.id);
                userData.avatar_url = publicUrl;
                document.getElementById('menu-avatar').src = publicUrl;
                updateNavbarAvatar(userData);
                alert("Fotografia de profil a fost salvată în Storage!");
            } catch (error) {
                console.error(error);
            }
        };
    }

    // Logica Login / Register
    bind('btn-do-login', async () => {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        try { await handleLogin(email, password); } catch (e) { alert(e.message); }
    });

    bind('btn-do-register', async () => {
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-pass').value;
        const username = document.getElementById('reg-user').value.trim();
        try { await handleRegister(email, password, username); } catch (e) { alert(e.message); }
    });

    bind('btn-logout', async () => { await supabaseClient.auth.signOut(); location.reload(); });

    // Camera si ransmisie deseu
    const uploadZone = document.getElementById('upload-zone');
    const camInput = document.getElementById('camera-input');
    const metadataBadge = document.getElementById('metadata-badge');

    if (uploadZone && camInput) uploadZone.onclick = () => camInput.click();
    if (camInput) {
        camInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            isPhotoVerified = false;
            if (metadataBadge) metadataBadge.classList.add('hidden');

            EXIF.getData(file, function() {
                const exifLong = EXIF.getTag(this, "GPSLongitude");
                const exifLat = EXIF.getTag(this, "GPSLatitude");
                const exifLongRef = EXIF.getTag(this, "GPSLongitudeRef");
                const exifLatRef = EXIF.getTag(this, "GPSLatitudeRef");

                if (exifLat && exifLong) {
                    const imageLat = convertEXIFToDecimal(exifLat, exifLatRef);
                    const imageLng = convertEXIFToDecimal(exifLong, exifLongRef);
                    if (userCoords) {
                        const distanta = calculateDistance(userCoords.lat, userCoords.lng, imageLat, imageLng);
                        if (distanta < 0.5) isPhotoVerified = true;
                    }
                }
                if (metadataBadge) {
                    metadataBadge.classList.remove('hidden');
                    metadataBadge.className = isPhotoVerified ? "text-center text-[10px] font-black p-3 rounded-xl bg-emerald-950/50 text-emerald-400 border border-emerald-500/30" : "text-center text-[10px] font-black p-3 rounded-xl bg-amber-950/50 text-amber-400 border border-amber-500/30";
                    metadataBadge.innerText = isPhotoVerified ? "✓ Autenticitate confirmată: Coordonatele geografice corespund." : "⚠ Locație foto indisponibilă: Lipsă metadate GPS native.";
                }
            });

            const reader = new FileReader();
            reader.onload = (f) => {
                document.getElementById('preview').src = f.target.result;
                document.getElementById('preview').classList.remove('hidden');
                document.getElementById('placeholder').classList.add('hidden');
                const btnSub = document.getElementById('btn-submit');
                btnSub.disabled = false;
                btnSub.classList.replace('bg-[#223C2F]', 'bg-emerald-600');
                btnSub.classList.replace('text-emerald-700', 'text-white');
            };
            reader.readAsDataURL(file);
        };
    }

    bind('btn-submit', async () => {
        const btn = document.getElementById('btn-submit');
        if (!userData) return alert("Trebuie să fii logat!");
        btn.innerText = "SE TRANSMITE...";
        btn.disabled = true;
        try {
            await uploadReport(camInput.files[0], userCoords || {lat: 44.8565, lng: 24.8697}, userData.id, isPhotoVerified);
            alert("Raportare trimisă cu succes!");
            location.reload();
        } catch (e) { alert(e.message); btn.innerText = "EXECUTĂ TRANSMISIA"; btn.disabled = false; }
    });
};

async function loadLiveNews() {
    const container = document.getElementById('news-container');
    if (!container) return;
    try {
        const { data: news } = await supabaseClient.from('news').select('*').order('id', { ascending: false }).limit(2);
        if (!news || news.length === 0) return;
        container.innerHTML = news.map(n => `
            <div class="bg-[#1A2E24] p-5 rounded-2xl border border-emerald-900/20 flex flex-col justify-between hover:border-emerald-500/30 transition-all">
                <div>
                    <span class="text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-[#14241C] px-2 py-1 rounded-md">${sanitize(n.category)}</span>
                    <h3 class="font-black text-xs uppercase italic tracking-tight text-emerald-100 mt-2">${sanitize(n.title)}</h3>
                    <p class="text-[11px] text-emerald-600/90 mt-1 leading-relaxed">${sanitize(n.content)}</p>
                </div>
                <p class="text-[9px] font-bold text-emerald-700/80 uppercase mt-3"><i class="far fa-clock mr-1"></i> ${formatNewsTime(n.created_at)}</p>
            </div>
        `).join('');
    } catch (e) {}
}