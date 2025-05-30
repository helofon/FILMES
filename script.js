const firebaseConfig = {
  apiKey: "AIzaSyAsjk8k0wS-CtyyDTUhtfvwznu1EhrITWk",
  authDomain: "site-filmes-a8770.firebaseapp.com",
  projectId: "site-filmes-a8770",
  storageBucket: "site-filmes-a8770.firebasestorage.app",
  messagingSenderId: "6675724716",
  appId: "1:6675724716:web:279205a26c9312e8bc6209"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let filmes = [];
let ratingSelecionado = 0;

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
    // Se o clique não foi dentro do container de gênero, esconde as opções
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

function adicionarOuSalvarFilme() {
  const titulo = document.getElementById('titulo').value;
  const sinopse = document.getElementById('sinopse').value;
  const capa = document.getElementById('capa').value;
  const trailer = document.getElementById('trailer').value;
  const generoCheckboxes = document.querySelectorAll('#genero-opcoes input[type="checkbox"]');
  const generosSelecionados = Array.from(generoCheckboxes).filter(c => c.checked).map(c => c.value);

  const filme = {
    titulo,
    sinopse,
    genero: generosSelecionados,
    capa,
    trailer,
    rating: ratingSelecionado
  };

  db.collection("filmes").add(filme)
    .then(() => {
      console.log("Filme adicionado com sucesso!");
      carregarFilmes(); // Recarrega e exibe os filmes atualizados após adicionar um novo
      limparCampos();   // Limpa os campos do formulário para um novo registro
    })
    .catch((error) => {
      console.error("Erro ao salvar o filme:", error);
      alert("Erro ao salvar o filme no banco de dados. Verifique o console para mais detalhes.");
    });
}

function carregarFilmes() {
  // Pega os documentos da coleção "filmes"
  db.collection("filmes").get()
    .then(snapshot => {
      filmes = []; // Limpa a lista atual de filmes
      snapshot.forEach(doc => {
        const data = doc.data(); // Pega os dados do documento
        data.id = doc.id;       // Adiciona o ID do documento aos dados
        filmes.push(data);      // Adiciona o filme à lista
      });
      exibirFilmes(); // Exibe os filmes carregados
    })
    .catch(error => {
      console.error("Erro ao carregar filmes:", error);
      alert("Erro ao carregar os filmes. Verifique o console para mais detalhes.");
    });
}

function exibirFilmes() {
  const container = document.getElementById('filmes-container');
  container.innerHTML = ''; // Limpa o container antes de exibir os filmes
  if (filmes.length === 0) {
    container.innerHTML = '<p>Nenhum filme cadastrado ainda. Adicione um!</p>';
    return;
  }

  filmes.forEach((filme, index) => {
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
  // Pega apenas os filmes selecionados (usando data-id agora)
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
  atualizarEstrelas(); // Reseta as estrelas visuais
}

// Adicione a função limparTodos (cuidado ao usar, ela deleta tudo!)
function limparTodos() {
  if (confirm("Tem certeza que deseja DELETAR TODOS os filmes? Esta ação é irreversível!")) {
    db.collection("filmes").get()
      .then(snapshot => {
        const batch = db.batch(); // Usar batch para deletar múltiplos documentos eficientemente
        snapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        return batch.commit(); // Confirma a exclusão em lote
      })
      .then(() => {
        console.log("Todos os filmes foram deletados!");
        carregarFilmes(); // Recarrega a lista para mostrar que está vazia
        alert("Todos os filmes foram removidos com sucesso!");
      })
      .catch(error => {
        console.error("Erro ao deletar todos os filmes:", error);
        alert("Erro ao tentar remover todos os filmes.");
      });
  }
}

// Adicione a função para deletar um filme específico
function deletarFilme(id) {
  if (confirm("Tem certeza que deseja deletar este filme?")) {
    db.collection("filmes").doc(id).delete()
      .then(() => {
        console.log("Filme deletado com sucesso!");
        carregarFilmes(); // Recarrega a lista
      })
      .catch(error => {
        console.error("Erro ao deletar filme:", error);
        alert("Erro ao deletar o filme.");
      });
  }
}

// Adicione a função para editar um filme
let idFilmeEditando = null; // Variável global para armazenar o ID do filme sendo editado

function editarFilme(id) {
  const filmeParaEditar = filmes.find(f => f.id === id);
  if (filmeParaEditar) {
    document.getElementById('titulo').value = filmeParaEditar.titulo || '';
    document.getElementById('sinopse').value = filmeParaEditar.sinopse || '';
    document.getElementById('capa').value = filmeParaEditar.capa || '';
    document.getElementById('trailer').value = filmeParaEditar.trailer || '';

    // Marcar os gêneros
    document.querySelectorAll('#genero-opcoes input[type="checkbox"]').forEach(c => {
      c.checked = filmeParaEditar.genero && filmeParaEditar.genero.includes(c.value);
    });

    // Definir o rating
    ratingSelecionado = filmeParaEditar.rating || 0;
    atualizarEstrelas();

    // Mudar o texto do botão para "Salvar Alterações"
    document.querySelector('button[onclick="adicionarOuSalvarFilme()"]').innerText = "Salvar Alterações";
    idFilmeEditando = id; // Armazena o ID do filme que está sendo editado
  }
}

// Refatorando adicionarOuSalvarFilme para incluir edição:
function adicionarOuSalvarFilme() {
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

  if (idFilmeEditando) {
    // Modo de edição: atualiza um documento existente
    db.collection("filmes").doc(idFilmeEditando).update(filmeData)
      .then(() => {
        console.log("Filme atualizado com sucesso!");
        carregarFilmes();
        limparCampos();
        document.querySelector('button[onclick="adicionarOuSalvarFilme()"]').innerText = "Adicionar Filme"; // Volta o texto do botão
        idFilmeEditando = null; // Reseta o ID de edição
      })
      .catch((error) => {
        console.error("Erro ao atualizar o filme:", error);
        alert("Erro ao atualizar o filme no banco de dados.");
      });
  } else {
    // Modo de adição: adiciona um novo documento
    db.collection("filmes").add(filmeData)
      .then(() => {
        console.log("Filme adicionado com sucesso!");
        carregarFilmes();
        limparCampos();
      })
      .catch((error) => {
        console.error("Erro ao salvar o filme:", error);
        alert("Erro ao salvar o filme no banco de dados.");
      });
  }
}


function filtrarPorGenero() {
  const termo = document.getElementById('busca-genero').value.toLowerCase();
  const container = document.getElementById('filmes-container');
  container.innerHTML = '';

  const filmesFiltrados = filmes.filter(filme => {
    // Garante que filme.genero é um array antes de usar .some()
    return filme.genero && filme.genero.some(g => g.toLowerCase().includes(termo));
  });

  if (filmesFiltrados.length === 0) {
    container.innerHTML = '<p>Nenhum filme encontrado para este gênero.</p>';
    return;
  }

  filmesFiltrados.forEach((filme, index) => {
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

function buscarFilmeOMDb() {
  const titulo = document.getElementById('titulo').value;
  if (!titulo.trim()) return alert("Digite o nome do filme para buscar no IMDb.");

  // Chave de API OMDb (substitua pela sua chave real, se for diferente)
  const OMDb_API_KEY = "7a859aa5"; 

  fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(titulo)}&apikey=${OMDb_API_KEY}`)
    .then(res => res.json())
    .then(data => {
      if (data.Response === "False") {
        alert(`Filme "${titulo}" não encontrado no IMDb. Tente outro título.`);
        return;
      }

      // Atualizar os campos com os dados recebidos
      document.getElementById('titulo').value = data.Title || "";
      document.getElementById('sinopse').value = data.Plot || "";
      document.getElementById('capa').value = data.Poster || "";
      document.getElementById('trailer').value = ""; // OMDb não fornece trailer diretamente

      // Configurar os gêneros (marcando os checkboxes)
      const generos = (data.Genre || "").split(',').map(g => g.trim());
      document.querySelectorAll('#genero-opcoes input[type="checkbox"]').forEach(c => {
        c.checked = generos.includes(c.value);
      });

      // Calcular e configurar o rating (escala de 1 a 5)
      // O IMDb Rating é geralmente de 0 a 10. Dividimos por 2 e arredondamos.
      const notaIMDb = parseFloat(data.imdbRating);
      ratingSelecionado = isNaN(notaIMDb) ? 0 : Math.round(notaIMDb / 2);
      atualizarEstrelas(); // Atualiza a exibição das estrelas
    })
    .catch(err => {
      console.error("Erro ao buscar filme no OMDb:", err);
      alert("Erro ao buscar informações do filme. Verifique sua conexão ou a API Key.");
    });
}
