# Frontend - Precificador de Receitas

PWA (Progressive Web App) mobile-first para gerenciamento de ingredientes, receitas e precificação de produtos.

## 🚀 Tecnologias

- **React 18.3** com TypeScript
- **Vite 5.2** para build otimizado
- **React Router 6** para navegação
- **Zustand 4.5** para gerenciamento de estado
- **Axios** para requisições HTTP
- **PWA** com service worker e manifest

## 📦 Instalação

```bash
npm install
```

## ⚙️ Configuração

Crie um arquivo `.env` baseado no `.env.example`:

```bash
VITE_API_URL=http://localhost:8080/api
```

## 🏃 Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:5173

## 🏗️ Build para Produção

```bash
npm run build
```

Os arquivos otimizados estarão em `dist/`

## 🧪 Preview da Build

```bash
npm run preview
```

## 📱 PWA

O aplicativo é instalável como PWA e funciona offline. Para testar:

1. Faça build de produção: `npm run build`
2. Sirva com HTTPS (requisito para PWA)
3. O navegador mostrará opção de instalação

## 🔐 Autenticação

O sistema usa JWT com refresh token. O token de acesso é renovado automaticamente quando expira.

## 📂 Estrutura

```
src/
├── components/       # Componentes reutilizáveis
│   ├── Layout.tsx
│   └── ProtectedRoute.tsx
├── lib/             # Utilitários
│   ├── api.ts       # Cliente HTTP com interceptors
│   └── apiClient.ts # API tipada
├── pages/           # Páginas/rotas
│   ├── Dashboard.tsx
│   ├── Ingredients.tsx
│   ├── Login.tsx
│   ├── Products.tsx
│   ├── Recipes.tsx
│   └── Register.tsx
├── store/           # Estado global
│   └── authStore.ts
├── App.tsx          # Router principal
├── index.css        # Estilos globais
└── main.tsx         # Entry point
```

## 🎨 Design

- Mobile-first responsivo
- Tema customizável via CSS variables
- Design minimalista e funcional
- Suporte a dark mode (futuro)

## 🔧 Desenvolvimento

### Adicionar nova página

1. Criar componente em `src/pages/`
2. Adicionar rota em `App.tsx`
3. Se precisar proteção, usar `<ProtectedRoute>`

### Adicionar novo endpoint

1. Adicionar interface em `src/lib/apiClient.ts`
2. Adicionar método na API correspondente
3. Usar no componente

## 📝 Notas

- Todos os dados são isolados por tenant (multi-tenant)
- Autenticação obrigatória para rotas protegidas
- Service worker cacheia assets para uso offline
- Build gera manifesto PWA automaticamente
