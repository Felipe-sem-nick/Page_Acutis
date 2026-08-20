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

// API URL for daily liturgy from Canção Nova
const LITURGY_URL = 'https://liturgia.cancaonova.com/pb/';
// Várias fontes em cascata: se uma estiver fora do ar ou bloqueada, tenta a próxima
const READER_PROXY = 'https://r.jina.ai/';
const CORS_PROXY_1 = 'https://corsproxy.io/?url=';
const ALLORIGINS_PROXY = 'https://api.allorigins.win/get?url=';

// Cache for today's gospel to avoid multiple requests
let cachedGospel = null;
let cacheDate = null;

// Function to fetch daily gospel from Canção Nova
async function carregarEvangelhoAutomatico() {
    const dataElement = document.getElementById('evangelho-data');
    const leituraElement = document.getElementById('evangelho-leitura');
    
    // Show loading state
    leituraElement.innerHTML = '<div class="loading"></div> Carregando evangelho do dia...';
    
    try {
        // Check if we already have today's gospel cached
        const hoje = new Date();
        const dataHoje = hoje.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        
        console.log('Current date:', dataHoje);
        console.log('Cached date:', cacheDate);
        console.log('Has cached gospel:', !!cachedGospel);
        
        if (cachedGospel && cacheDate === dataHoje) {
            console.log('Using cached gospel for today');
            exibirEvangelho(cachedGospel, dataElement, leituraElement);
            return;
        }
        
        console.log('Loading new gospel for date:', dataHoje);
        
        // Tenta várias fontes em sequência, já que qualquer uma isolada pode estar fora do ar ou bloqueada por CORS
        console.log('Fetching gospel from Canção Nova...');
        let evangelhoHoje = null;

        const estrategias = [
            { nome: 'Reader (r.jina.ai)', fn: fetchGospelViaReader },
            { nome: 'CORS proxy (corsproxy.io)', fn: () => fetchGospelWithCorsProxy(CORS_PROXY_1) },
            { nome: 'CORS proxy (allorigins)', fn: fetchGospelWithAllOrigins },
            { nome: 'Direto (Canção Nova)', fn: fetchGospelFromCancaoNova }
        ];

        for (const estrategia of estrategias) {
            try {
                evangelhoHoje = await estrategia.fn();
                console.log(`Sucesso via: ${estrategia.nome}`);
                break;
            } catch (erro) {
                console.log(`Falhou (${estrategia.nome}):`, erro);
            }
        }

        if (!evangelhoHoje) {
            console.log('Não foi possível carregar o evangelho automaticamente.');
            exibirMensagemIndisponivel(dataElement, leituraElement);
            return;
        }

        // Cache the result with the correct date
        cachedGospel = evangelhoHoje;
        cacheDate = dataHoje;
        
        console.log('Gospel cached for date:', dataHoje);
        
        exibirEvangelho(evangelhoHoje, dataElement, leituraElement);
        
    } catch (error) {
        console.error('Erro ao carregar evangelho:', error);
        exibirMensagemIndisponivel(dataElement, leituraElement);
    }
}

// Shown when we couldn't fetch the gospel automatically - gives the user a direct link instead of guessing content
function exibirMensagemIndisponivel(dataElement, leituraElement) {
    const hoje = new Date();
    const opcoes = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    dataElement.textContent = hoje.toLocaleDateString('pt-BR', opcoes);

    leituraElement.innerHTML = `
        <p style="color: #054b98; text-align: center;">
            Não conseguimos carregar o evangelho automaticamente agora.
        </p>
        <div style="text-align: center; margin-top: 1.5rem;">
            <a href="https://liturgia.cancaonova.com/pb/" target="_blank" rel="noopener" style="background: #054b98; color: white; text-decoration: none; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; display: inline-block; margin-bottom: 1rem;">
                Ver Evangelho de Hoje
            </a>
            <br>
            <button onclick="forcarAtualizacaoEvangelho()" style="background: #28a745; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; font-size: 0.9rem;">🔄 Tentar Novamente</button>
        </div>
    `;
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

// Tentativa direta na Canção Nova (raramente funciona no navegador por causa de CORS, mas é rápida e sem custo)
async function fetchGospelFromCancaoNova() {
    const response = await fetch(LITURGY_URL, {
        method: 'GET',
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    return parseGospelFromText(htmlToText(html));
}

// Busca via Jina AI Reader: devolve o texto já limpo da página e tem CORS liberado para o navegador
async function fetchGospelViaReader() {
    const response = await fetch(READER_PROXY + LITURGY_URL);

    if (!response.ok) {
        throw new Error(`Reader error! status: ${response.status}`);
    }

    const text = await response.text();
    return parseGospelFromText(text);
}

// Busca via proxy CORS que devolve o HTML bruto
async function fetchGospelWithCorsProxy(proxyUrl) {
    const response = await fetch(proxyUrl + encodeURIComponent(LITURGY_URL));

    if (!response.ok) {
        throw new Error(`Proxy error! status: ${response.status}`);
    }

    const html = await response.text();
    return parseGospelFromText(htmlToText(html));
}

// Busca via allorigins (devolve JSON com o HTML dentro de "contents")
async function fetchGospelWithAllOrigins() {
    const proxyUrl = ALLORIGINS_PROXY + encodeURIComponent(LITURGY_URL);
    const response = await fetch(proxyUrl);

    if (!response.ok) {
        throw new Error(`Proxy error! status: ${response.status}`);
    }

    const data = await response.json();
    return parseGospelFromText(htmlToText(data.contents));
}

// Converte HTML bruto em texto simples
function htmlToText(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.body.textContent || doc.body.innerText || '';
}

// Extrai referência e texto do evangelho a partir de texto simples
// (funciona tanto para o texto vindo do reader quanto do HTML convertido)
function parseGospelFromText(content) {
    try {
        // Referência do evangelho, ex: "Evangelho (Mt 20,1-16a)" ou "Evangelho Mt 20,1-16a"
        const evangelhoMatch = content.match(/Evangelho\s*\(?\s*([A-Z][a-z]{1,3}\s?\d+[.,]\d+[a-z]?(?:-\d+[a-z]?)?)/);
        let referencia = 'Evangelho do Dia';

        if (evangelhoMatch) {
            const shortRef = evangelhoMatch[1].trim();
            const bookNames = {
                'Mt': 'Mateus',
                'Mc': 'Marcos',
                'Lc': 'Lucas',
                'Jo': 'João'
            };

            const bookAbbrevMatch = shortRef.match(/^[A-Z][a-z]+/);
            const book = bookAbbrevMatch ? bookAbbrevMatch[0] : shortRef;
            const fullBook = bookNames[book] || book;
            referencia = `Evangelho segundo São ${fullBook} (${shortRef})`;
        }

        // Texto do evangelho: tudo entre o "Glória a vós, Senhor" que introduz a leitura
        // e o "Palavra da Salvação" que a encerra
        let texto = '';
        const gloriaMatch = content.match(/Glória a vós,?\s*Senhor\.?\s*([\s\S]*?)(?:—\s*)?Palavra da Salvação/i);

        if (gloriaMatch && gloriaMatch[1].trim().length > 50) {
            texto = `${gloriaMatch[1].trim()}

— Palavra da Salvação.
— Glória a vós, Senhor.`;
        } else {
            // Fallback: tenta extrair a partir de "Naquele tempo"
            const naqueleTempoMatch = content.match(/Naquele tempo[\s\S]*?(?=Palavra da Salvação|— Palavra|— Glória|Conferência Nacional|$)/i);
            if (naqueleTempoMatch) {
                texto = `${naqueleTempoMatch[0].trim()}

— Palavra da Salvação.
— Glória a vós, Senhor.`;
            } else {
                throw new Error('Gospel text not found');
            }
        }

        if (!texto || texto.length < 50) {
            throw new Error('Gospel text too short or not found');
        }

        console.log('Successfully parsed gospel:', { referencia, texto: texto.substring(0, 100) + '...' });

        return { referencia, texto };

    } catch (error) {
        console.error('Error parsing gospel content:', error);
        throw new Error('Failed to parse gospel from content');
    }
}

// Add event listener for refresh button
document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const listaIntencoes = document.getElementById('lista-intencoes');
            listaIntencoes.innerHTML = `
                <div class="loading-intencoes">
                    <div class="loading"></div>
                    <p>Carregando intenções...</p>
                </div>
            `;
            carregarIntencoes();
        })
    }
});

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
            <p><strong style="color: #054b98; font-size: 1.1rem;">${evangelho.referencia}</strong></p>
        </div>
        <div style="white-space: pre-line; text-align: justify; line-height: 1.8; font-size: 1rem;">
            ${evangelho.texto}
        </div>
        <div style="text-align: center; margin-top: 2rem;">
            <button onclick="forcarAtualizacaoEvangelho()" style="background: #28a745; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; font-size: 0.9rem;">🔄 Atualizar</button>
        </div>
    `;
}

// Auto-refresh gospel at midnight and check periodically
function configurarAtualizacaoAutomatica() {
    console.log('Configurando atualização automática do evangelho...');
    
    // Function to check if date has changed
    function verificarMudancaData() {
        const agora = new Date();
        const dataAtual = agora.toISOString().split('T')[0];
        
        console.log('Verificando data:', dataAtual, 'vs cached:', cacheDate);
        
        if (cacheDate && cacheDate !== dataAtual) {
            console.log('Data mudou! Carregando novo evangelho...');
            cachedGospel = null;
            cacheDate = null;
            carregarEvangelhoAutomatico();
        }
    }
    
    // Check every 30 minutes for date changes
    setInterval(verificarMudancaData, 30 * 60 * 1000); // 30 minutes
    
    // Also check every minute after 11:50 PM
    function verificarProximoAMeiaNoite() {
        const agora = new Date();
        const hora = agora.getHours();
        const minuto = agora.getMinutes();
        
        // If it's between 11:50 PM and 12:10 AM, check more frequently
        if (hora === 23 && minuto >= 50) {
            console.log('Próximo à meia-noite, verificando mais frequentemente...');
            const intervalFrequente = setInterval(() => {
                const novaData = new Date();
                if (novaData.getHours() === 0 && novaData.getMinutes() < 10) {
                    console.log('Meia-noite detectada! Atualizando evangelho...');
                    cachedGospel = null;
                    cacheDate = null;
                    carregarEvangelhoAutomatico();
                    clearInterval(intervalFrequente);
                }
            }, 60000); // Check every minute
        }
    }
    
    // Check for midnight transition every hour
    setInterval(verificarProximoAMeiaNoite, 60 * 60 * 1000); // Every hour
    
    // Original midnight calculation for precise timing
    const agora = new Date();
    const proximaMeianoite = new Date(agora);
    proximaMeianoite.setDate(proximaMeianoite.getDate() + 1);
    proximaMeianoite.setHours(0, 0, 0, 0);
    
    const tempoAteProximaMeianoite = proximaMeianoite.getTime() - agora.getTime();
    
    console.log(`Próxima atualização à meia-noite em: ${Math.round(tempoAteProximaMeianoite / 1000 / 60)} minutos`);
    
    // Schedule automatic update at midnight
    setTimeout(() => {
        console.log('Meia-noite! Atualizando evangelho...');
        // Clear cache to force new content
        cachedGospel = null;
        cacheDate = null;
        
        
        // Set up daily interval (24 hours) as backup
        setInterval(() => {
            console.log('Atualização diária automática...');
            cachedGospel = null;
            cacheDate = null;
            carregarEvangelhoAutomatico();
        }, 24 * 60 * 60 * 1000);
        
    }, tempoAteProximaMeianoite);
}

// Load gospel on page load
document.addEventListener('DOMContentLoaded', () => {
    carregarEvangelhoAutomatico();
    configurarAtualizacaoAutomatica();
    
    // Add event listener for refresh button in intentions section
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const listaIntencoes = document.getElementById('lista-intencoes');
            listaIntencoes.innerHTML = `
                <div class="loading-intencoes">
                    <div class="loading"></div>
                    <p>Carregando intenções...</p>
                </div>
            `;
            carregarIntencoes();
        });
    }
    
    // Initialize intentions form and load intentions
    initializeIntencaoForm();
    carregarIntencoes();
});

// Intenções - integração com SheetDB
const API_URL = 'https://sheetdb.io/api/v1/tnkjumf6seofr';
let intencaoForm;
let listaIntencoes;

// Initialize form elements after DOM loads
function initializeIntencaoForm() {
    intencaoForm = document.querySelector('.intencoes-form');
    listaIntencoes = document.getElementById('lista-intencoes');

    if (!intencaoForm || !listaIntencoes) {
        console.error('Formulário ou lista de intenções não encontrados no HTML.');
        return;
    }

    intencaoForm.addEventListener('submit', handleFormSubmit);
}

// Carrega as intenções já salvas na planilha
async function carregarIntencoes() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const intencoes = await response.json();

        // Pega as últimas 6 intenções e mostra as mais recentes primeiro
        const ultimasIntencoes = intencoes.slice(-6).reverse();

        renderizarIntencoes(ultimasIntencoes);
    } catch (error) {
        console.error('Erro ao carregar intenções:', error);
        listaIntencoes.innerHTML = `
            <div class="intencao-item">
                <p>Erro ao carregar intenções. Tente novamente mais tarde.</p>
            </div>
        `;
    }
}

// Envia uma nova intenção para a planilha
async function enviarIntencao(nome, intencao) {
    try {
        const hoje = new Date().toLocaleDateString('pt-BR');

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: {
                    nome: nome || 'Anônimo',
                    intencao: intencao,
                    data: hoje
                }
            })
        });

        return response.ok;
    } catch (error) {
        console.error('Erro ao enviar intenção:', error);
        return false;
    }
}

function renderizarIntencoes(intencoes) {
    listaIntencoes.innerHTML = '';

    if (!intencoes || intencoes.length === 0) {
        listaIntencoes.innerHTML = `
            <div class="intencao-item">
                <p>Nenhuma intenção encontrada. Seja o primeiro a compartilhar!</p>
            </div>
        `;
        return;
    }

    intencoes.forEach((intencao, index) => {
        const div = document.createElement('div');
        div.className = 'intencao-item fade-in';

        const textoIntencao = intencao.intencao || 'Intenção não disponível';
        const nomeAutor = intencao.nome || 'Anônimo';

        div.innerHTML = `
            <p>"${textoIntencao}"</p>
            <span>- ${nomeAutor}</span>
        `;
        listaIntencoes.appendChild(div);

        setTimeout(() => div.classList.add('visible'), 100 * (index + 1));
    });
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const intencao = document.getElementById('intencao').value.trim();

    if (!intencao) {
        alert('Por favor, digite sua intenção.');
        return;
    }

    const submitBtn = intencaoForm.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;

    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;

    const sucesso = await enviarIntencao(nome, intencao);

    if (sucesso) {
        intencaoForm.reset();

        submitBtn.textContent = 'Intenção Enviada!';
        submitBtn.style.background = '#28a745';

        setTimeout(() => {
            carregarIntencoes();
        }, 1000);

        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.style.background = '';
            submitBtn.disabled = false;
        }, 2000);
    } else {
        submitBtn.textContent = 'Erro ao enviar';
        submitBtn.style.background = '#dc3545';

        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.style.background = '';
            submitBtn.disabled = false;
        }, 2000);
    }
}


// Galeria functionality - Folder click events
document.addEventListener('DOMContentLoaded', function() {
    // Add click event to all folder items
    const folderItems = document.querySelectorAll('.folder-item');
    const folderContents = document.querySelectorAll('.folder-content');
    const closeButtons = document.querySelectorAll('.close-folder');
    
    // Open folder when clicking on folder item
    folderItems.forEach(item => {
        item.addEventListener('click', function() {
            const folderId = this.getAttribute('data-folder');
            const folderContent = document.getElementById(`folder-${folderId}`);
            
            if (folderContent) {
                // Close all other folders first
                folderContents.forEach(content => {
                    content.classList.remove('active');
                });
                
                // Open the clicked folder
                folderContent.classList.add('active');
                document.body.style.overflow = 'hidden'; // Prevent background scrolling
            }
        });
    });
    
    // Close folder when clicking close button
    closeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling
            const folderContent = this.closest('.folder-content');
            folderContent.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
        });
    });
    
    // Close folder when clicking outside the content
    folderContents.forEach(content => {
        content.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = ''; // Restore scrolling
            }
        });
    });
    
    // Close folder with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            folderContents.forEach(content => {
                if (content.classList.contains('active')) {
                    content.classList.remove('active');
                    document.body.style.overflow = ''; // Restore scrolling
                }
            });
        }
    });
});
