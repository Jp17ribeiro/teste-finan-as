# Teste Financeiro 💰

Sistema de Gestão Financeira com Dashboard interativo, desenvolvido com HTML, CSS e JavaScript vanilla, integrado com Supabase para persistência de dados.

## Características

- 📊 Dashboard com gráficos em tempo real
- 💳 Registro de receitas e despesas
- 📈 Relatórios financeiros
- 🎯 Controle de metas
- 👥 Gerenciamento de usuários (Admin/Usuário)
- 🌓 Modo claro/escuro
- 📱 Design responsivo
- 🔐 Autenticação segura com Supabase

## Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Supabase (PostgreSQL + Auth)
- **Gráficos**: Chart.js
- **Deploy**: Vercel

## Instalação Local

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/teste-financeiro.git
cd teste-financeiro

# Instale dependências (se houver)
npm install

# Inicie o servidor local
npm run dev
```

## Configuração Supabase

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Execute o schema SQL em `supabase/schema.sql`
4. Atualize as credenciais em `js/config/supabase-config.js`

## Deploy Vercel

```bash
# Login na Vercel
npx vercel login

# Deploy
npx vercel
```

## Licença

MIT
