#!/bin/bash

# Script para gerar certificados SSL auto-assinados para desenvolvimento
# Para produção, use Let's Encrypt

echo "🔐 Gerando certificados SSL auto-assinados..."

# Criar diretório para SSL se não existir
mkdir -p nginx/ssl

# Gerar chave privada
openssl genrsa -out nginx/ssl/key.pem 2048

# Gerar certificado auto-assinado
openssl req -new -x509 -key nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -subj "/C=BR/ST=Estado/L=Cidade/O=Empresa/OU=TI/CN=localhost"

# Definir permissões corretas
chmod 600 nginx/ssl/key.pem
chmod 644 nginx/ssl/cert.pem

echo "✅ Certificados SSL gerados com sucesso!"
echo "📁 Arquivos criados:"
echo "   - nginx/ssl/cert.pem (certificado)"
echo "   - nginx/ssl/key.pem (chave privada)"
echo ""
echo "⚠️  ATENÇÃO: Estes são certificados auto-assinados para desenvolvimento."
echo "   Para produção, use Let's Encrypt ou certificados válidos."
echo ""
echo "🚀 Para usar com HTTPS, execute:"
echo "   docker-compose --profile production up -d"
echo ""
echo "📖 Para Let's Encrypt em produção, consulte o README-DOCKER.md"