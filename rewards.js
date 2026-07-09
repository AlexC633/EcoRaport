// magazinul de recompense
function openRewardsMarketplace() {
    if (userData) {
        const currentPoints = userData.points || 0;
        const displayEl = document.getElementById('rewards-points-display');
        if (displayEl) displayEl.innerText = `${currentPoints} PCT`;
    } else {
        const displayEl = document.getElementById('rewards-points-display');
        if (displayEl) displayEl.innerText = `0 PCT`;
    }
    toggleModal('rewards-page', true);
}

window.handleClaim = async (cost, actionText) => {
    if (!userData) {
        alert("Trebuie să fii logat ca să poți revendica o recompensă!");
        toggleModal('auth-overlay', true);
        return;
    }

    const currentPoints = userData.points || 0;

    if (currentPoints < cost) {
        const pointsNeeded = cost - currentPoints;
        const popup = document.getElementById('custom-popup');
        const messageEl = document.getElementById('popup-message');

        if (popup && messageEl) {
            messageEl.innerText = `Mai ai nevoie de ${pointsNeeded} puncte pentru a ${actionText}.`;
            popup.classList.remove('hidden');
            
            setTimeout(() => {
                popup.classList.add('hidden');
            }, 4000);
        }
    } else {
        try {
            // Actualizăm punctele în baza de date
            const { error } = await supabaseClient
                .from('profiles')
                .update({ points: currentPoints - cost })
                .eq('id', userData.id);

            if (error) throw error;
            
            // Actualizăm sesiunea locală
            userData.points -= cost;
            
            // Reîmprospătăm elementul vizual de puncte din magazin
            const displayEl = document.getElementById('rewards-points-display');
            if (displayEl) displayEl.innerText = `${userData.points} PCT`;
            
            alert(`Felicitări! Ai consumat ${cost} puncte pentru a ${actionText}. Codul de validare unic a fost generat.`);
            location.reload();
        } catch (e) {
            console.error("Eroare la tranzacție puncte:", e);
            alert("Eroare tehnică la procesarea punctelor.");
        }
    }
};