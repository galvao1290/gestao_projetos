#!/bin/bash

# Script de backup automático para MongoDB
# Este script pode ser executado via cron ou Docker

set -e  # Parar em caso de erro

# Configurações
BACKUP_DIR="/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="gestao_projetos_backup_${DATE}"
RETENTION_DAYS=7  # Manter backups por 7 dias

# Cores para log
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

# Função principal de backup
perform_backup() {
    log_info "Iniciando backup do MongoDB..."
    
    # Criar diretório de backup se não existir
    mkdir -p "${BACKUP_DIR}"
    
    # Realizar backup
    log_info "Criando backup: ${BACKUP_NAME}"
    
    if mongodump \
        --host mongodb:27017 \
        --username admin \
        --password "${MONGO_ROOT_PASSWORD}" \
        --authenticationDatabase admin \
        --db gestao_projetos \
        --out "${BACKUP_DIR}/${BACKUP_NAME}"; then
        
        log_success "Backup criado com sucesso!"
        
        # Comprimir backup
        log_info "Comprimindo backup..."
        cd "${BACKUP_DIR}"
        tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
        rm -rf "${BACKUP_NAME}"
        
        log_success "Backup comprimido: ${BACKUP_NAME}.tar.gz"
        
        # Verificar tamanho do backup
        BACKUP_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
        log_info "Tamanho do backup: ${BACKUP_SIZE}"
        
    else
        log_error "Falha ao criar backup!"
        exit 1
    fi
}

# Função para limpar backups antigos
cleanup_old_backups() {
    log_info "Limpando backups antigos (mais de ${RETENTION_DAYS} dias)..."
    
    if find "${BACKUP_DIR}" -name "gestao_projetos_backup_*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete; then
        log_success "Backups antigos removidos"
    else
        log_warning "Nenhum backup antigo encontrado ou erro na limpeza"
    fi
}

# Função para listar backups existentes
list_backups() {
    log_info "Backups existentes:"
    ls -lh "${BACKUP_DIR}"/gestao_projetos_backup_*.tar.gz 2>/dev/null || log_warning "Nenhum backup encontrado"
}

# Função para restaurar backup
restore_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        log_error "Nome do arquivo de backup não fornecido"
        log_info "Uso: $0 restore <nome_do_arquivo.tar.gz>"
        exit 1
    fi
    
    if [ ! -f "${BACKUP_DIR}/${backup_file}" ]; then
        log_error "Arquivo de backup não encontrado: ${backup_file}"
        exit 1
    fi
    
    log_warning "ATENÇÃO: Esta operação irá substituir os dados existentes!"
    read -p "Deseja continuar? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Operação cancelada"
        exit 0
    fi
    
    log_info "Restaurando backup: ${backup_file}"
    
    # Extrair backup
    cd "${BACKUP_DIR}"
    tar -xzf "${backup_file}"
    
    # Obter nome da pasta extraída
    EXTRACTED_DIR=$(tar -tzf "${backup_file}" | head -1 | cut -f1 -d"/")
    
    # Restaurar dados
    if mongorestore \
        --host mongodb:27017 \
        --username admin \
        --password "${MONGO_ROOT_PASSWORD}" \
        --authenticationDatabase admin \
        --db gestao_projetos \
        --drop \
        "${EXTRACTED_DIR}/gestao_projetos"; then
        
        log_success "Backup restaurado com sucesso!"
        rm -rf "${EXTRACTED_DIR}"
    else
        log_error "Falha ao restaurar backup!"
        rm -rf "${EXTRACTED_DIR}"
        exit 1
    fi
}

# Função para verificar saúde do banco
health_check() {
    log_info "Verificando conectividade com MongoDB..."
    
    if mongosh \
        --host mongodb:27017 \
        --username admin \
        --password "${MONGO_ROOT_PASSWORD}" \
        --authenticationDatabase admin \
        --eval "db.adminCommand('ping')" \
        --quiet; then
        
        log_success "MongoDB está acessível"
        
        # Verificar estatísticas do banco
        log_info "Estatísticas do banco:"
        mongosh \
            --host mongodb:27017 \
            --username admin \
            --password "${MONGO_ROOT_PASSWORD}" \
            --authenticationDatabase admin \
            gestao_projetos \
            --eval "db.stats()" \
            --quiet
    else
        log_error "Não foi possível conectar ao MongoDB"
        exit 1
    fi
}

# Menu principal
case "${1:-backup}" in
    "backup")
        perform_backup
        cleanup_old_backups
        list_backups
        ;;
    "restore")
        restore_backup "$2"
        ;;
    "list")
        list_backups
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "health")
        health_check
        ;;
    "help")
        echo "Uso: $0 [comando] [argumentos]"
        echo ""
        echo "Comandos disponíveis:"
        echo "  backup          - Criar backup do banco (padrão)"
        echo "  restore <file>  - Restaurar backup específico"
        echo "  list            - Listar backups existentes"
        echo "  cleanup         - Remover backups antigos"
        echo "  health          - Verificar saúde do banco"
        echo "  help            - Mostrar esta ajuda"
        echo ""
        echo "Exemplos:"
        echo "  $0 backup"
        echo "  $0 restore gestao_projetos_backup_20231201_120000.tar.gz"
        echo "  $0 list"
        ;;
    *)
        log_error "Comando inválido: $1"
        log_info "Use '$0 help' para ver os comandos disponíveis"
        exit 1
        ;;
esac

log_success "Operação concluída!"