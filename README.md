# UPH Finance

Sistema web full stack para gestão de membros, mensalidades, taxa anual, rateio de despesas, doações, dashboard executivo, extrato individual e fluxo de caixa.

## Stack

- **Next.js + TypeScript** com App Router
- **Prisma ORM**
- **PostgreSQL**
- **Tailwind CSS**
- **shadcn/ui** (componentes base reaproveitáveis)
- **Zod** para validação

## Funcionalidades

- Cadastro de membro com apenas nome.
- Geração automática de **12 mensalidades** e **1 taxa anual** por membro.
- Configurações centralizadas para valores padrão.
- Registro de pagamentos com alocação automática em cobranças abertas por ordem cronológica.
- Suporte a pagamentos parciais.
- Registro de despesas.
- Rateio de despesas entre membros ativos, criando cobranças do tipo `EXPENSE_SHARE`.
- Registro de doações.
- Dashboard com receitas, pendências, despesas, doações, saldo e inadimplência.
- Extrato individual por membro.
- Fluxo de caixa por período.
- Rastreabilidade total entre pagamentos, alocações, cobranças e despesas.

## Regras de negócio implementadas

- **Valores históricos não são alterados** quando as configurações mudam.
- **Pagamentos são rateados automaticamente** nas cobranças em aberto do membro por ordem de vencimento.
- **Pagamentos parciais** atualizam a cobrança para `PARTIAL`.
- Cobranças usam os status **`PENDING`**, **`PARTIAL`** e **`PAID`**.
- Despesas rateadas geram cobranças do tipo **`EXPENSE_SHARE`** com vínculo à despesa original.
- Rotinas críticas usam **transações Prisma**.

## Entidades

- `Member`
- `Setting`
- `Charge`
- `Payment`
- `PaymentAllocation`
- `Expense`
- `Donation`

## Como rodar

### 1. Configure o ambiente

Crie um arquivo `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/uph_finance?schema=public"
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Gere o client Prisma

```bash
npm run db:generate
```

### 4. Aplique o schema no banco

Opção rápida para ambiente local:

```bash
npm run db:push
```

Ou com migration:

```bash
npm run db:migrate
```

### 5. Popule com dados de exemplo

```bash
npm run db:seed
```

### 6. Inicie a aplicação

```bash
npm run dev
```

A aplicação ficará disponível em `http://localhost:3000`.

## Estrutura resumida

- `app/` → páginas e server actions.
- `components/` → layout, UI e blocos reutilizáveis.
- `lib/services.ts` → regras de negócio, consultas e transações.
- `lib/validations.ts` → schemas Zod.
- `prisma/schema.prisma` → modelo relacional completo.
- `prisma/seed.ts` → base inicial com membros, pagamentos, despesas e doações.

## Observações importantes

- O projeto foi estruturado para trabalhar com **PostgreSQL**.
- O seed cria membros, pagamentos, despesas com rateio e doações para facilitar testes.
- Caso deseje evoluir o projeto, um próximo passo natural é adicionar autenticação e trilha formal de auditoria por usuário.
