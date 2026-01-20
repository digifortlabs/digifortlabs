import os

def fix_cors():
    env_path = os.path.join("backend", ".env")
    if not os.path.exists(env_path):
        print("❌ Error: backend/.env file not found!")
        return

    # Read existing lines
    with open(env_path, "r") as f:
        lines = f.readlines()

    # Prepare new CORS line
    new_cors = 'BACKEND_CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000","https://digifortlabs.com","https://www.digifortlabs.com","http://digifortlabs.com"]\n'
    
    # Check if CORS key exists
    updated_lines = []
    found = False
    for line in lines:
        if line.startswith("BACKEND_CORS_ORIGINS="):
            updated_lines.append(new_cors) # Replace it
            found = True
        else:
            updated_lines.append(line)
    
    if not found:
        updated_lines.append("\n" + new_cors)
    
    # Write back
    with open(env_path, "w") as f:
        f.writelines(updated_lines)
    
    print("✅ CORS Configuration Updated Successfully!")
    print("   Please restart your backend (./deploy_prod.sh) to apply changes.")

if __name__ == "__main__":
    fix_cors()
