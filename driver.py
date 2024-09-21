from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import subprocess
import sys
import undetected_chromedriver as uc

# Accept the token as a command-line argument
token = sys.argv[1] if len(sys.argv) > 1 else None

if not token:
    print("Token not provided")
    sys.exit(1)

# Print token for debugging
print(f"Token received: {token}")

# Function to create the Chrome driver instance
def create_chrome_driver(version_main=129):  # Change 127 to 129
    options = uc.ChromeOptions()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    driver = uc.Chrome(options=options, version_main=version_main)
    return driver


# Create the driver instance
driver = create_chrome_driver()

try:
    driver.get("https://www.groww.in")

    # Wait for the prices to be present
    print("Waiting for the price and percentage change to be present...")
    price_element = WebDriverWait(driver, 60).until(
        EC.presence_of_element_located((By.XPATH, "(//div[@class='seic76PricesDiv']//div[contains(@class, 'contentPrimary')])[1]"))
    )
    percentage_element = WebDriverWait(driver, 60).until(
        EC.presence_of_element_located((By.XPATH, "(//div[@class='seic76PricesDiv']//div[contains(@class, 'contentPositive') or contains(@class, 'contentNegative')])[1]"))
    )
    print("Price and percentage change are visible.")

    # Extract the Nifty 50 price and percentage values
    time.sleep(1)
    nifty50_price = driver.find_element(By.XPATH, "(//div[@class='seic76PricesDiv']//div[contains(@class, 'contentPrimary')])[1]").text
    nifty50_percentage = driver.find_element(By.XPATH, "(//div[@class='seic76PricesDiv']//div[contains(@class, 'contentPositive') or contains(@class, 'contentNegative')])[1]").text.split(' ')[1]

    # Format the Nifty 50 value
    nifty50_value = f"{nifty50_price}({nifty50_percentage})"
    print(f"Nifty50 Value: {nifty50_value}")

    # Extract the Sensex price and percentage values
    time.sleep(1)
    sensex_price = driver.find_element(By.XPATH, "(//div[@class='seic76PricesDiv']//div[contains(@class, 'contentPrimary')])[2]").text
    sensex_percentage = driver.find_element(By.XPATH, "(//div[@class='seic76PricesDiv']//div[contains(@class, 'contentPositive') or contains(@class, 'contentNegative')])[2]").text.split(' ')[1]

    # Format the Sensex value
    sensex_value = f"{sensex_price}({sensex_percentage})"
    print(f"Sensex Value: {sensex_value}")

    # Now click on the "Investments" link
    max_attempts = 30
    attempt = 0
    found_investments_link = False

    while attempt < max_attempts:
        try:
            print(f"Attempt {attempt + 1}: Waiting for the 'Investments' link to be present...")
            WebDriverWait(driver, 30).until(
                EC.presence_of_element_located((By.LINK_TEXT, "Dashboard"))
            )
            print("Found the 'Investments' link.")
            time.sleep(1)
            investments_button = driver.find_element(by=By.LINK_TEXT, value="Dashboard")
            investments_button.click()
            found_investments_link = True
            print("Clicked on 'Investments' button.")
            time.sleep(2)
            break

        except Exception as e:
            print(f"Error: {e}")
            attempt += 1
            time.sleep(3)

    if found_investments_link:
        # Wait for the investments page to load
        print("Waiting for the returns data to be present...")
        WebDriverWait(driver, 40).until(
            EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'stock-investments_stockInvLabel__ehYoT') and text()='Total Returns']/following-sibling::div"))
        )
        time.sleep(1)
        print("Returns data is visible.")

        # Extract return values
        total_return_element = driver.find_element(by=By.XPATH, value="//div[contains(@class, 'stock-investments_stockInvLabel__ehYoT') and text()='Total Returns']/following-sibling::div")
        one_day_return_element = driver.find_element(by=By.XPATH, value="//div[contains(@class, 'stock-investments_stockInvLabel__ehYoT') and text()='1D Returns']/following-sibling::div")

        total_return_text = total_return_element.text
        one_day_return_text = one_day_return_element.text

        # Get the total number of holdings
        total_holdings_element = driver.find_element(By.XPATH, "//div[contains(@class, 'bodyXLargeHeavy') and contains(text(), 'Holdings')]")
        total_holdings = int(total_holdings_element.text.split('(')[1].split(')')[0])
        print(f"Total Holdings: {total_holdings}")

        # Main extraction loop
        stock_data = []
        processed_stocks = set()
        last_height = driver.execute_script("return document.body.scrollHeight")

        while len(stock_data) < total_holdings:
            print(f"Attempting to extract stocks... {len(stock_data)}/{total_holdings} extracted")
            stock_rows = driver.find_elements(By.XPATH, "//tr[contains(@class, 'holdingRow_stockItemHover__mmKoy')]")
            time.sleep(1)

            for row in stock_rows:
                try:
                    stock_name = row.find_element(By.XPATH, ".//a[contains(@class, 'holdingRow_symbolname__Q52ie')]").text
                    if stock_name in processed_stocks:
                        continue

                    shares_avg = row.find_element(By.XPATH, ".//div[contains(@class, 'holdingRow_descdata__oT36U')]").text
                    market_price = row.find_element(By.XPATH, ".//td[contains(@class, 'holdingRow_stk12Pr20__fHbLV')]").text.split("\n")[0]
                    returns_percentage = row.find_element(By.XPATH, ".//td[contains(@class, 'holdingRow_stk12Pr20__fHbLV')]//div[contains(@class, 'contentPositive') or contains(@class, 'contentNegative')]").text
                    
                    shares = shares_avg.split()[0] + ' ' + shares_avg.split()[1]
                    avg_price = shares_avg.split()[-2] + ' ' + shares_avg.split()[-1]
                    stock_data.append(f"{stock_name}: {avg_price}, {shares}, Market Price: {market_price}, Returns: {returns_percentage}")
                    processed_stocks.add(stock_name)
                except Exception as e:
                    continue

            driver.execute_script("window.scrollBy(0, 1000);")
            time.sleep(2)
            new_height = driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height

        # Save the stock data along with return values to a file for sql.py
        with open("/Users/prakhartripathi/chartjs-api/data.txt", "w") as file:
            file.write(f"total_return_text={total_return_text}\n")
            file.write(f"one_day_return_text={one_day_return_text}\n")
            file.write(f"nifty50_value={nifty50_value}\n")
            file.write(f"sensex_value={sensex_value}\n")
            file.write(f"timestamp={time.strftime('%Y-%m-%d')}\n")
            for stock in stock_data:
                file.write(f"{stock}\n")

        print("All stocks extracted. Data saved to data.txt. Executing sql.py...")
        subprocess.run(["python", "/Users/prakhartripathi/chartjs-api/sql.py", token])

    else:
        print("The 'Investments' link was not found after 20 attempts.")

finally:
    # Close the browser
    driver.quit()
    print("Browser closed.")
