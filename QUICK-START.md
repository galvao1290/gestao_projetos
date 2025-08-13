# 🚀 Quick Start - Deploy com Docker

## ⚡ Deploy Rápido (5 minutos)

### 1. Preparar ambiente
```bash
# Clonar repositório
git clone <seu-repositorio>
cd GESTÃO_DE_PROJETOS

# Configurar variáveis
cp .env.example .env
nano .env  # Editar senhas e URLs
```

### 2. Deploy simples (HTTP)
```bash
# Dar permissão e executar
chmod +x deploy.sh
./deploy.sh
```

### 3. Acessar aplicação
- **Frontend:** http://seu-servidor
- **API:** http://seu-servidor:5000
- **Usuário padrão:** smartseg / smartseg123

---

## 🔧 Comandos Essenciais

```bash
# Iniciar aplicação
docker-compose up -d

# Parar aplicação
docker-compose down

# Ver logs
docker-compose logs -f

# Atualizar aplicação
git pull && docker-compose up --build -d

# Backup do banco
docker-compose exec mongodb mongodump --out /data/backup
```

---

## 🌐 Deploy com HTTPS (Produção)

### 1. Configurar domínio
```bash
# No .env
DOMAIN=seudominio.com
SSL_EMAIL=seu@email.com
CORS_ORIGIN=https://seudominio.com
REACT_APP_API_URL=https://seudominio.com:5000
```

### 2. Gerar SSL (Let's Encrypt)
```bash
# Primeiro, iniciar sem SSL
docker-compose up -d

# Depois, obter certificado
docker-compose --profile ssl run --rm certbot

# Reiniciar com SSL
docker-compose --profile production up -d
```

---

## 📊 Monitoramento

```bash
# Status dos containers
docker-compose ps

# Uso de recursos
docker stats

# Logs específicos
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb

# Health check
curl http://localhost/health
curl http://localhost:5000/api/health
```

---

## 🔒 Segurança Básica

### Firewall (Ubuntu)
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Variáveis importantes no .env
```env
# MUDE ESTAS SENHAS!
MONGO_ROOT_PASSWORD=senha_super_segura_123
JWT_SECRET=jwt_secret_muito_longo_e_seguro_aqui

# URLs da sua VPS
CORS_ORIGIN=https://seudominio.com
REACT_APP_API_URL=https://seudominio.com:5000
```

---

## 🆘 Problemas Comuns

### Container não inicia
```bash
docker-compose logs nome-do-container
```

### Erro de conexão com banco
```bash
# Verificar MongoDB
docker-compose logs mongodb

# Testar conexão
docker-compose exec backend node -e "console.log('DB OK')"
```

### Frontend não carrega
```bash
# Rebuild do frontend
docker-compose up --build frontend
```

### Reset completo
```bash
docker-compose down --volumes --remove-orphans
docker system prune -a
docker-compose up --build -d
```

---

## 📁 Estrutura de Arquivos

```
📦 GESTÃO_DE_PROJETOS/
├── 🐳 docker-compose.yml          # Configuração principal
├── 🐳 docker-compose.prod.yml     # Configuração de produção
├── 🐳 docker-compose.dev.yml      # Configuração de desenvolvimento
├── 🐳 Dockerfile                  # Backend container
├── 📁 client/
│   ├── 🐳 Dockerfile              # Frontend container (produção)
│   ├── 🐳 Dockerfile.dev          # Frontend container (desenvolvimento)
│   └── ⚙️ nginx.conf              # Configuração Nginx do frontend
├── 📁 nginx/
│   └── ⚙️ nginx.conf              # Proxy reverso principal
├── 📁 scripts/
│   ├── 🔧 backup.sh               # Script de backup
│   └── 🗑️ limpar_usuarios.js      # Script de limpeza
├── 🚀 deploy.sh                   # Script de deploy
├── 🔐 generate-ssl.sh             # Gerar certificados SSL
├── ⚙️ .env.example                # Variáveis de ambiente
├── 📖 README-DOCKER.md            # Documentação completa
└── 📖 QUICK-START.md              # Este arquivo
```

---

## 🎯 Próximos Passos

1. **Backup automático:** Configure cron para backup diário
2. **Monitoramento:** Implemente logs centralizados
3. **CI/CD:** Configure deploy automático
4. **Scaling:** Use Docker Swarm ou Kubernetes
5. **CDN:** Configure CloudFlare ou similar

---

**💡 Dica:** Para documentação completa, consulte `README-DOCKER.md`