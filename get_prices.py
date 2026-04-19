import sys
from vnstock import Quote
import datetime

today = datetime.datetime.now().strftime('%Y-%m-%d')
start = (datetime.datetime.now() - datetime.timedelta(days=7)).strftime('%Y-%m-%d')

print("Using vnstock version 3.5.1")
try:
    print(f"Fetching VNM data from {start} to {today} via VCI...")
    quote = Quote(symbol="VNM", source="vci")
    df = quote.history(start=start, end=today)
    print(df)
except Exception as e:
    import traceback
    traceback.print_exc()

try:
    print(f"\nFetching FPT intraday data via VCI...")
    quote = Quote(symbol="FPT", source="vci")
    df = quote.intraday(page_size=5)
    print(df)
except Exception as e:
    import traceback
    traceback.print_exc()
