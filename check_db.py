import sqlite3
conn = sqlite3.connect('digifortlabs.db')
cur = conn.cursor()
cur.execute('PRAGMA table_info(hospitals);')
cols = cur.fetchall()
for c in cols:
    print(c[1])
