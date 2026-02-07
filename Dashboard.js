// 1. Create a container for our "Reality Check"
const overlay = document.createElement('div');
overlay.style.cssText = "position:fixed; top:10%; right:10%; width:400px; z-index:9999; background:white; border:2px solid #333; padding:20px; box-shadow: 10px 10px 0px #000;";

var budget = 200;

// 2. Add a Title and the Canvas
overlay.innerHTML = `
    <h2 style="margin-top:0">Monthly Budget Impact</h2>
    <p>This purchase represents a new slice in your monthly spending.</p>
    <canvas id="budgetChart" width="200" height="200"></canvas>
    <button id="closeOverlay" style="margin-top:10px">I understand, let me shop</button>
`;

document.body.appendChild(overlay);

// 3. Add close button logic first (before chart initialization)
document.getElementById('closeOverlay').addEventListener('click', () => {
    console.log('Overlay closed by user');
    overlay.remove();
});

// 4. Initialize the Chart
const ctx = document.getElementById('budgetChart').getContext('2d');
new Chart(ctx, {
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
});