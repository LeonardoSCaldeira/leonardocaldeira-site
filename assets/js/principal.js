// Todo o JavaScript do site. Cinco responsabilidades, nada além disso.

const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

// 1. Título fatiado em linhas: cada linha sobe por trás de uma máscara. Precisa
//    das fontes carregadas, senão a medição das linhas sai errada. Refaz no
//    redimensionamento, porque a quebra de linha muda com a largura.
const titulos = [...document.querySelectorAll('.fatiar')];

function fatiar(titulo) {
  if (titulo.dataset.texto === undefined) titulo.dataset.texto = titulo.textContent.trim();

  const porLetra = titulo.classList.contains('fatiar-letras');
  titulo.textContent = titulo.dataset.texto;
  const palavras = titulo.dataset.texto.split(/\s+/);
  titulo.textContent = '';

  const marcas = palavras.map((palavra, i) => {
    const marca = document.createElement('span');
    marca.textContent = palavra;
    marca.style.display = 'inline-block';
    titulo.append(marca);
    if (i < palavras.length - 1) titulo.append(' ');
    return marca;
  });

  // Agrupa as palavras por linha, medindo onde cada uma caiu.
  const linhas = [];
  let topo = null;
  for (const marca of marcas) {
    const y = Math.round(marca.getBoundingClientRect().top);
    if (topo === null || Math.abs(y - topo) > 4) { linhas.push([]); topo = y; }
    linhas.at(-1).push(marca.textContent);
  }

  titulo.textContent = '';
  let contaLetra = 0;

  linhas.forEach((palavrasDaLinha, i) => {
    const mascara = document.createElement('span');
    mascara.className = 'linha';
    const interna = document.createElement('span');
    interna.className = 'linha-interna';

    if (porLetra) {
      // O título se forma letra a letra. Os espaços ficam como texto solto,
      // senão o inline-block come o espaçamento entre as palavras.
      for (const caractere of palavrasDaLinha.join(' ')) {
        if (caractere === ' ') { interna.append(' '); continue; }
        const letra = document.createElement('span');
        letra.className = 'letra';
        letra.textContent = caractere;
        letra.style.transitionDelay = contaLetra * 24 + 'ms';
        interna.append(letra);
        contaLetra += 1;
      }
    } else {
      interna.textContent = palavrasDaLinha.join(' ');
      interna.style.transitionDelay = i * 95 + 'ms';
    }

    mascara.append(interna);
    titulo.append(mascara);
    // Espaço entre as máscaras: some na tela, mas mantém a leitura correta
    // do título por leitor de tela.
    if (i < linhas.length - 1) titulo.append(' ');
  });

  // Com o texto picado em letras, o leitor de tela soletraria. O rótulo
  // devolve a frase inteira e as peças somem da árvore de acessibilidade.
  if (porLetra) {
    titulo.setAttribute('aria-label', titulo.dataset.texto);
    titulo.querySelectorAll('.linha').forEach((l) => l.setAttribute('aria-hidden', 'true'));
  }

  rearmar(titulo);
}

// O fatiamento espera as fontes carregarem, e nesse meio-tempo o observador já
// pode ter marcado o bloco como visto — aí as peças nasceriam prontas e não
// animariam nada. Tira a marca e devolve no quadro seguinte, para a transição
// ter de onde sair.
function rearmar(elemento) {
  if (!elemento.classList.contains('visto')) return;
  elemento.classList.remove('visto');
  requestAnimationFrame(() => requestAnimationFrame(() => elemento.classList.add('visto')));
}

// Parágrafos que entram palavra a palavra. Mesmo cuidado com leitor de tela.
function separarPalavras(bloco) {
  if (bloco.dataset.texto === undefined) bloco.dataset.texto = bloco.textContent.trim();
  bloco.setAttribute('aria-label', bloco.dataset.texto);
  bloco.textContent = '';

  bloco.dataset.texto.split(/\s+/).forEach((palavra, i, todas) => {
    const peca = document.createElement('span');
    peca.className = 'palavra';
    peca.setAttribute('aria-hidden', 'true');
    peca.textContent = palavra;
    peca.style.transitionDelay = 260 + i * 32 + 'ms';
    bloco.append(peca);
    if (i < todas.length - 1) bloco.append(' ');
  });

  rearmar(bloco);
}

const paragrafos = [...document.querySelectorAll('.palavras')];

if ((titulos.length || paragrafos.length) && !semMovimento) {
  const refatiar = () => {
    titulos.forEach(fatiar);
    paragrafos.forEach(separarPalavras);
  };
  document.fonts.ready.then(refatiar);

  let largura = innerWidth;
  let espera;
  addEventListener('resize', () => {
    if (innerWidth === largura) return;
    largura = innerWidth;
    clearTimeout(espera);
    espera = setTimeout(refatiar, 220);
  });
}

// 2. Revelação de entrada: bloco, título e cortina de imagem, cada um uma vez.
const marcados = document.querySelectorAll('.revela, .fatiar, .palavras, .capa');

if (marcados.length) {
  const olho = new IntersectionObserver((entradas, observador) => {
    for (const entrada of entradas) {
      if (!entrada.isIntersecting) continue;
      entrada.target.classList.add('visto');
      observador.unobserve(entrada.target);
    }
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });

  marcados.forEach((m) => olho.observe(m));
}

// 3. Movimento ligado à rolagem: o parallax das imagens e o preenchimento da
//    linha do tempo. Um único requestAnimationFrame para os dois, ligado por
//    IntersectionObserver e parado quando não há nada à vista.
const alvosParallax = [...document.querySelectorAll('[data-parallax]')];
const linhaTempo = document.querySelector('.linha-tempo');
const estacoes = linhaTempo ? [...linhaTempo.querySelectorAll('.estacao')] : [];

if ((alvosParallax.length || linhaTempo) && !semMovimento) {
  const ativos = new Set();
  let quadro = 0;

  const limitar = (n) => Math.max(0, Math.min(1, n));

  function passo() {
    const meio = innerHeight / 2;

    for (const alvo of ativos) {
      const caixa = alvo.getBoundingClientRect();

      if (alvo === linhaTempo) {
        // Enche conforme a seção atravessa a tela, e acende cada estação
        // quando o preenchimento passa por ela.
        const avanco = limitar((innerHeight * 0.78 - caixa.top) / (caixa.height + innerHeight * 0.25));
        linhaTempo.style.setProperty('--avanco', avanco.toFixed(3));
        estacoes.forEach((estacao, i) => {
          estacao.classList.toggle('ativa', avanco >= (i + 0.35) / estacoes.length);
        });
        continue;
      }

      const desvio = (caixa.top + caixa.height / 2 - meio) * parseFloat(alvo.dataset.parallax);
      const imagem = alvo.querySelector('img');
      if (imagem) imagem.style.setProperty('--desvio', Math.max(-26, Math.min(26, desvio)).toFixed(1) + 'px');
    }

    quadro = ativos.size && !document.hidden ? requestAnimationFrame(passo) : 0;
  }

  const vigia = new IntersectionObserver((entradas) => {
    for (const entrada of entradas) {
      entrada.isIntersecting ? ativos.add(entrada.target) : ativos.delete(entrada.target);
    }
    if (ativos.size && !quadro) quadro = requestAnimationFrame(passo);
  });

  alvosParallax.forEach((a) => vigia.observe(a));
  if (linhaTempo) vigia.observe(linhaTempo);

  addEventListener('visibilitychange', () => {
    if (!document.hidden && ativos.size && !quadro) quadro = requestAnimationFrame(passo);
  });
}

// 4. A vitrine do hero. Quem troca de projeto é o visitante, nunca um relógio:
//    conteúdo que se move sozinho tira o controle da mão de quem está lendo.
//    Só a imagem em exibição é baixada; as outras entram quando são pedidas.
const painel = document.getElementById('vitrine');
const abas = [...document.querySelectorAll('.abas [role="tab"]')];

if (painel && abas.length) {
  const figura = painel.querySelector('picture');
  const imagem = figura.querySelector('img');
  const fontes = figura.querySelectorAll('source');
  const link = painel.querySelector('.vitrine-link');
  const nome = painel.querySelector('.vitrine-nome');
  const descricao = painel.querySelector('.vitrine-desc');
  const medidas = fontes[0].getAttribute('sizes');

  function mostrar(aba) {
    const { slug, nome: titulo, url, desc, alt } = aba.dataset;

    abas.forEach((a) => {
      const ativa = a === aba;
      a.setAttribute('aria-selected', String(ativa));
      a.tabIndex = ativa ? 0 : -1;
    });

    painel.setAttribute('aria-labelledby', aba.id);
    link.href = url;
    nome.textContent = titulo;

    if (semMovimento) {
      descricao.textContent = desc;
    } else {
      // O texto se forma de novo a cada troca: a interação ganha corpo sem
      // precisar de efeito novo, reaproveitando a mesma montagem do hero.
      // separarPalavras já rearma a animação; marcar como visto aqui de novo
      // cancelaria o rearme antes do quadro seguinte.
      descricao.dataset.texto = desc;
      separarPalavras(descricao);
    }

    fontes.forEach((fonte) => {
      const extensao = fonte.type === 'image/avif' ? 'avif' : 'webp';
      fonte.srcset = `assets/imagens/hero-${slug}-640.${extensao} 640w, assets/imagens/hero-${slug}-1120.${extensao} 1120w`;
      fonte.setAttribute('sizes', medidas);
    });

    painel.classList.add('trocando');
    imagem.src = `assets/imagens/hero-${slug}-1120.webp`;
    imagem.alt = alt;
    imagem.decode().catch(() => {}).then(() => painel.classList.remove('trocando'));
  }

  abas.forEach((aba) => aba.addEventListener('click', () => mostrar(aba)));

  // Setas, Home e End percorrem as abas, como manda o padrão de tablist.
  document.querySelector('.abas').addEventListener('keydown', (evento) => {
    const atual = abas.indexOf(document.activeElement);
    if (atual < 0) return;
    const passo = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[evento.key];
    let alvo = null;

    if (passo) alvo = abas[(atual + passo + abas.length) % abas.length];
    else if (evento.key === 'Home') alvo = abas[0];
    else if (evento.key === 'End') alvo = abas[abas.length - 1];
    if (!alvo) return;

    evento.preventDefault();
    alvo.focus();
    mostrar(alvo);
  });
}

// 5. O fio na base da nav, que só aparece depois que a página sai do topo.
//    Sentinela em vez de listener de scroll: nada roda a cada quadro.
const topo = document.getElementById('topo');
const nav = document.querySelector('.nav');

if (topo && nav) {
  new IntersectionObserver(
    ([entrada]) => nav.classList.toggle('rolou', !entrada.isIntersecting),
    { threshold: 1 }
  ).observe(topo);
}
