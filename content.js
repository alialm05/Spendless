//import "./chart.js"
var BUDGET = 300;
var BUDGET_LOADED = false
const overlayHolder = document.createElement('div');
overlayHolder.style.all = "initial";
document.body.appendChild(overlayHolder);

function loadBudgetInfo() {
    if (BUDGET_LOADED) {
        return Promise.resolve(BUDGET); // Return current budget if already loaded
    }
    
    console.log('Attempting to load budget data...');
    
    // First show what's in storage for debugging
    chrome.storage.local.get(null).then((allData) => {
        console.log('All data in storage:', allData);
    });
    
    // Return the promise so it can be awaited
    return loadStateExtensionData('spendless_data').then((result) => {
        console.log('Raw storage result:', result);
        
        // Chrome storage returns {spendless_data: actualValue}
        const data = result.spendless_data;
        
        if (data) {
            console.log('Found stored data:', data);
            
            // Check if data is an object with money_leftover property
            if (typeof data === 'object' && data.money_leftover !== undefined) {
                BUDGET = data.money_leftover;
                console.log('Set BUDGET from money_leftover:', BUDGET);
            } else if (typeof data === 'number') {
                // If data is just a number
                BUDGET = data;
                console.log('Set BUDGET from number:', BUDGET);
            } else {
                console.log('Unexpected data format:', typeof data, data);
            }
            
            BUDGET_LOADED = true;
            return BUDGET;
        } else {
            console.log('No data found for key: spendless_data');
            console.log('Using default budget:', BUDGET);
            BUDGET_LOADED = true;
            return BUDGET; // Return default budget if nothing in storage
        }
    }).catch((error) => {
        console.error('Error loading budget data:', error);
        console.log('Using default budget due to error:', BUDGET);
        BUDGET_LOADED = true;
        return BUDGET; // Return default budget on error
    });
}

function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = "budgetOverlay";

    overlay.innerHTML = `
        <h1 style="margin-top:0">Monthly Budget Impact</h1>
        <p>This purchase represents a new slice in your monthly spending.</p>
        <div id="loadingIndicator" style="text-align: center; color: #666;">
            <p>Loading your budget data...</p>
            <div style="font-size: 24px;">⏳</div>
        </div>
        <div id="budgetContent" style="display: none;">
            <h1 id="overlayTitle"></h1>
            <h2 id="budgetStatus"></h2>
            <canvas id="budgetChart" width="250" height="250" style="max-width:250px;max-height:250px;"></canvas>
            <button id="closeOverlay" data-risk="" style="display:none">I understand, let me shop</button>
        </div>
    `;

    overlayHolder.appendChild(overlay);

    document.getElementById('closeOverlay').addEventListener('click', (e) => {
        console.log('Overlay closed by user');
        overlay.remove();

        const riskLevel = e.currentTarget.dataset.risk;

        if (riskLevel < 25) return; // No sound for Low/Medium risk

        const audioUrl = chrome.runtime.getURL("resources/siren.mp3");
        const audio = new Audio(audioUrl);
        audio.volume = 0.75;
        audio.play();
    });

    return overlay;
}

function showBudgetContent() {
    const loadingEl = document.getElementById('loadingIndicator');
    const contentEl = document.getElementById('budgetContent');
    
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
    if (contentEl) {
        contentEl.style.display = 'block';
    }
}

function createChart(purchase, moneyLeft){
    const ctx = document.getElementById('budgetChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['THIS PURCHASE', 'Budget'],
            datasets: [{
                data: [moneyLeft, purchase], 
                backgroundColor: ['#FF0000', '#02c282']
            }]
        },
        options: {
            plugins: {
                title: { display: true, text: 'Monthly Budget Projection' }
            }
        }
    });
}

// Initialize Popup on checkout
async function init() {
    if (isAmazonUpsell()) {
        return; 
    }

    console.log('Initializing content script...');
    
    const overlay = createOverlay(); // Show overlay with loading indicator
    
    // Wait for budget to be loaded before proceeding
    try {
        const loadedBudget = await loadBudgetInfo();
        console.log('Budget loaded successfully:', loadedBudget);
        BUDGET = loadedBudget;
    } catch (error) {
        console.error('Failed to load budget, using default:', error);
        // BUDGET keeps its default value of 300
    }

    const totalAmount = findOrderTotal();
    console.log('Total amount found:', totalAmount);
    
    if (totalAmount) {
        // Hide loading and show content
        showBudgetContent();
        
        console.log("Price Detected:", totalAmount);

        // Now we can safely use the loaded BUDGET
        const overlayTitle = document.getElementById('overlayTitle');
        overlayTitle.appendChild(document.createTextNode(`You are spending $${totalAmount.toFixed(2)}.`)); 

        const pUsed = calculateBudgetRisk(BUDGET, totalAmount);
        const riskText = document.getElementById('budgetStatus');

        const threshold = getRiskLevel(pUsed);

        console.log('Budget being used for calculations:', BUDGET);
        createChart(Math.max(1, BUDGET - totalAmount), totalAmount);

        // image/gif
        const image = document.createElement('img');
        console.log('Displaying image for risk level:', threshold.image);
        image.src = chrome.runtime.getURL(threshold.image);
        image.style.width = '100px';
        image.style.height = '100px';
        overlay.appendChild(image);

        const closeOverlay = document.getElementById('closeOverlay');
        closeOverlay.style.display = 'block';
        closeOverlay.dataset.risk = threshold.threshold;

        overlay.appendChild(closeOverlay);

        riskText.appendChild(document.createTextNode(`Risk Level: ${threshold.level}`));
        riskText.style.color = threshold.color;
    } else {
        // If no total amount found, still hide loading
        showBudgetContent();
    }
}


// Run 2 seconds after load to ensure Amazon's dynamic prices have appeared
setTimeout(init, 1000);
