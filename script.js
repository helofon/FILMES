
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

// Estrelas
document.addEventListener("DOMContentLoaded", function () {
  carregarFilmes();
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

  document.getElementById('buscar-filme').addEventListener('click', buscarFilme);
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

  db.collection("filmes").add(filme).then(() => {
    carregarFilmes();
    limparCampos();
  });
}

function carregarFilmes() {
  db.collection("filmes").get().then(snapshot => {
    filmes = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      data.id = doc.id;
      filmes.push(data);
    });
    exibirFilmes();
  });
}

function exibirFilmes() {
  const container = document.getElementById('filmes-container');
  container.innerHTML = '';
  filmes.forEach((filme, index) => {
    const estrelas = '★'.repeat(filme.rating || 0) + '☆'.repeat(5 - (filme.rating || 0));
    container.innerHTML += `
      <div class="filme">
        <h3>${filme.titulo}</h3>
        <p>${filme.sinopse}</p>
        <p><strong>Gêneros:</strong> ${filme.genero.join(', ')}</p>
        <p><strong>Rating:</strong> ${estrelas}</p>
        <img src="${filme.capa}" alt="${filme.titulo}">
        <p><a href="${filme.trailer}" target="_blank">Assistir Trailer</a></p>
        <input type="checkbox" value="${index}"> Selecionar
      </div>
    `;
  });
}

function sortearFilme() {
  const selecionados = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
    .map(c => filmes[c.value]);

  const resultado = document.getElementById("resultado");
  if (selecionados.length === 0) {
    resultado.innerText = "Nenhum filme selecionado!";
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

function buscarFilme() {
  const titulo = document.getElementById('titulo').value;
  if (!titulo) {
    alert('Por favor, insira o título do filme!');
    return;
  }
  const apiKey = "7a859aa5";
  const url = `https://www.omdbapi.com/?t=${encodeURIComponent(titulo)}&apikey=${apiKey}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.Response === "True") {
        document.getElementById('sinopse').value = data.Plot;
        document.getElementById('capa').value = data.Poster;
        document.getElementById('trailer').value = `https://www.youtube.com/results?search_query=${encodeURIComponent(data.Title)}+trailer`;
      } else {
        alert('Filme não encontrado!');
      }
    })
    .catch(error => {
      console.error("Erro ao buscar filme:", error);
      alert('Erro ao buscar informações do filme!');
    });
}
