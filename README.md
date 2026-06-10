# Controle da Qualidade — Drifts

Aplicação React (Vite) para registro de medição e movimentação de drifts, com dados salvos no **Supabase**.

## Funcionalidades

- **Saída de drifts** — formulário de medição (9 leituras: pé, centro, ponta) com média automática.
- **Entrada de drifts** — mesma estrutura da saída, **sem o campo Ordem de produção** (registrado apenas na saída).
- **Histórico** — tabela consolidada (saída à esquerda, entrada à direita) pareada por **EC** em ordem cronológica (1ª saída ↔ 1ª entrada, e assim por diante); quem ainda não tem par fica com as células em branco. Filtros por EC, ordem, data e diâmetro.
- **Cadastros** — abas de *Drifts* (EC + diâmetro) e *Responsáveis* (PN + nome), com busca, editar e excluir.

Navegação em formato de página, com botão **Voltar** e atalho **ESC** para retornar ao início.

## 1) Configurar o Supabase

1. Crie um projeto em https://supabase.com.
2. Abra **SQL Editor → New query**, cole o conteúdo de `supabase_schema.sql` e clique em **Run**. Isso cria as tabelas `drifts`, `responsaveis` e `movimentacoes`.
3. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.

### Tabelas e colunas criadas

**drifts**
- `id` (uuid, PK) · `ec` (text) · `diametro` (numeric) · `created_at` (timestamptz)

**responsaveis**
- `id` (uuid, PK) · `pn` (text) · `nome` (text) · `created_at` (timestamptz)

**movimentacoes**
- `id` (uuid, PK) · `tipo` ('saida' | 'entrada') · `ec` (text) · `diametro` (numeric) · `ordem_producao` (text)
- `pe_1`, `pe_2`, `pe_3` (numeric) · `centro_1`, `centro_2`, `centro_3` (numeric) · `ponta_1`, `ponta_2`, `ponta_3` (numeric)
- `valor_medio` (numeric) · `responsavel_pn` (text) · `responsavel_nome` (text) · `data_hora` (timestamptz) · `created_at` (timestamptz)
- Observação: `ordem_producao` é preenchido apenas nas **saídas** (a página de Entrada não tem esse campo); nas entradas fica nulo.

## 2) Variáveis de ambiente

Crie um arquivo `.env` na raiz (use `.env.example` como base):

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

## 3) Rodar localmente

```bash
npm install
npm run dev
```

## 4) Deploy na Vercel

1. Suba o projeto para um repositório Git e importe em https://vercel.com (Add New → Project). O Vite é detectado automaticamente.
2. Em **Settings → Environment Variables**, cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os mesmos valores do `.env`.
3. Clique em **Deploy**.

> Observação de segurança: a chave anon fica visível no navegador. As políticas RLS do script liberam acesso geral (uso interno). Para restringir, ative o Supabase Auth e ajuste as políticas para usar `auth.uid()`.
