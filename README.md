# ebac-task-cep

Task of searching for ZIP codes in VIACEP using a FETCH API, and saving the data in the web storage API.

# Tarefa M9 - Formulário de Cadastro (ViaCEP + Web Storage)

Aplicação simples de cadastro de usuários com:

- Preenchimento automático de endereço via **ViaCEP** usando **Fetch API**
- Persistência de dados no **Local Storage (Web Storage API)**
- Restauração automática dos dados ao recarregar a página

## 🎯 Requisitos atendidos

- Fetch API consultando `https://viacep.com.br/ws/{CEP}/json/`
- Manipulação do DOM para preencher campos (logradouro, bairro, cidade e UF)
- Persistência no Local Storage para não perder os dados ao recarregar
- Código organizado em 3 arquivos: `index.html`, `styles.css`, `scripts.js`

## ✅ Como executar

1. Baixe/clonar o repositório
2. Abra o arquivo `index.html` no navegador  
   (ou use uma extensão como Live Server no VS Code)

## 🧠 Como testar

1. Preencha nome, sobrenome e e-mail
2. Digite um CEP válido (ex.: 01001-000)
3. Veja o endereço preencher automaticamente
4. Recarregue a página (F5) e confira que os dados continuam preenchidos

## 🔍 Onde ver os dados no navegador

DevTools (F12) → Application → Local Storage → procure a chave:

- `user_form_data_v1`

## 📁 Estrutura do projeto

- `index.html`
- `styles.css`
- `scripts.js`

## 🚀 Melhorias (opcional)

- Tema claro/escuro usando Local Storage
- Validações extras e máscaras (telefone)
