async function uploadReport(file, coords, userId, isVerified) {
    const fName = `${Date.now()}_${file.name}`;
    
    const { error: upErr } = await supabaseClient.storage.from('trash-reports').upload(fName, file);
    if (upErr) throw upErr;
    
    const { data: urlData } = supabaseClient.storage.from('trash-reports').getPublicUrl(fName);
    
    const { error: insErr } = await supabaseClient.from('reports').insert([{ 
        image_url: urlData.publicUrl, 
        latitude: coords.lat, 
        longitude: coords.lng, 
        user_id: userId,
        status: 'pending',
        is_verified: isVerified
    }]);
    if (insErr) throw insErr;
    
    await supabaseClient.rpc('increment_points', { user_id_param: userId, amount: 10 });
}

async function fetchAllReports() {
    const { data: reports, error: rErr } = await supabaseClient.from('reports').select('*');
    if (rErr) throw rErr;

    const { data: profiles, error: pErr } = await supabaseClient.from('profiles').select('*');
    if (pErr) return reports;

    return reports.map(r => {
        const profilAsociat = profiles.find(p => p.id === r.user_id);
        return {
            ...r,
            profiles: profilAsociat || { username: 'Agent Eco', points: 0 }
        };
    });
}

// Funcție nouă pentru preluarea statisticilor specifice utilizatorului
async function fetchUserStats(userId) {
    const { data, error } = await supabaseClient.rpc('get_user_stats', { user_id_param: userId });
    if (error) {
        console.error("Eroare la preluarea statisticilor:", error);
        return { total_reports: 0, resolved_reports: 0 };
    }
    return data[0] || { total_reports: 0, resolved_reports: 0 };
}