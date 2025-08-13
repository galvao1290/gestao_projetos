# 🚀 Deploy VPS - Passo a Passo Simples

## 1. Preparar VPS (Ubuntu/Debian)
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Configurar firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000

# Reiniciar sessão SSH
exit
```

## 2. Upload do Código
```bash
# Via Git
git clone https://github.com/seu-usuario/seu-repo.git
cd seu-repo

# Ou via SCP do Windows
scp -r "C:\caminho\do\projeto" usuario@ip-vps:/home/usuario/
```

## 3. Configurar .env
```bash
cp .env.example .env
nano .env
```

**Editar estas linhas no .env:**
```env
CORS_ORIGIN=http://SEU_IP_VPS
REACT_APP_API_URL=http://SEU_IP_VPS:5000
MONGO_ROOT_PASSWORD=senha123
JWT_SECRET=jwt_secret_longo_aqui
```

## 4. Deploy
```bash
chmod +x deploy.sh
./deploy.sh
```

**OU manualmente:**
```bash
docker-compose up --build -d
```

## 5. Verificar
```bash
docker-compose ps
curl http://localhost/health
```

## 6. Acessar
- **App:** `http://SEU_IP_VPS`
- **Login:** smartseg / smartseg123

---

## Comandos Úteis
```bash
# Ver logs
docker-compose logs

# Parar
docker-compose down

# Atualizar
git pull && docker-compose up --build -d

# Backup
docker-compose exec mongodb mongodump --out /data/backup
```

## Problemas?
```bash
# Reset completo
docker-compose down --volumes
docker system prune -a
docker-compose up --build -d
```

**Pronto! 🎉**