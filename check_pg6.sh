#!/bin/bash
PGPASSWORD="Digif0rtlab$" psql -U digifort_admin -d digifort_db -h localhost -c "SELECT table_name, column_name FROM information_schema.columns WHERE column_name LIKE '%domain%' OR column_name LIKE '%custom%';"
