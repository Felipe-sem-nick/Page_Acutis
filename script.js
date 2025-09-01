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

// Sistema de Evangelhos - Adicione quantos evangelhos quiser aqui
const evangelhos = [
    {
        referencia: "Evangelho segundo São João (Jo 14,1-6)",
        texto: `Naquele tempo, disse Jesus aos seus discípulos:
        
        "Não se perturbe o vosso coração. Tendes fé em Deus, tende fé também em mim. Na casa de meu Pai há muitas moradas. Se assim não fosse, eu vos teria dito. Vou preparar-vos um lugar. E quando eu for e vos preparar um lugar, voltarei e vos levarei comigo, para que, onde eu estou, estejais também vós. E vós conheceis o caminho para onde eu vou."
        
        Disse-lhe Tomé: "Senhor, não sabemos para onde vais. Como podemos conhecer o caminho?"
        
        Respondeu-lhe Jesus: "Eu sou o Caminho, a Verdade e a Vida. Ninguém vem ao Pai senão por mim."`
    },
    {
        referencia: "Evangelho segundo São Mateus (Mt 5,1-12a)",
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
        Alegrai-vos e exultai, porque é grande a vossa recompensa nos céus."`
    },
    {
        referencia: "Evangelho segundo São Lucas (Lc 10,38-42)",
        texto: `Naquele tempo, Jesus entrou num povoado, e certa mulher, de nome Marta, recebeu-o em sua casa. Sua irmã chamava-se Maria. Esta sentou-se aos pés do Senhor e ficou escutando a sua palavra. Marta agitava-se de um lado para outro, ocupada com muitos serviços.
        
        Então aproximou-se e disse: "Senhor, não te importas que minha irmã me deixe sozinha com o serviço? Manda que ela venha ajudar-me!"
        
        O Senhor, porém, lhe respondeu: "Marta, Marta! Tu te preocupas e andas agitada por muitas coisas. Porém, uma só é necessária. Maria escolheu a melhor parte e esta não lhe será tirada."`
    }
];

// Evangelho do Dia functionality
function carregarEvangelhoDemo() {
    const dataElement = document.getElementById('evangelho-data');
    const leituraElement = document.getElementById('evangelho-leitura');
    
    // Simulate loading
    leituraElement.innerHTML = '<div class="loading"></div> Carregando evangelho...';
    
    setTimeout(() => {
        const hoje = new Date();
        const opcoes = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        
        dataElement.textContent = hoje.toLocaleDateString('pt-BR', opcoes);
        
        // Seleciona um evangelho baseado no dia da semana (ou você pode escolher manualmente)
        // Para escolher manualmente, mude o índice: evangelhos[0], evangelhos[1], etc.
        const diaSemanIndex = hoje.getDay() % evangelhos.length;
        const evangelhoEscolhido = evangelhos[diaSemanIndex];
        
        leituraElement.innerHTML = `
            <p><strong>${evangelhoEscolhido.referencia}</strong></p>
            <p style="white-space: pre-line; text-align: justify;">${evangelhoEscolhido.texto}</p>
            <p><em>Palavra da Salvação.</em></p>
        `;
        
        // Adiciona botões para navegar entre evangelhos
        const botoesNav = document.createElement('div');
        botoesNav.style.cssText = 'text-align: center; margin-top: 1rem;';
        botoesNav.innerHTML = `
            <button onclick="trocarEvangelho(-1)" style="margin: 0 0.5rem; padding: 0.5rem 1rem; background: #FF8C42; color: white; border: none; border-radius: 5px; cursor: pointer;">← Anterior</button>
            <span style="margin: 0 1rem; color: #D84315; font-weight: bold;">${diaSemanIndex + 1} de ${evangelhos.length}</span>
            <button onclick="trocarEvangelho(1)" style="margin: 0 0.5rem; padding: 0.5rem 1rem; background: #FF8C42; color: white; border: none; border-radius: 5px; cursor: pointer;">Próximo →</button>
        `;
        leituraElement.appendChild(botoesNav);
    }, 1500);
}

// Variável global para controlar qual evangelho está sendo exibido
let evangelhoAtual = new Date().getDay() % evangelhos.length;

// Função para trocar de evangelho
function trocarEvangelho(direcao) {
    evangelhoAtual = (evangelhoAtual + direcao + evangelhos.length) % evangelhos.length;
    
    const leituraElement = document.getElementById('evangelho-leitura');
    const evangelhoEscolhido = evangelhos[evangelhoAtual];
    
    leituraElement.innerHTML = `
        <p><strong>${evangelhoEscolhido.referencia}</strong></p>
        <p style="white-space: pre-line; text-align: justify;">${evangelhoEscolhido.texto}</p>
        <p><em>Palavra da Salvação.</em></p>
    `;
    
    // Adiciona botões para navegar entre evangelhos
    const botoesNav = document.createElement('div');
    botoesNav.style.cssText = 'text-align: center; margin-top: 1rem;';
    botoesNav.innerHTML = `
        <button onclick="trocarEvangelho(-1)" style="margin: 0 0.5rem; padding: 0.5rem 1rem; background: #FF8C42; color: white; border: none; border-radius: 5px; cursor: pointer;">← Anterior</button>
        <span style="margin: 0 1rem; color: #D84315; font-weight: bold;">${evangelhoAtual + 1} de ${evangelhos.length}</span>
        <button onclick="trocarEvangelho(1)" style="margin: 0 0.5rem; padding: 0.5rem 1rem; background: #FF8C42; color: white; border: none; border-radius: 5px; cursor: pointer;">Próximo →</button>
    `;
    leituraElement.appendChild(botoesNav);
}

// OPÇÃO 3: Carregar evangelhos de arquivo JSON
// Para usar esta opção, comente a função carregarEvangelhoDemo() acima e descomente esta:
/*
async function carregarEvangelhoDeArquivo() {
    const dataElement = document.getElementById('evangelho-data');
    const leituraElement = document.getElementById('evangelho-leitura');
    
    leituraElement.innerHTML = '<div class="loading"></div> Carregando evangelho...';
    
    try {
        const response = await fetch('./evangelhos.json');
        const data = await response.json();
        
        const hoje = new Date();
        const opcoes = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        
        dataElement.textContent = hoje.toLocaleDateString('pt-BR', opcoes);
        
        // Busca evangelho por data ou pega um aleatório
        const dataHoje = hoje.toISOString().split('T')[0];
        let evangelhoEscolhido = data.evangelhos.find(e => e.data === dataHoje);
        
        if (!evangelhoEscolhido) {
            // Se não há evangelho para hoje, pega um baseado no dia da semana
            const index = hoje.getDay() % data.evangelhos.length;
            evangelhoEscolhido = data.evangelhos[index];
        }
        
        leituraElement.innerHTML = `
            <p><strong>${evangelhoEscolhido.referencia}</strong></p>
            <p style="white-space: pre-line; text-align: justify;">${evangelhoEscolhido.texto}</p>
            <p><em>Palavra da Salvação.</em></p>
        `;
        
    } catch (error) {
        console.error('Erro ao carregar evangelho:', error);
        leituraElement.innerHTML = '<p>Erro ao carregar o evangelho. Tente novamente mais tarde.</p>';
    }
}
*/

// Load gospel on page load
document.addEventListener('DOMContentLoaded', carregarEvangelhoDemo);

// Intenções functionality
const intencaoForm = document.querySelector('.intencoes-form');
const listaIntencoes = document.getElementById('lista-intencoes');

// Sample intentions data
let intencoes = [
    { nome: 'Maria', intencao: 'Pela saúde de todos os enfermos' },
    { nome: 'João', intencao: 'Pela paz no mundo' },
    { nome: 'Ana', intencao: 'Pelos jovens que estão perdidos' },
    { nome: 'Pedro', intencao: 'Pelas famílias em dificuldade' }
];

function renderizarIntencoes() {
    listaIntencoes.innerHTML = '';
    intencoes.slice(-6).reverse().forEach(intencao => {
        const div = document.createElement('div');
        div.className = 'intencao-item fade-in';
        div.innerHTML = `
            <p>"${intencao.intencao}"</p>
            <span>- ${intencao.nome || 'Anônimo'}</span>
        `;
        listaIntencoes.appendChild(div);
        
        // Trigger fade-in animation
        setTimeout(() => div.classList.add('visible'), 100);
    });
}

intencaoForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value.trim();
    const intencao = document.getElementById('intencao').value.trim();
    
    if (intencao) {
        intencoes.push({ nome: nome || 'Anônimo', intencao });
        renderizarIntencoes();
        
        // Clear form
        this.reset();
        
        // Show success message
        const submitBtn = this.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Intenção Enviada!';
        submitBtn.style.background = '#4CAF50';
        
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.style.background = '';
        }, 2000);
    }
});

// Initialize intentions
renderizarIntencoes();

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

// Add fade-in animation to sections
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('section');
    animatedElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
});

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

// Galeria lightbox functionality
const galeriaItems = document.querySelectorAll('.galeria-item img');

galeriaItems.forEach(img => {
    img.addEventListener('click', () => {
        // Create lightbox overlay
        const lightbox = document.createElement('div');
        lightbox.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            cursor: pointer;
        `;
        
        const lightboxImg = document.createElement('img');
        lightboxImg.src = img.src;
        lightboxImg.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            border-radius: 10px;
            box-shadow: 0 0 50px rgba(255,255,255,0.3);
        `;
        
        lightbox.appendChild(lightboxImg);
        document.body.appendChild(lightbox);
        
        // Close lightbox on click
        lightbox.addEventListener('click', () => {
            document.body.removeChild(lightbox);
        });
        
        // Close lightbox on escape key
        const closeOnEscape = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(lightbox);
                document.removeEventListener('keydown', closeOnEscape);
            }
        };
        document.addEventListener('keydown', closeOnEscape);
    });
});

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