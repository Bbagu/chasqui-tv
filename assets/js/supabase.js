// Configuración de Supabase - Chasqui TV
const SUPABASE_URL = "https://yasohefmwjqicsbithja.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhc29oZWZtd2pxaWNzYml0aGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MDE3MjIsImV4cCI6MjA5NDA3NzcyMn0.RqfW2CwsBXv4T0hgCCdt4a6l4Wm3HPHTxXsSD_vhMfQ";

// Inicializar el cliente de Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Hacerlo disponible globalmente
window.supabase = supabase;
