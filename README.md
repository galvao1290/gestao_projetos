# Sistema de Gestão de Projetos

Sistema completo de gestão de projetos com autenticação, planilhas interativas e sistema de permissões por coluna.

## 🚀 Funcionalidades

- ✅ **Autenticação de usuários** (Login/Registro)
- ✅ **Gestão de projetos** (CRUD completo)
- ✅ **Planilhas interativas** com edição em tempo real
- ✅ **Sistema de permissões por coluna** (LEITURA_ESCRITA, APENAS_LEITURA, OCULTA)
- ✅ **Upload de arquivos CSV**
- ✅ **Colaboradores por projeto**
- ✅ **Interface responsiva** e moderna

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação via tokens
- **Bcrypt** - Hash de senhas
- **Multer** - Upload de arquivos
- **CSV-Parser** - Processamento de arquivos CSV

### Frontend
- **React.js** - Biblioteca para interfaces
- **React Router** - Roteamento
- **Axios** - Cliente HTTP
- **React Toastify** - Notificações
- **CSS3** - Estilização

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) (versão 16 ou superior)
- [MongoDB](https://www.mongodb.com/try/download/community) (versão 5 ou superior)
- [Git](https://git-scm.com/)

## 🔧 Instalação

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd gestao-projetos
```

### 2. Instale as dependências do backend
```bash
npm install
```

### 3. Instale as dependências do frontend
```bash
cd client
npm install
cd ..
```

### 4. Configure as variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env com suas configurações
```

**Variáveis obrigatórias no .env:**
```env
MONGO_URI=mongodb://localhost:27017/gestao_projetos
JWT_SECRET=seu_jwt_secret_muito_seguro_aqui
PORT=5000
```

### 5. Inicie o MongoDB
```bash
# Windows (se instalado como serviço)
net start MongoDB

# macOS/Linux
sudo systemctl start mongod

# Ou usando Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## 🚀 Executando o Projeto

### Desenvolvimento (Backend + Frontend)
```bash
npm run dev
```

### Apenas Backend
```bash
npm run server
```

### Apenas Frontend
```bash
npm run client
```

### Produção
```bash
# Build do frontend
npm run build

# Iniciar servidor
npm start
```

## 🌐 Acesso

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **MongoDB:** mongodb://localhost:27017

## 📁 Estrutura do Projeto

```
gestao-projetos/
├── client/                 # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── contexts/       # Contextos (AuthContext)
│   │   ├── pages/          # Páginas da aplicação
│   │   └── styles/         # Arquivos CSS
│   └── package.json
├── middleware/             # Middlewares do Express
│   └── auth.js            # Middleware de autenticação
├── models/                # Modelos do MongoDB
│   ├── User.js           # Modelo de usuário
│   └── Projeto.js        # Modelo de projeto
├── routes/                # Rotas da API
│   ├── auth.js           # Rotas de autenticação
│   ├── users.js          # Rotas de usuários
│   └── projetos.js       # Rotas de projetos
├── uploads/               # Arquivos enviados (gitignored)
├── .env.example          # Exemplo de variáveis de ambiente
├── .gitignore            # Arquivos ignorados pelo Git
├── package.json          # Dependências do backend
├── README.md             # Este arquivo
└── server.js             # Servidor principal
```

## 🔐 Sistema de Permissões

O sistema possui três níveis de permissão por coluna:

- **LEITURA_ESCRITA:** Usuário pode ver e editar a coluna
- **APENAS_LEITURA:** Usuário pode apenas visualizar a coluna
- **OCULTA:** Coluna não é visível para o usuário

## 📝 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário logado

### Usuários
- `GET /api/users` - Listar usuários
- `GET /api/users/:id` - Buscar usuário por ID

### Projetos
- `GET /api/projetos` - Listar projetos
- `POST /api/projetos` - Criar projeto
- `GET /api/projetos/:id` - Buscar projeto
- `PUT /api/projetos/:id` - Atualizar projeto
- `DELETE /api/projetos/:id` - Deletar projeto
- `POST /api/projetos/:id/upload` - Upload de CSV
- `PUT /api/projetos/:id/dados` - Atualizar dados da planilha
- `GET /api/projetos/:id/permissoes` - Buscar permissões
- `PUT /api/projetos/:id/permissoes` - Atualizar permissões

## 🧪 Testando a Aplicação

1. **Registre um usuário** em `/register`
2. **Faça login** em `/login`
3. **Crie um projeto** no dashboard
4. **Faça upload de um CSV** ou crie dados manualmente
5. **Configure permissões** para colaboradores
6. **Teste a edição** de células com diferentes permissões

## 🐛 Solução de Problemas

### MongoDB não conecta
```bash
# Verifique se o MongoDB está rodando
mongosh

# Ou verifique o status do serviço
sudo systemctl status mongod
```

### Erro de CORS
- Verifique se o proxy está configurado no `client/package.json`
- Confirme se o backend está rodando na porta 5000

### Erro de JWT
- Verifique se `JWT_SECRET` está definido no `.env`
- Certifique-se de que o token não expirou

### Erro de Upload
- Verifique se a pasta `uploads/` existe
- Confirme as permissões de escrita

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

**Miguel** - Desenvolvedor Principal

---

⭐ Se este projeto te ajudou, considere dar uma estrela no repositório!