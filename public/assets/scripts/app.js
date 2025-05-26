// Função para carregar notícias na página inicial
async function carregarNoticias() {
    const container = document.querySelector('.row');
    if (!container) return;
    container.innerHTML = '';
    try {
        const resposta = await fetch('http://localhost:3000/noticias');
        const noticias = await resposta.json();
        noticias.forEach((noticia, index) => {
            const card = `
                <div class="col">
                    <div class="card h-100">
                        <img src="${noticia.imagem_principal}" class="card-img-top" alt="${noticia.titulo}">
                        <div class="card-body">
                            <h5 class="card-title">${noticia.titulo}</h5>
                            <p class="card-text">${noticia.resumo || noticia.descricao}</p>
                            <a href="detalhes.html?id=${noticia.id}" class="btn btn-primary">Ler mais</a>
                        </div>
                        <div class="card-footer">
                            <small class="text-muted">Publicado em ${new Date(noticia.data).toLocaleDateString()}</small>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += card;
        });
    } catch (erro) {
        container.innerHTML = '<p>Erro ao carregar notícias.</p>';
    }
}

// Função para carregar detalhes de uma notícia específica
async function carregarDetalhesNoticia() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = parseInt(urlParams.get('id'));
    try {
        const resposta = await fetch(`http://localhost:3000/noticias/${id}`);
        if (!resposta.ok) throw new Error('Notícia não encontrada');
        const noticia = await resposta.json();
        document.querySelector('.noticia-titulo').textContent = noticia.titulo;
        document.querySelector('.noticia-imagem').src = noticia.imagem_principal;
        document.querySelector('.noticia-conteudo').textContent = noticia.conteudo;
        document.querySelector('.noticia-autor').textContent = `Por ${noticia.autor}`;
        document.querySelector('.noticia-categoria').textContent = noticia.categoria || '';
        document.querySelector('.noticia-data').textContent = new Date(noticia.data).toLocaleDateString();
        // Carregar imagens complementares
        const galeriaContainer = document.querySelector('.galeria-imagens');
        if (galeriaContainer && noticia.imagens_complementares) {
            galeriaContainer.innerHTML = '';
            noticia.imagens_complementares.forEach(img => {
                const imgElement = `
                    <div class="col-md-4">
                        <div class="card mb-4">
                            <img src="${img.src}" class="card-img-top" alt="${img.descricao}">
                            <div class="card-body">
                                <p class="card-text">${img.descricao}</p>
                            </div>
                        </div>
                    </div>
                `;
                galeriaContainer.innerHTML += imgElement;
            });
        }
    } catch (erro) {
        document.querySelector('main').innerHTML = '<p>Notícia não encontrada.</p>';
    }
}

// Função para carregar os destaques no carrossel
async function carregarDestaques() {
    const carrosselInner = document.querySelector('.carousel-inner');
    if (!carrosselInner) return;
    try {
        const resposta = await fetch('http://localhost:3000/noticias');
        const noticias = await resposta.json();
        // Filtra apenas as notícias marcadas como destaque
        const noticiasDestaque = noticias.filter(noticia => noticia.destaque);
        // Limpa o conteúdo atual do carrossel
        carrosselInner.innerHTML = '';
        // Adiciona os indicadores do carrossel
        const indicadores = document.querySelector('.carousel-indicators');
        indicadores.innerHTML = '';
        // Adiciona cada notícia em destaque ao carrossel
        noticiasDestaque.forEach((noticia, index) => {
            // Cria o indicador
            indicadores.innerHTML += `
                <button type="button" 
                        data-bs-target="#carrosselNoticias" 
                        data-bs-slide-to="${index}" 
                        ${index === 0 ? 'class="active"' : ''}
                        aria-label="Slide ${index + 1}">
                </button>
            `;
            // Cria o slide com link para a notícia
            const slide = `
                <div class="carousel-item ${index === 0 ? 'active' : ''}">
                    <a href="detalhes.html?id=${noticia.id}" style="text-decoration: none; color: inherit;">
                        <img src="${noticia.imagem_principal}" class="d-block w-100" alt="${noticia.titulo}">
                        <div class="carousel-caption">
                            <h3>${noticia.titulo}</h3>
                            <p>${noticia.resumo || noticia.descricao}</p>
                        </div>
                    </a>
                </div>
            `;
            carrosselInner.innerHTML += slide;
        });
    } catch (erro) {
        carrosselInner.innerHTML = '<p>Erro ao carregar destaques.</p>';
    }
}

// Modifique a função de inicialização para incluir o carregamento dos destaques
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('detalhes.html')) {
        carregarDetalhesNoticia();
    } else {
        carregarDestaques();
        carregarNoticias();
    }
});
