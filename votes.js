async function submitCommunityVote(reportId, voteType) {
    console.log(`Funcția submitCommunityVote a fost apelată pentru raportul: ${reportId}, tip vot: ${voteType}`);

    if (!userData) {
        alert("Trebuie să fii autentificat pentru a vota validitatea acestui incident!");
        if (typeof toggleModal === "function") toggleModal('auth-overlay', true);
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('report_votes')
            .insert([
                {
                    report_id: reportId,
                    user_id: userData.id,
                    vote_type: voteType
                }
            ]);

        if (error) {
            if (error.code === '23505') {
                alert("Ai votat deja la acest incident! Protocolul permite un singur vot per agent.");
            } else {
                throw error;
            }
            return;
        }

        alert("Votul tău a fost înregistrat securizat în rețea!");
        
        if (typeof fetchAllReports === "function" && typeof updateMarkers === "function") {
            const updatedReports = await fetchAllReports();
            updateMarkers(updatedReports);
        }

    } catch (err) {
        console.error("Eroare la procesarea votului comunitar:", err);
        alert("Eroare la transmiterea votului.");
    }
}

window.submitCommunityVote = submitCommunityVote;