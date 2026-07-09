// leaderboard
async function openLeaderboard() {
    toggleModal('stats-page', true);
    
    const list = document.getElementById('global-ranking-list');
    if (!list) return;
    
    list.innerHTML = `<p class="text-xs text-emerald-500 font-bold uppercase tracking-wider text-center py-4"><i class="fas fa-spinner fa-spin mr-2"></i>Se încarcă topul agenților...</p>`;

    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .order('points', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            list.innerHTML = `<p class="text-xs text-slate-400 font-bold uppercase text-center py-4">Nu există agenți înregistrați.</p>`;
            return;
        }
        
        list.innerHTML = data.map((u, i) => {
            const rank = getRankInfo(u.points);
            // Dacă utilizatorul are un avatar în storage îl folosim, altfel punem fallback dynamic
            const avatarUrl = u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`;
            
            return `
                <div class="flex items-center gap-4 p-4 bg-[#1A2E24] rounded-2xl border-l-4 shadow-md transition-all hover:border-emerald-500" style="border-color:${rank.color}">
                    <div class="font-black text-emerald-400 w-6 text-sm text-center">${i + 1}</div>
                    <img src="${avatarUrl}" class="w-8 h-8 rounded-full bg-[#14241C] border border-emerald-900/30 object-cover">
                    <div class="flex-1 min-w-0">
                        <p class="font-black text-xs uppercase italic text-slate-100 truncate">${sanitize(u.username)}</p>
                        <p class="text-[8px] font-bold uppercase tracking-wider" style="color:${rank.color}">${rank.name}</p>
                    </div>
                    <div class="font-black text-emerald-400 text-xs bg-[#14241C] px-3 py-1.5 rounded-xl border border-emerald-950">${u.points} PCT</div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error("Eroare la încărcarea clasamentului:", err);
        list.innerHTML = `<p class="text-xs text-red-400 font-bold uppercase text-center py-4">Eroare la conectarea cu baza de date.</p>`;
    }
}