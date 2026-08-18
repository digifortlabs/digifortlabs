import sqlite3
conn = sqlite3.connect('digifortlabs.db')
cur = conn.cursor()
cur.execute("SELECT email, role, is_active, is_deleted FROM users WHERE email='admin@digifortlabs.com'")
print(cur.fetchall())
