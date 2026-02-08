function getPriceAmazon(){
    const grandTotal = document.querySelector('.grand-total-cell');

    if (!grandTotal) {
        console.log('Grand total element not found');
        return 0;
    }
    
    console.log('Grand total element found:', grandTotal);
    console.log('Grand total innerHTML:', grandTotal.innerHTML);
    
    const priceClass = 'order-summary-line-definition';
    const priceClass2 = 'breakword';

    // Method 1: Your current approach (querySelector with class)
    let priceElement = grandTotal.querySelector(`.${priceClass}`);
    
    // Method 2: If class doesn't work, try finding by tag and content
    if (!priceElement) {
        priceElement = grandTotal.querySelector('span, div, td');
        console.log('Trying alternative selectors...');
    }
    
    /*const allDescendants = grandTotal.querySelectorAll('*');
    console.log('All descendant elements:', allDescendants);
    allDescendants.forEach((el, index) => {
        console.log(`Element ${index}:`, el.tagName, el.className, el.innerText);
    });*/
    
    if (priceElement) {
        console.log('Price element found:', priceElement);
        //console.log('Price text:', priceElement.innerText);
        const price = parseFloat(priceElement.innerText.replace(/[^0-9.-]+/g,""));
        //console.log('Parsed price:', price);
        return price;
    }
    
    console.log('No price element found');
    return 0;
}

function findPriceBySymbol() {
    // 1. Get all elements that might contain text
    const elements = document.querySelectorAll('span, div, b, strong, td');
    let highestPrice = 0;

    for (const el of elements) {
        const text = el.innerText.trim();

        // 2. Check if the text contains '$' and a number
        if (text.includes('$') && /\d/.test(text)) {
            // Clean the string (e.g., "$1,250.00 USD" -> "1250.00")
            //console.log('Found potential price text:', text);
            const cleanText = text.replace(/[^0-9.]/g, '');
            const price = parseFloat(cleanText);

            // 3. Logic: The "Total" is usually the largest price on a checkout page
            if (!isNaN(price) && price > highestPrice) {
                console.log('New highest price found:', price);
                console.log('From Clean text:', cleanText);
                console.log('from', text);
                highestPrice = price;
            }
        }
    }

    return highestPrice > 0 ? highestPrice : null;
}

function findLargestPrice() {
    const elements = document.querySelectorAll('span, div, h1, h2, strong');
    let bestMatch = { price: 0, fontSize: 0 };

    elements.forEach(el => {
        const text = el.innerText;
        if (text.includes('$')) {
            const price = parseFloat(text.replace(/[^0-9.]/g, ''));
            const style = window.getComputedStyle(el);
            const size = parseFloat(style.fontSize);

            if (price > 0 && size > bestMatch.fontSize) {
                bestMatch = { price, fontSize: size };
            }
        }
    });

    if (bestMatch.price === 0) {
        return findPriceBySymbol() || 0; // Fallback to symbol-based search if no price found by size
    }
    return bestMatch.price;
}

function findOrderTotal() {
    // A list of common price IDs and Classes across the web
    const priceSelectors = [
        '#total-price',                // Keychron / Shopify
        '.total-recap__final-price',   // International Shopify
        '#sc-buy-box-ptb-button-value',// Amazon Sidebar
        '.grand-total-price',
        '.grand-total-cell',          // Generic stores
        '.order-total .price',         // WooCommerce
        '[data-checkout-payment-due-target]' // Shopify Data Attribute
    ];

    for (let selector of priceSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            const text = element.innerText || element.textContent;
            // Extract numbers and decimals only (e.g., "$126.00" -> 126.00)
            const numericPrice = parseFloat(text.replace(/[^0-9.-]+/g, ""));
            
            if (!isNaN(numericPrice) && numericPrice > 0) {
                return numericPrice;
            }
        }
    }
    console.log("finding price by symbol");
    return findLargestPrice(); // fallback
}

if (typeof window !== 'undefined') {
    window.findOrderTotal = findOrderTotal;
    window.getPriceAmazon = getPriceAmazon;
    window.findPriceBySymbol = findPriceBySymbol;
    window.findLargestPrice = findLargestPrice;
}
