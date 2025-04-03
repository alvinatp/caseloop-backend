from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
import asyncio
import httpx
from bs4 import BeautifulSoup
from bs4.element import Comment
from openai import OpenAI
import os
import json
import uuid
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get OpenAI API key from environment
openai_api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=openai_api_key)

print("Scraper initialized")
print(f"OpenAI API Key configured: {bool(openai_api_key)}")

def tag_visible(element):
    if element.parent.name in ['style', 'script', 'head', 'title', 'meta', '[document]']:
        return False
    if isinstance(element, Comment):
        return False
    return True

def text_from_html(body):
    soup = BeautifulSoup(body, 'html.parser')
    texts = soup.findAll(string=True)
    visible_texts = filter(tag_visible, texts)  
    return u" ".join(t.strip() for t in visible_texts)

async def extract_summary(name: str, website: str):
    try:
        print(f"Fetching website content from: {website}")
        # Extract the summary from the main page
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(website, timeout=10.0)
            html = response.text
            print(f"Received {len(html)} bytes of HTML")
        
        result = text_from_html(html)
        if (result):
            print(f"Extracted {len(result)} characters of text content")
            print("Sending to OpenAI for summarization...")
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": f"Write a maximum of two sentences summarizing the overview and mission of the organization called {name}, based on web searched information. For example, '{name} primarily offers [main service] and serves [main target].' If no relevant information is found, return N/A."},
                    {"role": "user", "content": f"Give me an overview of {name} based on this website content: {result[:4000]}"}
                ]
            )
            summary = response.choices[0].message.content.strip()
            print(f"Generated summary: {summary}")
            return summary
        else: 
            print("No visible text content found")
            return ""
    except Exception as e:
        print(f"Error extracting summary: {e}")
        return ""

async def scrape_services(category: str, city: str):
    # Initialize Chrome driver with headless mode for server environment
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    
    try:
        print("Initializing Chrome WebDriver...")
        # Use an explicit version of ChromeDriver to avoid compatibility issues
        from webdriver_manager.chrome import ChromeDriverManager
        from selenium.webdriver.chrome.service import Service
        
        # Specify a Chrome version that has available drivers
        driver = webdriver.Chrome(
            service=Service(ChromeDriverManager(chrome_version="113.0.5672").install()), 
            options=options
        )
        # Use set to track visited centers
        visited = set()
        services_data = []
        
        print(f"Searching for category: '{category}' in zipcode: '{city}'")
        
        # Navigate to findhelp.org search page 
        search_url = f"https://www.findhelp.org/search?terms={category}&postal={city}"
        print(f"Navigating to: {search_url}")
        driver.get(search_url)
        time.sleep(5)  # Wait for page to load
        
        # Save screenshot for debugging
        screenshot_path = "search_results.png"
        driver.save_screenshot(screenshot_path)
        print(f"Saved screenshot to {os.path.abspath(screenshot_path)}")
        
        # Get the page source and save it
        html_source = driver.page_source
        html_path = "search_results.html"
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_source)
        print(f"Saved HTML source to {os.path.abspath(html_path)}")
        
        print(f"Page title: {driver.title}")
        print(f"Current URL: {driver.current_url}")
        print("Parsing results...")
        
        # Parse the HTML with BeautifulSoup
        soup = BeautifulSoup(html_source, 'html.parser')
        
        # Log some HTML structure to help debug
        print("\nExamining HTML structure:")
        for i, elem in enumerate(soup.select("h1, h2, h3")):
            if i < 10:  # Limit to first 10 headings
                print(f"Heading: {elem.name} - {elem.text.strip()}")
        
        # Try to find the resource listings
        # This selector may need adjustment based on findhelp.org's actual structure
        resource_items = soup.select(".resource-card, .program-card, .listing-card")
        
        print(f"Found {len(resource_items)} resources using primary selectors")
        
        if not resource_items:
            print("No resources found. Trying alternative selectors...")
            # Try alternative selectors if the first one doesn't work
            resource_items = soup.select("div[data-test='program-card'], div[data-test='resource-card']")
            print(f"Found {len(resource_items)} resources with alternative selectors")
            
            if not resource_items:
                print("Trying general container selectors...")
                # Just grab all major divs for analysis
                resource_items = soup.select("div.MuiPaper-root, div.MuiCard-root, article, .program, .service, .agency, .listing")
                print(f"Found {len(resource_items)} potential containers")
        
        # Log the first 3 resource elements' HTML to debug
        print("\nSample resource HTML structure:")
        for i, item in enumerate(resource_items[:3]):
            if i < 3:
                print(f"\nResource {i+1} class: {item.get('class')}")
                print(f"Resource {i+1} first 200 chars: {str(item)[:200]}...")
        
        for index, item in enumerate(resource_items[:10]):  # Limit to first 10 for testing
            try:
                print(f"\nProcessing resource {index + 1}:")
                
                # Extract data - these selectors need to be adjusted based on the actual HTML structure
                name_elem = item.select_one("h2, h3, h4, .organization-name, .program-name, .title")
                address_elem = item.select_one(".address, .location, [itemprop='address']")
                website_elem = item.select_one("a[href^='http']")
                phone_elem = item.select_one(".phone, .contact-phone, [itemprop='telephone']")
                
                name = name_elem.text.strip() if name_elem else f"Resource {index + 1}"
                address = address_elem.text.strip() if address_elem else ""
                website = website_elem['href'] if website_elem and 'href' in website_elem.attrs else ""
                phone = phone_elem.text.strip() if phone_elem else ""
                
                print(f"Name: {name}")
                print(f"Address: {address}")
                print(f"Website: {website}")
                print(f"Phone: {phone}")
                
                if name and name not in visited:
                    visited.add(name)
                    
                    descriptions = ""
                    if website:
                        print(f"Extracting summary for {name} from {website}")
                        descriptions = await extract_summary(name, website)
                    
                    # Create a resource object
                    resource = {
                        "id": str(uuid.uuid4()),
                        "city": city,
                        "category": category,
                        "name": name,
                        "address": address,
                        "website": website,
                        "phone": phone,
                        "descriptions": descriptions
                    }
                    
                    print(f"Added resource: {name}")
                    services_data.append(resource)
            except Exception as e:
                print(f"Error extracting resource info: {e}")
        
        driver.quit()
        print("WebDriver closed")
        
        # Save results to a JSON file
        json_path = "findhelp_results.json"
        with open(json_path, "w") as f:
            json.dump(services_data, f, indent=2)
        print(f"Saved results to {os.path.abspath(json_path)}")
            
        print(f"Scraping complete. Found {len(services_data)} resources.")
        return services_data
    except Exception as e:
        print(f"Error in web scraping: {e}")
        return []

# Run the scraper with command line arguments if provided
async def main():
    # Get category and city from command line arguments or use defaults
    if len(sys.argv) >= 3:
        category = sys.argv[1]
        city = sys.argv[2]
    else:
        category = "food"
        city = "94103"  # San Francisco ZIP code
    
    print(f"Starting scraper with category: {category}, city/zipcode: {city}")
    print(f"Current working directory: {os.getcwd()}")
    results = await scrape_services(category, city)
    print(f"Total results: {len(results)}")
    
    # Print first 3 results for review
    for i, result in enumerate(results[:3]):
        print(f"\nResult {i+1}:")
        print(f"Name: {result['name']}")
        print(f"Address: {result['address']}")
        print(f"Website: {result['website']}")
        print(f"Phone: {result['phone']}")
        print(f"Description: {result['descriptions']}")

if __name__ == "__main__":
    asyncio.run(main()) 