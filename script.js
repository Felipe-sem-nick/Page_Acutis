// Mobile Navigation
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Múltiplas fontes de liturgia para garantir disponibilidade
const FONTES_LITURGIA = {
    cancaoNova: 'https://liturgia.cancaonova.com/pb/',
    paulus: 'https://liturgia.paulus.com.br/',
    cnbb: 'https://liturgiadiaria.cnbb.org.br/',
    vaticannews: 'https://www.vaticannews.va/pt/liturgia.html'
};

const CORS_PROXY = 'https://api.allorigins.win/get?url=';
const BACKUP_PROXY = 'https://cors-anywhere.herokuapp.com/';

// Cache for today's gospel to avoid multiple requests
let cachedGospel = null;
let cacheDate = null;

// Função principal melhorada para carregar evangelho automaticamente
async function carregarEvangelhoAutomatico() {
    const dataElement = document.getElementById('evangelho-data');
    const leituraElement = document.getElementById('evangelho-leitura');
    
    // Exibir estado de carregamento
    leituraElement.innerHTML = '<div class="loading"></div> 📖 Buscando evangelho do dia...';
    
    try {
        const hoje = new Date();
        const dataHoje = hoje.toISOString().split('T')[0];
        
        console.log('📅 Verificando evangelho para:', dataHoje);
        console.log('📅 Cache atual:', cacheDate);
        
        // Verificar se já temos o evangelho de hoje
        if (cachedGospel && cacheDate === dataHoje) {
            console.log('✅ Usando evangelho em cache');
            exibirEvangelho(cachedGospel, dataElement, leituraElement);
            return;
        }
        
        console.log('🔄 Carregando novo evangelho...');
        
        // Tentar buscar de múltiplas fontes
        let evangelhoCarregado = null;
        const fontes = Object.entries(FONTES_LITURGIA);
        
        for (let i = 0; i < fontes.length; i++) {
            const [nomeFonte, urlFonte] = fontes[i];
            
            try {
                console.log(`🔍 Tentando ${nomeFonte} (${i + 1}/${fontes.length})...`);
                leituraElement.innerHTML = `<div class="loading"></div> 🔍 Conectando com ${nomeFonte}...`;
                
                evangelhoCarregado = await buscarDeFonte(urlFonte, nomeFonte);
                
                if (evangelhoCarregado && evangelhoCarregado.texto && evangelhoCarregado.texto.length > 50) {
                    console.log(`✅ Sucesso com ${nomeFonte}!`);
                    break;
                }
            } catch (erro) {
                console.log(`❌ ${nomeFonte} falhou:`, erro.message);
                continue;
            }
        }
        
        // Se todas as fontes falharam, usar conteúdo local
        if (!evangelhoCarregado || !evangelhoCarregado.texto || evangelhoCarregado.texto.length < 50) {
            console.log('📚 Usando evangelho local alternativo...');
            leituraElement.innerHTML = '<div class="loading"></div> 📚 Carregando conteúdo local...';
            evangelhoCarregado = await obterEvangelhoAlternativo();
        }
        
        // Salvar no cache
        cachedGospel = evangelhoCarregado;
        cacheDate = dataHoje;
        
        console.log('✅ Evangelho carregado e salvo no cache');
        exibirEvangelho(evangelhoCarregado, dataElement, leituraElement);
        
    } catch (error) {
        console.error('❌ Erro crítico:', error);
        leituraElement.innerHTML = `
            <div style="text-align: center; padding: 1.5rem; background: #ffebee; border-radius: 8px; border-left: 4px solid #0D47A1;">
                <p style="color: #0D47A1; font-weight: bold; margin-bottom: 1rem;">
                    ⚠️ Não foi possível carregar o evangelho
                </p>
                <p style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">
                    Verifique sua conexão ou tente novamente.
                </p>
                <button onclick="forcarAtualizacaoEvangelho()" 
                        style="background: #4CAF50; color: white; border: none; padding: 0.6rem 1.2rem; 
                               border-radius: 5px; cursor: pointer; font-size: 0.9rem;">
                    🔄 Tentar Novamente
                </button>
            </div>
        `;
    }
}

// Force gospel update (clears cache)
function forcarAtualizacaoEvangelho() {
    console.log('Forçando atualização do evangelho...');
    cachedGospel = null;
    cacheDate = null;
    carregarEvangelhoAutomatico();
}

// Make force update available globally
window.forcarAtualizacaoEvangelho = forcarAtualizacaoEvangelho;

// Função universal para buscar evangelho de qualquer fonte
async function buscarDeFonte(url, nomeFonte) {
    // Tentar conexão direta primeiro
    try {
        console.log(`🚀 Conexão direta com ${nomeFonte}`);
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (response.ok) {
            const html = await response.text();
            const resultado = extrairEvangelhoDoHTML(html);
            if (resultado && resultado.texto && resultado.texto.length > 50) {
                return resultado;
            }
        }
        throw new Error(`Resposta inválida: ${response.status}`);
        
    } catch (erroConexaoDireta) {
        console.log(`❌ Conexão direta falhou: ${erroConexaoDireta.message}`);
        
        // Tentar com proxy CORS
        try {
            console.log(`🔄 Tentando proxy CORS para ${nomeFonte}`);
            const proxyUrl = CORS_PROXY + encodeURIComponent(url);
            
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error(`Erro no proxy: ${response.status}`);
            }
            
            const data = await response.json();
            const resultado = extrairEvangelhoDoHTML(data.contents);
            
            if (resultado && resultado.texto && resultado.texto.length > 50) {
                return resultado;
            }
            throw new Error('Conteúdo inválido do proxy');
            
        } catch (erroProxy) {
            console.log(`❌ Proxy falhou: ${erroProxy.message}`);
            throw new Error(`Todas as tentativas falharam para ${nomeFonte}`);
        }
    }
}

// Função melhorada para extrair evangelho do HTML
function extrairEvangelhoDoHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    try {
        let referencia = 'Evangelho do Dia';
        let texto = '';
        
        // Estratégia 1: Buscar por seletores CSS comuns
        const seletores = [
            '.evangelho-content', '.liturgia-evangelho', '.gospel-content',
            '[data-evangelho]', '.texto-liturgico', '.daily-gospel'
        ];
        
        for (const seletor of seletores) {
            const elemento = doc.querySelector(seletor);
            if (elemento) {
                console.log('🎯 Encontrado via seletor:', seletor);
                texto = elemento.textContent || elemento.innerText || '';
                break;
            }
        }
        
        // Estratégia 2: Busca por texto (mais robusta)
        if (!texto || texto.length < 50) {
            console.log('🔍 Usando busca por texto...');
            const conteudo = doc.body.textContent || doc.body.innerText || '';
            
            // Buscar referência do evangelho
            const padraoReferencia = /(?:Mt|Mc|Lc|Jo)\s+\d+[,:.]\d+-\d+/gi;
            const matchReferencia = conteudo.match(padraoReferencia);
            if (matchReferencia && matchReferencia[0]) {
                referencia = formatarReferencia(matchReferencia[0]);
            }
            
            // Buscar texto do evangelho com vários padrões
            const padroes = [
                // Padrão Canção Nova tradicional
                /Naquele tempo[\s\S]*?(?=Palavra da Salvação|— Palavra|— Glória|$)/i,
                // Padrão com Jesus disse
                /(?:Jesus disse|Disse Jesus)[\s\S]*?(?=Palavra da Salvação|— Palavra|$)/i,
                // Padrão com Em verdade
                /Em verdade[\s\S]*?(?=Palavra da Salvação|— Palavra|$)/i,
                // Bloco após Evangelho
                /Evangelho[\s\S]{50,}?([\s\S]{150,}?)(?=Oração|Meditação|$)/i
            ];
            
            for (const padrao of padroes) {
                const match = conteudo.match(padrao);
                if (match) {
                    let textoEncontrado = match[0] || match[1] || '';
                    textoEncontrado = limparTextoEvangelho(textoEncontrado);
                    
                    if (textoEncontrado.length > 100) {
                        texto = textoEncontrado;
                        console.log('🎯 Texto encontrado com padrão');
                        break;
                    }
                }
            }
        }
        
        // Validar resultado
        if (!texto || texto.length < 50) {
            throw new Error('Texto do evangelho não encontrado');
        }
        
        // Formatar resultado final
        const textoFinal = finalizarTextoEvangelho(texto);
        
        console.log('✅ Evangelho extraído com sucesso');
        return { referencia, texto: textoFinal };
        
    } catch (error) {
        console.error('❌ Erro na extração:', error);
        throw new Error('Falha ao extrair evangelho: ' + error.message);
    }
}

// Função auxiliar para formatar referência
function formatarReferencia(ref) {
    const livros = { 'Mt': 'Mateus', 'Mc': 'Marcos', 'Lc': 'Lucas', 'Jo': 'João' };
    const partes = ref.trim().split(/\s+/);
    
    if (partes.length >= 2) {
        const livro = partes[0];
        const capitulo = partes.slice(1).join(' ');
        const nomeCompleto = livros[livro] || livro;
        return `Evangelho segundo São ${nomeCompleto} (${livro} ${capitulo})`;
    }
    return `Evangelho do Dia - ${ref}`;
}

// Função para limpar texto do evangelho
function limparTextoEvangelho(texto) {
    return texto
        .replace(/Glória a vós, Senhor/gi, '')
        .replace(/Palavra da Salvação/gi, '')
        .replace(/— Palavra.*$/gm, '')
        .replace(/— Glória.*$/gm, '')
        .trim();
}

// Função para finalizar formatação do texto
function finalizarTextoEvangelho(texto) {
    let textoLimpo = texto
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    
    // Adicionar conclusão padrão se não existir
    if (!textoLimpo.includes('Palavra da Salvação')) {
        textoLimpo += '\n\n— Palavra da Salvação.\n— Glória a vós, Senhor.';
    }
    
    return textoLimpo;
}

// Test function to check API connectivity
async function testarConexaoCancaoNova() {
    console.log('=== TESTING CANÇÃO NOVA CONNECTION ===');
    console.log('Target URL:', LITURGY_URL);
    
    try {
        console.log('1. Testing direct connection...');
        const directResult = await fetchGospelFromCancaoNova();
        console.log('✅ Direct connection successful!', directResult);
        return directResult;
    } catch (directError) {
        console.log('⚠️ Direct connection failed:', directError.message);
        
        try {
            console.log('2. Testing proxy connection...');
            const proxyResult = await fetchGospelWithProxy();
            console.log('✅ Proxy connection successful!', proxyResult);
            return proxyResult;
        } catch (proxyError) {
            console.log('❌ Proxy connection failed:', proxyError.message);
            
            console.log('3. Using fallback content...');
            const fallbackResult = await obterEvangelhoAlternativo();
            console.log('ℹ️ Using fallback content:', fallbackResult);
            return fallbackResult;
        }
    }
}

// Make testing function available globally
window.testarConexaoCancaoNova = testarConexaoCancaoNova;

// Debug function to check cache status
function verificarStatusCache() {
    const hoje = new Date();
    const dataAtual = hoje.toISOString().split('T')[0];
    
    console.log('=== STATUS DO CACHE DO EVANGELHO ===');
    console.log('Data atual:', dataAtual);
    console.log('Data no cache:', cacheDate);
    console.log('Evangelho em cache:', !!cachedGospel);
    console.log('Cache válido:', cacheDate === dataAtual);
    
    if (cachedGospel) {
        console.log('Referência do evangelho em cache:', cachedGospel.referencia);
        console.log('Início do texto:', cachedGospel.texto.substring(0, 100) + '...');
    }
    
    return {
        dataAtual,
        dataCache: cacheDate,
        temCache: !!cachedGospel,
        cacheValido: cacheDate === dataAtual
    };
}

// Make debug function available globally
window.verificarStatusCache = verificarStatusCache;
async function obterEvangelhoAlternativo() {
    // In a real implementation, you would use a CORS-enabled API or your own backend
    // For now, we'll simulate daily content based on date patterns
    
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth() + 1;
    const dia = hoje.getDate();
    
    // Create a unique seed based on the date for consistent daily content
    const semente = (ano * 10000) + (mes * 100) + dia;
    
    // Database of gospel passages for different occasions/seasons
    const evangelhos = [
        {
            referencia: "Evangelho segundo São João (Jo 14,1-6)",
            texto: `Naquele tempo, disse Jesus aos seus discípulos:
            
            "Não se perturbe o vosso coração. Tendes fé em Deus, tende fé também em mim. Na casa de meu Pai há muitas moradas. Se assim não fosse, eu vos teria dito. Vou preparar-vos um lugar. E quando eu for e vos preparar um lugar, voltarei e vos levarei comigo, para que, onde eu estou, estejais também vós. E vós conheceis o caminho para onde eu vou."
            
            Disse-lhe Tomé: "Senhor, não sabemos para onde vais. Como podemos conhecer o caminho?"
            
            Respondeu-lhe Jesus: "Eu sou o Caminho, a Verdade e a Vida. Ninguém vem ao Pai senão por mim."
            
            — Palavra da Salvação.
            — Glória a vós, Senhor.`
        },
        {
            referencia: "Evangelho segundo São Lucas (Lc 5,33-39)",
            texto: `Naquele tempo, os fariseus e os mestres da Lei disseram a Jesus: "Os discípulos de João, e também os discípulos dos fariseus, jejuam com frequência e fazem orações. Mas os teus discípulos comem e bebem". 
            
            Jesus, porém, lhes disse: "Os convidados de um casamento podem fazer jejum enquanto o noivo está com eles? Mas dias virão em que o noivo será tirado do meio deles. Então, naqueles dias, eles jejuarão". 
            
            Jesus contou-lhes ainda uma parábola: "Ninguém tira retalho de roupa nova para fazer remendo em roupa velha; senão vai rasgar a roupa nova, e o retalho novo não combinará com a roupa velha. Ninguém coloca vinho novo em odres velhos; porque, senão, o vinho novo arrebenta os odres velhos e se derrama; e os odres se perdem. Vinho novo deve ser colocado em odres novos. E ninguém, depois de beber vinho velho, deseja vinho novo; porque diz: o velho é melhor".
            
            — Palavra da Salvação.
            — Glória a vós, Senhor.`
        },
        {
            referencia: "Evangelho segundo São Mateus (Mt 5,1-12)",
            texto: `Naquele tempo, vendo Jesus as multidões, subiu ao monte. Sentou-se e os discípulos aproximaram-se dele. Então começou a ensiná-los, dizendo:
            
            "Bem-aventurados os pobres em espírito, porque deles é o Reino dos Céus.
            Bem-aventurados os que choram, porque serão consolados.
            Bem-aventurados os mansos, porque herdarão a terra.
            Bem-aventurados os que têm fome e sede de justiça, porque serão saciados.
            Bem-aventurados os misericordiosos, porque alcançarão misericórdia.
            Bem-aventurados os puros de coração, porque verão a Deus.
            Bem-aventurados os pacificadores, porque serão chamados filhos de Deus.
            Bem-aventurados os que são perseguidos por causa da justiça, porque deles é o Reino dos Céus.
            Bem-aventurados sois quando vos injuriarem e vos perseguirem e, mentindo, disserem todo mal contra vós por causa de mim.
            Alegrai-vos e exultai, porque é grande a vossa recompensa nos céus."
            
            — Palavra da Salvação.
            — Glória a vós, Senhor.`
        },
        {
            referencia: "Evangelho segundo São Lucas (Lc 10,38-42)",
            texto: `Naquele tempo, Jesus entrou num povoado, e certa mulher, de nome Marta, recebeu-o em sua casa. Sua irmã chamava-se Maria. Esta sentou-se aos pés do Senhor e ficou escutando a sua palavra. Marta agitava-se de um lado para outro, ocupada com muitos serviços.
            
            Então aproximou-se e disse: "Senhor, não te importas que minha irmã me deixe sozinha com o serviço? Manda que ela venha ajudar-me!"
            
            O Senhor, porém, lhe respondeu: "Marta, Marta! Tu te preocupas e andas agitada por muitas coisas. Porém, uma só é necessária. Maria escolheu a melhor parte e esta não lhe será tirada."
            
            — Palavra da Salvação.
            — Glória a vós, Senhor.`
        },
        {
            referencia: "Evangelho segundo São João (Jo 3,16-21)",
            texto: `Naquele tempo, disse Jesus a Nicodemos:
            
            "Deus amou tanto o mundo, que entregou o seu Filho único, para que todo o que nele crer não pereça, mas tenha a vida eterna. De fato, Deus não enviou o seu Filho ao mundo para condenar o mundo, mas para que o mundo seja salvo por ele. Quem nele crê, não é condenado; quem não crê, já está condenado, porque não acreditou no nome do Filho único de Deus.
            
            Ora, o julgamento é este: a luz veio ao mundo, mas os homens preferiram as trevas à luz, porque suas ações eram más. Quem pratica o mal odeia a luz e não se aproxima da luz, para que suas ações não sejam denunciadas. Mas quem age conforme a verdade aproxima-se da luz, para que se torne claro que suas ações são realizadas em Deus."
            
            — Palavra da Salvação.
            — Glória a vós, Senhor.`
        },
        {
            referencia: "Evangelho segundo São Marcos (Mc 12,28-34)",
            texto: `Naquele tempo, aproximou-se de Jesus um dos escribas que os tinha ouvido discutir. Vendo como Jesus havia respondido bem, perguntou-lhe: "Qual é o primeiro de todos os mandamentos?"
            
            Jesus respondeu: "O primeiro é este: 'Ouve, ó Israel! O Senhor, nosso Deus, é o único Senhor. Amarás o Senhor, teu Deus, de todo o teu coração, de toda a tua alma, de todo o teu entendimento e com toda a tua força'. O segundo é este: 'Amarás o teu próximo como a ti mesmo'. Não existe outro mandamento maior do que estes."
            
            O escriba disse a Jesus: "Muito bem, Mestre! Na verdade disseste que ele é único e não há outro além dele; e que amá-lo de todo o coração, de todo o entendimento e com toda a força, e amar o próximo como a si mesmo vale mais do que todos os holocaustos e sacrifícios."
            
            Jesus, vendo que ele havia respondido sabiamente, disse-lhe: "Tu não estás longe do Reino de Deus". E ninguém mais ousava fazer-lhe perguntas.
            
            — Palavra da Salvação.
            — Glória a vós, Senhor.`
        },
        {
            referencia: "Evangelho segundo São Lucas (Lc 6,20-26)",
            texto: `Naquele tempo, Jesus, erguendo os olhos para os seus discípulos, disse:
            
            "Bem-aventurados vós, os pobres, porque vosso é o Reino de Deus!
            Bem-aventurados vós, que agora tendes fome, porque sereis saciados!
            Bem-aventurados vós, que agora chorais, porque havereis de rir!
            Bem-aventurados sereis quando os homens vos odiarem, quando vos expulsarem, vos injuriarem e proscreverem vosso nome como infame, por causa do Filho do Homem! Alegrai-vos nesse dia e exultai, porque grande é a vossa recompensa no céu.
            
            Mas ai de vós, ricos, porque já tendes a vossa consolação!
            Ai de vós, que estais saciados, porque tereis fome!
            Ai de vós, que agora rides, porque gemereis e chorareis!
            Ai de vós, quando todos os homens vos louvarem! Do mesmo modo seus pais tratavam os falsos profetas."
            
            — Palavra da Salvação.
            — Glória a vós, Senhor.`
        }
    ];
    
    // Select gospel based on date seed to ensure same gospel for same day
    const indice = semente % evangelhos.length;
    return evangelhos[indice];
}

// Function to display the gospel with proper formatting
function exibirEvangelho(evangelho, dataElement, leituraElement) {
    const hoje = new Date();
    const opcoes = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    
    dataElement.textContent = hoje.toLocaleDateString('pt-BR', opcoes);
    
    leituraElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 1.5rem;">
            <p><strong style="color: #0D47A1; font-size: 1.1rem;">${evangelho.referencia}</strong></p>
        </div>
        <div style="white-space: pre-line; text-align: justify; line-height: 1.8; font-size: 1rem;">
            ${evangelho.texto}
        </div>
        <div style="text-align: center; margin-top: 2rem;">
            <button onclick="forcarAtualizacaoEvangelho()" style="background: #4CAF50; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; font-size: 0.9rem;">🔄 Atualizar</button>
        </div>
    `;
}

// Sistema de atualização automática robusto
function configurarAtualizacaoAutomatica() {
    console.log('⚙️ Configurando atualização automática do evangelho...');
    
    // Função para verificar se precisa atualizar
    function precisaAtualizar() {
        const hoje = new Date();
        const dataHoje = hoje.toISOString().split('T')[0];
        
        // Verificar se não há cache ou se a data mudou
        return !cacheDate || cacheDate !== dataHoje || !cachedGospel;
    }
    
    // Função principal de verificação e atualização
    function verificarEAtualizar() {
        if (precisaAtualizar()) {
            const hoje = new Date();
            const dataAtual = hoje.toISOString().split('T')[0];
            
            console.log('🔄 Data mudou! Atualizando evangelho...');
            console.log('📅 Data atual:', dataAtual);
            console.log('📅 Último cache:', cacheDate);
            
            // Limpar cache e recarregar
            cachedGospel = null;
            cacheDate = null;
            carregarEvangelhoAutomatico();
        } else {
            console.log('✅ Evangelho já atualizado para hoje');
        }
    }
    
    // Verificação inicial
    verificarEAtualizar();
    
    // Verificar a cada 15 minutos
    const intervaloVerificacao = setInterval(verificarEAtualizar, 15 * 60 * 1000);
    console.log('⏰ Verificação configurada para cada 15 minutos');
    
    // Verificar próximo à meia-noite (mais frequente)
    function verificacaoMeiaNoite() {
        const agora = new Date();
        const hora = agora.getHours();
        const minuto = agora.getMinutos();
        
        // Entre 23:50 e 00:10 - verificar mais vezes
        if ((hora === 23 && minuto >= 50) || (hora === 0 && minuto <= 10)) {
            console.log('🌙 Verificação intensiva - próximo à meia-noite');
            verificarEAtualizar();
        }
    }
    
    // Verificar a cada minuto para capturar meia-noite
    const intervaloMeiaNoite = setInterval(verificacaoMeiaNoite, 60 * 1000);
    
    // Configurar timer preciso para meia-noite
    function configurarTimerMeiaNoite() {
        const agora = new Date();
        const proximaMeianoite = new Date(agora);
        proximaMeianoite.setDate(proximaMeianoite.getDate() + 1);
        proximaMeianoite.setHours(0, 0, 30, 0); // 00:00:30 para garantir que a data mudou
        
        const tempoRestante = proximaMeianoite.getTime() - agora.getTime();
        const minutosRestantes = Math.round(tempoRestante / 1000 / 60);
        
        console.log(`⏰ Timer para meia-noite configurado: ${minutosRestantes} minutos`);
        
        setTimeout(() => {
            console.log('🌅 Meia-noite detectada! Forçando atualização...');
            
            // Forçar atualização completa
            cachedGospel = null;
            cacheDate = null;
            carregarEvangelhoAutomatico();
            
            // Reconfigurar timer para próxima meia-noite
            setTimeout(configurarTimerMeiaNoite, 60000); // Esperar 1 minuto antes de reconfigurar
            
        }, tempoRestante);
    }
    
    // Iniciar timer de meia-noite
    configurarTimerMeiaNoite();
    
    // Verificar quando a página volta ao foco
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            console.log('👁️ Página voltou ao foco - verificando atualização');
            setTimeout(verificarEAtualizar, 2000); // Aguardar 2 segundos
        }
    });
    
    // Verificar quando a janela ganha foco
    window.addEventListener('focus', () => {
        console.log('🔍 Janela ganhou foco - verificando atualização');
        setTimeout(verificarEAtualizar, 2000);
    });
    
    console.log('✅ Sistema de atualização automática configurado!');
    
    // Retornar objeto com controles (para debug se necessário)
    return {
        verificarAgora: verificarEAtualizar,
        pararVerificacao: () => {
            clearInterval(intervaloVerificacao);
            clearInterval(intervaloMeiaNoite);
        }
    };
}

// Inicialização do sistema ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    console.log('📖 Inicializando sistema de evangelho automático...');
    console.log('🌐 Fontes disponíveis:', Object.keys(FONTES_LITURGIA).length);
    
    // Carregar evangelho imediatamente
    carregarEvangelhoAutomatico();
    
    // Configurar atualização automática
    window.sistemaAtualizacao = configurarAtualizacaoAutomatica();
    
    console.log('✅ Sistema inicializado com sucesso!');
});

// Funções de debug e monitoramento
function verificarStatusSistema() {
    const hoje = new Date();
    const dataAtual = hoje.toISOString().split('T')[0];
    const horaAtual = hoje.toLocaleTimeString('pt-BR');
    
    const status = {
        '📅 Data atual': dataAtual,
        '⏰ Hora atual': horaAtual,
        '📅 Data em cache': cacheDate || 'Nenhuma',
        '📖 Evangelho em cache': !!cachedGospel ? 'Sim' : 'Não',
        '✅ Cache válido': (cacheDate === dataAtual && !!cachedGospel) ? 'Sim' : 'Não',
        '🔄 Precisa atualizar': (!cacheDate || cacheDate !== dataAtual || !cachedGospel) ? 'Sim' : 'Não',
        '🌐 Fontes configuradas': Object.keys(FONTES_LITURGIA).length
    };
    
    console.log('=== STATUS DO SISTEMA ===');
    console.table(status);
    
    if (cachedGospel) {
        console.log('\n=== EVANGELHO EM CACHE ===');
        console.log('📖 Referência:', cachedGospel.referencia);
        console.log('📝 Tamanho do texto:', cachedGospel.texto.length);
        console.log('📝 Preview:', cachedGospel.texto.substring(0, 120) + '...');
    }
    
    return status;
}

function testarTodasAsFontes() {
    console.log('=== TESTANDO TODAS AS FONTES DE LITURGIA ===');
    
    const fontes = Object.entries(FONTES_LITURGIA);
    const resultados = [];
    
    // Testar cada fonte sequencialmente
    async function testarFonte(nome, url) {
        try {
            const inicio = Date.now();
            const resultado = await buscarDeFonte(url, nome);
            const tempo = Date.now() - inicio;
            
            return {
                fonte: nome,
                status: '✅ Sucesso',
                tempo: `${tempo}ms`,
                tamanho: resultado.texto ? resultado.texto.length : 0,
                referencia: resultado.referencia || 'N/A'
            };
        } catch (error) {
            return {
                fonte: nome,
                status: '❌ Falha',
                erro: error.message
            };
        }
    }
    
    // Executar testes em sequência
    const promessas = fontes.map(([nome, url]) => testarFonte(nome, url));
    
    Promise.all(promessas).then(resultados => {
        console.log('\n=== RESULTADOS DOS TESTES ===');
        console.table(resultados);
        
        const fontesOk = resultados.filter(r => r.status.includes('Sucesso')).length;
        console.log(`\n✅ ${fontesOk}/${fontes.length} fontes funcionando`);
    });
    
    return promessas;
}

function forcarAtualizacaoCompleta() {
    console.log('=== FORÇANDO ATUALIZAÇÃO COMPLETA ===');
    
    // Limpar cache completamente
    cachedGospel = null;
    cacheDate = null;
    
    console.log('🗑️ Cache limpo');
    console.log('🔄 Iniciando carregamento...');
    
    // Forçar carregamento
    return carregarEvangelhoAutomatico().then(() => {
        console.log('✅ Atualização completa finalizada!');
    }).catch(error => {
        console.error('❌ Erro na atualização:', error);
    });
}

// Disponibilizar funções globalmente para debug no console
window.verificarStatusSistema = verificarStatusSistema;
window.testarTodasAsFontes = testarTodasAsFontes;
window.forcarAtualizacaoCompleta = forcarAtualizacaoCompleta;

console.log('🚀 Sistema de Evangelho Automático carregado!');
console.log('📝 Para debug, use: verificarStatusSistema(), testarTodasAsFontes(), forcarAtualizacaoCompleta()');

// Test function to check API structure
async function testarAPI() {
    try {
        console.log('=== TESTING API ==>');
        console.log('API URL:', API_URL);
        
        // First, test if we can read from the API
        console.log('Testing GET request...');
        const getResponse = await fetch(API_URL);
        console.log('GET Response status:', getResponse.status);
        console.log('GET Response headers:', Object.fromEntries(getResponse.headers.entries()));
        
        if (getResponse.ok) {
            const getData = await getResponse.json();
            console.log('GET Full API response:', getData);
            console.log('GET Response type:', typeof getData);
            console.log('GET Is array:', Array.isArray(getData));
            
            if (getData && getData.length > 0) {
                console.log('First item structure:', getData[0]);
                console.log('Available columns:', Object.keys(getData[0] || {}));
            } else {
                console.log('No data found in response - table might be empty');
            }
        } else {
            console.error('GET request failed:', getResponse.status, getResponse.statusText);
            const errorText = await getResponse.text();
            console.error('GET Error response:', errorText);
        }
        
        // Test POST request with minimal data
        console.log('\n=== TESTING POST REQUEST ===');
        const testData = {
            nome: 'Teste API',
            intencao: 'Teste de conexão com a API'
        };
        
        console.log('Test data to send:', testData);
        
        const postResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ data: [testData] })
        });
        
        console.log('POST Response status:', postResponse.status);
        console.log('POST Response headers:', Object.fromEntries(postResponse.headers.entries()));
        
        const postResponseText = await postResponse.text();
        console.log('POST Raw response:', postResponseText);
        
        if (postResponse.ok) {
            console.log('✅ POST request successful!');
            try {
                const postResponseData = JSON.parse(postResponseText);
                console.log('POST Parsed response:', postResponseData);
            } catch (e) {
                console.log('POST Response is not JSON, but request was successful');
            }
        } else {
            console.error('❌ POST request failed:', postResponse.status, postResponse.statusText);
        }
        
    } catch (error) {
        console.error('API test error:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
    }
}

// Test function with sample data
function testarRenderizacao() {
    console.log('=== TESTING RENDERING WITH SAMPLE DATA ==>');
    const sampleData = [
        { nome: 'Teste 1', intencao: 'Esta é uma intenção de teste' },
        { nome: 'Teste 2', intencao: 'Outra intenção para verificar' }
    ];
    renderizarIntencoes(sampleData);
}

// Add test button to console
window.testarRenderizacao = testarRenderizacao;
window.carregarIntencoes = carregarIntencoes;
window.testarAPI = testarAPI;
window.testarEnvio = async function() {
    console.log('=== TESTING SUBMISSION ==>');
    const result = await enviarIntencao('Teste Console', 'Esta é uma intenção de teste via console');
    console.log('Test submission result:', result);
    if (result) {
        console.log('Test successful! Reloading data...');
        setTimeout(() => carregarIntencoes(), 1000);
    }
    return result;
};

// Alternative function specifically for SheetDB format
async function enviarIntencaoSheetDB(nome, intencao) {
    try {
        console.log('=== TRYING SHEETDB SPECIFIC FORMAT ==>');
        
        // SheetDB often expects data in this specific format
        const payload = {
            NOME: nome || 'Anônimo',
            'INTENÃO': intencao
        };
        
        console.log('SheetDB payload:', JSON.stringify(payload, null, 2));
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        console.log('SheetDB Response status:', response.status);
        const responseText = await response.text();
        console.log('SheetDB Response text:', responseText);
        
        return response.ok;
        
    } catch (error) {
        console.error('SheetDB specific format error:', error);
        return false;
    }
}

// Test function to find the correct column names
async function testarColunas() {
    console.log('=== TESTING COLUMN NAMES ==>');
    
    const testCombinations = [
        { NOME: 'Teste1', 'INTENÃÃO': 'Teste formato 1' },
        { NOME: 'Teste2', 'INTENÇÃO': 'Teste formato 2' },
        { NOME: 'Teste3', 'intenção': 'Teste formato 3' },
        { NOME: 'Teste4', 'INTENCAO': 'Teste formato 4' },
        { NOME: 'Teste5', 'intencao': 'Teste formato 5' }
    ];
    
    for (let i = 0; i < testCombinations.length; i++) {
        const testData = testCombinations[i];
        console.log(`\n--- Testing combination ${i + 1} ---`);
        console.log('Data:', JSON.stringify(testData, null, 2));
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testData)
            });
            
            console.log(`Response ${i + 1}:`, response.status, response.ok);
            const responseText = await response.text();
            console.log(`Response text ${i + 1}:`, responseText);
            
            if (response.ok) {
                console.log(`✅ Combination ${i + 1} might have worked!`);
                // Wait a bit and then check if the data appeared
                setTimeout(async () => {
                    const checkResponse = await fetch(API_URL);
                    const data = await checkResponse.json();
                    console.log('Updated data after test:', data.slice(-1)); // Show last entry
                }, 2000);
                break;
            }
        } catch (error) {
            console.log(`Error in combination ${i + 1}:`, error.message);
        }
    }
}

window.testarColunas = testarColunas;

// Test with curl-like request
async function testarComCurl() {
    try {
        console.log('=== TESTING WITH SIMPLE FORMAT ==>');
        
        const simpleData = {
            NOME: 'Teste Simples',
            'INTENÃO': 'Teste usando formato simples'
        };
        
        // Try the most basic fetch possible
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(simpleData),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Simple test status:', response.status);
        console.log('Simple test response:', await response.text());
        
        return response.ok;
        
    } catch (error) {
        console.error('Simple test error:', error);
        return false;
    }
}

window.enviarIntencaoSheetDB = enviarIntencaoSheetDB;
window.testarComCurl = testarComCurl;

// Intenções functionality with SheetDB API
const API_URL = 'https://sheetdb.io/api/v1/tnkjumf6seofr';
let intencaoForm;
let listaIntencoes;

// Initialize form elements after DOM loads
function initializeIntencaoForm() {
    intencaoForm = document.querySelector('.intencoes-form');
    listaIntencoes = document.getElementById('lista-intencoes');
    
    if (!intencaoForm) {
        console.error('Form not found!');
        return;
    }
    
    if (!listaIntencoes) {
        console.error('Lista de intenções not found!');
        return;
    }
    
    console.log('Form elements initialized successfully');
    
    // Add form submit event listener
    intencaoForm.addEventListener('submit', handleFormSubmit);
}

// Function to load intentions from SheetDB API
async function carregarIntencoes() {
    try {
        console.log('Loading intentions from:', API_URL);
        const response = await fetch(API_URL);
        
        console.log('Load response status:', response.status);
        console.log('Load response ok:', response.ok);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Loaded raw data:', data);
        console.log('Data type:', typeof data);
        console.log('Data length:', data ? data.length : 'N/A');
        
        // Check if data is an array, if not, it might be wrapped in another object
        let intencoes = Array.isArray(data) ? data : (data.data || data.result || []);
        console.log('Processed intentions array:', intencoes);
        
        // Show all available column names for debugging
        if (intencoes.length > 0) {
            console.log('Available columns in data:', Object.keys(intencoes[0]));
        }
        
        // Get last 6 intentions and reverse to show newest first (following project specification)
        const ultimasIntencoes = intencoes.slice(-6).reverse();
        console.log('Last 6 intentions (reversed):', ultimasIntencoes);
        
        renderizarIntencoes(ultimasIntencoes);
    } catch (error) {
        console.error('Erro ao carregar intenções:', error);
        listaIntencoes.innerHTML = `
            <div class="intencao-item">
                <p>Erro ao carregar intenções. Tente novamente mais tarde.</p>
                <p style="font-size: 0.8em; color: #666;">Erro: ${error.message}</p>
            </div>
        `;
    }
}

// Function to send intention to SheetDB API with multiple column name attempts
async function enviarIntencao(nome, intencao) {
    try {
        console.log('=== SENDING INTENTION ==>');
        console.log('Nome:', nome);
        console.log('Intenção:', intencao);
        
        // Try different column names that might work
        const columnVariations = [
            'INTENÇÃO',         // Ç -> Ç encoding
            'INTENÃÃO',         // Different UTF-8 encoding
            'intenção',         // Simple Portuguese
            'INTENCAO',           // Without special characters
            'intencao'            // Lowercase without special characters
        ];
        
        for (let i = 0; i < columnVariations.length; i++) {
            const columnName = columnVariations[i];
            console.log(`\n--- Trying column name: "${columnName}" (attempt ${i + 1}) ---`);
            
            try {
                const formData = new URLSearchParams();
                formData.append('NOME', nome || 'Anônimo');
                formData.append(columnName, intencao);
                
                console.log('Form data:', formData.toString());

                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: formData.toString()
                });

                console.log(`Response for "${columnName}":`);
                console.log('- Status:', response.status);
                console.log('- OK:', response.ok);
                
                const responseText = await response.text();
                console.log('- Response:', responseText);
                
                if (response.ok) {
                    console.log(`✅ Success with column name: "${columnName}"!`);
                    
                    // Wait a moment and verify the data was actually saved
                    setTimeout(async () => {
                        try {
                            const verifyResponse = await fetch(API_URL);
                            const data = await verifyResponse.json();
                            const lastEntry = data[data.length - 1];
                            console.log('Last entry after submission:', lastEntry);
                            
                            // Check if the intention was actually saved
                            const hasIntention = Object.values(lastEntry).some(value => 
                                typeof value === 'string' && value.includes(intencao.substring(0, 10))
                            );
                            
                            if (hasIntention) {
                                console.log('✅ Intention was successfully saved!');
                            } else {
                                console.log('⚠️ Name saved but intention might be empty');
                            }
                        } catch (verifyError) {
                            console.log('Could not verify data:', verifyError.message);
                        }
                    }, 1000);
                    
                    return true;
                } else {
                    console.log(`❌ Failed with column name "${columnName}": ${response.status}`);
                }
            } catch (error) {
                console.log(`❌ Error with column name "${columnName}":`, error.message);
            }
        }
        
        // If we get here, all attempts failed
        throw new Error('All column name attempts failed');
        
    } catch (error) {
        console.error('=== SEND INTENTION ERROR ==>');
        console.error('Error:', error.message);
        return false;
    }
}

function renderizarIntencoes(intencoes) {
    console.log('=== RENDERING INTENTIONS ==>');
    console.log('Input data:', intencoes);
    console.log('Input data type:', typeof intencoes);
    console.log('Is array:', Array.isArray(intencoes));
    
    listaIntencoes.innerHTML = '';
    
    if (!intencoes || intencoes.length === 0) {
        console.log('No intentions found, showing default message');
        listaIntencoes.innerHTML = `
            <div class="intencao-item">
                <p>Nenhuma intenção encontrada. Seja o primeiro a compartilhar!</p>
            </div>
        `;
        return;
    }
    
    console.log(`Rendering ${intencoes.length} intentions`);
    
    intencoes.forEach((intencao, index) => {
        console.log(`Processing intention ${index + 1}:`, intencao);
        
        const div = document.createElement('div');
        div.className = 'intencao-item fade-in';
        
        // Handle different possible column names based on actual SheetDB structure
        // From the API test, we know the columns are: NOME and INTENÃÃO
        const textoIntencao = 
            intencao['INTENÃÃO'] ||      // Exact column name from SheetDB (double encoded)
            intencao['INTENÃO'] ||      // Alternative encoding
            intencao['INTENÇÃO'] ||      // Alternative encoding
            intencao['intenção'] ||      // lowercase version
            intencao.intencao ||           // simple version
            intencao.intention ||          // English version
            'Intenção não disponível';
            
        const nomeAutor = 
            intencao['NOME'] ||            // Exact column name from SheetDB
            intencao.nome ||               // lowercase version
            intencao.name ||               // English version
            'Anônimo';
        
        console.log(`Intention text: "${textoIntencao}", Author: "${nomeAutor}"`);
        console.log('Available keys in this object:', Object.keys(intencao));
        
        div.innerHTML = `
            <p>"${textoIntencao}"</p>
            <span>- ${nomeAutor}</span>
        `;
        listaIntencoes.appendChild(div);
        
        // Trigger fade-in animation with delay
        setTimeout(() => div.classList.add('visible'), 100 * (index + 1));
    });
    
    console.log('Finished rendering intentions');
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    console.log('=== FORM SUBMISSION STARTED ==>');
    
    const nome = document.getElementById('nome').value.trim();
    const intencao = document.getElementById('intencao').value.trim();
    
    console.log('Form data:', { nome, intencao });
    
    if (!intencao) {
        console.log('No intention text provided');
        alert('Por favor, digite sua intenção.');
        return;
    }
    
    const submitBtn = intencaoForm.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    
    // Show loading state
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;
    
    console.log('Sending intention to API...');
    const sucesso = await enviarIntencao(nome, intencao);
    console.log('Submission result:', sucesso);
    
    if (sucesso) {
        // Clear form
        intencaoForm.reset();
        
        // Show success message
        submitBtn.textContent = 'Intenção Enviada!';
        submitBtn.style.background = '#4CAF50';
        
        // Reload intentions to show the new one
        setTimeout(() => {
            console.log('Reloading intentions after successful submission');
            carregarIntencoes();
        }, 1000);
        
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.style.background = '';
            submitBtn.disabled = false;
        }, 2000);
    } else {
        // Show error message
        submitBtn.textContent = 'Erro ao enviar';
        submitBtn.style.background = '#f44336';
        
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.style.background = '';
            submitBtn.disabled = false;
        }, 2000);
    }
}

// Initialize everything after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DOM CONTENT LOADED ==>');
    
    // Initialize form elements and events
    initializeIntencaoForm();
    
    // Initialize gallery folders
    initializeGalleryFolders();
    
    // Test API and load intentions
    testarAPI();
    setTimeout(() => carregarIntencoes(), 500); // Small delay after API test
    
    // Initialize refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            console.log('Manual refresh triggered');
            refreshBtn.innerHTML = '🔄 Carregando...';
            refreshBtn.disabled = true;
            
            carregarIntencoes().finally(() => {
                refreshBtn.innerHTML = '🔄 Atualizar';
                refreshBtn.disabled = false;
            });
        });
    }
    
    // Initialize animations
    const animatedElements = document.querySelectorAll('section');
    animatedElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
});

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Scroll animations (already initialized in main DOMContentLoaded)

// Header background change on scroll
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(21, 101, 192, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.background = 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)';
        header.style.backdropFilter = 'none';
    }
});

// Gallery folder functionality
function initializeGalleryFolders() {
    const folderItems = document.querySelectorAll('.folder-item');
    const folderContents = document.querySelectorAll('.folder-content');
    const closeFolderBtns = document.querySelectorAll('.close-folder');
    const photoItems = document.querySelectorAll('.photo-item img');
    
    // Open folder on click
    folderItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const folderId = item.getAttribute('data-folder');
            const folderContent = document.getElementById(`folder-${folderId}`);
            
            if (folderContent) {
                // Close any open folder first
                folderContents.forEach(content => {
                    content.classList.remove('active');
                });
                
                // Ensure the modal is properly positioned
                folderContent.style.position = 'fixed';
                folderContent.style.top = '0';
                folderContent.style.left = '0';
                folderContent.style.width = '100vw';
                folderContent.style.height = '100vh';
                folderContent.style.zIndex = '10000';
                
                // Move to body if it's not already there (shouldn't be needed with proper HTML)
                if (folderContent.parentNode !== document.body) {
                    document.body.appendChild(folderContent);
                }
                
                // Open the clicked folder
                folderContent.classList.add('active');
                document.body.style.overflow = 'hidden'; // Prevent body scroll
                
                console.log(`Opened folder: ${folderId}`);
            }
        });
    });
    
    // Close folder functionality
    closeFolderBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Close any active lightbox first
            const activeLightbox = document.querySelector('.photo-lightbox.active');
            if (activeLightbox) {
                closeLightbox(activeLightbox);
            }
            
            const folderContent = btn.closest('.folder-content');
            if (folderContent) {
                folderContent.classList.remove('active');
                document.body.style.overflow = 'auto'; // Restore body scroll
            }
        });
    });
    
    // Close folder when clicking outside content
    folderContents.forEach(content => {
        content.addEventListener('click', (e) => {
            // Only close if clicking the background, not the content area
            if (e.target === content) {
                e.preventDefault();
                e.stopPropagation();
                
                // Check if there's an active lightbox first
                const activeLightbox = document.querySelector('.photo-lightbox.active');
                if (activeLightbox) {
                    closeLightbox(activeLightbox);
                    return;
                }
                
                content.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // Photo lightbox functionality
    photoItems.forEach(img => {
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            openPhotoLightbox(img.src, img.alt);
        });
    });
    
    // Close folder with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // First check if there's an active lightbox
            const activeLightbox = document.querySelector('.photo-lightbox.active');
            if (activeLightbox) {
                e.preventDefault();
                e.stopPropagation();
                closeLightbox(activeLightbox);
                return; // Don't close folder if lightbox is open
            }
            
            // Then check for active folder
            const activeFolder = document.querySelector('.folder-content.active');
            if (activeFolder) {
                e.preventDefault();
                e.stopPropagation();
                activeFolder.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        }
    });
}

// Photo lightbox function
function openPhotoLightbox(src, alt) {
    // Remove any existing lightbox
    const existingLightbox = document.querySelector('.photo-lightbox');
    if (existingLightbox) {
        existingLightbox.remove();
    }
    
    // Create new lightbox
    const lightbox = document.createElement('div');
    lightbox.className = 'photo-lightbox';
    lightbox.innerHTML = `
        <img src="${src}" alt="${alt}" />
    `;
    
    document.body.appendChild(lightbox);
    
    // Show lightbox with animation
    setTimeout(() => {
        lightbox.classList.add('active');
    }, 10);
    
    // Close lightbox on click
    lightbox.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeLightbox(lightbox);
    });
    
    // Prevent lightbox from closing when clicking the image
    const img = lightbox.querySelector('img');
    img.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// Function to properly close lightbox
function closeLightbox(lightbox) {
    if (!lightbox) return;
    
    lightbox.classList.remove('active');
    setTimeout(() => {
        if (lightbox && lightbox.parentNode) {
            lightbox.remove();
        }
    }, 300);
}

// Function to add photos to a folder (for future use)
function addPhotoToFolder(folderId, imageSrc, caption) {
    const folder = document.getElementById(`folder-${folderId}`);
    if (!folder) return;
    
    const photosGrid = folder.querySelector('.photos-grid');
    const noPhotos = photosGrid.querySelector('.no-photos');
    
    // Remove "no photos" message if it exists
    if (noPhotos) {
        noPhotos.remove();
    }
    
    // Create new photo item
    const photoItem = document.createElement('div');
    photoItem.className = 'photo-item';
    photoItem.innerHTML = `
        <img src="${imageSrc}" alt="${caption}">
        <div class="photo-caption">${caption}</div>
    `;
    
    // Add click event for lightbox
    const img = photoItem.querySelector('img');
    img.addEventListener('click', (e) => {
        e.stopPropagation();
        openPhotoLightbox(img.src, img.alt);
    });
    
    photosGrid.appendChild(photoItem);
    
    // Update photo count in folder cover
    const folderCover = document.querySelector(`[data-folder="${folderId}"] .photo-count`);
    if (folderCover) {
        const currentCount = photosGrid.querySelectorAll('.photo-item').length;
        folderCover.textContent = `${currentCount} foto${currentCount !== 1 ? 's' : ''}`;
    }
}

// Make addPhotoToFolder available globally for future use
window.addPhotoToFolder = addPhotoToFolder;

// Galeria lightbox functionality (legacy support for old lightbox code)
// Note: Old gallery code removed - now handled by the new folder system above

// Random scripture quotes for variety
const scriptures = [
    {
        text: '"Vinde a mim, todos vós que estais aflitos e sobrecarregados, e eu vos aliviarei."',
        reference: 'Mateus 11:28'
    },
    {
        text: '"O Senhor é o meu pastor; nada me faltará."',
        reference: 'Salmo 23:1'
    },
    {
        text: '"Tudo posso naquele que me fortalece."',
        reference: 'Filipenses 4:13'
    },
    {
        text: '"Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito."',
        reference: 'João 3:16'
    }
];

// Add random scripture to footer
function adicionarVersiculoRodape() {
    const scripture = scriptures[Math.floor(Math.random() * scriptures.length)];
    const footerContent = document.querySelector('.footer-content');
    
    const scriptureDiv = document.createElement('div');
    scriptureDiv.className = 'footer-section';
    scriptureDiv.innerHTML = `
        <h4>Palavra do Dia</h4>
        <p style="font-style: italic;">${scripture.text}</p>
        <p style="color: #E3F2FD; font-size: 0.9rem;">${scripture.reference}</p>
    `;
    
    footerContent.appendChild(scriptureDiv);
}

// Initialize scripture
document.addEventListener('DOMContentLoaded', adicionarVersiculoRodape);

// CTA Button functionality
document.querySelector('.cta-button').addEventListener('click', () => {
    document.querySelector('#historia').scrollIntoView({
        behavior: 'smooth'
    });
});

// Form validation
function validarFormulario() {
    const intencaoInput = document.getElementById('intencao');
    const submitBtn = document.querySelector('.submit-btn');
    
    intencaoInput.addEventListener('input', () => {
        if (intencaoInput.value.trim().length > 0) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
        } else {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.6';
        }
    });
}

document.addEventListener('DOMContentLoaded', validarFormulario);