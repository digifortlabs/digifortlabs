#!/bin/bash
PGPASSWORD="Digif0rtlab$" psql -U digifort_admin -d digifort_db -h localhost -c "\dt"
