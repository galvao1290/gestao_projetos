#!/bin/bash

# Script de deploy para VPS
# Este script automatiza o processo de deploy da aplicação

set -e  # Parar execução em caso de erro

echo "🚀 Iniciando processo de deploy..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    log_error "Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Verificar se arquivo .env existe
if [ ! -f .env ]; then
    log_warning "Arquivo .env não encontrado. Copiando .env.example..."
    cp .env.example .env
    log_warning "Por favor, edite o arquivo .env com suas configurações antes de continuar."
    read -p "Pressione Enter para continuar após editar o .env..."
fi

# Parar containers existentes
log_info "Parando containers existentes..."
docker-compose down --remove-orphans

# Remover imagens antigas (opcional)
read -p "Deseja remover imagens antigas para rebuild completo? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Removendo imagens antigas..."
    docker-compose down --rmi all --volumes --remove-orphans
fi

# Build e start dos containers
log_info "Construindo e iniciando containers..."
docker-compose up --build -d

# Aguardar containers ficarem prontos
log_info "Aguardando containers ficarem prontos..."
sleep 30

# Verificar status dos containers
log_info "Verificando status dos containers..."
docker-compose ps

# Verificar logs do backend
log_info "Verificando logs do backend..."
docker-compose logs --tail=20 backend

# Verificar se aplicação está respondendo
log_info "Testando conectividade..."
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    log_success "Backend está respondendo!"
else
    log_warning "Backend pode não estar respondendo ainda. Verifique os logs."
fi

if curl -f http://localhost > /dev/null 2>&1; then
    log_success "Frontend está respondendo!"
else
    log_warning "Frontend pode não estar respondendo ainda. Verifique os logs."
fi

# Mostrar informações finais
echo
log_success "Deploy concluído!"
echo
log_info "Aplicação disponível em:"
echo "  Frontend: http://localhost (porta 80)"
echo "  Backend API: http://localhost:5000"
echo "  MongoDB: localhost:27017"
echo
log_info "Para monitorar logs:"
echo "  docker-compose logs -f"
echo
log_info "Para parar a aplicação:"
echo "  docker-compose down"
echo
log_info "Para atualizar a aplicação:"
echo "  git pull && ./deploy.sh"
echo