# Acutis - Missionários da Esperança

Um website religioso completo com funcionalidades dinâmicas para compartilhamento de fé e comunidade.

## 🙏 Funcionalidades

### 📖 Evangelho do Dia
- Busca automática do evangelho diário do site liturgia.cancaonova.com
- Atualização automática à meia-noite
- Sistema de fallback para garantir disponibilidade
- Formatação litúrgica autêntica

### 🤲 Intenções de Oração
- Formulário para compartilhar intenções
- Integração com SheetDB como banco de dados
- Exibição das últimas 6 intenções
- Atualização em tempo real

### 📸 Galeria Organizada
- Sistema de pastas para diferentes ocasiões:
  - 🏠 Visitas Pastorais
  - 📢 Evangelização
  - 🎉 Eventos Especiais
  - 🙏 Orações e Encontros
  - 🤝 Atividades Comunitárias
  - 📚 Formação e Estudo
- Visualização em tela cheia
- Lightbox para fotos individuais

### 📱 Design Responsivo
- Interface moderna e amigável
- Compatível com dispositivos móveis
- Navegação intuitiva
- Cores e tipografia otimizadas

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **API Externa**: SheetDB para armazenamento de intenções
- **Fonte de Conteúdo**: liturgia.cancaonova.com
- **CORS Proxy**: api.allorigins.win

## 🚀 Como Usar

### Instalação Local

1. Clone o repositório:
```bash
git clone https://github.com/SEU_USUARIO/acutis-missionarios-esperanca.git
cd acutis-missionarios-esperanca
```

2. Inicie um servidor local:
```bash
python -m http.server 8080
```

3. Acesse no navegador:
```
http://localhost:8080
```

### Deploy

O projeto é totalmente estático e pode ser hospedado em:
- GitHub Pages
- Netlify
- Vercel
- Qualquer servidor web

## 📋 Configuração

### SheetDB (Intenções)
O projeto está configurado para usar a API do SheetDB. Para usar sua própria planilha:

1. Acesse [SheetDB.io](https://sheetdb.io)
2. Crie uma nova API baseada em uma planilha Google Sheets
3. Substitua a URL no arquivo `script.js`:
```javascript
const API_URL = 'SUA_URL_SHEETDB_AQUI';
```

### Evangelho do Dia
O sistema busca automaticamente de liturgia.cancaonova.com. Não requer configuração adicional.

## 🎨 Personalização

### Cores
As cores principais podem ser alteradas no arquivo `styles.css`:
- `#FF8C42` - Laranja principal
- `#D84315` - Vermelho escuro
- `#FFF8F0` - Bege claro

### Conteúdo
- Edite os textos em `index.html`
- Adicione novas fotos na pasta `imagens/`
- Modifique os evangelhos de fallback em `script.js`

## 📁 Estrutura do Projeto

```
acutis-missionarios-esperanca/
├── index.html          # Página principal
├── styles.css          # Estilos CSS
├── script.js           # Lógica JavaScript
├── imagens/            # Pasta de imagens
│   ├── img_visita1.jpeg
│   ├── img_visita2.jpeg
│   ├── img-visita3.jpeg
│   └── img_visita4.jpeg
└── README.md           # Documentação
```

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🙏 Sobre o Projeto

Inspirado pelo Beato Carlo Acutis e seu lema "Estar sempre unido a Jesus Cristo, este é o meu projeto de vida", este website foi desenvolvido para apoiar a missão evangelizadora do grupo Acutis: Missionários da Esperança.

---

**Desenvolvido com ❤️ e fé para a maior glória de Deus**