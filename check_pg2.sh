#!/bin/bash
PGPASSWORD="Digif0rtlab$" psql -U digifort_admin -d digifort_db -h localhost -c "SELECT hospital_slug, legal_name, email FROM hospitals LIMIT 10;"
