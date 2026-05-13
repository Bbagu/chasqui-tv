/**
 * main.js - Lógica central de Chasqui TV
 * Maneja la carga dinámica de contenido desde Supabase
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar Menú de Navegación
    renderNavigation();

    // 2. Si estamos en el Home, cargar contenido del Home
    if (document.getElementById('home-content')) {
        renderHomeContent();
    }

    // 3. Si estamos en una página de noticia, cargar noticia
    if (document.getElementById('articulo')) {
        renderNoticiaDetalle();
    }

    // 4. Si estamos en una página de categoría, cargar listado
    if (document.getElementById('category-page')) {
        renderCategoryPage();
    }

    // 5. Si estamos en la página de búsqueda
    if (document.getElementById('searchTerm')) {
        renderSearchResults();
    }

    // 6. Configurar la barra de búsqueda global (Header)
    setupGlobalSearch();

    // 7. Configurar formularios de Newsletter
    setupNewsletter();

    // 8. Cargar Widgets de Sidebar (Más leídas)
    renderSidebarWidgets();
});

/**
 * Gestiona la suscripción al newsletter en todo el sitio
 */
function setupNewsletter() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        const emailInput = form.querySelector('input[type="email"]');
        if (!emailInput) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = emailInput.value.trim();
            const btn = form.querySelector('button');
            const originalText = btn.textContent;

            if (!email) return;

            try {
                btn.disabled = true;
                btn.textContent = 'PROCESANDO...';

                const { error } = await window.supabase
                    .from('suscriptores')
                    .insert([{ email: email, activo: true }]);

                if (error) {
                    if (error.code === '23505') throw new Error('Este correo ya está registrado.');
                    throw error;
                }

                alert('¡Gracias por suscribirte a Chasqui TV!');
                emailInput.value = '';

            } catch (err) {
                alert(err.message);
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
    });
}

/**
 * Configura los inputs de búsqueda en el header
 */
function setupGlobalSearch() {
    const searchInputs = document.querySelectorAll('header input[type="text"], .search-box input');
    const searchButtons = document.querySelectorAll('header button, .search-box button');

    const performSearch = (val) => {
        if (!val.trim()) return;
        window.location.href = `buscar.html?q=${encodeURIComponent(val.trim())}`;
    };

    searchInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch(input.value);
        });
    });

    searchButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.parentElement.querySelector('input');
            if (input) performSearch(input.value);
        });
    });
}

/**
 * Realiza la búsqueda y renderiza los resultados en buscar.html
 */
async function renderSearchResults() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    const termDisplay = document.getElementById('searchTerm');
    const resultsContainer = document.querySelector('main .space-y-12');

    if (!query) {
        if (termDisplay) termDisplay.textContent = '...';
        return;
    }

    if (termDisplay) termDisplay.textContent = `"${query}"`;

    try {
        const { data: noticias, error } = await window.supabase
            .from('noticias')
            .select('*, categorias(nombre)')
            .eq('estado', 'publicado')
            .or(`titulo.ilike.%${query}%,resumen.ilike.%${query}%`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!resultsContainer) return;

        if (noticias.length === 0) {
            resultsContainer.innerHTML = `
                <div class="py-20 text-center space-y-4">
                    <span class="text-6xl">🔍</span>
                    <h3 class="font-bebas text-2xl text-gray-400">No se encontraron resultados</h3>
                    <p class="text-gray-500 text-sm max-w-xs mx-auto">Intenta buscar con palabras clave diferentes o revisa la ortografía.</p>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = noticias.map(n => `
            <article class="group flex flex-col md:flex-row gap-6 cursor-pointer" onclick="window.location.href='noticia.html?slug=${n.slug}'">
                <div class="md:w-64 h-40 overflow-hidden rounded shrink-0 shadow">
                    <img src="${n.imagen_url || 'https://via.placeholder.com/600x400'}" alt="${n.titulo}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                </div>
                <div>
                    <span class="font-condensed text-[10px] font-bold text-rojo uppercase tracking-widest block mb-1">${n.categorias?.nombre || 'General'}</span>
                    <h3 class="font-condensed text-xl font-bold leading-tight group-hover:text-rojo transition mb-2">${n.titulo}</h3>
                    <p class="text-gray-600 text-sm line-clamp-2 mb-3">${n.resumen || ''}</p>
                    <span class="text-[10px] text-gray-400 font-bold uppercase">${new Date(n.created_at).toLocaleDateString()}</span>
                </div>
            </article>
            <hr class="border-gray-100">
        `).join('');

    } catch (err) {
        console.error('Error en búsqueda:', err.message);
    }
}

/**
 * Renderiza el detalle de una noticia específica
 */
async function renderNoticiaDetalle() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const { data: noticia, error } = await window.supabase
            .from('noticias')
            .select('*, categorias(nombre), perfiles(nombre)')
            .eq('slug', slug)
            .single();

        if (error || !noticia) throw new Error('Noticia no encontrada');

        // Inyectar datos en el HTML
        document.title = `${noticia.titulo} — Chasqui TV`;
        
        const catBadge = document.querySelector('.art-categoria');
        if (catBadge) catBadge.textContent = noticia.categorias?.nombre || 'General';
        
        const titleH1 = document.querySelector('.art-titulo');
        if (titleH1) titleH1.textContent = noticia.titulo;
        
        const summaryP = document.querySelector('.art-bajada');
        if (summaryP) summaryP.textContent = noticia.resumen || '';
        
        const authorName = document.querySelector('.autor-nombre');
        if (authorName) authorName.textContent = `Por: ${noticia.perfiles?.nombre || 'Redacción Chasqui TV'}`;
        
        const dateSpan = document.querySelector('.art-fecha span:first-child');
        if (dateSpan) dateSpan.textContent = `📅 ${new Date(noticia.created_at).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
        
        const mainImg = document.querySelector('.art-img-wrap img');
        if (mainImg) mainImg.src = noticia.imagen_url || 'https://via.placeholder.com/1200x630';
        
        const bodyContainer = document.querySelector('.art-body');
        if (bodyContainer) bodyContainer.innerHTML = noticia.contenido;

        // Dinamizar SEO Meta Tags
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', noticia.resumen || '');
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', noticia.titulo);
        const ogImg = document.querySelector('meta[property="og:image"]');
        if (ogImg) ogImg.setAttribute('content', noticia.imagen_url || '');

        // Cargar Relacionadas
        renderRelatedNews(noticia.categoria_id, noticia.id);

        // Actualizar vistas (RPC)
        await window.supabase.rpc('increment_vistas', { row_id: noticia.id }).catch(e => console.log('Vistas error:', e));

    } catch (err) {
        console.error(err.message);
        const main = document.querySelector('main');
        if (main) main.innerHTML = `<div class="py-20 text-center uppercase font-bold text-gray-400">Error: La noticia no existe o ha sido eliminada.</div>`;
    }
}

/**
 * Renderiza noticias relacionadas al final del artículo
 */
async function renderRelatedNews(catId, currentId) {
    const container = document.querySelector('.grid-relacionadas');
    if (!container) return;

    try {
        const { data } = await window.supabase
            .from('noticias')
            .select('*')
            .eq('categoria_id', catId)
            .neq('id', currentId)
            .eq('estado', 'publicado')
            .limit(3);

        if (data && data.length > 0) {
            container.innerHTML = data.map(n => `
                <div class="card-rel" onclick="window.location.href='noticia.html?slug=${n.slug}'">
                  <div class="card-rel-img-wrap">
                    <img class="card-rel-img" src="${n.imagen_url || 'https://via.placeholder.com/400x225'}" alt="" />
                  </div>
                  <div class="card-rel-body">
                    <div class="card-rel-titulo">${n.titulo}</div>
                    <div class="card-rel-time">${new Date(n.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
            `).join('');
        }
    } catch (e) {
        console.error('Related news error:', e);
    }
}

/**
 * Renderiza widgets de la barra lateral (Más leídas)
 */
async function renderSidebarWidgets() {
    const sidebarMostRead = document.querySelector('.sidebar-widget .widget-body');
    if (!sidebarMostRead) return;

    try {
        const { data: noticias } = await window.supabase
            .from('noticias')
            .select('*, categorias(nombre)')
            .eq('estado', 'publicado')
            .order('vistas', { ascending: false })
            .limit(5);

        if (noticias && noticias.length > 0) {
            sidebarMostRead.innerHTML = noticias.map((n, index) => `
                <div class="mas-leida cursor-pointer" onclick="window.location.href='noticia.html?slug=${n.slug}'">
                  <div class="mas-leida-num">${index + 1}</div>
                  <div>
                    <div class="mas-leida-titulo">${n.titulo}</div>
                    <div class="mas-leida-cat">${n.categorias?.nombre || 'General'} · ${n.vistas} vistas</div>
                  </div>
                </div>
            `).join('');
        }
    } catch (e) {
        console.error('Sidebar widgets error:', e);
    }
}

/**
 * Renderiza el listado de noticias de una categoría específica
 */
async function renderCategoryPage() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const { data: categoria } = await window.supabase
            .from('categorias')
            .select('*')
            .eq('slug', slug)
            .single();

        if (!categoria) throw new Error('Categoría no encontrada');

        document.title = `${categoria.nombre} — Chasqui TV`;
        const catTitle = document.getElementById('category-title');
        if (catTitle) catTitle.textContent = categoria.nombre;
        const breadCat = document.getElementById('breadcrumb-cat');
        if (breadCat) breadCat.textContent = categoria.nombre;

        const { data: noticias, error } = await window.supabase
            .from('noticias')
            .select('*, categorias(nombre)')
            .eq('categoria_id', categoria.id)
            .eq('estado', 'publicado')
            .order('created_at', { ascending: false });

        const grid = document.getElementById('category-grid');
        if (!grid) return;

        if (!noticias || noticias.length === 0) {
            grid.innerHTML = '<p class="col-span-full text-center text-gray-400 py-10 uppercase font-bold">No hay noticias en esta categoría aún.</p>';
            return;
        }

        grid.innerHTML = noticias.map(n => `
            <div class="group cursor-pointer" onclick="window.location.href='noticia.html?slug=${n.slug}'">
              <div class="relative overflow-hidden rounded mb-3">
                <img src="${n.imagen_url || 'https://via.placeholder.com/600x400'}" alt="${n.titulo}" class="w-full h-48 object-cover group-hover:scale-105 transition duration-500">
              </div>
              <h3 class="font-condensed text-xl font-bold leading-tight group-hover:text-rojo transition">${n.titulo}</h3>
              <p class="text-sm text-gray-600 mt-2 line-clamp-2">${n.resumen || ''}</p>
              <span class="text-[10px] text-gray-400 mt-2 block uppercase">${new Date(n.created_at).toLocaleDateString()}</span>
            </div>
        `).join('');

    } catch (err) {
        console.error(err.message);
    }
}

/**
 * Renderiza el menú de navegación trayendo las categorías reales
 */
async function renderNavigation() {
    const navContainers = document.querySelectorAll('.nav-inner, nav .max-w-7xl');
    if (!navContainers.length) return;

    try {
        const { data: categorias, error } = await window.supabase
            .from('categorias')
            .select('*')
            .order('nombre');

        if (error) throw error;

        navContainers.forEach(container => {
            let html = `<a href="index.html" class="font-condensed font-bold text-gray-400 hover:text-white px-4 py-3 uppercase text-sm transition shrink-0">Inicio</a>`;
            
            categorias.forEach(cat => {
                html += `<a href="categoria.html?slug=${cat.slug}" class="font-condensed font-bold text-gray-400 hover:text-white px-4 py-3 uppercase text-sm transition shrink-0">${cat.nombre}</a>`;
            });

            container.innerHTML = html;
        });

    } catch (err) {
        console.error('Error al cargar navegación:', err.message);
    }
}

/**
 * Carga noticias, banners y Live URL en el Home
 */
async function renderHomeContent() {
    try {
        const { data: config } = await window.supabase
            .from('configuracion')
            .select('valor')
            .eq('clave', 'url_live')
            .single();
        
        const livePlayer = document.getElementById('livePlayer');
        if (config && livePlayer) {
            let url = config.valor;
            // Convertir URL de YouTube normal a Embed si es necesario
            if (url.includes('youtube.com/watch?v=')) {
                url = url.replace('watch?v=', 'embed/');
            } else if (url.includes('youtu.be/')) {
                url = url.replace('youtu.be/', 'youtube.com/embed/');
            }
            livePlayer.src = url;
        }
    } catch (e) {}

    try {
        const { data: noticias, error } = await window.supabase
            .from('noticias')
            .select('*, categorias(nombre)')
            .eq('estado', 'publicado')
            .order('created_at', { ascending: false })
            .limit(6);

        if (error) throw error;

        const grid = document.getElementById('news-grid');
        if (!grid) return;

        if (!noticias || noticias.length === 0) {
            grid.innerHTML = '<p class="col-span-full text-center text-gray-400 py-10 uppercase font-bold">No hay noticias publicadas aún.</p>';
            return;
        }

        grid.innerHTML = noticias.map(n => `
            <div class="group cursor-pointer" onclick="window.location.href='noticia.html?slug=${n.slug}'">
              <div class="relative overflow-hidden rounded mb-3">
                <img src="${n.imagen_url || 'https://via.placeholder.com/600x400'}" alt="${n.titulo}" class="w-full h-48 object-cover group-hover:scale-105 transition duration-500">
                <span class="absolute bottom-2 left-2 bg-rojo text-white font-condensed text-[10px] font-bold px-2 py-0.5 uppercase">${n.categorias?.nombre || 'General'}</span>
              </div>
              <h3 class="font-condensed text-xl font-bold leading-tight group-hover:text-rojo transition">${n.titulo}</h3>
              <p class="text-sm text-gray-600 mt-2 line-clamp-2">${n.resumen || ''}</p>
              <span class="text-[10px] text-gray-400 mt-2 block uppercase">${new Date(n.created_at).toLocaleDateString()}</span>
            </div>
        `).join('');

    } catch (err) {
        console.error('Error al cargar noticias:', err.message);
    }
}
