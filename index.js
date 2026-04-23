const API_KEY = "95dd0fd5e6087234dd7dc6c516ffb45c";

// Mapeamento atualizado com IDs oficiais do TMDB
const STREAMING_MAP = {
  "Netflix": 8,
  "Amazon Prime Video": 9,
  "Disney Plus": 337,
  "HBO Max": 1899, // Atualizado para o ID da 'Max' que é mais estável agora
  "Apple TV+": 350,
  "Paramount+": 531
};

function salvarPreferencias() {
  const checkboxes = document.querySelectorAll("input[type=checkbox]:checked");
  const selecionados = Array.from(checkboxes).map(cb => cb.value);
  
  localStorage.setItem("streamings", JSON.stringify(selecionados));
  alert("Preferências salvas com sucesso!");
}

async function indicarFilme() {
  const favoritos = JSON.parse(localStorage.getItem("streamings")) || [];
  const resultado = document.getElementById("resultado");
  
  if (favoritos.length === 0) {
    resultado.innerHTML = "⚠️ Escolha pelo menos um streaming!";
    return;
  }
  
  resultado.innerHTML = "🔎 Buscando um filme top pra você...";
  
  try {
    const providerIds = favoritos.map(nome => STREAMING_MAP[nome]).join("|");
    
    // Chamada para descobrir filmes populares nos streamings selecionados no Brasil
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=pt-BR&sort_by=popularity.desc&watch_region=BR&with_watch_providers=${providerIds}`;
    
    const resposta = await fetch(url);
    const dados = await resposta.json();
    
    if (!dados.results || dados.results.length === 0) {
      resultado.innerHTML = "😢 Nenhum filme encontrado. Tente selecionar mais streamings!";
      return;
    }
    
    // Sorteia um dos 20 filmes da primeira página
    const filme = dados.results[Math.floor(Math.random() * dados.results.length)];
    
    // Busca os provedores específicos deste filme para confirmar onde assistir
    const provResp = await fetch(
      `https://api.themoviedb.org/3/movie/${filme.id}/watch/providers?api_key=${API_KEY}`
    );
    const provDados = await provResp.json();
    const provedoresBR = provDados.results?.BR?.flatrate || [];
    
    mostrarFilme(filme, provedoresBR);
    
  } catch (erro) {
    console.error("Erro na API:", erro);
    resultado.innerHTML = "❌ Erro ao buscar filme. Verifique sua conexão.";
  }
}

function mostrarFilme(filme, provedores) {
  const container = document.getElementById("resultado");
  const imagem = filme.poster_path ?
    `https://image.tmdb.org/t/p/w500${filme.poster_path}` :
    "https://via.placeholder.com/500x750?text=Sem+Poster";
  
  const nomesProvedores = provedores.length > 0 
    ? provedores.map(p => p.provider_name).join(", ") 
    : "Disponível nos seus streamings selecionados";

  container.innerHTML = `
    <div style="text-align: center; animation: fadeIn 0.5s ease-in;">
      <img src="${imagem}" class="poster" style="max-width: 100%; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);"/>
      <h2 style="margin-top: 15px;">${filme.title}</h2>
      <p style="font-style: italic; color: #666;">${filme.release_date ? filme.release_date.split('-')[0] : ''}</p>
      <p><strong>⭐ Nota:</strong> ${filme.vote_average.toFixed(1)}/10</p>
      <p style="text-align: justify; padding: 0 10px;">${filme.overview || "Sinopse não disponível em português."}</p>
      <div style="background: #f0f0f0; padding: 10px; border-radius: 8px; margin-top: 10px;">
        <p style="margin: 0;"><strong>📺 Onde assistir:</strong> ${nomesProvedores}</p>
      </div>
    </div>
  `;
}
