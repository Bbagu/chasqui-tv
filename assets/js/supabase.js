// Configuración de Supabase - Chasqui TV
(function() {
    const SUPABASE_URL = "https://yasohefmwjqicsbithja.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhc29oZWZtd2pxaWNzYml0aGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MDE3MjIsImV4cCI6MjA5NDA3NzcyMn0.RqfW2CwsBXv4T0hgCCdt4a6l4Wm3HPHTxXsSD_vhMfQ";

    // 1. Verificar si ya tenemos una instancia del cliente funcionando
    if (window.supabase && typeof window.supabase.from === 'function') {
        console.log("Supabase ya estaba inicializado.");
        return;
    }

    // 2. Verificar que la librería de Supabase esté cargada (objeto global de la CDN)
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        console.error("Error: La librería de Supabase no se encontró. Asegúrate de incluir el script CDN antes de este archivo.");
        return;
    }

    // 3. Crear el cliente e inicializarlo
    try {
        const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });

        // 4. Sobrescribir el objeto global con la instancia del cliente
        window.supabase = supabaseClient;
        console.log("Supabase inicializado correctamente.");
    } catch (error) {
        console.error("Error al inicializar el cliente de Supabase:", error);
    }
})();
