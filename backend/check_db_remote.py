import psycopg2
try:
    conn = psycopg2.connect("postgresql://digifort_admin:Digif0rtlab$@127.0.0.1:5432/digifort_db")
    cur = conn.cursor()
    cur.execute("SELECT file_id, filename, s3_key, storage_path, upload_status, processing_stage FROM pdf_files WHERE filename='scan_final_recovery.pdf' ORDER BY file_id DESC LIMIT 4;")
    for r in cur.fetchall(): print(r)
except Exception as e:
    print(e)
