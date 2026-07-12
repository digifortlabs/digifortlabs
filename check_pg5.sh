#!/bin/bash
PGPASSWORD="Digif0rtlab$" psql -U digifort_admin -d digifort_db -h localhost -c "\x" -c "SELECT * FROM hospitals LIMIT 1;"
