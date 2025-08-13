# 🐳 Deploy com Docker - Sistema de Gestão de Projetos

Este guia explica como fazer o deploy da aplicação usando Docker e Docker Compose em uma VPS.

## 📋 Pré-requisitos

### Na sua VPS:
- Ubuntu 20.04+ ou CentOS 8+ (recomendado)
- Docker 20.10+
- Docker Compose 2.0+
- Git
- Pelo menos 2GB RAM e 10GB de espaço em disco

### Instalação do Docker (Ubuntu)
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Reiniciar sessão ou executar:
newgrp docker
```

## 🚀 Deploy Rápido

### 1. Clonar o repositório
```bash
git clone <seu-repositorio>
cd GESTÃO_DE_PROJETOS
```

### 2. Configurar variáveis de ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar configurações (IMPORTANTE!)
nano .env
```

**Configurações importantes no .env:**
```env
# Altere estas senhas em produção!
MONGO_ROOT_PASSWORD=sua_senha_super_segura_aqui
JWT_SECRET=seu_jwt_secret_muito_seguro_e_longo_aqui

# URL da sua VPS
CORS_ORIGIN=http://seu-dominio.com
REACT_APP_API_URL=http://seu-dominio.com:5000
```

### 3. Executar deploy
```bash
# Dar permissão ao script
chmod +x deploy.sh

# Executar deploy
./deploy.sh
```

## 📁 Estrutura dos Containers

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    MongoDB      │
│   (React)       │    │   (Node.js)     │    │   (Database)    │
│   Port: 80      │◄──►│   Port: 5000    │◄──►│   Port: 27017   │
│   Nginx         │    │   Express API   │    │   Data Storage  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Comandos Úteis

### Gerenciamento básico
```bash
# Iniciar aplicação
docker-compose up -d

# Parar aplicação
docker-compose down

# Reiniciar aplicação
docker-compose restart

# Ver logs
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Monitoramento
```bash
# Status dos containers
docker-compose ps

# Uso de recursos
docker stats

# Entrar no container do backend
docker-compose exec backend sh

# Entrar no MongoDB
docker-compose exec mongodb mongosh
```

### Backup e Restore
```bash
# Backup do banco de dados
docker-compose exec mongodb mongodump --db gestao_projetos --out /data/backup

# Restore do banco de dados
docker-compose exec mongodb mongorestore /data/backup
```

## 🌐 Configuração de Domínio

### 1. Configurar DNS
Aponte seu domínio para o IP da VPS:
```
A    @    seu-ip-da-vps
A    www  seu-ip-da-vps
```

### 2. Configurar Nginx (opcional para SSL)
Crie o arquivo `nginx/nginx.conf` para proxy reverso com SSL:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com www.seu-dominio.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Ativar perfil de produção
```bash
# Usar configuração com Nginx
docker-compose --profile production up -d
```

## 🔒 Segurança

### Firewall (UFW)
```bash
# Instalar e configurar firewall
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp  # API (remover em produção)
```

### SSL com Let's Encrypt
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

## 📊 Monitoramento

### Logs da aplicação
```bash
# Logs em tempo real
docker-compose logs -f --tail=100

# Logs de erro apenas
docker-compose logs | grep ERROR

# Salvar logs em arquivo
docker-compose logs > app-logs.txt
```

### Verificação de saúde
```bash
# Testar API
curl http://localhost:5000/api/health

# Testar frontend
curl http://localhost

# Verificar conectividade do banco
docker-compose exec backend node -e "console.log('DB OK')"
```

## 🔄 Atualizações

### Atualizar aplicação
```bash
# Baixar atualizações
git pull origin main

# Rebuild e restart
docker-compose down
docker-compose up --build -d

# Ou usar o script
./deploy.sh
```

### Backup antes de atualizar
```bash
# Backup completo
docker-compose exec mongodb mongodump --out /data/backup/$(date +%Y%m%d)

# Backup dos volumes
docker run --rm -v gestao_projetos_mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb-backup-$(date +%Y%m%d).tar.gz /data
```

## 🆘 Troubleshooting

### Problemas comuns

1. **Container não inicia**
   ```bash
   docker-compose logs nome-do-container
   ```

2. **Erro de conexão com banco**
   ```bash
   # Verificar se MongoDB está rodando
   docker-compose ps mongodb
   
   # Verificar logs do MongoDB
   docker-compose logs mongodb
   ```

3. **Frontend não carrega**
   ```bash
   # Verificar build do React
   docker-compose logs frontend
   
   # Rebuild do frontend
   docker-compose up --build frontend
   ```

4. **Erro de permissão**
   ```bash
   # Ajustar permissões
   sudo chown -R $USER:$USER .
   ```

### Comandos de emergência
```bash
# Parar tudo e limpar
docker-compose down --volumes --remove-orphans
docker system prune -a

# Restart completo
docker-compose down
docker-compose up --build -d
```

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs: `docker-compose logs`
2. Consulte a documentação do Docker
3. Verifique as issues no repositório

---

**⚠️ Importante:** Sempre faça backup dos dados antes de atualizações em produção!