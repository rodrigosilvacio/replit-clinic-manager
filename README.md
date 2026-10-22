# Nina - Sistema de Gestão de Clínicas

Sistema completo para gestão de clínicas médicas, desenvolvido com tecnologias modernas para gerenciamento de pacientes, agendamentos, prontuários eletrônicos, estoque e finanças.

## O que é

Nina é um sistema web full-stack para administração de clínicas de saúde. Oferece funcionalidades integradas para o dia a dia de clínicas, desde o cadastro de pacientes até o controle financeiro, com suporte a múltiplos perfis de usuário e notificações via WhatsApp.

## Principais Funcionalidades

- **Autenticação e Controle de Acesso (RBAC)**: Quatro perfis de usuário com permissões específicas:
  - ADMIN: Acesso completo ao sistema
  - RECEPCAO: Gestão de pacientes e agendamentos
  - PROFISSIONAL_SAUDE: Acesso a prontuários e consultas
  - FINANCEIRO: Gestão de recebimentos e pagamentos

- **Gestão de Pacientes**: Cadastro completo com dados pessoais, convênio, contato de emergência, alergias e consentimento LGPD

- **Gestão de Colaboradores**: Cadastro de profissionais com especialidade e registro profissional

- **Gestão de Serviços/Procedimentos**: Cadastro de serviços oferecidos com duração e preço

- **Agenda e Agendamentos**: Visualização semanal com controle de status (Agendada, Confirmada, Em Atendimento, Concluída, Cancelada, Faltou)

- **Prontuário Eletrônico**: Registros de anamnese, evolução, prescrição, atestado e exames

- **Controle de Estoque**: Gerenciamento de itens com alertas de estoque mínimo e movimentações (entrada, saída, ajuste)

- **Gestão Financeira**: Controle de recebimentos e pagamentos com múltiplas formas de pagamento (PIX, Cartão, Dinheiro, Boleto, Transferência)

- **Dashboard**: Painel com indicadores-chave de desempenho (KPIs)

- **Notificações WhatsApp**: Envio automático de lembretes de consulta via integração Z-API

## Stack Tecnológica

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Shadcn/ui (componentes Radix UI)
- Wouter (roteamento)
- TanStack Query (gerenciamento de estado e cache)
- React Hook Form + Zod (formulários e validação)
- Recharts (gráficos)

### Backend
- Node.js
- Express 5
- TypeScript
- Drizzle ORM
- PostgreSQL
- Passport.js (autenticação baseada em sessão)
- bcryptjs (hash de senhas)

## Estrutura de Pastas

```
/
├── client/                  # Aplicação frontend React
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   │   └── ui/          # Componentes Shadcn/ui
│   │   ├── hooks/           # Hooks customizados
│   │   ├── lib/             # Utilitários (auth, queryClient)
│   │   └── pages/           # Páginas da aplicação
│   │       ├── agenda.tsx
│   │       ├── colaboradores.tsx
│   │       ├── configuracoes.tsx
│   │       ├── consultas.tsx
│   │       ├── dashboard.tsx
│   │       ├── estoque.tsx
│   │       ├── financeiro.tsx
│   │       ├── login.tsx
│   │       ├── medicos.tsx
│   │       ├── pacientes.tsx
│   │       ├── prontuario.tsx
│   │       └── servicos.tsx
│   └── public/              # Arquivos estáticos
├── server/                  # Servidor Express
│   ├── index.ts             # Ponto de entrada do servidor
│   ├── routes.ts            # Definição das rotas da API
│   ├── storage.ts           # Camada de acesso a dados
│   ├── db.ts                # Configuração do banco de dados
│   ├── seed.ts              # Dados iniciais (seed)
│   ├── zapi.ts              # Integração WhatsApp via Z-API
│   ├── static.ts            # Servir arquivos estáticos (produção)
│   └── vite.ts              # Configuração Vite (desenvolvimento)
├── shared/                  # Código compartilhado
│   └── schema.ts            # Definições Drizzle e validações Zod
├── script/                  # Scripts de build
│   └── build.ts
├── drizzle.config.ts        # Configuração Drizzle Kit
├── tailwind.config.ts       # Configuração Tailwind CSS
├── vite.config.ts           # Configuração Vite
├── tsconfig.json            # Configuração TypeScript
└── package.json
```

## Instalação e Configuração

### Pré-requisitos
- Node.js (versão compatível com ES modules)
- PostgreSQL

### Passos

1. Clone o repositório e acesse a pasta do projeto

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente (veja seção abaixo)

4. Execute o push do schema para o banco de dados:
```bash
npm run db:push
```

5. Inicie a aplicação em modo desenvolvimento:
```bash
npm run dev
```

A aplicação estará disponível na porta 5000 (ou na porta definida em `PORT`).

### Build para Produção

```bash
npm run build
npm run start
```

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL de conexão PostgreSQL |
| `PORT` | Porta do servidor (padrão: 5000) |
| `ZAPI_INSTANCE_ID` | ID da instância Z-API (opcional, para WhatsApp) |
| `ZAPI_INSTANCE_TOKEN` | Token da instância Z-API (opcional, para WhatsApp) |
| `ZAPI_CLIENT_TOKEN` | Token do cliente Z-API (opcional, para WhatsApp) |

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor em modo desenvolvimento |
| `npm run build` | Compila o projeto para produção |
| `npm run start` | Inicia o servidor em modo produção |
| `npm run check` | Executa verificação de tipos TypeScript |
| `npm run db:push` | Sincroniza o schema com o banco de dados |

## Usuários Padrão (Seed)

O sistema cria automaticamente os seguintes usuários na primeira execução:

| Email | Senha | Perfil |
|-------|-------|--------|
| admin@nina.com | admin123 | ADMIN |
| maria@nina.com | user123 | RECEPCAO |
| carlos@nina.com | user123 | PROFISSIONAL_SAUDE |
| ana@nina.com | user123 | FINANCEIRO |

## Licença

MIT
