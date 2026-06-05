import sys
import os
import urllib.parse
import time
import logging
import requests
import subprocess
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

APP_VERSION = "1.0"
UPDATE_URL = "https://digifortlabs.com/downloads/wa_sender/version.json"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

def check_updates():
    try:
        logging.info(f"Checking for updates... Current version: {APP_VERSION}")
        resp = requests.get(UPDATE_URL, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            remote_version = data.get("version", "1.0")
            download_url = data.get("download_url", "")
            
            if remote_version > APP_VERSION and download_url:
                logging.info(f"New version {remote_version} found! Downloading...")
                
                # Download the new installer
                installer_path = os.path.join(os.getenv('TEMP'), 'DigifortWA_Setup.exe')
                installer_data = requests.get(download_url)
                
                with open(installer_path, 'wb') as f:
                    f.write(installer_data.content)
                    
                logging.info("Update downloaded. Launching installer...")
                # Launch installer silently and exit current process
                subprocess.Popen([installer_path, "/SILENT", "/SUPPRESSMSGBOXES", "/SP-"])
                sys.exit(0)
    except Exception as e:
        logging.error(f"Update check failed: {e}")


def parse_args(args):
    params = {}
    if len(args) > 1:
        try:
            uri = args[1].replace("digifort-wa://", "http://d/")
            qs = urllib.parse.parse_qs(urllib.parse.urlparse(uri).query)
            params = {k: v[0] for k, v in qs.items()}
        except Exception as e:
            logging.error(f"Failed to parse URI: {e}")
    return params

def send_whatsapp(phone, text):
    logging.info(f"Preparing to send message to {phone}")
    
    # Chrome Profile Directory to persist login (No need to scan QR every time)
    user_data_dir = os.path.join(os.getenv('LOCALAPPDATA'), 'DigifortWASender', 'ChromeProfile')
    os.makedirs(user_data_dir, exist_ok=True)

    options = Options()
    options.add_argument(f"user-data-dir={user_data_dir}")
    # Hide automation bar
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    
    # Optional: Run minimized or headless if you want it completely invisible
    # options.add_argument("--headless=new")
    
    logging.info("Starting Chrome...")
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        
        # Load WhatsApp Web
        encoded_text = urllib.parse.quote(text)
        url = f"https://web.whatsapp.com/send?phone={phone}&text={encoded_text}"
        driver.get(url)
        
        logging.info("Waiting for WhatsApp Web to load...")
        logging.info("If this is your first time, you may need to scan the QR code.")
        
        # Wait up to 120 seconds for login/load
        wait = WebDriverWait(driver, 120) 
        
        # We wait for the send button icon to appear
        send_btn_xpath = '//span[@data-icon="send"]'
        send_btn = wait.until(EC.element_to_be_clickable((By.XPATH, send_btn_xpath)))
        
        logging.info("Clicking Send...")
        send_btn.click()
        
        # Wait a moment for the message to actually go through
        time.sleep(3)
        
        logging.info("Message sent successfully.")
        driver.quit()
        
    except Exception as e:
        logging.error(f"Error during sending: {e}")
        try:
            driver.quit()
        except:
            pass

if __name__ == "__main__":
    check_updates()
    
    params = parse_args(sys.argv)
    phone = params.get('phone')
    text = params.get('text', '')
    
    if phone:
        send_whatsapp(phone, text)
    else:
        logging.error("No phone number provided.")
        input("Press Enter to exit...")
