//import "./chart.js"
const overlay = document.createElement('div');
//overlay.style.cssText = `position:fixed; top:10%; right:10%; width:400px; z-index:9999; background:white;  border:2px solid #333; padding:20px; box-shadow: 10px 10px 0px #000;`;
overlay.className = "budgetOverlay";

// Remove require - utils.js functions are now available globally
// Make sure utils.js is loaded before this script

const budget = 300;

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
    return null;
}


// 2. Add a Title and the Canvas
overlay.innerHTML = `
    <h2 style="margin-top:0">Monthly Budget Impact</h2>
    <p>This purchase represents a new slice in your monthly spending.</p>
    <h1 id="overlayTitle"></h1>
    <h2 id="budgetStatus"></h2>
    <canvas id="budgetChart" width="200" height="200"></canvas>
    <button id="closeOverlay" data-risk="" style="display:none">I understand, let me shop</button>
`;

document.body.appendChild(overlay);

// 3. Add close button logic first (before chart initialization)
document.getElementById('closeOverlay').addEventListener('click', (e) => {
    console.log('Overlay closed by user');
    overlay.remove();

    const riskLevel = e.currentTarget.dataset.risk;

    if (riskLevel < 25) return; // No sound for Low/Medium risk

    const audioUrl = chrome.runtime.getURL("resources/siren.mp3");
    const audio = new Audio(audioUrl);
    audio.play();
});

// Initialize Popup on checkout
function init() {
    const totalAmount = findOrderTotal();
    console.log('Total amount found:', totalAmount);
    if (totalAmount) {
        console.log("Price Detected:", totalAmount);
        // Call your function that creates the UI and the Pie Chart
        //showBudgetImpact(totalAmount);
        const overlayTitle = document.getElementById('overlayTitle');
        overlayTitle.appendChild(document.createTextNode(`You are spending $${totalAmount.toFixed(2)}.`)); 

        const pUsed = calculateBudgetRisk(budget, totalAmount);
        const riskText = document.getElementById('budgetStatus');

        const riskU = getRiskLevel(pUsed);

        closeOverlay = document.getElementById('closeOverlay');
        closeOverlay.style.display = 'block';
        closeOverlay.dataset.risk = riskU.threshold;

        overlay.appendChild(closeOverlay);

        riskText.appendChild(document.createTextNode(`Risk Level: ${riskU.level}`));
        riskText.style.color = riskU.color;

        

    }
}


// Run 2 seconds after load to ensure Amazon's dynamic prices have appeared
setTimeout(init, 1000);

// 4. Initialize the Chart
//const ctx = document.getElementById('budgetChart').getContext('2d');
/*new Chart(ctx, {
    type: 'pie',
    data: {
        labels: ['Rent', 'Food', 'Savings', 'THIS PURCHASE'],
        datasets: [{
            data: [1200, 400, 500, 150], // You'll replace 150 with your scraped price!
            backgroundColor: ['#eee', '#ccc', '#aaa', '#FF0000'] // Red for the new purchase!
        }]
    },
    options: {
        plugins: {
            title: { display: true, text: 'Monthly Budget Projection' }
        }
    }
});*/