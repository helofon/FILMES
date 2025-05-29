let filmes = [];
let editandoIndex = -1;
let ratingSelecionado = 0;

window.onload = function () {
  const filmesSalvos = localStorage.getItem("filmes");
  if (filmesSalvos) {
    filmes = JSON.parse(filmesSalvos);
    exibirFilmes();
  }

  document.querySelectorAll('.estrela').forEach(estrela => {
    estrela.addEventListener('click', () => {
      ratingSelecionado = parseInt(estrela.getAttribute('data-value'));
      atualizarEstrelas();
    });
  });
};

function atualizarEstrelas() {
  document.querySelectorAll('.estrela').forEach(estrela => {
    const valor = parseInt(estrela.getAttribute('data-value'));
    estrela.classList.toggle('selecionada', valor <= ratingSelecionado);
  });
}

function adicionarOuSalvarFilme() {
  const titulo = document.getElementById('titulo').value;
  const sinopse = document.getElementById('sinopse').value;
  const generoSelect = document.getElementById('genero');
  const capa = document.getElementById('capa').value;
  const trailer = document.getElementById('trailer').value;
  const generosSelecionados = Array.from(generoSelect.selectedOptions).map(opt => opt.value);

  const filme = {
    titulo,
    sinopse,
    genero: generosSelecionados,
    capa,
    trailer,
    rating: ratingSelecionado
  };

  if (editandoIndex >= 0) {
    filmes[editandoIndex] = filme;
    editandoIndex = -1;
  } else {
    filmes.push(filme);
  }

  localStorage.setItem("filmes", JSON.stringify(filmes));
  exibirFilmes();
  limparCampos();
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
        <input type="checkbox" value="${index}"> Selecionar<br>
        <button onclick="editarFilme(${index})">Editar</button>
        <button onclick="removerFilme(${index})">Remover</button>
      </div>
    `;
  });
}

function editarFilme(index) {
  const filme = filmes[index];
  document.getElementById('titulo').value = filme.titulo;
  document.getElementById('sinopse').value = filme.sinopse;
  document.getElementById('capa').value = filme.capa;
  document.getElementById('trailer').value = filme.trailer;
  ratingSelecionado = filme.rating || 0;
  atualizarEstrelas();

  const generoSelect = document.getElementById('genero');
  Array.from(generoSelect.options).forEach(option => {
    option.selected = filme.genero.includes(option.value);
  });

  editandoIndex = index;
}

function removerFilme(index) {
  if (confirm("Tem certeza que deseja remover este filme?")) {
    filmes.splice(index, 1);
    localStorage.setItem("filmes", JSON.stringify(filmes));
    exibirFilmes();
  }
}

function limparTodos() {
  if (confirm("Tem certeza que deseja apagar todos os filmes?")) {
    filmes = [];
    localStorage.removeItem("filmes");
    exibirFilmes();
  }
}

function sortearFilme() {
  const selecionados = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
    .map(checkbox => filmes[checkbox.value]);

  const resultado = document.getElementById('resultado');

  if (selecionados.length === 0) {
    resultado.innerText = 'Nenhum filme selecionado!';
    return;
  }

  const filmeSorteado = selecionados[Math.floor(Math.random() * selecionados.length)];
  resultado.innerText = `🎬 Filme Sorteado: ${filmeSorteado.titulo}`;
}

function limparCampos() {
  document.getElementById('titulo').value = '';
  document.getElementById('sinopse').value = '';
  document.getElementById('capa').value = '';
  document.getElementById('trailer').value = '';
  document.getElementById('genero').selectedIndex = -1;
  ratingSelecionado = 0;
  atualizarEstrelas();
}
