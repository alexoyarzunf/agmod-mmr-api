docker-dev-build:
	docker compose -f docker-compose.dev.yml build --no-cache

docker-dev-run:
	docker compose -f docker-compose.dev.yml up api mariadb

docker-dev-run-bg:
	docker compose -f docker-compose.dev.yml up -d api mariadb

docker-dev-stop:
	docker compose -f docker-compose.dev.yml down

docker-dev-logs:
	docker compose -f docker-compose.dev.yml logs

docker-prod-build:
	docker compose -f docker-compose.prod.yml build --no-cache

docker-prod-run:
	docker compose -f docker-compose.prod.yml up api mariadb

docker-prod-run-bg:
	docker compose -f docker-compose.prod.yml up -d api mariadb

docker-prod-stop:
	docker compose -f docker-compose.prod.yml down

docker-prod-logs:
	docker compose -f docker-compose.dev.yml logs

docker-run-migrations:
	docker exec -it -w /usr/src/app agmod-mmr-api-api-1 yarn migration:run
