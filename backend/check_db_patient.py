import psycopg2
try:
    conn = psycopg2.connect("postgresql://digifort_admin:Digif0rtlab$@127.0.0.1:5432/digifort_db")
    cur = conn.cursor()
    # Find patient
    cur.execute("SELECT record_id FROM patients WHERE patient_u_id='D77751';")
    patient_row = cur.fetchone()
    if patient_row:
        pid = patient_row[0]
        print(f"Found record_id: {pid}")
        cur.execute(f"SELECT file_id, filename, s3_key, storage_path, upload_status, processing_stage FROM pdf_files WHERE record_id={pid} ORDER BY file_id DESC;")
        for r in cur.fetchall(): print(r)
    else:
        print("Patient D77751 not found")
except Exception as e:
    print(e)
