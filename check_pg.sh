#!/bin/bash
PGPASSWORD="Digif0rtlab$" psql -U digifort_admin -d digifort_db -h localhost -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'hospitals';"
