# Como subir o Gestão de Vendas Pro no Netlify

Guia passo a passo para o primeiro deploy (sem experiência prévia).

---

## Pré-requisito: código no GitHub

O Netlify funciona melhor conectado a um repositório Git. Se ainda não fez isso:

1. Crie uma conta no **GitHub** (https://github.com).
2. Instale o **Git** no seu PC: https://git-scm.com/downloads.
3. No terminal, na pasta do projeto (`D:\gestao-pro`), rode:

```bash
git init
git add .
git commit -m "Projeto Gestão de Vendas Pro"
```

4. No GitHub, crie um repositório novo (botão **New repository**). Nome sugerido: `gestao-vendas-pro`. Não marque “Add README”.
5. Conecte e envie o código (troque `SEU_USUARIO` pelo seu usuário do GitHub):

```bash
git remote add origin https://github.com/SEU_USUARIO/gestao-vendas-pro.git
git branch -M main
git push -u origin main
```

Se pedir login, use seu usuário e senha (ou token) do GitHub.

---

## Parte 1: Criar conta no Netlify

1. Acesse **https://www.netlify.com**.
2. Clique em **Sign up**.
3. Escolha **Sign up with GitHub** (ou com e-mail).
4. Conclua o cadastro e o login.

---

## Parte 2: Conectar o projeto ao Netlify

1. No painel do Netlify, clique em **Add new site** → **Import an existing project**.
2. Clique em **Deploy with GitHub** (ou GitLab/Bitbucket, se tiver o código lá).
3. Se pedir, **autorize o Netlify** a acessar sua conta do GitHub.
4. Na lista de repositórios, escolha **gestao-vendas-pro** (ou o nome que você deu).
5. Na tela de configuração do build:
   - **Branch to deploy:** `main` (deixe assim).
   - **Build command:** deve aparecer `npm run build` (já está no `netlify.toml`).
   - **Publish directory:** deve aparecer `dist` (também no `netlify.toml`).
6. Clique em **Deploy site** (ou **Deploy [nome-do-site]**).

O Netlify vai clonar o repositório, instalar dependências, rodar `npm run build` e publicar a pasta `dist`. Isso leva 1–3 minutos.

---

## Parte 3: Depois do deploy

1. Quando aparecer **Site is live**, seu app está no ar.
2. O endereço será algo como: `https://nome-aleatorio-123.netlify.app`.
3. Clique no link para abrir o **Gestão de Vendas Pro** no navegador.

### Trocar o nome do site (opcional)

1. No Netlify: **Site configuration** → **Domain management** → **Options** → **Edit site name**.
2. Escolha um nome que ainda não exista, por exemplo: `minha-gestao-vendas`.
3. A URL fica: `https://minha-gestao-vendas.netlify.app`.

---

## Atualizações futuras

Sempre que você enviar alterações para o GitHub na branch `main`:

```bash
git add .
git commit -m "Descrição da alteração"
git push
```

o Netlify **reconstrói e publica de novo** sozinho. Em 1–2 minutos o site atualizado estará no ar.

---

## Se algo der errado

- **Build failed:** Abra o **Deploys** no Netlify, clique no deploy que falhou e leia o **log**. O erro costuma mostrar qual comando ou passo falhou.
- **Página em branco:** Confirme que no `netlify.toml` está `publish = "dist"` e que o `npm run build` gera a pasta `dist` na sua máquina.
- **Dúvidas:** Documentação do Netlify: https://docs.netlify.com.

---

Resumo: coloque o projeto no GitHub, conecte esse repositório no Netlify e faça o primeiro deploy. O arquivo `netlify.toml` na raiz do projeto já deixa o build e a publicação configurados para este app.
