//import "./chart.js"
const BUDGET = 300;
const overlayHolder = document.createElement('div');
overlayHolder.style.all = "initial";
document.body.appendChild(overlayHolder);

const overlay = document.createElement('div');
overlay.className = "budgetOverlay";

overlay.innerHTML = `
    <h1 style="margin-top:0">Monthly Budget Impact</h2>
    <p>This purchase represents a new slice in your monthly spending.</p>
    <h1 id="overlayTitle"></h1>
    <h2 id="budgetStatus"></h2>
    <canvas id="budgetChart" width="250" height="250" style="max-width:250px;max-height:250px;"></canvas>
    <button id="closeOverlay" data-risk="" style="display:none">I understand, let me shop</button>
`;

overlayHolder.appendChild(overlay);

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
                data: [moneyLeft, purchase], 
                backgroundColor: ['#02c282', '#FF0000']
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

        const threshold = getRiskLevel(pUsed);

        createChart(Math.max(1, BUDGET - totalAmount), totalAmount);

        // image/gif
        const image = document.createElement('img');
        console.log('Displaying image for risk level:', threshold.image);
        image.src = chrome.runtime.getURL(threshold.image);
        image.style.width = '100px';
        image.style.height = '100px';
        overlay.appendChild(image);

        closeOverlay = document.getElementById('closeOverlay');
        closeOverlay.style.display = 'block';
        closeOverlay.dataset.risk = threshold.threshold;


        overlay.appendChild(closeOverlay);

        riskText.appendChild(document.createTextNode(`Risk Level: ${threshold.level}`));
        riskText.style.color = threshold.color;

    }
}


// Run 2 seconds after load to ensure Amazon's dynamic prices have appeared
setTimeout(init, 1000);
