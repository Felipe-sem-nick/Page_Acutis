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
const CORS_PROXY = 'https://api.allorigins.win/get?url=';

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
        const dataHoje = hoje.toDateString();
        
        if (cachedGospel && cacheDate === dataHoje) {
            exibirEvangelho(cachedGospel, dataElement, leituraElement);
            return;
        }
        
        // Try to fetch from Canção Nova directly first
        console.log('Fetching gospel from Canção Nova...');
        let evangelhoHoje;
        
        try {
            evangelhoHoje = await fetchGospelFromCancaoNova();
        } catch (corsError) {
            console.log('CORS error, trying with proxy...', corsError);
            evangelhoHoje = await fetchGospelWithProxy();
        }
        
        if (!evangelhoHoje) {
            console.log('Failed to fetch from online sources, using fallback...');
            evangelhoHoje = await obterEvangelhoAlternativo();
        }
        
        // Cache the result
        cachedGospel = evangelhoHoje;
        cacheDate = dataHoje;
        
        exibirEvangelho(evangelhoHoje, dataElement, leituraElement);
        
    } catch (error) {
        console.error('Erro ao carregar evangelho:', error);
        leituraElement.innerHTML = `
            <p style="color: #D84315; text-align: center;">
                <strong>⚠️ Erro ao carregar o evangelho</strong><br>
                Verifique sua conexão com a internet ou tente novamente mais tarde.
            </p>
            <div style="text-align: center; margin-top: 1rem;">
                <button onclick="carregarEvangelhoAutomatico()" style="background: #FF8C42; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;">🔄 Tentar Novamente</button>
            </div>
        `;
    }
}

// Function to fetch gospel directly from Canção Nova
async function fetchGospelFromCancaoNova() {
    const response = await fetch(LITURGY_URL, {
        method: 'GET',
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    return parseGospelFromHTML(html);
}

// Function to fetch gospel using CORS proxy
async function fetchGospelWithProxy() {
    const proxyUrl = CORS_PROXY + encodeURIComponent(LITURGY_URL);
    
    console.log('Trying proxy URL:', proxyUrl);
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
        throw new Error(`Proxy error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return parseGospelFromHTML(data.contents);
}

// Function to parse gospel content from HTML
function parseGospelFromHTML(html) {
    // Create a temporary DOM element to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    try {
        // Find the gospel section
        const content = doc.body.textContent || doc.body.innerText || '';
        
        // Extract gospel reference (e.g., "Lc 5,33-39")
        const evangelhoMatch = content.match(/Evangelho[\s\S]*?([A-Z][a-z]\s+\d+,\d+-\d+)/i);
        let referencia = 'Evangelho do Dia';
        
        if (evangelhoMatch) {
            const shortRef = evangelhoMatch[1];
            // Convert abbreviations to full names
            const bookNames = {
                'Mt': 'Mateus',
                'Mc': 'Marcos', 
                'Lc': 'Lucas',
                'Jo': 'João'
            };
            
            const book = shortRef.split(' ')[0];
            const chapter = shortRef.split(' ')[1];
            const fullBook = bookNames[book] || book;
            referencia = `Evangelho segundo São ${fullBook} (${book} ${chapter})`;
        }
        
        // Extract the gospel text between specific markers
        let texto = '';
        
        // Look for the gospel text after "Glória a vós, Senhor" and before "Palavra da Salvação"
        const gloriaMatch = content.match(/Glória a vós, Senhor[\s\S]*?Naquele tempo[\s\S]*?Palavra da Salvação/i);
        
        if (gloriaMatch) {
            let gospelText = gloriaMatch[0];
            // Clean up the text
            gospelText = gospelText.replace(/Glória a vós, Senhor/i, '');
            gospelText = gospelText.replace(/Palavra da Salvação/i, '');
            gospelText = gospelText.trim();
            
            // Format the text properly
            texto = `${gospelText}

— Palavra da Salvação.
— Glória a vós, Senhor.`;
        } else {
            // Fallback: try to extract any gospel-like content
            const naqueleTempoMatch = content.match(/Naquele tempo[\s\S]*?(?=Palavra da Salvação|— Palavra|— Glória|Conferência Nacional|$)/i);
            if (naqueleTempoMatch) {
                texto = `${naqueleTempoMatch[0].trim()}

— Palavra da Salvação.
— Glória a vós, Senhor.`;
            } else {
                throw new Error('Gospel text not found in HTML');
            }
        }
        
        if (!texto || texto.length < 50) {
            throw new Error('Gospel text too short or not found');
        }
        
        console.log('Successfully parsed gospel:', { referencia, texto: texto.substring(0, 100) + '...' });
        
        return {
            referencia,
            texto
        };
        
    } catch (error) {
        console.error('Error parsing HTML:', error);
        throw new Error('Failed to parse gospel from HTML');
    }
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
            <p><strong style="color: #D84315; font-size: 1.1rem;">${evangelho.referencia}</strong></p>
        </div>
        <div style="white-space: pre-line; text-align: justify; line-height: 1.8; font-size: 1rem;">
            ${evangelho.texto}
        </div>
        <div style="text-align: center; margin-top: 2rem;">
            <button onclick="carregarEvangelhoAutomatico()" style="background: #FF8C42; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; font-size: 0.9rem;">🔄 Atualizar</button>
        </div>
    `;
}

// Auto-refresh gospel at midnight
function configurarAtualizacaoAutomatica() {
    const agora = new Date();
    const proximaMeianoite = new Date(agora);
    proximaMeianoite.setDate(proximaMeianoite.getDate() + 1);
    proximaMeianoite.setHours(0, 0, 0, 0);
    
    const tempoAteProximaMeianoite = proximaMeianoite.getTime() - agora.getTime();
    
    // Schedule automatic update at midnight
    setTimeout(() => {
        // Clear cache to force new content
        cachedGospel = null;
        cacheDate = null;
        
        // Load new gospel
        carregarEvangelhoAutomatico();
        
        // Set up daily interval (24 hours)
        setInterval(() => {
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
});

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
        header.style.background = 'rgba(255, 140, 66, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.background = 'linear-gradient(135deg, #FF8C42 0%, #FF7B32 100%)';
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
        <p style="color: #FFE0B8; font-size: 0.9rem;">${scripture.reference}</p>
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