# Sistema de Registro de Abordagens

Sistema web para registro e gerenciamento de abordagens policiais, com suporte a fotos, dados pessoais e histórico.

## Funcionalidades

- Registro de pessoas com fotos e dados pessoais
- Registro de veículos com fotos e informações
- Registro de abordagens com localização via GPS
- Histórico completo de abordagens por pessoa
- Busca por nome, RG ou CPF
- Interface responsiva e intuitiva
- Armazenamento local via IndexedDB

## Tecnologias

- HTML5
- CSS3
- JavaScript (ES6+)
- IndexedDB
- Express.js
- Service Workers (PWA)

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/abordados.git
cd abordados
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Deploy

O projeto está configurado para deploy na Vercel. Para fazer o deploy:

1. Instale a CLI da Vercel:
```bash
npm i -g vercel
```

2. Faça login na sua conta:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

## Uso

1. Acesse a aplicação no navegador
2. Use o botão "+" para adicionar uma nova abordagem
3. Busque pessoas existentes ou cadastre novas
4. Use o GPS para obter a localização atual
5. Preencha os dados necessários e salve

## Licença

MIT 