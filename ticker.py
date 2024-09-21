
import finnhub
import mysql.connector
import jwt
import os
import re
finnhub_client = finnhub.Client(api_key="")

db_config = {
    'user': 'admin',
    'password': 'admin12345678',
    'host': '',
    'database': 'stocks'
}
jwt_secret = 'your_jwt_secret'


# Function to extract the username (id) from the JWT token stored in a file
def get_username_from_token(token):
    try:
        decoded_token = jwt.decode(token, jwt_secret, algorithms=["HS256"])
        return decoded_token.get('id')  # Assuming 'id' stores the username
    except jwt.ExpiredSignatureError:
        print("Token has expired")
    except jwt.InvalidTokenError:
        print("Invalid token")
    return None

# Function to read the token from a file (assumes the token is stored in a file called token.txt)
def read_token_from_file():
    token_file_path = "/Users/prakhartripathi/chartjs-api/token.txt"
    if os.path.exists(token_file_path):
        with open(token_file_path, "r") as file:
            return file.read().strip()
    return None

# Fetch stock names and their tickers for the user from the MySQL database
def fetch_stocks_from_db(username):
    connection = mysql.connector.connect(**db_config)
    cursor = connection.cursor()

    query = "SELECT name FROM list_of_stocks WHERE user = %s AND ticker IS NULL"
    cursor.execute(query, (username,))

    stock_names = [row[0] for row in cursor.fetchall()]

    cursor.close()
    connection.close()

    return stock_names

# Get the ticker symbol for a given stock name using Finnhub


def get_ticker_from_finnhub(stock_name):
    search_result = finnhub_client.symbol_lookup(stock_name)
    print(f"Search result for {stock_name}: {search_result}")  # Print the full response

    # Regex to match tickers that do not contain any numbers
    ticker_pattern = re.compile(r'^[A-Za-z]+$')
    nse_ticker = None
    bse_ticker = None

    # Function to filter and validate Indian tickers (NSE and BSE only)
    def filter_tickers(result):
        nonlocal nse_ticker, bse_ticker
        display_symbol = result['displaySymbol']
        stock_symbol = display_symbol.split('.')[0]  # Extract the part before the ".NS" or ".BO"

        # Ensure we filter by valid tickers for NSE/BSE only
        if display_symbol.endswith(".NS") and ticker_pattern.match(stock_symbol):
            nse_ticker = display_symbol
        elif display_symbol.endswith(".BO") and ticker_pattern.match(stock_symbol):
            bse_ticker = display_symbol

    # Primary search results processing
    for result in search_result['result']:
        filter_tickers(result)

    # If valid tickers are found in the primary search, prioritize NSE first, then BSE
    if nse_ticker or bse_ticker:
        return nse_ticker if nse_ticker else bse_ticker

    # Alternative search using the first word of the stock name
    alternative_search_term = stock_name.split()[0]
    alternative_search_result = finnhub_client.symbol_lookup(alternative_search_term)
    print(f"Alternative search result for {alternative_search_term}: {alternative_search_result}")  # Print alternative search result

    # Alternative search results processing
    for result in alternative_search_result['result']:
        filter_tickers(result)

    # Return the valid ticker from the alternative search
    if nse_ticker or bse_ticker:
        return nse_ticker if nse_ticker else bse_ticker

    # If neither ticker is valid, return None
    return None

# Update the ticker for a stock in the database
def update_ticker_in_db(stock_name, ticker_symbol, username):
    connection = mysql.connector.connect(**db_config)
    cursor = connection.cursor()

    update_query = "UPDATE list_of_stocks SET ticker = %s WHERE name = %s AND user = %s"
    cursor.execute(update_query, (ticker_symbol, stock_name, username))

    connection.commit()
    cursor.close()
    connection.close()

# Main function
def main():
    # Read the token from the file
    token = read_token_from_file()

    if not token:
        print("No token found")
        return

    # Get the username from the token
    username = get_username_from_token(token)

    if not username:
        print("Unable to extract username from token")
        return

    print(f"Username from JWT: {username}")

    # Fetch stock names with NULL tickers for the given user
    stock_names = fetch_stocks_from_db(username)
    print(f"Stocks for {username} with NULL tickers: {stock_names}")

    # For each stock, get the ticker symbol from Finnhub and update the database
    for stock_name in stock_names:
        ticker_symbol = get_ticker_from_finnhub(stock_name)
        if ticker_symbol:
            print(f"Updating ticker for {stock_name}: {ticker_symbol}")
            update_ticker_in_db(stock_name, ticker_symbol, username)
        else:
            print(f"No ticker found for {stock_name}")

if __name__ == "__main__":
    main()
