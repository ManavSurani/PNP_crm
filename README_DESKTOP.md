# PNP CRM Standalone Desktop Guide

Your project has been successfully converted into a high-speed Desktop Application.

## How to use:

### 1. Create the Desktop Icon
Double-click the file named `create-shortcut.vbs`. 
*   This will create a **PNP CRM** icon on your Windows Desktop.
*   You only need to do this once.

### 2. Launch the Application
Double-click the **PNP CRM** icon on your Desktop.
*   **Zero Installation**: Your client doesn't need to install anything (Node.js is already bundled inside!).
*   A terminal window will open—**keep it open** while using the CRM.

### 3. Data Storage
All your data is now stored inside the project folder in: `_data\crm.db`.
*   This makes the entire folder **Portable**. You can move it to any drive or folder, and everything will still work!
*   To back up your data, simply copy the `_data` folder or the entire project folder.

---

## Important for the Client:
When you give this folder to your client:
1.  Ensure they have **Node.js** installed (or I can help you bundle it).
2.  Tell them to run `create-shortcut.vbs` first.
3.  That's it! They are ready to go.
