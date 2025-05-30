// Adicione estas importações MODULARES no TOPO do seu script.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyAsjk8k0wS-CtyyDTUhtfvwznu1EhrITWk",
  authDomain: "site-filmes-a8770.firebaseapp.com",
  projectId: "site-filmes-a8770",
  storageBucket: "site-filmes-a8770.firebasestorage.app",
  messagingSenderId: "6675724716",
  appId: "1:6675724716:web:279205a26c9312e8bc6209"
};

// Use a sintaxe modular para inicializar:
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Agora getFirestore está importado e disponível

let filmes = [];
// Declare 'ratingSelecionado' com 'let' no topo para evitar o ReferenceError
let ratingSelecionado = 0;
let idFilmeEditando = null; // Variável global para armazenar o ID do filme sendo editado

document.addEventListener("DOMContentLoaded", function () {
  carregarFilmes(); // Carrega os filmes ao iniciar a página
  document.querySelectorAll('.estrela').forEach(estrela => {
    estrela.addEventListener('click', () => {
      ratingSelecionado = parseInt(estrela.getAttribute('data-value'));
      atualizarEstrelas();
    });
  });

  document.addEventListener('click', function (event) {
    const container = document.getElementById("genero-container");
    if (!container.contains(event.target)) {
      document.getElementById("genero-opcoes").classList.add("oculto");
    }
  });
});

function toggleGenero() {
  document.getElementById("genero-opcoes").classList.toggle("oculto");
}

function atualizarEstrelas() {
  document.querySelectorAll('.estrela').forEach(estrela => {
    const valor = parseInt(estrela.getAttribute('data-value'));
    estrela.classList.toggle('selecionada', valor <= ratingSelecionado);
  });
}

// A função adicionarOuSalvarFilme agora precisa ser 'async' para usar 'await' com addDoc/updateDoc
async function adicionarOuSalvarFilme() {
  const titulo = document.getElementById('titulo').value;
  const sinopse = document.getElementById('sinopse').value;
  const capa = document.getElementById('capa').value;
  const trailer = document.getElementById('trailer').value;
  const generoCheckboxes = document.querySelectorAll('#genero-opcoes input[type="checkbox"]');
  const generosSelecionados = Array.from(generoCheckboxes).filter(c => c.checked).map(c => c.value);

  const filmeData = {
    titulo,
    sinopse,
    genero: generosSelecionados,
    capa,
    trailer,
    rating: ratingSelecionado
  };

  try {
    if (idFilmeEditando) {
      // Modo de edição: atualiza um documento existente
      await updateDoc(doc(db, "filmes", idFilmeEditando), filmeData);
      console.log("Filme atualizado com sucesso!");
      document.querySelector('button[onclick="adicionarOuSalvarFilme()"]').innerText = "Adicionar Filme"; // Volta o texto do botão
      idFilmeEditando = null; // Reseta o ID de edição
    } else {
      // Modo de adição: adiciona um novo documento
      await addDoc(collection(db, "filmes"), filmeData); // 'collection' e 'addDoc' estão importados
      console.log("Filme adicionado com sucesso!");
    }
    carregarFilmes(); // Recarrega e exibe os filmes
    limparCampos();   // Limpa o formulário
  } catch (error) {
    console.error("Erro ao salvar/atualizar o filme:", error);
    alert("Erro ao salvar/atualizar o filme no banco de dados. Verifique o console para mais detalhes.");
  }
}

// carregarFilmes também pode ser 'async' para usar await getDocs
async function carregarFilmes() {
  try {
    const filmesCollection = collection(db, "filmes"); // 'collection' está importada
    const snapshot = await getDocs(filmesCollection); // 'getDocs' está importada
    filmes = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      data.id = doc.id;
      filmes.push(data);
    });
    exibirFilmes();
  } catch (error) {
    console.error("Erro ao carregar filmes:", error);
    alert("Erro ao carregar os filmes. Verifique o console para mais detalhes.");
  }
}

function exibirFilmes() {
  const container = document.getElementById('filmes-container');
  container.innerHTML = '';
  if (filmes.length === 0) {
    container.innerHTML = '<p>Nenhum filme cadastrado ainda. Adicione um!</p>';
    return;
  }

  filmes.forEach((filme) => { // Removi o 'index' pois não é mais usado no checkbox
    const estrelas = '★'.repeat(filme.rating || 0) + '☆'.repeat(5 - (filme.rating || 0));
    container.innerHTML += `
      <div class="filme">
        <h3>${filme.titulo}</h3>
        <p>${filme.sinopse}</p>
        <p><strong>Gêneros:</strong> ${filme.genero.join(', ')}</p>
        <p><strong>Rating:</strong> ${estrelas}</p>
        <img src="${filme.capa}" alt="${filme.titulo}" onerror="this.onerror=null;this.src='https://via.placeholder.com/150?text=Sem+Capa';">
        <p><a href="${filme.trailer}" target="_blank">Assistir Trailer</a></p>
        <input type="checkbox" data-id="${filme.id}"> Selecionar
        <button onclick="editarFilme('${filme.id}')">Editar</button>
        <button onclick="deletarFilme('${filme.id}')">Deletar</button>
      </div>
    `;
  });
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
  document.querySelectorAll('#genero-opcoes input[type="checkbox"]').forEach(c => c.checked = false);
  ratingSelecionado = 0;
  atualizarEstrelas();
}

async function limparTodos() {
  if (confirm("Tem certeza que deseja DELETAR TODOS os filmes? Esta ação é irreversível!")) {
    try {
      const filmesCollection = collection(db, "filmes");
      const snapshot = await getDocs(filmesCollection);
      const batch = writeBatch(db); // use writeBatch para operações em lote

      snapshot.forEach(documento => {
        batch.delete(doc(db, "filmes", documento.id)); // deleteDoc usa a referência do documento
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
      await deleteDoc(doc(db, "filmes", id)); // 'deleteDoc' e 'doc' estão importados
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

    document.querySelectorAll('#genero-opcoes input[type="checkbox"]').forEach(c => {
      c.checked = filmeParaEditar.genero && filmeParaEditar.genero.includes(c.value);
    });

    ratingSelecionado = filmeParaEditar.rating || 0;
    atualizarEstrelas();

    document.querySelector('button[onclick="adicionarOuSalvarFilme()"]').innerText = "Salvar Alterações";
    idFilmeEditando = id;
  }
}

async function buscarFilmeOMDb() {
  const titulo = document.getElementById('titulo').value;
  if (!titulo.trim()) {
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
    document.getElementById('trailer').value = "";

    const generos = (data.Genre || "").split(',').map(g => g.trim());
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
