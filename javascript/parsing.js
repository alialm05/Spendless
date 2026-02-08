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
    console.log('Attempting to find price by symbol...');
    const elements = document.querySelectorAll('span, div, b, strong, td');
    let highestPrice = 0;

    for (const el of elements) {
        const text = el.innerText.trim();

        // check if text contains '$' and a number
        if (text.includes('$') && /\d/.test(text)) {
            // clean the string 
            //console.log('Found potential price text:', text);
            const cleanText = text.replace(/[^0-9.]/g, '');
            const price = parseFloat(cleanText);

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
            if (price > 0 && size >= bestMatch.fontSize) {
                //console.log(`Parsed price: ${price}, Font size: ${size}px`);
                bestMatch = { price, fontSize: size };
            }
        }
    });

    if (bestMatch.price === 0) {
        return findPriceBySymbol() || 0; // Fallback to symbol-based search if no price found by size
    }
    console.log(`Best match found: $${bestMatch.price} with font size ${bestMatch.fontSize}px`);
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
            // extract numbers
            const numericPrice = parseFloat(text.replace(/[^0-9.-]+/g, ""));
            console.log(`Trying selector "${selector}": found text "${text}", parsed price ${numericPrice}`);
            if (!isNaN(numericPrice) && numericPrice > 0) {
                return numericPrice;
            }
        }
    }
    console.log("finding price by largest price");
    return findLargestPrice(); // fallback
}

if (typeof window !== 'undefined') {
    window.findOrderTotal = findOrderTotal;
    window.getPriceAmazon = getPriceAmazon;
    window.findPriceBySymbol = findPriceBySymbol;
    window.findLargestPrice = findLargestPrice;
}
