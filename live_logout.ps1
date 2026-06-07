scp -i d:\Website\DIGIFORTLABS\digifort-prod-key.pem -o StrictHostKeyChecking=no d:\Website\DIGIFORTLABS\backend\logout_whatsapp.py ec2-user@digifortlabs.com:~/logout_whatsapp.py
ssh -i d:\Website\DIGIFORTLABS\digifort-prod-key.pem -o StrictHostKeyChecking=no ec2-user@digifortlabs.com "python3 ~/logout_whatsapp.py"
