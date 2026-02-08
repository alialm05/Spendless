//import "./chart.js"
const overlay = document.createElement('div');
//overlay.style.cssText = `position:fixed; top:10%; right:10%; width:400px; z-index:9999; background:white;  border:2px solid #333; padding:20px; box-shadow: 10px 10px 0px #000;`;
overlay.className = "budgetOverlay";

// Remove require - utils.js functions are now available globally
// Make sure utils.js is loaded before this script

const BUDGET = 300;


// 2. Add a Title and the Canvas
overlay.innerHTML = `
    <h2 style="margin-top:0">Monthly Budget Impact</h2>
    <p>This purchase represents a new slice in your monthly spending.</p>
    <h1 id="overlayTitle"></h1>
    <h2 id="budgetStatus"></h2>
    <canvas id="budgetChart" width="250" height="250" style="max-width:250px;max-height:250px;"></canvas>
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
    audio.volume = 0.75;
    audio.play();
});

function createChart(purchase, moneyLeft){
    const ctx = document.getElementById('budgetChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Budget', 'THIS PURCHASE'],
            datasets: [{
                data: [moneyLeft, purchase], // You'll replace 150 with your scraped price!
                backgroundColor: ['#02c282', '#FF0000'] // Green for the budget, Red for the new purchase!
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
function init() {

    console.log('Initializing content script...');

    const totalAmount = findOrderTotal();
    console.log('Total amount found:', totalAmount);
    if (totalAmount) {
        console.log("Price Detected:", totalAmount);

        //showBudgetImpact(totalAmount);
        const overlayTitle = document.getElementById('overlayTitle');
        overlayTitle.appendChild(document.createTextNode(`You are spending $${totalAmount.toFixed(2)}.`)); 

        const pUsed = calculateBudgetRisk(BUDGET, totalAmount);
        const riskText = document.getElementById('budgetStatus');

        const riskU = getRiskLevel(pUsed);

        createChart(BUDGET - totalAmount, totalAmount);

        // image/gif
        const image = document.createElement('img');
        image.src = chrome.runtime.getURL(`resources/200.gif`);
        image.style.width = '100px';
        image.style.height = '100px';
        overlay.appendChild(image);

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
