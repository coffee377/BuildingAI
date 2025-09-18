sed:
	sed -i '.bak' 's/public\./fastbuildai\./g' fb_tables_backup.sql;

in:
	psql -h 10.1.150.105 -p 7000 -U langchain \
			-d postgres \
			-c "CREATE SCHEMA IF NOT EXISTS fastbuildai;SET search_path TO fastbuildai" \
			-f fb_tables_backup.sql

out:
	# 导出源数据库中所有以 fb_ 开头的表（包含表结构和数据）
	pg_dump -h 10.1.150.105 -p 32769 -U postgres \
			-d fastbuildai \
			-n public \
			-t 'fb_*' -v \
			--no-owner --no-privileges -a \
			-f fb_tables_backup.sql
	