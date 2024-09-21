import mysql.connector
import yfinance as yf

# MySQL connection
db = mysql.connector.connect(
    host="testgroww.cxgwkco2aeaf.ap-south-1.rds.amazonaws.com",
    user="admin",
    password="admin12345678",
    database="stocks"
)
cursor = db.cursor()

# Manual ticker mapping (this should be updated with the correct ticker symbols)
manual_ticker_mapping = {
    "Titagarh Railsystems": "TITAGARH.BO",
    "Kirloskar Brothers": "KIRLOSBROS.BO",
    "Mazagon Dock Ship": "MAZDOCK.NS",
    "Antony Waste": "AWHCL.NS",
    "Suzlon Energy": "SUZLON.NS",
    "Newgen Software Tech": "NEWGEN.NS",
    # Add more mappings as needed
}

# Fetch stock names from the database
cursor.execute("SELECT name FROM list_of_stocks")
stocks = cursor.fetchall()

# Iterate over each stock name
for (name,) in stocks:
    try:
        ticker = manual_ticker_mapping.get(name)
        
        if not ticker:
            # If manual mapping is not found, use yfinance search
            search_result = yf.Ticker(name)
            if search_result.info.get('symbol'):
                ticker = search_result.info.get('symbol')

        if ticker:
            print(f"Found ticker for {name}: {ticker}")
            
            # Update the database with the found ticker
            cursor.execute(
                "UPDATE list_of_stocks SET ticker = %s WHERE name = %s",
                (ticker, name)
            )
            db.commit()
        else:
            print(f"Ticker not found for {name}")
    except Exception as e:
        print(f"Error fetching ticker for {name}: {e}")

cursor.close()
db.close()
