
var BUDGET = 300;
var BUDGET_LOADED = false

// Create audio objects once at the module level
const audioCache = {
    cash: null,
    siren: null,
    initialized: false
};

const overlayHolder = document.createElement('div');
overlayHolder.style.all = "initial";
document.body.appendChild(overlayHolder);

// CSS-based scroll management functions
function disableScroll() {
    // Store current scroll position
    const scrollY = window.scrollY;
    document.body.style.top = `-${scrollY}px`;
    document.body.dataset.scrollY = scrollY;
    // Add CSS class to disable scrolling
    document.body.classList.add('no-scroll');
}

function enableScroll() {
    // Remove CSS class
    document.body.classList.remove('no-scroll');
    // Restore scroll position
    const scrollY = document.body.dataset.scrollY;
    document.body.style.top = '';
    window.scrollTo(0, parseInt(scrollY || '0'));
    delete document.body.dataset.scrollY;
}


// initialize audio obj
function initializeAudio() {
    if (audioCache.initialized) return;
    
    try {
        audioCache.cash = new Audio(chrome.runtime.getURL("resources/cash.mp3"));
        audioCache.cash.volume = 0.75;
        audioCache.cash.preload = 'auto';
        
        audioCache.siren = new Audio(chrome.runtime.getURL("resources/siren.mp3"));
        audioCache.siren.volume = 0.75;
        audioCache.siren.preload = 'auto';
        
        audioCache.initialized = true;
        console.log('Audio objects initialized successfully');
    } catch (error) {
        console.error('Failed to initialize audio objects:', error);
    }
}

function loadBudgetInfo() {
    if (BUDGET_LOADED) {
        return Promise.resolve(BUDGET); // return current budget if already loaded
    }
    
    chrome.storage.local.get(null).then((allData) => {
        console.log('All data in storage:', allData);
    });
    
    return loadStateExtensionData('spendless_data').then((result) => {
        console.log('Raw storage result:', result);
        
        const data = result.spendless_data;
        
        if (data) {
            console.log('Found stored data:', data);
            
            if (typeof data === 'object' && data.money_leftover !== undefined) {
                BUDGET = data.money_leftover;
                console.log('Set BUDGET from money_leftover:', BUDGET);
            } else if (typeof data === 'number') {
            
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
            return BUDGET; // return default budget if nothing in storage
        }
    }).catch((error) => {
        console.error('Error loading budget data:', error);
        console.log('Using default budget due to error:', BUDGET);
        BUDGET_LOADED = true;
        return BUDGET; 
    });
}

// Initialize audio when the script loads

function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = "budgetOverlay";
    
    // Disable scrolling when overlay is created

    overlay.innerHTML = `
        <h1>Monthly Budget Impact</h1>
        <p>This purchase represents a new slice in your monthly spending.</p>
        <div id="loadingIndicator">
            <p>Loading your budget data...</p>
            <div style="font-size: 24px;">⏳</div>
        </div>
        <div id="budgetContent">
            <h1 id="overlayTitle"></h1>
            <h2 id="budgetStatus"></h2>
            <canvas id="budgetChart" width="250" height="250"></canvas>
            <button id="closeOverlay" data-risk="">I understand, let me shop</button>
        </div>
    `;

    overlayHolder.appendChild(overlay);

    document.getElementById('closeOverlay').addEventListener('click', (e) => {
        console.log('Overlay closed by user');
        
        // Re-enable scrolling before removing overlay
        enableScroll();
        overlay.remove();

        const riskLevel = parseFloat(e.currentTarget.dataset.risk) || 0;
        console.log('Playing audio for risk level:', riskLevel);

        if (riskLevel < 25) {
            audioCache.cash.play();
        } else if (riskLevel < 50) {
            audioCache.siren.play();
        }
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
        contentEl.classList.add('active');
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

initializeAudio();


// Initialize Popup on checkout
async function init() {
    if (isAmazonUpsell()) {
        return; 
    }

    console.log('Initializing content script...');
    
    const overlay = createOverlay(); 

    // Wait for budget to be loaded before proceeding
    try {
        const loadedBudget = await loadBudgetInfo();
        console.log('Budget loaded successfully:', loadedBudget);
        BUDGET = loadedBudget;
    } catch (error) {
        console.error('Failed to load budget, using default:', error);
    }

    const totalAmount = findOrderTotal();
    console.log('Total amount found:', totalAmount);
    
    if (totalAmount) {
        // Hide loading and show content
        showBudgetContent();
        
        console.log("Price Detected:", totalAmount);

        
        const overlayTitle = document.getElementById('overlayTitle');
        overlayTitle.appendChild(document.createTextNode(`You are spending $${totalAmount.toFixed(2)}.`)); 

        const pUsed = calculateBudgetRisk(BUDGET, totalAmount);
        const riskText = document.getElementById('budgetStatus');

        const threshold = getRiskLevel(pUsed);

        console.log('Risk level determined:', threshold.threshold);
        if (threshold.threshold > 25) {
            disableScroll();    
        }

        console.log('Budget being used for calculations:', BUDGET);
        createChart(Math.max(1, BUDGET - totalAmount), totalAmount);

        const image = document.createElement('img');
        console.log('Displaying image for risk level:', threshold.image);
        image.src = chrome.runtime.getURL(threshold.image);
        image.style.width = '100px';
        image.style.height = '100px';
        overlay.appendChild(image);

        const closeOverlay = document.getElementById('closeOverlay');
        closeOverlay.classList.add('active');
        closeOverlay.dataset.risk = threshold.threshold;

        overlay.appendChild(closeOverlay);

        riskText.appendChild(document.createTextNode(`Risk Level: ${threshold.level}`));
        riskText.style.color = threshold.color;


    } else {
        showBudgetContent();
    }
}


// Run 2 seconds after load to ensure Amazon's dynamic prices have appeared
setTimeout(init, 1000);
