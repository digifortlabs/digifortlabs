# How to Get AWS Access Key ID & Secret Key

To allow the AWS CLI to talk to your account, you need to generate a "Key Pair".

1.  **Log in to AWS Console**: [https://console.aws.amazon.com/](https://console.aws.amazon.com/)
2.  **Go to IAM**: Search for **"IAM"** in the top search bar and click it.
3.  **Users**: Click **"Users"** in the left sidebar.
    *   *If you don't have a user yet:* Click **"Create user"**, name it `digifort-admin`, and click Next until it's created. (Give it "AdministratorAccess" permission for now to avoid issues).
    *   *If you have a user:* Click on your user name.
4.  **Security Credentials**: Click the **"Security credentials"** tab.
5.  **Create Access Key**: Scroll down to "Access keys" and click **"Create access key"**.
6.  **Use Case**: Select **"Command Line Interface (CLI)"**.
7.  **Finalize**: Click Next until you see the keys.
    *   **Access Key ID**: Begins with `AKIA...`
    *   **Secret Access Key**: A long string of random characters. **SHOW IT** and copy it immediately. You won't see it again!

> [!CAUTION]
> **Never share these keys** with anyone or commit them to GitHub. Treat them like your password.

Once you have them, go back to your terminal and run `aws configure`.
