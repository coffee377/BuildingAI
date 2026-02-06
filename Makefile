OLD_PORT ?= 4090
NEW_PORT ?= 5090
ENV_FILE ?= .env
BACKUP_FILE ?= $(ENV_FILE).bak

init:
	pnpm predeploy
	pnpm build:web
	
start:
	pnpm start
	
stop:
	pnpm stop
	
status:
	pnpm pm2:status
	
delete:
	pnpm delete
	
env: backup-env
	@cp .env.development .env

# 备份.env文件的子目标
.PHONY: backup-env
backup-env:
	@if [ -f $(ENV_FILE) ]; then \
		cp -f $(ENV_FILE) $(BACKUP_FILE); \
		echo "Backup: $(ENV_FILE) -> $(BACKUP_FILE)"; \
	else \
		echo "Error: $(ENV_FILE) file not found!"; \
		exit 1; \
	fi