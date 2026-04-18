import sqlite3
conn = sqlite3.connect('app.db')
cursor = conn.cursor()
cursor.execute("SELECT id FROM project_presentation WHERE id='fe138c52-3be3-44ad-a273-adb2eea889d3'")
print(cursor.fetchone())
conn.close()
