# 📖 Como Alterar o Evangelho do Dia

## 🎯 **3 Formas de Alterar o Evangelho:**

### **1️⃣ MÉTODO SIMPLES - Editar diretamente no código**

**Passo a passo:**
1. Abra o arquivo `script.js`
2. Encontre a função `carregarEvangelhoDemo()`
3. Localize o array `evangelhos` no início do arquivo
4. Edite ou adicione novos evangelhos no formato:

```javascript
{
    referencia: "Evangelho segundo São [Nome] ([Sigla] X,Y-Z)",
    texto: `Texto completo do evangelho aqui...`
}
```

**Exemplo:**
```javascript
{
    referencia: "Evangelho segundo São Mateus (Mt 6,9-13)",
    texto: `Naquele tempo, Jesus ensinou seus discípulos a orar:
    
    "Pai nosso que estás nos céus,
    santificado seja o teu nome;
    venha o teu reino;
    seja feita a tua vontade,
    assim na terra como no céu..."`
}
```

### **2️⃣ MÉTODO AVANÇADO - Sistema com navegação**

**O que já está implementado:**
- ✅ Array com múltiplos evangelhos
- ✅ Rotação automática baseada no dia da semana
- ✅ Botões para navegar entre evangelhos
- ✅ Contador mostrando qual evangelho está sendo exibido

**Para adicionar mais evangelhos:**
1. No arquivo `script.js`, encontre o array `evangelhos`
2. Adicione novos objetos ao array seguindo o formato existente
3. O sistema automaticamente incluirá os novos evangelhos na rotação

### **3️⃣ MÉTODO PROFISSIONAL - Arquivo JSON externo**

**Vantagens:**
- ✅ Fácil de editar sem mexer no código
- ✅ Pode ser atualizado por pessoas não-técnicas
- ✅ Permite agendamento por data específica
- ✅ Backup e versionamento mais simples

**Como usar:**
1. Edite o arquivo `evangelhos.json`
2. No arquivo `script.js`, comente a linha:
   ```javascript
   document.addEventListener('DOMContentLoaded', carregarEvangelhoDemo);
   ```
3. Descomente o bloco da função `carregarEvangelhoDeArquivo()`
4. Adicione esta linha no final:
   ```javascript
   document.addEventListener('DOMContentLoaded', carregarEvangelhoDeArquivo);
   ```

**Formato do evangelhos.json:**
```json
{
  "evangelhos": [
    {
      "data": "2024-09-01",
      "referencia": "Evangelho segundo São João (Jo 14,1-6)",
      "texto": "Texto completo do evangelho..."
    }
  ]
}
```

## 🔄 **Como Trocar de Método:**

### Atualmente ativo: **Método 2 (Avançado)**

### Para usar Método 1 (Simples):
- Remova os botões de navegação da função
- Edite diretamente o evangelho no código

### Para usar Método 3 (JSON):
- Siga as instruções acima para ativar o carregamento via JSON

## 📅 **Lógica Atual de Seleção:**

- **Domingo (0):** Evangelho índice 0
- **Segunda (1):** Evangelho índice 1  
- **Terça (2):** Evangelho índice 2
- **Quarta (3):** Evangelho índice 0 (reinicia)
- E assim por diante...

## 💡 **Dicas Importantes:**

1. **Formatação de texto:** Use `\n\n` para quebras de parágrafo
2. **Aspas:** Use `\"` para aspas dentro do texto
3. **Backup:** Sempre faça backup antes de editar
4. **Teste:** Recarregue a página após cada alteração

## 🛠️ **Para Desenvolvedores:**

### Integração com API externa:
```javascript
async function carregarEvangelhoAPI() {
    try {
        const response = await fetch('https://api.evangelho.com/hoje');
        const data = await response.json();
        // Processar dados...
    } catch (error) {
        // Fallback para evangelho local
    }
}
```

### Agendamento automático:
```javascript
// Agendar atualização diária às 00:00
setInterval(() => {
    const agora = new Date();
    if (agora.getHours() === 0 && agora.getMinutes() === 0) {
        carregarEvangelhoDemo();
    }
}, 60000); // Verifica a cada minuto
```

---

**📧 Precisa de ajuda?** Edite este arquivo README ou consulte a documentação do projeto.