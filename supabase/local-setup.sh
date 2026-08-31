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
    local services=("supabase_db" "supabase_rest" "supabase_auth" "supabase_envoy" "supabase_redis")
    
    for service in "${services[@]}"; do
        if docker ps | grep -q "$service"; then
            local health=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "$service" 2>/dev/null)
            if [ "$health" = "healthy" ] || [ "$health" = "no-healthcheck" ]; then
                echo -e "${GREEN}✓ $service is running${NC}"
            else
                echo -e "${YELLOW}⚠ $service is $health${NC}"
            fi
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
            if ! docker exec -i supabase_db psql -U postgres -d "${POSTGRES_DB}" -f "/dev/stdin" < "$migration_file"; then
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

# Apply seed data
seed() {
    echo -e "${YELLOW}Applying seed data...${NC}"
    
    if [ ! -f "$SCRIPT_DIR/seed.sql" ]; then
        echo -e "${RED}Error: seed.sql not found${NC}"
        return 1
    fi
    
    if ! docker exec -i supabase_db psql -U postgres -d "${POSTGRES_DB}" -f "/dev/stdin" < "$SCRIPT_DIR/seed.sql"; then
        echo -e "${RED}Failed to apply seed data${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Seed data applied successfully${NC}"
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
    docker exec -it supabase_db psql -U postgres -d "${POSTGRES_DB}" "$@"
}

# Show environment info
info() {
    echo -e "${GREEN}Local Supabase Configuration${NC}"
    echo "================================"
    echo "Gateway URL: http://localhost:8000 (main API endpoint)"
    echo "  Auth API: http://localhost:8000/auth/v1/*"
    echo "  REST API: http://localhost:8000/rest/v1/*"
    echo ""
    echo "Direct Service Access (internal):"
    echo "  GoTrue (auth): http://localhost:9999"
    echo "  PostgREST: http://localhost:3000 (not exposed)"
    echo "  Postgres: localhost:5432 (postgres/postgres)"
    echo "  Redis: localhost:6379"
    echo ""
    echo "Next.js Configuration:"
    echo "  NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000"
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
    seed)
        check_docker
        seed
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|migrate|seed|reset|logs|psql|info}"
        echo ""
        echo "Commands:"
        echo "  start     - Start all Supabase services"
        echo "  stop      - Stop all Supabase services"
        echo "  restart   - Restart all services"
        echo "  status    - Check service health"
        echo "  migrate   - Apply pending migrations"
        echo "  seed      - Apply seed data from supabase/seed.sql"
        echo "  reset     - Reset database (WARNING: deletes all data)"
        echo "  logs      - Show service logs (add service name for specific logs)"
        echo "  psql      - Connect to PostgreSQL CLI"
        echo "  info      - Show configuration info"
        exit 1
        ;;
esac
