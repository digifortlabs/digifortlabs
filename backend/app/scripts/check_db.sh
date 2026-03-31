#!/bin/bash
sudo -u postgres psql -d digifort_db -c "SELECT file_id, filename, s3_key, storage_path, upload_status, processing_stage FROM pdf_files ORDER BY file_id DESC LIMIT 5;"
