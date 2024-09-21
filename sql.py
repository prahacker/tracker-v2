import pymysql
import os
import sys
import jwt

db_user = 'admin'
db_password = 'admin12345678'
db_host = ''
stocks_db_name = ''
admin_db_name = ''

jwt_secret = 'your_jwt_secret'
print(f"Received token: {sys.argv[1]}")

def get_username_from_token(token):
    try:
        decoded_token = jwt.decode(token, jwt_secret, algorithms=["HS256"])
        return decoded_token.get('id')
    except jwt.ExpiredSignatureError:
        print("Token has expired")
    except jwt.InvalidTokenError:
        print("Invalid token")
    return None

def format_value_and_percentage(value):
    try:
        start_of_percentage = value.find('(')
        if start_of_percentage != -1:
            value_part = value[:start_of_percentage].strip()
            percentage_part = value[start_of_percentage:].replace('(', '').replace(')', '').strip()
            formatted_value = f"{value_part}({percentage_part})"
        else:
            formatted_value = value
        return formatted_value
    except Exception as e:
        print(f"Error formatting value: {value} - {e}")
        return value

def main():
    token = sys.argv[1] if len(sys.argv) > 1 else None

    if not token:
        print("Token is required")
        sys.exit(1)

    username = get_username_from_token(token)
    if not username:
        print("Could not retrieve username from the token.")
        sys.exit(1)

    print(f"Username: {username}")

    data_file_path = "/data.txt"
    data = {}
    stock_data = []

    try:
        with open(data_file_path, "r") as file:
            for line in file:
                if "=" in line:
                    key, value = line.strip().split("=", 1)
                    data[key] = value
                else:
                    stock_data.append(line.strip())
    finally:
        if os.path.exists(data_file_path):
            os.remove(data_file_path)
            print(f"{data_file_path} has been deleted.")

    total_return_text = data.get("total_return_text")
    one_day_return_text = data.get("one_day_return_text")
    nifty50 = data.get("nifty50_value")
    sensex = data.get("sensex_value")
    date = data.get("timestamp")

    if nifty50:
        nifty50 = format_value_and_percentage(nifty50)

    if sensex:
        sensex = format_value_and_percentage(sensex)

    print(f"Nifty50: {nifty50}, Sensex: {sensex}")

    stocks_connection = pymysql.connect(
        host=db_host,
        user=db_user,
        password=db_password,
        database=stocks_db_name,
        cursorclass=pymysql.cursors.DictCursor
    )

    admin_connection = pymysql.connect(
        host=db_host,
        user=db_user,
        password=db_password,
        database=admin_db_name,
        cursorclass=pymysql.cursors.DictCursor
    )

    try:
        with stocks_connection.cursor() as cursor:
            check_stock_query = """
            SELECT * FROM list_of_stocks WHERE name = %s AND user = %s
            """
            update_stock_query = """
            UPDATE list_of_stocks SET avg = %s, no_shares = %s WHERE name = %s AND user = %s
            """
            insert_stock_query = """
            INSERT INTO list_of_stocks (name, avg, user, no_shares)
            VALUES (%s, %s, %s, %s)
            """
            for stock in stock_data:
                try:
                    stock_name, avg_and_shares = stock.split(": ")[0], stock.split(": ")[1]
                    avg_price = avg_and_shares.split(", ")[0].replace("Avg. ₹", "")
                    no_shares = avg_and_shares.split(", ")[1].replace(" shares", "")
                    cursor.execute(check_stock_query, (stock_name, username))
                    existing_stock = cursor.fetchone()
                    if existing_stock:
                        cursor.execute(update_stock_query, (avg_price, no_shares, stock_name, username))
                    else:
                        cursor.execute(insert_stock_query, (stock_name, avg_price, username, no_shares))
                except ValueError as ve:
                    print(f"Skipping stock due to split error: {ve} - Line: {stock}")
                except Exception as e:
                    print(f"Error processing stock: {e} - Line: {stock}")
            stocks_connection.commit()

        with admin_connection.cursor() as cursor:
            create_user_table_query = f"""
            CREATE TABLE IF NOT EXISTS `{username}` (
                id INT AUTO_INCREMENT PRIMARY KEY,
                total_return_text VARCHAR(255),
                one_day_return_text VARCHAR(255),
                nifty50 VARCHAR(50),
                sensex VARCHAR(50),
                date DATETIME
            )
            """
            cursor.execute(create_user_table_query)
            insert_user_data_query = f"""
            INSERT INTO `{username}` (total_return_text, one_day_return_text, nifty50, sensex, date)
            VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(insert_user_data_query, (total_return_text, one_day_return_text, nifty50, sensex, date))
            admin_connection.commit()
    finally:
        stocks_connection.close()
        admin_connection.close()

if __name__ == "__main__":
    main()
