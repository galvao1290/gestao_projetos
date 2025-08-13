#!/bin/bash

# Script de configuração automática para VPS
# Execute este script na sua VPS Ubuntu/Debian

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_info "🚀 Iniciando configuração da VPS para deploy da aplicação..."

# Verificar se é root
if [ "$EUID" -eq 0 ]; then
    log_error "Não execute este script como root. Use um usuário normal com sudo."
    exit 1
fi

# Atualizar sistema
log_info "📦 Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
log_info "🔧 Instalando dependências básicas..."
sudo apt install -y curl wget git nano htop ufw

# Verificar se Docker já está instalado
if command -v docker &> /dev/null; then
    log_warning "Docker já está instalado"
else
    log_info "🐳 Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    log_success "Docker instalado com sucesso"
fi

# Verificar se Docker Compose já está instalado
if command -v docker-compose &> /dev/null; then
    log_warning "Docker Compose já está instalado"
else
    log_info "🔨 Instalando Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    log_success "Docker Compose instalado com sucesso"
fi

# Configurar firewall
log_info "🔥 Configurando firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp  # API backend
log_success "Firewall configurado"

# Criar diretório para a aplicação
APP_DIR="$HOME/gestao-projetos"
log_info "📁 Criando diretório da aplicação: $APP_DIR"
mkdir -p "$APP_DIR"

# Obter IP público da VPS
PUBLIC_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "ERRO_AO_OBTER_IP")
log_info "🌐 IP público da VPS: $PUBLIC_IP"

# Criar arquivo .env básico
log_info "⚙️ Criando arquivo .env básico..."
cat > "$APP_DIR/.env" << EOF
# === CONFIGURAÇÕES BÁSICAS ===
NODE_ENV=production
PORT=5000

# === BANCO DE DADOS ===
MONGODB_URI=mongodb://app_user:senha_app_123@mongodb:27017/gestao_projetos?authSource=gestao_projetos
MONGO_ROOT_PASSWORD=senha_super_segura_$(date +%s)
MONGO_APP_PASSWORD=senha_app_123

# === SEGURANÇA ===
JWT_SECRET=jwt_secret_$(openssl rand -hex 32)

# === CORS E FRONTEND ===
# SUBSTITUA $PUBLIC_IP pelo seu domínio se tiver
CORS_ORIGIN=http://$PUBLIC_IP
REACT_APP_API_URL=http://$PUBLIC_IP:5000

# === DOMÍNIO (descomente se tiver domínio) ===
# DOMAIN=seudominio.com
# SSL_EMAIL=seu@email.com
EOF

log_success "Arquivo .env criado em $APP_DIR/.env"

# Criar script de deploy rápido
log_info "📝 Criando script de deploy rápido..."
cat > "$APP_DIR/quick-deploy.sh" << 'EOF'
#!/bin/bash

set -e

echo "🚀 Iniciando deploy..."

# Parar containers existentes
echo "⏹️ Parando containers existentes..."
docker-compose down 2>/dev/null || true

# Fazer backup se existir banco
if docker volume ls | grep -q gestao_projetos_mongodb_data; then
    echo "💾 Fazendo backup do banco..."
    docker run --rm -v gestao_projetos_mongodb_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/backup-$(date +%Y%m%d_%H%M%S).tar.gz /data
fi

# Build e start
echo "🔨 Construindo e iniciando containers..."
docker-compose up --build -d

# Aguardar containers iniciarem
echo "⏳ Aguardando containers iniciarem..."
sleep 30

# Verificar status
echo "📊 Status dos containers:"
docker-compose ps

# Testar conectividade
echo "🔍 Testando conectividade..."
if curl -f http://localhost/health >/dev/null 2>&1; then
    echo "✅ Frontend OK"
else
    echo "❌ Frontend com problemas"
fi

if curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
    echo "✅ Backend OK"
else
    echo "❌ Backend com problemas"
fi

echo "🎉 Deploy concluído!"
echo "📱 Acesse: http://$(curl -s ifconfig.me)"
echo "🔑 Login: smartseg / smartseg123"
EOF

chmod +x "$APP_DIR/quick-deploy.sh"

# Criar diretório de backups
mkdir -p "$APP_DIR/backups"

# Mostrar informações finais
log_success "🎉 Configuração da VPS concluída!"
echo ""
log_info "📋 Próximos passos:"
echo "1. Faça upload do código da aplicação para: $APP_DIR"
echo "2. Edite o arquivo .env se necessário: nano $APP_DIR/.env"
echo "3. Execute o deploy: cd $APP_DIR && ./quick-deploy.sh"
echo ""
log_info "🌐 Sua aplicação ficará disponível em: http://$PUBLIC_IP"
log_info "🔑 Login padrão: smartseg / smartseg123"
echo ""
log_warning "⚠️ IMPORTANTE: Reinicie a sessão SSH para aplicar as permissões do Docker!"
log_warning "⚠️ Execute: exit e conecte novamente"
echo ""
log_info "📖 Para mais informações, consulte DEPLOY-VPS-GUIDE.md"