const SUPABASE_URL = 'https://rbmmipvdgjynqrblnbyu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_AQj9OPtkBkEaTNf7tYGJ_A_GRXJnHE8';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function getRankInfo(points) {
    if (points < 50) return { name: "Eco-Rookie", color: "#94a3b8" }; 
    if (points < 100) return { name: "Eco-Hunter", color: "#7dd3fc" }; 
    if (points < 200) return { name: "Eco-Guardian", color: "#1d4ed8" }; 
    if (points < 400) return { name: "Trash-Destroyer", color: "#a855f7" }; 
    return { name: "Planet SAVER", color: "#10b981" }; 
}

function sanitize(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}