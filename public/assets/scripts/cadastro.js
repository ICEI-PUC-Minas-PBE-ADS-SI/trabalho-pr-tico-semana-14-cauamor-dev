// Funções para manipulação do CRUD de notícias

// Função para visualizar prévia da imagem
function previewImagem(input, previewId) {
    const preview = document.getElementById(previewId);
    const file = input.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            // Atualiza o campo de URL com o nome do arquivo
            const urlInput = input.parentElement.querySelector('input[type="text"]');
            urlInput.value = file.name;
        }
        reader.readAsDataURL(file);
    } else {
        preview.style.display = 'none';
    }
}

// Função para carregar todas as notícias na tabela
async function carregarNoticias() {
    const tbody = document.getElementById('listaNoticias');
    if (!tbody) return;
    tbody.innerHTML = '';
    try {
        const resposta = await fetch('http://localhost:3000/noticias');
        const noticias = await resposta.json();
        noticias.forEach(noticia => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${noticia.titulo}</td>
                <td>${noticia.autor}</td>
                <td>${new Date(noticia.data).toLocaleDateString()}</td>
                <td>
                    <a href="detalhes.html?id=${noticia.id}" class="btn btn-sm btn-info me-1" target="_blank">
                        <i class="fas fa-eye"></i> Ver
                    </a>
                    <button class="btn btn-sm btn-primary me-1" onclick="editarNoticia(${noticia.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="excluirNoticia(${noticia.id})">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (erro) {
        console.error('Erro ao carregar notícias:', erro);
    }
}

// Função para cadastrar uma nova notícia
async function cadastrarNoticia(evento) {
    evento.preventDefault();
    const form = evento.target;
    
    // Coletar imagens da galeria
    const imagensComplementares = [];
    for (let i = 1; i <= 3; i++) {
        const arquivo = form[`arquivo${i}`].files[0];
        const url = form[`imagem${i}`].value;
        const descricao = form[`descricao${i}`].value;
        
        if ((arquivo || url) && descricao) {
            let imagemUrl = url;
            
            // Se houver arquivo, converte para base64
            if (arquivo) {
                imagemUrl = await converterArquivoParaBase64(arquivo);
            }
            
            imagensComplementares.push({ 
                src: imagemUrl, 
                descricao: descricao 
            });
        }
    }

    const noticia = {
        titulo: form.titulo.value,
        resumo: form.resumo.value,
        conteudo: form.conteudo.value,
        autor: form.autor.value,
        data: form.data.value,
        imagem_principal: form.imagem_principal.value,
        categoria: form.categoria.value,
        destaque: form.destaque.checked,
        imagens_complementares: imagensComplementares
    };

    try {
        const resposta = await fetch('http://localhost:3000/noticias', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(noticia)
        });

        if (resposta.ok) {
            alert('Notícia cadastrada com sucesso!');
            form.reset();
            // Limpar previews das imagens
            for (let i = 1; i <= 3; i++) {
                const preview = document.getElementById(`preview${i}`);
                if (preview) {
                    preview.style.display = 'none';
                    preview.src = '';
                }
            }
            carregarNoticias();
        } else {
            throw new Error('Erro ao cadastrar notícia');
        }
    } catch (erro) {
        console.error('Erro:', erro);
        alert('Erro ao cadastrar notícia. Tente novamente.');
    }
}

// Função para converter arquivo em base64
function converterArquivoParaBase64(arquivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(arquivo);
    });
}

// Função para editar uma notícia
async function editarNoticia(id) {
    try {
        console.log('Iniciando edição da notícia:', id);
        const resposta = await fetch(`http://localhost:3000/noticias/${id}`);
        
        if (!resposta.ok) {
            throw new Error(`Erro na resposta do servidor: ${resposta.status}`);
        }
        
        const noticia = await resposta.json();
        console.log('Dados da notícia recebidos:', noticia);
        
        const form = document.getElementById('formNoticia');
        if (!form) {
            throw new Error('Formulário não encontrado');
        }

        // Função auxiliar para preencher campo com segurança
        const preencherCampo = (campoId, valor) => {
            const campo = form.querySelector(`#${campoId}`);
            if (campo) {
                campo.value = valor || '';
            }
        };

        // Preencher campos básicos com verificação
        preencherCampo('titulo', noticia.titulo);
        preencherCampo('resumo', noticia.resumo || noticia.descricao);
        preencherCampo('conteudo', noticia.conteudo);
        preencherCampo('autor', noticia.autor);
        preencherCampo('data', noticia.data);
        preencherCampo('imagem_principal', noticia.imagem_principal);
        
        // Mostrar preview da imagem principal se existir
        if (noticia.imagem_principal) {
            const previewPrincipal = document.getElementById('preview_principal');
            if (previewPrincipal) {
                previewPrincipal.src = noticia.imagem_principal;
                previewPrincipal.style.display = 'block';
            }
        }
        
        // Preencher categoria e destaque com verificação
        const categoriaSelect = form.querySelector('#categoria');
        if (categoriaSelect) {
            categoriaSelect.value = noticia.categoria || '';
        }

        const destaqueCheckbox = form.querySelector('#destaque');
        if (destaqueCheckbox) {
            destaqueCheckbox.checked = noticia.destaque || false;
        }

        // Limpar campos da galeria primeiro
        for (let i = 1; i <= 3; i++) {
            preencherCampo(`imagem${i}`, '');
            preencherCampo(`descricao${i}`, '');
            
            const preview = document.getElementById(`preview${i}`);
            if (preview) {
                preview.style.display = 'none';
                preview.src = '';
            }
        }

        // Preencher campos da galeria
        if (noticia.imagens_complementares && noticia.imagens_complementares.length > 0) {
            console.log('Preenchendo galeria com:', noticia.imagens_complementares);
            noticia.imagens_complementares.forEach((img, index) => {
                if (index < 3) {
                    preencherCampo(`imagem${index + 1}`, img.src);
                    preencherCampo(`descricao${index + 1}`, img.descricao);
                    
                    // Se a imagem for base64, mostra o preview
                    if (img.src && img.src.startsWith('data:image')) {
                        const preview = document.getElementById(`preview${index + 1}`);
                        if (preview) {
                            preview.src = img.src;
                            preview.style.display = 'block';
                        }
                    }
                }
            });
        }

        // Alterar o comportamento do formulário para atualização
        form.onsubmit = (e) => atualizarNoticia(e, id);
        
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Atualizar Notícia';
        }
        
        // Rolar até o formulário
        form.scrollIntoView({ behavior: 'smooth' });
        
        console.log('Edição iniciada com sucesso');
    } catch (erro) {
        console.error('Erro detalhado ao carregar notícia:', erro);
        alert('Erro ao carregar notícia para edição. Verifique o console para mais detalhes.');
    }
}

// Função para atualizar uma notícia
async function atualizarNoticia(evento, id) {
    evento.preventDefault();
    console.log('Iniciando atualização da notícia:', id);
    
    const form = evento.target;
    if (!form) {
        console.error('Formulário não encontrado');
        return;
    }

    // Função auxiliar para obter valor do campo com segurança
    const obterValorCampo = (campoId) => {
        const campo = form.querySelector(`#${campoId}`);
        return campo ? campo.value : '';
    };

    // Coletar imagens da galeria
    const imagensComplementares = [];
    for (let i = 1; i <= 3; i++) {
        const arquivo = form.querySelector(`#arquivo${i}`)?.files[0];
        const url = obterValorCampo(`imagem${i}`);
        const descricao = obterValorCampo(`descricao${i}`);
        
        if ((arquivo || url) && descricao) {
            let imagemUrl = url;
            
            // Se houver arquivo, converte para base64
            if (arquivo) {
                imagemUrl = await converterArquivoParaBase64(arquivo);
            }
            
            imagensComplementares.push({ 
                src: imagemUrl, 
                descricao: descricao 
            });
        }
    }

    // Verificar se há um novo arquivo para a imagem principal
    const arquivoImagemPrincipal = form.querySelector('#arquivo_principal')?.files[0];
    let imagemPrincipal = obterValorCampo('imagem_principal');

    // Se houver um novo arquivo, converte para base64
    if (arquivoImagemPrincipal) {
        imagemPrincipal = await converterArquivoParaBase64(arquivoImagemPrincipal);
    }

    const noticia = {
        titulo: obterValorCampo('titulo'),
        resumo: obterValorCampo('resumo'),
        descricao: obterValorCampo('resumo'), // Manter compatibilidade
        conteudo: obterValorCampo('conteudo'),
        autor: obterValorCampo('autor'),
        data: obterValorCampo('data'),
        imagem_principal: imagemPrincipal,
        categoria: obterValorCampo('categoria'),
        destaque: form.querySelector('#destaque')?.checked || false,
        imagens_complementares: imagensComplementares
    };

    console.log('Dados a serem enviados:', noticia);

    try {
        const resposta = await fetch(`http://localhost:3000/noticias/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(noticia)
        });

        if (!resposta.ok) {
            throw new Error(`Erro na resposta do servidor: ${resposta.status}`);
        }

        const noticiaAtualizada = await resposta.json();
        console.log('Notícia atualizada com sucesso:', noticiaAtualizada);

        alert('Notícia atualizada com sucesso!');
        
        // Limpar formulário
        form.reset();
        
        // Limpar previews das imagens
        for (let i = 1; i <= 3; i++) {
            const preview = document.getElementById(`preview${i}`);
            if (preview) {
                preview.style.display = 'none';
                preview.src = '';
            }
        }

        // Restaurar comportamento padrão do formulário
        form.onsubmit = cadastrarNoticia;
        
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = 'Cadastrar Notícia';
        }

        // Recarregar lista de notícias
        await carregarNoticias();
        
    } catch (erro) {
        console.error('Erro ao atualizar notícia:', erro);
        alert('Erro ao atualizar notícia. Verifique o console para mais detalhes.');
    }
}

// Função para excluir uma notícia
async function excluirNoticia(id) {
    if (confirm('Tem certeza que deseja excluir esta notícia?')) {
        try {
            const resposta = await fetch(`http://localhost:3000/noticias/${id}`, {
                method: 'DELETE'
            });

            if (resposta.ok) {
                alert('Notícia excluída com sucesso!');
                carregarNoticias();
            } else {
                throw new Error('Erro ao excluir notícia');
            }
        } catch (erro) {
            console.error('Erro:', erro);
            alert('Erro ao excluir notícia. Tente novamente.');
        }
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formNoticia');
    if (form) {
        form.addEventListener('submit', cadastrarNoticia);
    }
    carregarNoticias();
}); 