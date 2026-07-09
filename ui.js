function toggleModal(id, show) {
    const el = document.getElementById(id);
    if (el) show ? el.classList.remove('hidden') : el.classList.add('hidden');
}

async function loadLeaderboard() {
    const { data } = await supabaseClient.from('profiles').select('*').order('points', { ascending: false });
    const list = document.getElementById('global-ranking-list');
    if (!list) return;
    
    list.innerHTML = data.map((u, i) => {
        const rank = getRankInfo(u.points);
        return `<div class="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border-l-4" style="border-color:${rank.color}">
            <div class="font-black text-black w-6">${i+1}</div>
            <div class="flex-1">
                <p class="font-black text-xs uppercase italic text-black">${sanitize(u.username)}</p>
                <p class="text-[9px] font-bold uppercase" style="color:${rank.color}">${rank.name}</p>
            </div>
            <div class="font-black text-emerald-600 text-sm">${u.points} PCT</div>
        </div>`;
    }).join('');
}

function updatePasswordUI(validations) {
    const reqLength = document.getElementById('req-length');
    const reqNum = document.getElementById('req-num');
    const reqSpec = document.getElementById('req-spec');

    if (reqLength) {
        if (validations.hasLength) {
            reqLength.classList.replace('text-slate-400', 'text-emerald-600');
            reqLength.innerHTML = '✓ Minim 8 caractere';
        } else {
            reqLength.className = 'text-slate-400';
            reqLength.innerHTML = '● Minim 8 caractere';
        }
    }

    if (reqNum) {
        if (validations.hasNumber) {
            reqNum.classList.replace('text-slate-400', 'text-emerald-600');
            reqNum.innerHTML = '✓ Un număr';
        } else {
            reqNum.className = 'text-slate-400';
            reqNum.innerHTML = '● Un număr';
        }
    }

    if (reqSpec) {
        if (validations.hasSpecial) {
            reqSpec.classList.replace('text-slate-400', 'text-emerald-600');
            reqSpec.innerHTML = '✓ Un caracter special';
        } else {
            reqSpec.className = 'text-slate-400';
            reqSpec.innerHTML = '● Un caracter special';
        }
    }
}

function updateUsernameUI(status) {
    const iconEl = document.getElementById('user-check-icon');
    if (!iconEl) return;

    if (status === 'checking') {
        iconEl.innerHTML = '<i class="fas fa-spinner fa-spin text-slate-400 text-xs"></i>';
    } else if (status === 'available') {
        iconEl.innerHTML = '<i class="fas fa-check-circle text-emerald-500 text-xs"></i>';
    } else if (status === 'taken') {
        iconEl.innerHTML = '<i class="fas fa-times-circle text-red-500 text-xs"></i>';
    } else {
        iconEl.innerHTML = '';
    }
}