#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Load environment
if [ -f "$SCRIPT_DIR/.env.docker" ]; then
    export $(cat "$SCRIPT_DIR/.env.docker" | grep -v '^#' | xargs)
fi

# Check prerequisites
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        exit 1
    fi
}

check_docker_compose() {
    if ! docker compose version &> /dev/null; then
        echo -e "${RED}Error: Docker Compose is not installed${NC}"
        exit 1
    fi
}

# Start services
start() {
    echo -e "${YELLOW}Starting Supabase services...${NC}"
    cd "$SCRIPT_DIR"
    docker compose --env-file .env.docker up -d
    echo -e "${GREEN}Services started${NC}"
    
    # Wait for services to be healthy
    echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
    sleep 5
    check_health
}

# Stop services
stop() {
    echo -e "${YELLOW}Stopping Supabase services...${NC}"
    cd "$SCRIPT_DIR"
    docker compose --env-file .env.docker down
    echo -e "${GREEN}Services stopped${NC}"
}

# Check health of all services
check_health() {
    echo -e "${YELLOW}Checking service health...${NC}"
    local services=("postgres" "supabase_rest" "supabase_auth" "supabase_realtime" "supabase_storage" "supabase_meta" "redis")
    
    for service in "${services[@]}"; do
        if docker ps | grep -q "$service"; then
            echo -e "${GREEN}✓ $service is running${NC}"
        else
            echo -e "${RED}✗ $service is not running${NC}"
        fi
    done
}

# Apply migrations
migrate() {
    echo -e "${YELLOW}Applying migrations...${NC}"
    
    # Find all migration files and execute them
    local failed=0
    for migration_file in "$SCRIPT_DIR/migrations"/*.sql; do
        if [ -f "$migration_file" ]; then
            echo -e "${YELLOW}Applying: $(basename "$migration_file")${NC}"
            if ! docker exec supabase_postgres psql -U postgres -d "${POSTGRES_DB}" -f "/dev/stdin" < "$migration_file"; then
                echo -e "${RED}Failed to apply $(basename "$migration_file")${NC}"
                failed=1
            fi
        fi
    done
    
    if [ $failed -eq 1 ]; then
        echo -e "${RED}Migrations failed - database schema may be incomplete${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Migrations applied successfully${NC}"
}

# Reset database
reset() {
    echo -e "${YELLOW}Resetting database (this will drop all data)...${NC}"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Cancelled"
        return
    fi
    
    stop
    cd "$SCRIPT_DIR"
    docker compose --env-file .env.docker down -v
    start
    migrate
    echo -e "${GREEN}Database reset complete${NC}"
}

# Show logs
logs() {
    cd "$SCRIPT_DIR"
    docker compose --env-file .env.docker logs -f "$@"
}

# Exec into postgres
psql_exec() {
    docker exec -it supabase_postgres psql -U postgres -d "${POSTGRES_DB}" "$@"
}

# Show environment info
info() {
    echo -e "${GREEN}Local Supabase Configuration${NC}"
    echo "================================"
    echo "API URL: http://localhost:3001"
    echo "Auth URL: http://localhost:9999"
    echo "Realtime URL: ws://localhost:4000"
    echo "Storage URL: http://localhost:5000"
    echo "Postgres: localhost:5432 (postgres/postgres)"
    echo "Redis: localhost:6379"
    echo ""
    echo -e "${GREEN}Services Status:${NC}"
    check_health
}

# Main command dispatcher
case "${1:-help}" in
    start)
        check_docker
        check_docker_compose
        start
        ;;
    stop)
        check_docker_compose
        stop
        ;;
    restart)
        check_docker
        check_docker_compose
        stop
        start
        ;;
    status|health)
        check_health
        ;;
    migrate)
        check_docker
        migrate
        ;;
    reset)
        check_docker
        check_docker_compose
        reset
        ;;
    logs)
        check_docker_compose
        logs "${@:2}"
        ;;
    psql)
        check_docker
        psql_exec "${@:2}"
        ;;
    info)
        info
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|migrate|reset|logs|psql|info}"
        echo ""
        echo "Commands:"
        echo "  start     - Start all Supabase services"
        echo "  stop      - Stop all Supabase services"
        echo "  restart   - Restart all services"
        echo "  status    - Check service health"
        echo "  migrate   - Apply pending migrations"
        echo "  reset     - Reset database (WARNING: deletes all data)"
        echo "  logs      - Show service logs (add service name for specific logs)"
        echo "  psql      - Connect to PostgreSQL CLI"
        echo "  info      - Show configuration info"
        exit 1
        ;;
esac
