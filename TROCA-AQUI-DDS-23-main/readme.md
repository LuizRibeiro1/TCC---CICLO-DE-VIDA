- Clona o projeto 

- Crie o banco com o script da pasta `data/banco.sql`

- Abra o terminal, entre na pasta `server`

- `npm i` para instalar os pacotes necessários

- Copie `server/.env.example` para `server/.env` e ajuste os dados do MySQL:

```
PORT=4774

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=LifeStock

JWT_SECRET=uma_chave_secreta_forte
```

- Inicie o servidor: `npm run server` ou `node server.js`

- Acesse: http://localhost:4774/login

**Usuários de teste** (após rodar o script SQL):

| E-mail | Senha | Perfil |
|--------|-------|--------|
| admin@lifestock.com | 123456 | ADMINISTRADOR |
| funcionario@lifestock.com | 123456 | FUNCIONARIO |

Novos cadastros pela tela `/cadastro` são criados automaticamente como **FUNCIONARIO**.
