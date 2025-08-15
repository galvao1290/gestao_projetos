# Deploy com Docker

## Pré-requisitos
- Docker
- Docker Compose

## Como usar na VPS

### 1. Clonar o projeto
```bash
git clone <seu-repositorio>
cd gestao-de-projetos
```

### 2. Executar com Docker
```bash
# Iniciar todos os serviços
docker-compose up -d --build

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs

# Parar serviços
docker-compose down
```

### 3. Acessar a aplicação
- Frontend: http://191.252.182.20 (porta 80)
- Backend API: http://191.252.182.20:5000
- MongoDB: 191.252.182.20:27017

## Estrutura dos Serviços

- **MongoDB**: Banco de dados (porta 27017)
- **Backend**: API Node.js (porta 5000)
- **Frontend**: React com Nginx (porta 80)

## Comandos Úteis

```bash
# Rebuild apenas um serviço
docker-compose up -d --build frontend

# Ver logs de um serviço específico
docker-compose logs backend

# Entrar no container
docker exec -it gestao-projetos-backend sh

# Limpar tudo
docker-compose down -v
docker system prune -a
```

## Configuração para Produção

1. Altere o `JWT_SECRET` no docker-compose.yml
2. Configure um domínio no nginx.conf se necessário
3. Use HTTPS em produção

## Troubleshooting

- Se o frontend não carregar, verifique os logs: `docker-compose logs frontend`
- Se o backend não conectar ao MongoDB, verifique se o serviço mongodb está rodando
- Para problemas de permissão, use `sudo` nos comandos docker