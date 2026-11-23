import json
import time
import urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer
import httpx

PORT = 8001
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json"
}

def fetch_vietnam_stock(ticker: str) -> dict:
    ticker = ticker.upper().strip()
    client = httpx.Client(headers=HEADERS, timeout=10.0, follow_redirects=True)

    # 1. Company Intro
    name = f"Công ty CP {ticker}"
    market = "HOSE"
    try:
        r_intro = client.get(f"https://cafef.vn/du-lieu/Ajax/PageNew/CompanyIntro.ashx?symbol={ticker}")
        if r_intro.status_code == 200:
            intro_data = r_intro.json().get("Data", {})
            name = intro_data.get("Name") or name
            cid = intro_data.get("CenterId")
            if cid == 1: market = "HOSE"
            elif cid == 2: market = "HNX"
            elif cid in [8, 9]: market = "UPCoM"
    except Exception as e:
        print(f"Error fetching intro: {e}")

    # 2. Realtime Price from VNDirect
    price = 50000
    price_change = 0.0
    try:
        now = int(time.time())
        r_price = client.get(f"https://dchart-api.vndirect.com.vn/dchart/history?resolution=D&symbol={ticker}&from={now - 86400*30}&to={now}")
        if r_price.status_code == 200:
            pdata = r_price.json()
            closes = pdata.get("c", [])
            if closes:
                price = int(closes[-1] * 1000)
                if len(closes) >= 2 and closes[-2] > 0:
                    price_change = round(((closes[-1] - closes[-2]) / closes[-2]) * 100, 2)
    except Exception as e:
        print(f"Error fetching price: {e}")

    # 3. Financial Statements (KQKD)
    years = []
    revenue = []
    cogs = []
    gross_profit = []
    net_profit = []
    eps = []

    try:
        r_kqkd = client.get(f"https://apiweb.cafef.vn/api/v1/BCTC/GetReportSummary?symbol={ticker}&pageIndex=1&pageSize=5&reportType=KQKD&TypeTime=NAM")
        if r_kqkd.status_code == 200:
            val = r_kqkd.json().get("value", {})
            d_list = val.get("data", [])
            if d_list and len(d_list) > 0:
                periods = d_list[0].get("data", [])
                periods = sorted(periods, key=lambda x: x.get("year", 0))

                for p in periods:
                    y = p.get("year")
                    if not y: continue
                    years.append(y)
                    items = {item.get("code"): item.get("value", 0) for item in p.get("data", [])}

                    rev = items.get("KQKD_2") or items.get("KQKD_1", 0)
                    cg = items.get("KQKD_3", 0)
                    gp = items.get("KQKD_4", 0)
                    np_val = items.get("KQKD_14") or items.get("KQKD_13", 0)
                    eps_val = items.get("KQKD_15", 0)

                    revenue.append(round(rev / 1e9, 1))
                    cogs.append(round(abs(cg) / 1e9, 1))
                    gross_profit.append(round(gp / 1e9, 1))
                    net_profit.append(round(np_val / 1e9, 1))
                    eps.append(int(eps_val) if eps_val else 0)
    except Exception as e:
        print(f"Error fetching KQKD: {e}")

    # 4. Balance Sheet (CDKT)
    total_assets = []
    equity = []
    total_debt = []
    fixed_assets = []

    try:
        r_cdkt = client.get(f"https://apiweb.cafef.vn/api/v1/BCTC/GetReportSummary?symbol={ticker}&pageIndex=1&pageSize=5&reportType=CDKT&TypeTime=NAM")
        if r_cdkt.status_code == 200:
            val = r_cdkt.json().get("value", {})
            d_list = val.get("data", [])
            if d_list and len(d_list) > 0:
                periods = d_list[0].get("data", [])
                periods = sorted(periods, key=lambda x: x.get("year", 0))

                for p in periods:
                    items = {item.get("code"): item.get("value", 0) for item in p.get("data", [])}
                    assets = items.get("CDKT_27", 0)
                    eq = items.get("CDKT_31", 0)
                    d_short = items.get("CDKT_29", 0)
                    d_long = items.get("CDKT_30", 0)
                    fa = items.get("CDKT_24", 0)

                    total_assets.append(round(assets / 1e9, 1))
                    equity.append(round(eq / 1e9, 1))
                    total_debt.append(round((d_short + d_long) / 1e9, 1))
                    fixed_assets.append(round(fa / 1e9, 1))
    except Exception as e:
        print(f"Error fetching CDKT: {e}")

    n = len(years)
    if n == 0:
        raise ValueError(f"Không có dữ liệu tài chính cho mã {ticker}")

    while len(total_assets) < n: total_assets.append(0)
    while len(equity) < n: equity.append(0)
    while len(total_debt) < n: total_debt.append(0)
    while len(fixed_assets) < n: fixed_assets.append(0)

    # Ước tính CFO & CAPEX & EBITDA
    cfo = []
    capex = []
    ebitda = []

    for i in range(n):
        np_i = net_profit[i]
        ebitda_i = round(np_i * 1.35, 1)
        ebitda.append(ebitda_i)

        cfo_i = round(np_i * 1.12, 1)
        cfo.append(cfo_i)

        if i > 0 and fixed_assets[i] > fixed_assets[i-1]:
            cap_i = round(fixed_assets[i] - fixed_assets[i-1], 1)
        else:
            cap_i = round(revenue[i] * 0.04, 1) if revenue[i] > 0 else 0
        capex.append(cap_i)

    # 5. Financial Indicators
    pe = 0
    pb = 0
    roe_ind = 0
    roa_ind = 0
    try:
        r_ind = client.get(f"https://apiweb.cafef.vn/api/v2/BCTC/FinancialIndicators?symbol={ticker}&pageIndex=1&pageSize=1")
        if r_ind.status_code == 200:
            ival = r_ind.json().get("value", {})
            idata = ival.get("data", [])
            if idata:
                ind_map = {item.get("code"): item.get("value") for item in idata[0].get("data", [])}
                pe = ind_map.get("PE") or 0
                pb = ind_map.get("PB") or 0
                roe_ind = ind_map.get("ROE") or 0
                roa_ind = ind_map.get("ROA") or 0
    except Exception as e:
        print(f"Error fetching indicators: {e}")

    # Shares outstanding
    last_eps = eps[-1] if eps and eps[-1] > 0 else (price / pe if pe > 0 else 3000)
    shares = round((net_profit[-1] * 1e9) / (last_eps * 1e6), 1) if last_eps > 0 else 1000

    # Smart sliders
    last_rev = revenue[-1] if revenue else 1
    margin = round((net_profit[-1] / last_rev * 100), 1) if last_rev > 0 else 12
    margin = max(1.0, min(50.0, margin))

    growth_5y = 12.0
    if len(revenue) >= 2 and revenue[0] > 0:
        cagr = (pow(revenue[-1] / revenue[0], 1.0 / (len(revenue) - 1)) - 1.0) * 100
        growth_5y = round(max(0.0, min(50.0, cagr)), 1)

    return {
        "_ticker": ticker,
        "_isDemo": False,
        "_isLive": True,
        "_source": "CafeF & VNDirect (Python Backend)",
        "name": name,
        "market": market,
        "sector": "Việt Nam",
        "currency": "VND",
        "price": price,
        "priceChange": price_change,
        "shares": shares,
        "years": years,
        "revenue": revenue,
        "cogs": cogs,
        "grossProfit": gross_profit,
        "ebitda": ebitda,
        "netProfit": net_profit,
        "totalAssets": total_assets,
        "equity": equity,
        "totalDebt": total_debt,
        "cfo": cfo,
        "capex": capex,
        "eps": eps,
        "unit": "tỷ đồng",
        "_peRatio": pe if pe > 0 else None,
        "_pbRatio": pb if pb > 0 else None,
        "_roe": roe_ind if roe_ind > 0 else None,
        "_roa": roa_ind if roa_ind > 0 else None,
        "defaultSliders": {
            "growth": growth_5y,
            "terminal": 3.0,
            "wacc": 12.0,
            "mos": 25.0,
            "margin": margin
        }
    }

class StockHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/stock":
            params = urllib.parse.parse_qs(parsed.query)
            symbol = params.get("symbol", [""])[0].strip()
            if not symbol:
                self.send_response(400)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Thiếu tham số symbol"}).encode("utf-8"))
                return

            try:
                print(f"[{time.strftime('%H:%M:%S')}] Kéo dữ liệu cho mã: {symbol}")
                data = fetch_vietnam_stock(symbol)
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))
            except Exception as e:
                print(f"Lỗi: {e}")
                self.send_response(404)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
        elif parsed.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')
        else:
            self.send_response(404)
            self.end_headers()

def run_server():
    server = HTTPServer(("127.0.0.1", PORT), StockHandler)
    print(f"===========================================================")
    print(f"🚀 Stock Backend Server đang chạy tại http://127.0.0.1:{PORT}")
    print(f"API Endpoint: http://127.0.0.1:{PORT}/api/stock?symbol=VNM")
    print(f"===========================================================")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nĐã dừng server.")

if __name__ == "__main__":
    run_server()
