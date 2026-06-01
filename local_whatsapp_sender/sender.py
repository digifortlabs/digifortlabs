import os
import time
import random
import requests
from playwright.sync_api import sync_playwright

# Configuration
# Change this to your actual production domain, e.g., "https://www.digifortlabs.com/api"
API_BASE_URL = "http://localhost:8000"
POLL_INTERVAL_SECONDS = 10  # How often to check for new messages when idle
MIN_SEND_DELAY = 15 # Minimum seconds to wait between sending messages
MAX_SEND_DELAY = 45 # Maximum seconds to wait between sending messages

def mark_message_status(message_id, status, error_msg=None):
    try:
        requests.put(f"{API_BASE_URL}/whatsapp/queue/{message_id}/status", json={
            "status": status,
            "error_message": error_msg
        })
    except Exception as e:
        print(f"Failed to update message status for ID {message_id}: {e}")

def main():
    print("Starting Local WhatsApp Automation Desktop App...")
    
    with sync_playwright() as p:
        # We launch chromium in non-headless mode so the user can scan the QR code
        # We store the user data dir so the login session is saved across restarts.
        user_data_dir = os.path.join(os.getcwd(), "whatsapp_session")
        browser_context = p.chromium.launch_persistent_context(
            user_data_dir,
            headless=False,
            viewport={'width': 1024, 'height': 768}
        )
        
        page = browser_context.pages[0]
        print("Navigating to WhatsApp Web. Please scan the QR code if you haven't already.")
        page.goto("https://web.whatsapp.com/")
        
        # Wait for the user to scan the QR code and the main chat list to load
        print("Waiting for WhatsApp Web to load completely...")
        page.wait_for_selector('div[data-testid="chat-list"]', timeout=120000) # Wait up to 2 minutes for QR scan
        print("Successfully logged into WhatsApp!")

        while True:
            try:
                # 1. Poll the API for pending messages
                response = requests.get(f"{API_BASE_URL}/whatsapp/queue/pending")
                if response.status_code == 200:
                    pending_messages = response.json()
                    
                    if not pending_messages:
                        # No messages, sleep and poll again later
                        time.sleep(POLL_INTERVAL_SECONDS)
                        continue
                        
                    print(f"Found {len(pending_messages)} pending message(s).")
                    
                    for msg in pending_messages:
                        msg_id = msg['id']
                        phone = msg['phone_number']
                        text = msg['message_text']
                        
                        print(f"[{time.strftime('%H:%M:%S')}] Processing message {msg_id} to {phone}...")
                        
                        try:
                            # 2. Navigate to the send URL
                            # We use encodeURIComponent equivalent logic which is done by requests or just plain string formatting
                            import urllib.parse
                            encoded_text = urllib.parse.quote(text)
                            send_url = f"https://web.whatsapp.com/send?phone={phone}&text={encoded_text}"
                            
                            page.goto(send_url)
                            
                            # 3. Wait for the Send button to appear.
                            # WhatsApp Web DOM changes frequently. The send button is usually an SVG or a button with specific aria-label.
                            # Currently, the send button often has data-testid="send" or aria-label="Send"
                            print("Waiting for chat to load and send button to appear...")
                            
                            # Sometimes it says "Phone number shared via url is invalid."
                            # We should check for both the send button and an invalid popup.
                            
                            try:
                                send_button_selector = 'button[aria-label="Send"]'
                                page.wait_for_selector(send_button_selector, timeout=30000)
                                page.click(send_button_selector)
                                
                                # Wait a moment to ensure it actually sends
                                time.sleep(3)
                                
                                # Mark as sent
                                mark_message_status(msg_id, "sent")
                                print(f"Successfully sent message {msg_id} to {phone}.")
                                
                            except Exception as wait_err:
                                # Check if it's an invalid number dialog
                                if page.locator('text="Phone number shared via url is invalid."').is_visible():
                                    print(f"Invalid phone number: {phone}")
                                    mark_message_status(msg_id, "failed", "Invalid phone number on WhatsApp")
                                else:
                                    print(f"Timeout waiting for Send button. WhatsApp Web might have updated its layout.")
                                    mark_message_status(msg_id, "failed", "Timeout finding Send button. Script may need update.")
                        
                        except Exception as process_err:
                            print(f"Error processing message {msg_id}: {process_err}")
                            mark_message_status(msg_id, "failed", str(process_err))
                            
                        # 4. Wait random interval to prevent bans
                        delay = random.randint(MIN_SEND_DELAY, MAX_SEND_DELAY)
                        print(f"Sleeping for {delay} seconds to mimic human behavior...")
                        time.sleep(delay)
                        
                else:
                    print(f"Error polling API: HTTP {response.status_code}")
                    time.sleep(POLL_INTERVAL_SECONDS)
                    
            except Exception as loop_err:
                print(f"Loop error: {loop_err}")
                time.sleep(POLL_INTERVAL_SECONDS)

if __name__ == "__main__":
    main()
