import os
import psycopg2

def restore_db(file_path, dsn):
    print(f"Connecting to DB using {dsn}...")
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    cursor = conn.cursor()
    
    print(f"Reading {file_path}...")
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        sql = "".join([line for line in lines if not (
            line.startswith('\\connect') or 
            line.startswith('\\restrict') or 
            line.startswith('\\unrestrict') or 
            line.startswith('\\set')
        )])
        sql = sql.replace('keval', 'digifort_admin')
    
    print("Dropping public schema...")
    try:
        cursor.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public; GRANT ALL ON SCHEMA public TO digifort_admin;")
    except Exception as e:
        print(f"Error dropping schema: {e}")

    print("Executing SQL dump...")
    try:
        cursor.execute(sql)
        print("Database restored successfully!")
    except Exception as e:
        print(f"Error restoring database: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    dsn = "postgresql://digifort_admin:Digif0rtlab$@localhost:5432/digifort_db"
    restore_db('digifort_backup_prod_inserts.sql', dsn)
