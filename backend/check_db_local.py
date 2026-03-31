import psycopg2
try:
    conn = psycopg2.connect("postgresql://digifort_admin:Digif0rtlab$@127.0.0.1:5433/digifort_db")
    cur = conn.cursor()
    cur.execute("SELECT file_id, filename, s3_key, storage_path, upload_status, processing_stage FROM pdf_files ORDER BY file_id DESC LIMIT 5;")
    rows = cur.fetchall()
    for r in rows:
        print(r)
except Exception as e:
    print(f"Error connecting: {e}")
