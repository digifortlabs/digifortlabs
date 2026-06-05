import sys
import os
import urllib.parse
import time
import logging
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

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
    params = parse_args(sys.argv)
    phone = params.get('phone')
    text = params.get('text', '')
    
    if phone:
        send_whatsapp(phone, text)
    else:
        logging.error("No phone number provided.")
        input("Press Enter to exit...")
