async function getSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) return null;
    const { data } = await supabaseClient.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    return { ...session.user, ...data };
}

async function handleLogin(email, password) {
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    location.reload();
}

async function handleRegister(email, password, username) {
    // 1. Inregistram userul in Supabase
    const { data, error } = await supabaseClient.auth.signUp({
        email, 
        password, 
        options: { 
            data: { display_name: username }
        }
    });
    
    if (error) throw error;
    
    // 2. Folosim UPSERT în loc de INSERT pentru a preveni eroarea de cheie duplicat (profiles_pkey)
    if (data.user) {
        const { error: profileErr } = await supabaseClient
            .from('profiles')
            .upsert([{ 
                id: data.user.id, 
                username: username, 
                points: 0, 
                rank: 'Eco-Rookie' 
            }], { onConflict: 'id' }); 
            
        if (profileErr) {
            console.error("Eroare la crearea profilului în baza de date:", profileErr);
            throw profileErr;
        }
        
        alert("Cont creat cu succes! Verifică email-ul pentru confirmare!");
        location.reload();
    }
}

async function signInSocial(provider) {
    await supabaseClient.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
}

function validatePassword(p) {
    return { hasLength: p.length >= 8, hasNumber: /\d/.test(p), hasSpecial: /[!@#$%^&*]/.test(p) };
}

async function isUsernameAvailable(u) {
    if (u.length < 3) return null;
    const { data } = await supabaseClient.from('profiles').select('username').eq('username', u).maybeSingle();
    return !data;
}