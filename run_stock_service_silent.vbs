Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\NC\.gemini\antigravity\scratch\farm-management"
WshShell.Run "py -3.11 stock_service.py", 0, False
