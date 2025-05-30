import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, writeBatch } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyAsjk8k0wS-CtyyDTUhtfvwznu1EhrITWk",
    authDomain: "site-filmes-a8770.firebaseapp.com",
    projectId: "site-filmes-a8770",
    storageBucket: "site-filmes-a8770.firebasestorage.app",
    messagingSenderId: "6675724716",
    appId: "1:6675724716:web:279205a26c9312e8bc6209"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let filmes = []; // Lista global de todos os filmes carregados
let ratingSelecionado = 0;
let idFilmeEditando = null;

// Garante que o script só execute após o DOM estar completamente carregado
document.addEventListener("DOMContentLoaded", function () {
    carregarFilmes();

    // Event listener para as estrelas de avaliação
    document.querySelectorAll('.estrela').forEach(estrela => {
        estrela.addEventListener('click', () => {
            ratingSelecionado = parseInt(estrela.getAttribute('data-value'));
            atualizarEstrelas();
        });
    });

    // Event listener para ocultar opções de gênero ao clicar fora
    document.addEventListener('click', function (event) {
        const generoContainer = document.getElementById("genero-container");
        const generoOptions = document.getElementById("genero-opcoes");
        
        // Se o clique não foi dentro do container de gênero, oculte as opções
        if (!generoContainer.contains(event.target) && !generoOptions.classList.contains("oculto")) {
            generoOptions.classList.add("oculto");
        }
    });

    // Adicione TODOS os listeners para os botões e inputs aqui dentro do DOMContentLoaded
    document.getElementById('btnBuscarOMDb').addEventListener('click', buscarFilmeOMDb);
    document.getElementById('genero-toggle').addEventListener('click', toggleGenero);
    document.getElementById('btnAdicionarOuSalvarFilme').addEventListener('click', adicionarOuSalvarFilme);
    document.getElementById('btnLimparTodos').addEventListener('click', limparTodos);
    document.getElementById('btnSortearFilme').addEventListener('click', sortearFilme);
    document.getElementById('busca-genero').addEventListener('input', filtrarPorGenero); // Listener do filtro por gênero
});

// Funções do aplicativo (definidas no escopo global para serem acessíveis)

function toggleGenero() {
    document.getElementById("genero-opcoes").classList.toggle("oculto");
}

function atualizarEstrelas() {
    document.querySelectorAll('.estrela').forEach(estrela => {
        const valor = parseInt(estrela.getAttribute('data-value'));
        estrela.classList.toggle('selecionada', valor <= ratingSelecionado);
    });
}

async function adicionarOuSalvarFilme() {
    const titulo = document.getElementById('titulo').value.trim();
    const sinopse = document.getElementById('sinopse').value.trim();
    const capa = document.getElementById('capa').value.trim();
    const trailer = document.getElementById('trailer').value.trim();
    const generoCheckboxes = document.querySelectorAll('#genero-opcoes input[type="checkbox"]');
    const generosSelecionados = Array.from(generoCheckboxes).filter(c => c.checked).map(c => c.value);
    const ano = document.getElementById('ano').value.trim(); // Captura o ano

    if (!titulo) {
        alert("O título do filme é obrigatório!");
        return;
    }

    // Validação opcional para o ano (4 dígitos numéricos)
    if (ano && !/^[0-9]{4}$/.test(ano)) {
        alert("O ano do filme deve ter 4 dígitos numéricos.");
        return;
    }

    const filmeData = {
        titulo,
        sinopse,
        genero: generosSelecionados,
        capa,
        trailer,
        rating: ratingSelecionado,
        ano: ano // Adiciona o ano ao objeto de dados
    };

    try {
        if (idFilmeEditando) {
            await updateDoc(doc(db, "filmes", idFilmeEditando), filmeData);
            console.log("Filme atualizado com sucesso!");
            document.getElementById('btnAdicionarOuSalvarFilme').innerText = "Adicionar Filme";
            idFilmeEditando = null;
        } else {
            await addDoc(collection(db, "filmes"), filmeData);
            console.log("Filme adicionado com sucesso!");
        }
        carregarFilmes();
        limparCampos();
    } catch (error) {
        console.error("Erro ao salvar/atualizar o filme:", error);
        alert("Erro ao salvar/atualizar o filme no banco de dados. Verifique o console para mais detalhes.");
    }
}

async function carregarFilmes() {
    try {
        const filmesCollection = collection(db, "filmes");
        const snapshot = await getDocs(filmesCollection);
        filmes = []; // Limpa a lista global antes de recarregar
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            filmes.push(data);
        });
        exibirFilmes(filmes); // Exibe todos os filmes carregados inicialmente
    } catch (error) {
        console.error("Erro ao carregar filmes ou processar dados existentes:", error);
    }
}

// Função para extrair o ID do vídeo do YouTube de diversas URLs
function getYouTubeVideoId(url) {
    if (!url || typeof url !== 'string') return null;
    const regExp = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/i;
    const match = url.match(regExp);
    return (match && match[1] && match[1].length === 11) ? match[1] : null;
}

// Exibe a lista de filmes (pode ser a lista completa ou uma filtrada)
function exibirFilmes(listaParaExibir = filmes) {
    const container = document.getElementById('filmes-container');
    container.innerHTML = '';

    if (listaParaExibir.length === 0) {
        container.innerHTML = '<p>Nenhum filme encontrado com os critérios de busca ou cadastrado ainda. Adicione um!</p>';
        return;
    }

    listaParaExibir.forEach((filme) => {
        const estrelas = '★'.repeat(filme.rating || 0) + '☆'.repeat(5 - (filme.rating || 0));
        const generosFormatados = Array.isArray(filme.genero) ? filme.genero.join(', ') : 'N/A';
        const anoFilme = filme.ano ? ` (${filme.ano})` : ''; // Adiciona o ano ao título se existir

        const videoId = getYouTubeVideoId(filme.trailer);
        let trailerContent = '';

        if (videoId) {
            // Incorpora o vídeo do YouTube com parâmetros para melhor experiência
            trailerContent = `
                <div class="video-container">
                    <iframe 
                        width="300" height="169" 
                        src="http://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&modestbranding=1&rel=0" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
            `;
        } else if (filme.trailer && filme.trailer.trim() !== '') {
            // Se não for um vídeo do YouTube, mas tiver uma URL, mostra como link
            trailerContent = `<p><a href="${filme.trailer}" target="_blank" rel="noopener noreferrer">Assistir Trailer (Link Externo)</a></p>`;
        } else {
            // Se não houver trailer ou for inválido
            trailerContent = `<p>Trailer não disponível.</p>`;
        }
        
        container.innerHTML += `
            <div class="filme">
                <h3>${filme.titulo}${anoFilme}</h3> 
                <p>${filme.sinopse}</p>
                <p><strong>Gêneros:</strong> ${generosFormatados}</p>
                <p><strong>Rating:</strong> ${estrelas}</p>
                <img src="${filme.capa}" alt="${filme.titulo}" onerror="this.onerror=null;this.src='https://via.placeholder.com/150?text=Sem+Capa';">
                ${trailerContent}
                <input type="checkbox" data-id="${filme.id}"> Selecionar
                <button onclick="window.editarFilme('${filme.id}')">Editar</button>
                <button onclick="window.deletarFilme('${filme.id}')">Deletar</button>
            </div>
        `;
    });
}

// Função para filtrar filmes por gênero (chamada pelo input de busca)
function filtrarPorGenero() {
    const termoBusca = document.getElementById('busca-genero').value.toLowerCase().trim();
    let filmesFiltrados = filmes; // Começa com a lista completa de filmes

    if (termoBusca !== '') {
        filmesFiltrados = filmes.filter(filme => {
            const generosDoFilme = Array.isArray(filme.genero) ? filme.genero : [];
            // Verifica se ALGUM dos gêneros do filme inclui o termo de busca
            return generosDoFilme.some(genero => genero.toLowerCase().includes(termoBusca));
        });
    }
    exibirFilmes(filmesFiltrados); // Exibe a lista filtrada
}

function sortearFilme() {
    const selecionados = Array.from(document.querySelectorAll('#filmes-container input[type="checkbox"]:checked'))
        .map(checkbox => filmes.find(f => f.id === checkbox.getAttribute('data-id')));

    const resultado = document.getElementById("resultado");
    if (selecionados.length === 0) {
        resultado.innerText = "Nenhum filme selecionado para sortear!";
        return;
    }

    const sorteado = selecionados[Math.floor(Math.random() * selecionados.length)];
    resultado.innerText = `🎬 Filme Sorteado: ${sorteado.titulo}`;
}

function limparCampos() {
    document.getElementById('titulo').value = '';
    document.getElementById('sinopse').value = '';
    document.getElementById('capa').value = '';
    document.getElementById('trailer').value = '';
    document.getElementById('ano').value = ''; // Limpa o campo do ano
    document.querySelectorAll('#genero-opcoes input[type="checkbox"]').forEach(c => c.checked = false);
    ratingSelecionado = 0;
    atualizarEstrelas();
    document.getElementById('btnAdicionarOuSalvarFilme').innerText = "Adicionar Filme";
    idFilmeEditando = null;
}

async function limparTodos() {
    if (confirm("Tem certeza que deseja DELETAR TODOS os filmes? Esta ação é irreversível!")) {
        try {
            const filmesCollection = collection(db, "filmes");
            const snapshot = await getDocs(filmesCollection);
            const batch = writeBatch(db);

            snapshot.forEach(documento => {
                batch.delete(doc(db, "filmes", documento.id));
            });

            await batch.commit();
            console.log("Todos os filmes foram deletados!");
            carregarFilmes();
            alert("Todos os filmes foram removidos com sucesso!");
        } catch (error) {
            console.error("Erro ao deletar todos os filmes:", error);
            alert("Erro ao tentar remover todos os filmes.");
        }
    }
}

async function deletarFilme(id) {
    if (confirm("Tem certeza que deseja deletar este filme?")) {
        try {
            await deleteDoc(doc(db, "filmes", id));
            console.log("Filme deletado com sucesso!");
            carregarFilmes();
        } catch (error) {
            console.error("Erro ao deletar filme:", error);
            alert("Erro ao deletar o filme.");
        }
    }
}

function editarFilme(id) {
    const filmeParaEditar = filmes.find(f => f.id === id);
    if (filmeParaEditar) {
        document.getElementById('titulo').value = filmeParaEditar.titulo || '';
        document.getElementById('sinopse').value = filmeParaEditar.sinopse || '';
        document.getElementById('capa').value = filmeParaEditar.capa || '';
        document.getElementById('trailer').value = filmeParaEditar.trailer || '';
        document.getElementById('ano').value = filmeParaEditar.ano || ''; // Preenche o campo do ano

        document.querySelectorAll('#genero-opcoes input[type="checkbox"]').forEach(c => {
            const generosDoFilme = Array.isArray(filmeParaEditar.genero) ? filmeParaEditar.genero : [];
            c.checked = generosDoFilme.includes(c.value);
        });

        ratingSelecionado = filmeParaEditar.rating || 0;
        atualizarEstrelas();

        document.getElementById('btnAdicionarOuSalvarFilme').innerText = "Salvar Alterações";
        idFilmeEditando = id;
    }
}

async function buscarFilmeOMDb() {
    const titulo = document.getElementById('titulo').value.trim();
    if (!titulo) {
        alert("Digite o nome do filme para buscar no IMDb.");
        return;
    }

    const OMDb_API_KEY = "7a859aa5"; 

    try {
        const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(titulo)}&apikey=${OMDb_API_KEY}`);
        const data = await res.json();

        if (data.Response === "False") {
            alert(`Filme "${titulo}" não encontrado no IMDb. Tente outro título.`);
            return;
        }

        document.getElementById('titulo').value = data.Title || "";
        document.getElementById('sinopse').value = data.Plot || "";
        document.getElementById('capa').value = data.Poster || "";
        document.getElementById('trailer').value = ""; // OMDb não fornece trailer
        document.getElementById('ano').value = data.Year || ""; // Preenche o ano do OMDb
        
        const generos = (data.Genre || "").split(',').map(g => g.trim()).filter(g => g !== '');
        document.querySelectorAll('#genero-opcoes input[type="checkbox"]').forEach(c => {
            c.checked = generos.includes(c.value);
        });

        const notaIMDb = parseFloat(data.imdbRating);
        ratingSelecionado = isNaN(notaIMDb) ? 0 : Math.round(notaIMDb / 2);
        atualizarEstrelas();
    } catch (err) {
        console.error("Erro ao buscar filme no OMDb:", err);
        alert("Erro ao buscar informações do filme. Verifique sua conexão ou a API Key.");
    }
}

// Expõe as funções globalmente para serem acessíveis pelos onclick no HTML
window.editarFilme = editarFilme;
window.deletarFilme = deletarFilme;
