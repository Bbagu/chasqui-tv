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
        renderPublicBanners();
    }

    // 3. Si estamos en una página de noticia, cargar noticia
    if (document.getElementById('articulo')) {
        renderNoticiaDetalle();
        renderPublicBanners();
    }

    // 4. Si estamos en una página de categoría, cargar listado
    if (document.getElementById('category-page')) {
        renderCategoryPage();
        renderPublicBanners();
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
 * Carga banners activos en los espacios del sitio público
 */
async function renderPublicBanners() {
    try {
        const { data: banners } = await window.supabase
            .from('banners')
            .select('*')
            .eq('activo', true);

        if (!banners || banners.length === 0) return;

        // Función auxiliar para inyectar banner
        const injectBanner = (position, elementId) => {
            const container = document.getElementById(elementId);
            const banner = banners.find(b => b.posicion === position);
            if (container && banner) {
                container.innerHTML = `
                    <a href="${banner.url_destino || '#'}" target="_blank" class="block w-full h-full">
                        <img src="${banner.imagen_url}" alt="${banner.nombre}" class="w-full h-full object-cover rounded shadow-lg">
                    </a>
                `;
                container.classList.remove('bg-gray-100', 'border-2', 'border-dashed', 'text-gray-400');
                container.style.height = 'auto';
                container.style.border = 'none';
            }
        };

        injectBanner('header', 'header-banner');
        injectBanner('sidebar', 'sidebar-banner');
        injectBanner('footer', 'footer-banner');
        injectBanner('articulo', 'article-banner');

    } catch (e) {
        console.error('Error al cargar banners:', e);
    }
}

/**
 * Renderiza el detalle de una noticia específica
 */
async function renderNoticiaDetalle() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');

    if (!slug) {
        console.error("Error: No se encontró el parámetro 'slug' en la URL.");
        return;
    }

    console.log("Buscando noticia con slug:", slug);

    try {
        // Traer noticia (filtramos por slug ignorando mayúsculas/minúsculas)
        const { data: noticia, error } = await window.supabase
            .from('noticias')
            .select('*')
            .ilike('slug', slug)
            .maybeSingle();

        if (error) throw error;

        if (!noticia) {
            console.error("No se encontró ninguna noticia en la base de datos con el slug:", slug);
            throw new Error('Noticia no encontrada');
        }

        // Traer categoría por separado
        let nombreCat = 'General';
        if (noticia.categoria_id) {
            const { data: cat } = await window.supabase.from('categorias').select('nombre').eq('id', noticia.categoria_id).single();
            if (cat) nombreCat = cat.nombre;
        }

        // Traer autor por separado
        let nombreAutor = 'Redacción Chasqui TV';
        if (noticia.autor_id) {
            const { data: perfil } = await window.supabase.from('perfiles').select('nombre').eq('id', noticia.autor_id).single();
            if (perfil) nombreAutor = perfil.nombre;
        }

        // Inyectar datos en el HTML
        document.title = `${noticia.titulo} — Chasqui TV`;
        
        const catBadge = document.querySelector('.art-categoria');
        if (catBadge) catBadge.textContent = nombreCat;
        
        const titleH1 = document.querySelector('.art-titulo');
        if (titleH1) titleH1.textContent = noticia.titulo;
        
        const summaryP = document.querySelector('.art-bajada');
        if (summaryP) summaryP.textContent = noticia.resumen || '';
        
        const authorName = document.querySelector('.autor-nombre');
        if (authorName) authorName.textContent = `Por: ${nombreAutor}`;
        
        const dateSpan = document.querySelector('.art-fecha span:first-child');
        if (dateSpan) {
            const fecha = new Date(noticia.created_at);
            dateSpan.textContent = `📅 ${fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`;
        }
        
        const mainImg = document.querySelector('.art-img-wrap img');
        if (mainImg) {
            mainImg.src = noticia.imagen_url || 'https://via.placeholder.com/1200x630';
            mainImg.alt = noticia.titulo;
        }
        
        const bodyContainer = document.querySelector('.art-body');
        if (bodyContainer) bodyContainer.innerHTML = noticia.contenido;

        // Banner dentro del artículo
        renderPublicBanners();

        // Cargar Relacionadas
        renderRelatedNews(noticia.categoria_id, noticia.id);

        // Actualizar vistas (RPC)
        await window.supabase.rpc('increment_vistas', { row_id: noticia.id }).catch(() => {});

    } catch (err) {
        console.error("Error al renderizar:", err.message);
        const main = document.querySelector('main');
        if (main) main.innerHTML = `
            <div class="py-20 text-center space-y-4">
                <h3 class="font-bebas text-3xl text-gray-400 uppercase">Lo sentimos</h3>
                <p class="text-gray-500">La noticia no existe o el enlace es incorrecto.</p>
                <a href="index.html" class="inline-block bg-negro text-amarillo font-bebas px-6 py-2 rounded">Volver al Inicio</a>
            </div>
        `;
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
