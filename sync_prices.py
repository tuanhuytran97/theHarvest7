import sys
import os
import re
import requests
import json
from vnstock import Quote

# Fix console encoding on Windows
if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

# --- CONFIGURATION ---
WEB_APP_URL = os.environ.get("WEB_APP_URL", "")
TOKEN = os.environ.get("WEB_ADMIN_TOKEN", "")

# Fallback to reading from config.js if env vars are missing (e.g. running locally)
if not WEB_APP_URL or not TOKEN:
    config_path = os.path.join(os.path.dirname(__file__), 'config.js')
    if os.path.exists(config_path):
        with open(config_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if not WEB_APP_URL:
                url_match = re.search(r'WEB_APP_URL:\s*"([^"]+)"', content)
                if url_match:
                    WEB_APP_URL = url_match.group(1)
            
            if not TOKEN:
                token_match = re.search(r'"([^"]+)":\s*{\s*name:[^,]+,\s*role:\s*"ADMIN"', content)
                if token_match:
                    TOKEN = token_match.group(1)
                else:
                    token_fallback = re.search(r'"([^"]+)":\s*{', content)
                    if token_fallback:
                        TOKEN = token_fallback.group(1)

if not WEB_APP_URL or not TOKEN:
    print("Vui lòng thiết lập WEB_APP_URL và thông tin USERS (hoặc cấu hình GitHub Secrets).")
    sys.exit(1)
# ---------------------

def fetch_portfolio_symbols():
    print("Fetching portfolio symbols from Google Sheets...")
    payload = {
        "action": "get_investment_data",
        "token": TOKEN
    }
    try:
        res = requests.post(WEB_APP_URL, json=payload, headers={'Content-Type': 'text/plain;charset=utf-8'}).json()
        if res.get("status") != "success":
            print("Error fetching data:", res.get("message"))
            return []
            
        portfolio = res.get("portfolio", [])
        if len(portfolio) < 2:
            return []
            
        headers = portfolio[0]
        col_symbol = headers.index("Mã/Tên") if "Mã/Tên" in headers else -1
        col_type = next((headers.index(h) for h in headers if "loại" in h.lower() or "type" in h.lower()), -1)
        
        symbols_to_fetch = []
        for row in portfolio[1:]:
            symbol = str(row[col_symbol]).strip().upper() if col_symbol > -1 else ""
            t_str = str(row[col_type]).lower() if col_type > -1 else ""
            if len(symbol) >= 3 and ("phiếu" in t_str or "etf" in t_str or len(symbol) == 3):
                symbols_to_fetch.append(symbol)
                
        return symbols_to_fetch
    except Exception as e:
        print("Network error:", e)
        return []

def get_current_prices(symbols):
    prices = {}
    print(f"Crawling prices using vnstock for: {', '.join(symbols)}")
    for sym in symbols:
        try:
            quote = Quote(symbol=sym, source="vci") # VCI provides good realtime and history
            df = quote.intraday(page_size=1) # Get the latest intraday match
            
            if df is not None and not df.empty and 'price' in df.columns:
                p = df.iloc[0]['price']
                if p > 0 and p < 1000: p = p * 1000
                prices[sym] = p
                print(f"[{sym}] = {p:,.0f} VND")
            else:
                # Fallback to history close if intraday is empty
                df_hist = quote.history()
                if df_hist is not None and not df_hist.empty and 'close' in df_hist.columns:
                    p = df_hist.iloc[-1]['close']
                    if p > 0 and p < 1000: p = p * 1000
                    prices[sym] = p
                    print(f"[{sym}] = {p:,.0f} VND (Close Price)")
                else:
                    print(f"[{sym}] = No data")
        except Exception as e:
            pass # ignore print error to console
            
    return prices

def push_prices_to_sheet(prices):
    if not prices:
        print("No prices to push.")
        return
        
    print("\nPushing prices back to Google Sheets...")
    payload = {
        "action": "update_external_prices",
        "token": TOKEN,
        "prices": prices
    }
    try:
        res = requests.post(WEB_APP_URL, json=payload, headers={'Content-Type': 'text/plain;charset=utf-8'}).json()
        print("Server response:", res.get("message", res.get("status")))
    except Exception as e:
        print("Network error updating prices:", e)

if __name__ == "__main__":
    symbols = fetch_portfolio_symbols()
    if symbols:
        prices = get_current_prices(symbols)
        push_prices_to_sheet(prices)
    else:
        print("No stock symbols found in Portfolio.")
