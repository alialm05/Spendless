// Multi-step wizard implementing the Python logic from the prompt
const steps = [];
let state = {
    income: 0,
    debts: [],
    essentials_allocations: [],
    leftover_after_essentials: 0,
    goal: 1,
    on_track: 'n',
    extra_allocations: [],
    recommended: 0,
    savings: 0,
    money_leftover: 0,
    wants_allocations: {},
};

function saveStateExtensionData(value) {
    chrome.storage.local.set({ data : value }).then()
}

function loadStateExtensionData(key) {
    chrome.storage.local.get([key]).then((result) => {
       return result; 
    });
}

function resetStateExtensionData() {
    saveStateExtensionData(0);
}

const goal_allocations = {1: 0.8, 2: 0.3, 3: 0.5, 4: 0.7};

// utility helpers
function $(id) { return document.getElementById(id); }

// populate dynamic sections
const essentialsCategories = ["Rent", "Food", "Utilities", "Transportation", "Internet", "Insurance", "Other Essentials"];
const wantsCategories = ["Entertainment", "Dining Out", "Shopping", "Travel"];

function createEssentialsFields() {
    const container = $('essentials');
    container.innerHTML = '';
    essentialsCategories.forEach((cat, idx) => {
        const leftDiv = document.createElement('div');
        const label = document.createElement('label');
        label.textContent = `Do you want to allocate money to ${cat}? (enter amount if yes)`;
        label.style.fontSize = '14px';
        leftDiv.appendChild(label);

        const rightDiv = document.createElement('div');
        rightDiv.style.display = 'flex';
        rightDiv.style.alignItems = 'center';
        rightDiv.style.gap = '4px';

        const dollarSign = document.createElement('span');
        dollarSign.textContent = '$';
        dollarSign.style.fontWeight = '600';
        dollarSign.style.color = 'var(--accent)';

        const amt = document.createElement('input');
        amt.type = 'number'; amt.min = 0; amt.step = '0.01'; amt.placeholder = 'amount';
        amt.style.width = '100px'; amt.style.marginLeft = '0px';
        amt.dataset.idx = idx;
        rightDiv.appendChild(dollarSign);
        rightDiv.appendChild(amt);

        container.appendChild(leftDiv);
        container.appendChild(rightDiv);
    });
}

function createWantsFields() {
    const container = $('wants');
    // Clear only the wants rows, keep the header
    const header = container.querySelector('#wantsBudgetHeader');
    container.innerHTML = '';
    if (header) container.appendChild(header);

    wantsCategories.forEach((cat, idx) => {
        const row = document.createElement('div');
        row.className = 'wants-row';

        const labelDiv = document.createElement('div');
        labelDiv.className = 'wants-row-label';
        labelDiv.textContent = cat;

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'wants-row-input-wrapper';

        const dollarSign = document.createElement('span');
        dollarSign.textContent = '$';

        const amt = document.createElement('input');
        amt.type = 'number';
        amt.min = 0;
        amt.step = '0.01';
        amt.placeholder = '0.00';
        amt.dataset.idx = idx;
        amt.dataset.category = cat;

        // Real-time input validation and budget tracking
        amt.addEventListener('input', (e) => { updateWantsBudgetTracking(e); updateRealtimeFeedback(); });

        inputWrapper.appendChild(dollarSign);
        inputWrapper.appendChild(amt);

        row.appendChild(labelDiv);
        row.appendChild(inputWrapper);

        container.appendChild(row);
    });
}

function updateWantsBudgetTracking(event) {
    const wantsContainer = $('wants');
    const inputs = wantsContainer.querySelectorAll('input[data-idx]');

    // Calculate total wants currently entered
    let totalWantsEntered = 0;
    inputs.forEach(input => {
        totalWantsEntered += parseFloat(input.value) || 0;
    });

    // Get the maximum wants budget (calculated during Calculate click)
    const maxWantsBudget = parseFloat(wantsContainer.dataset.maxBudget) || 0;
    const remaining = Math.max(0, maxWantsBudget - totalWantsEntered);

    // Update the remaining display
    const remainingEl = $('wantsBudgetRemaining');
    if (remainingEl) {
        remainingEl.textContent = `$${remaining.toFixed(2)}`;
        remainingEl.style.color = totalWantsEntered > maxWantsBudget ? '#ef4444' : 'white';
    }

    // Show/hide warning
    const warningEl = $('wantsBudgetWarning');
    if (totalWantsEntered > maxWantsBudget && maxWantsBudget > 0) {
        warningEl.style.display = 'block';
    } else {
        warningEl.style.display = 'none';
    }

    // Cap input values at remaining budget (prevent overspending per field)
    if (totalWantsEntered > maxWantsBudget && maxWantsBudget > 0 && event && event.target) {
        // This input would exceed budget, cap it
        const currentInput = event.target;
        const currentValue = parseFloat(currentInput.value) || 0;
        const othersTotal = totalWantsEntered - currentValue;
        const allowedForThis = Math.max(0, maxWantsBudget - othersTotal);

        if (currentValue > allowedForThis) {
            currentInput.value = allowedForThis.toFixed(2);
            // Re-run tracker using the adjusted input as the event source
            updateWantsBudgetTracking({ target: currentInput });
        }
    }
}

// Debts management: user is asked "Do you have any monthly debt payments? (y/n):"
function showDebtsStep() {
    const debtsList = $('debtsList');
    debtsList.innerHTML = '';

    const question = document.createElement('div');
    question.textContent = 'Enter your monthly debt payments (leave count 0 if none):';
    debtsList.appendChild(question);

    const numDiv = document.createElement('div');
    numDiv.style.marginTop = '8px';
    const numLabel = document.createElement('label');
    numLabel.textContent = 'How many debts do you have? ';
    const numInput = document.createElement('input');
    numInput.type = 'number'; numInput.min = 0; numInput.value = 0; numInput.style.width = '80px'; numInput.style.marginLeft = '8px';
    numInput.id = 'debtsCount';
    numDiv.appendChild(numLabel);
    numDiv.appendChild(numInput);
    debtsList.appendChild(numDiv);

    const createBtn = document.createElement('button');
    createBtn.type = 'button';
    createBtn.textContent = 'Create Debt Entries';
    createBtn.className = 'primary';
    createBtn.style.marginTop = '8px';
    debtsList.appendChild(createBtn);

    const entriesDiv = document.createElement('div');
    entriesDiv.style.display = 'flex'; entriesDiv.style.flexDirection = 'column'; entriesDiv.style.gap = '8px'; entriesDiv.style.marginTop = '8px';
    debtsList.appendChild(entriesDiv);

    createBtn.addEventListener('click', () => {
        entriesDiv.innerHTML = '';
        const count = parseInt(numInput.value) || 0;
        for (let i = 1; i <= count; i++) {
            const box = document.createElement('div');
            box.className = 'debt-row';
            box.style.display = 'flex'; box.style.gap = '8px'; box.style.alignItems = 'center';

            const name = document.createElement('input'); name.placeholder = `Debt ${i} name`; name.style.width = '160px';

            const monthlyWrapper = document.createElement('div');
            monthlyWrapper.style.display = 'flex';
            monthlyWrapper.style.alignItems = 'center';
            monthlyWrapper.style.gap = '4px';
            const monthlyDollar = document.createElement('span');
            monthlyDollar.textContent = '$';
            monthlyDollar.style.fontWeight = '600';
            monthlyDollar.style.color = 'var(--accent)';
            const monthly = document.createElement('input'); monthly.type = 'number'; monthly.placeholder = 'monthly payment'; monthly.min = 0; monthly.step = '0.01'; monthly.style.width = '130px';
            monthlyWrapper.appendChild(monthlyDollar);
            monthlyWrapper.appendChild(monthly);

            const totalWrapper = document.createElement('div');
            totalWrapper.style.display = 'flex';
            totalWrapper.style.alignItems = 'center';
            totalWrapper.style.gap = '4px';
            const totalDollar = document.createElement('span');
            totalDollar.textContent = '$';
            totalDollar.style.fontWeight = '600';
            totalDollar.style.color = 'var(--accent)';
            const total = document.createElement('input'); total.type = 'number'; total.placeholder = 'total debt amount'; total.min = 0; total.step = '0.01'; total.style.width = '150px';
            totalWrapper.appendChild(totalDollar);
            totalWrapper.appendChild(total);

            const payoff = document.createElement('span'); payoff.style.marginLeft = '8px'; payoff.style.color = '#555';

            const updatePayoff = () => {
                const m = parseFloat(monthly.value) || 0;
                const t = parseFloat(total.value) || 0;
                const months = m > 0 ? (t / m) : Infinity;
                payoff.textContent = isFinite(months) ? `Estimated payoff time: ${Math.round(months*10)/10} months` : 'Estimated payoff time: ∞';
            };

            monthly.addEventListener('input', updatePayoff);
            total.addEventListener('input', updatePayoff);

            box.appendChild(name); box.appendChild(monthlyWrapper); box.appendChild(totalWrapper); box.appendChild(payoff);
            entriesDiv.appendChild(box);
        }
    });

    // controls enabled by default (user inputs count)
    numInput.disabled = false; createBtn.disabled = false;
}

// wizard navigation
function showSection(id) {
    document.querySelectorAll('#planningForm > section, #planningForm > div, #planningForm > h3').forEach(n => n.style.display = 'none');
    // show the entire form (we control visibility inside)
}


// initialize fields
createEssentialsFields();
createWantsFields();
showDebtsStep();

// Real-time budget feedback
function updateRealtimeFeedback() {
    const income = parseFloat($('income').value) || 0;

    // Debts - determine monthly debt total if entries exist
    const debtsListDiv = $('debtsList');
    const countVal = debtsListDiv.querySelector('#debtsCount') ? (parseInt(debtsListDiv.querySelector('#debtsCount').value) || 0) : 0;
    let monthlyDebtTotal = 0;
    if (countVal > 0) {
        const allDivs = debtsListDiv.querySelectorAll('div');
        const entriesDiv = allDivs[allDivs.length - 1];
        if (entriesDiv) {
            const boxes = entriesDiv.children;
            for (const b of boxes) {
                const ins = b.querySelectorAll('input');
                if (ins.length >= 2) {
                    monthlyDebtTotal += parseFloat(ins[1].value) || 0;
                }
            }
        }
    }

    // Essentials total
    let essentialsTotal = 0;
    const essentialsContainer = $('essentials');
    const essentialAmounts = essentialsContainer.querySelectorAll('input[data-idx]');
    essentialAmounts.forEach(input => { essentialsTotal += parseFloat(input.value) || 0; });

    // Calculate leftover AFTER fixed expenses (debt + essentials) - this is shown BEFORE wants
    const leftover_after_fixed_live = Math.max(0, income - (monthlyDebtTotal + essentialsTotal));

    // Determine active goal and reservation percentage
    const activeGoal = parseInt(document.querySelector('.goal-btn.active')?.dataset.goal) || 1;
    const reservationMap = {1:75,2:5,3:50,4:70};
    const reservedPct = reservationMap[activeGoal] || 75;

    // Max wants budget available BEFORE wants are entered
    const maxWantsBudget = Math.max(0, leftover_after_fixed_live * (1 - (reservedPct/100)));

    // Update wants header (visible before Calculate)
    const wantsContainer = $('wants');
    const wantsBudgetHeader = wantsContainer.querySelector('#wantsBudgetHeader');
    const wantsBudgetGoalName = $('wantsBudgetGoalName');
    const wantsBudgetMax = $('wantsBudgetMax');
    const wantsBudgetRemaining = $('wantsBudgetRemaining');
    if (income > 0 && wantsBudgetHeader) {
        wantsBudgetHeader.style.display = 'block';
        const goalNameDisplay = activeGoal === 1 ? 'Save money (75% reserved)'
            : activeGoal === 2 ? 'Spend on wants (5% reserved)'
            : activeGoal === 3 ? 'Save and spend (50% reserved)'
            : 'Pay off debt (70% reserved)';
        wantsBudgetGoalName.textContent = goalNameDisplay;
        wantsBudgetMax.textContent = `$${maxWantsBudget.toFixed(2)}`;
        // store max budget for wants live tracking
        wantsContainer.dataset.maxBudget = maxWantsBudget.toString();
    } else if (wantsBudgetHeader) {
        wantsBudgetHeader.style.display = 'none';
        wantsContainer.dataset.maxBudget = '0';
    }

    // Update remaining after current wants inputs
    const wantInputs = wantsContainer.querySelectorAll('input[data-idx]');
    let totalWantsEntered = 0;
    wantInputs.forEach(i => totalWantsEntered += parseFloat(i.value) || 0);
    const remainingForWants = Math.max(0, maxWantsBudget - totalWantsEntered);
    if (wantsBudgetRemaining) {
        wantsBudgetRemaining.textContent = `$${remainingForWants.toFixed(2)}`;
        wantsBudgetRemaining.style.color = totalWantsEntered > maxWantsBudget ? '#ef4444' : 'white';
    }

    // Show/hide wants warning
    const warningEl = $('wantsBudgetWarning');
    if (totalWantsEntered > maxWantsBudget && maxWantsBudget > 0) {
        warningEl.style.display = 'block';
    } else {
        warningEl.style.display = 'none';
    }

    // Overall realtime money left (income - all current entries)
    let wantsTotal = totalWantsEntered;
    const totalSpent = monthlyDebtTotal + essentialsTotal + wantsTotal;
    const moneyLeft = income - totalSpent;

    const feedbackEl = $('realtimeFeedback');
    const feedbackText = $('feedbackText');
    if (income > 0) {
        feedbackEl.style.display = 'block';
        // Keep percent based coloring for overall buffer
        const percentLeft = (moneyLeft / income) * 100;
        feedbackEl.className = '';
        if (moneyLeft < 0) {
            feedbackEl.classList.add('danger');
            feedbackText.textContent = `🔴 Over Budget: -$${Math.abs(moneyLeft).toFixed(2)}`;
        } else if (percentLeft < 10) {
            feedbackEl.classList.add('tight');
            feedbackText.textContent = `🟡 Tight Budget: $${moneyLeft.toFixed(2)} remaining`;
        } else {
            feedbackEl.classList.add('safe');
            feedbackText.textContent = `🟢 Healthy: $${moneyLeft.toFixed(2)} remaining`;
        }
    } else {
        feedbackEl.style.display = 'none';
    }
}

// Attach real-time listeners
$('income').addEventListener('input', updateRealtimeFeedback);

// Update when essentials/wants/debts change
const formEl = $('planningForm');
formEl.addEventListener('input', (e) => {
    if (e.target.type === 'number') {
        updateRealtimeFeedback();
    }
});

// initialize fields

// main calculation flow executed when user clicks Calculate & Show Chart
$('calculate').addEventListener('click', () => {
    // 1. Income
    const income = parseFloat($('income').value) || 0;
    state.income = income;

    // 2. Debts: read debtsList entries if user created them (count > 0)
    state.debts = [];
    const debtsListDiv = $('debtsList');
    const countInput = debtsListDiv.querySelector('#debtsCount');
    const countVal = countInput ? (parseInt(countInput.value) || 0) : 0;
    if (countVal > 0) {
        const allDivs = debtsListDiv.querySelectorAll('div');
        const entriesDiv = allDivs[allDivs.length - 1];
        if (entriesDiv) {
            const boxes2 = entriesDiv.children;
            for (const b of boxes2) {
                const ins = b.querySelectorAll('input');
                if (ins.length >= 3) {
                    const name = ins[0].value || 'Debt';
                    const monthly_payment = parseFloat(ins[1].value) || 0;
                    const total_amount = parseFloat(ins[2].value) || 0;
                    state.debts.push({name, monthly_payment, total_amount});
                }
            }
        }
    }

    function total_monthly_debt(debts) { return debts.reduce((s,d)=>s+(d.monthly_payment||0),0); }
    const monthly_debt_total = total_monthly_debt(state.debts);
    const income_after_debt = income - monthly_debt_total;

    // Debt health analysis: per-debt payoff months and overall suggestion
    const debtHealthEl = $('debtHealth');
    let debtHealthHtml = '';
    if (state.debts.length === 0) {
        debtHealthHtml = '<div style="color:#9ca3af;font-style:italic;">No debts detected. Great job! 🎉</div>';
    } else {
        let weightedSum = 0, totalAmount = 0;
        state.debts.forEach(d => {
            const m = d.monthly_payment || 0;
            const t = d.total_amount || 0;
            const months = m > 0 ? (t / m) : Infinity;
            debtHealthHtml += `<div><strong>${d.name}</strong>: monthly <strong style="color:var(--accent)">$${m.toFixed(2)}</strong>, total <strong>$${t.toFixed(2)}</strong> → payoff: <strong style="color:var(--muted)">${isFinite(months) ? (Math.round(months*10)/10) + 'mo' : '∞'}</strong></div>`;
            if (isFinite(months)) { weightedSum += months * t; totalAmount += t; }
        });
        const weightedAvgMonths = totalAmount ? (weightedSum / totalAmount) : Infinity;
        debtHealthHtml += `<div>Total monthly payments: <strong style="color:var(--accent)">$${monthly_debt_total.toFixed(2)}</strong></div>`;
        debtHealthHtml += `<div>Weighted payoff time: <strong style="color:var(--accent)">${isFinite(weightedAvgMonths) ? (Math.round(weightedAvgMonths*10)/10) + ' months' : '∞'}</strong></div>`;

        // heuristics for being 'on track'
        const onTrackByPaymentRatio = income > 0 ? (monthly_debt_total <= income * 0.25) : false;
        const onTrackByDuration = isFinite(weightedAvgMonths) ? (weightedAvgMonths <= 36) : false;
        const suggestedOnTrack = onTrackByPaymentRatio || onTrackByDuration;

        if (suggestedOnTrack) {
            debtHealthHtml += `<div class="on-track">✓ <strong>You're on track!</strong> Payments are manageable and payoff is within ~3 years. Keep it up!</div>`;
        } else {
            debtHealthHtml += `<div class="at-risk">⚠ <strong>Action needed:</strong> Consider increasing payments, prioritizing high-interest debt, or exploring refinancing to accelerate payoff.</div>`;
        }
    }
    if (debtHealthEl) debtHealthEl.innerHTML = debtHealthHtml;

    // 3. Essentials: read allocations
    const essentialsContainer = $('essentials');
    let essentials_allocations = [];
    for (let i=0;i<essentialsCategories.length;i++) {
        const amtInput = essentialsContainer.querySelector(`input[data-idx="${i}"]`);
        const amount = amtInput ? (parseFloat(amtInput.value) || 0) : 0;
        essentials_allocations.push(amount);
    }
    state.essentials_allocations = essentials_allocations;

    // Calculate leftover AFTER fixed expenses (debt + essentials)
    const fixedExpensesTotal = monthly_debt_total + essentials_allocations.reduce((a,b)=>a+b,0);
    let leftover_after_fixed = income - fixedExpensesTotal;
    state.leftover_after_essentials = leftover_after_fixed;

    // Store these for output clarity
    state.fixed_expenses_total = Math.round(fixedExpensesTotal*100)/100;
    state.leftover_after_fixed = Math.round(leftover_after_fixed*100)/100;

    // 4. Goal Selection (only matters if leftover > 0)
    const goal = leftover_after_fixed > 0 ? (parseInt(document.querySelector('.goal-btn.active')?.dataset.goal) || 1) : 0;
    state.goal = goal;
    const on_track = 'n';  // Removed on track field
    state.on_track = on_track;

    // Initialize allocation variables
    let extra_allocations = [];
    let goal_allocation_amount = 0;  // Amount allocated toward goal
    let goal_percentage = 0;         // Percentage automatically reserved
    let savings = 0;                   // Amount saved
    let money_leftover = leftover_after_fixed;  // Money remaining after goal allocation

    if (leftover_after_fixed <= 0) {
        // No leftover; nothing to allocate or spend
        goal_allocation_amount = 0;
        goal_percentage = 0;
        savings = 0;
        money_leftover = 0;
    } else {
        // Leftover exists; allocate based on goal with fixed percentages
        if (goal === 1) {
            // Goal 1: Save money - automatically save 75%
            goal_percentage = 75;
            goal_allocation_amount = leftover_after_fixed * 0.75;
            savings = goal_allocation_amount;
            money_leftover = leftover_after_fixed - savings;
        } else if (goal === 2) {
            // Goal 2: Spend on wants - automatically save 5%
            goal_percentage = 5;
            goal_allocation_amount = leftover_after_fixed * 0.05;
            savings = goal_allocation_amount;
            money_leftover = leftover_after_fixed - savings;
        } else if (goal === 3) {
            // Goal 3: Save and spend - automatically save 50%
            goal_percentage = 50;
            goal_allocation_amount = leftover_after_fixed * 0.50;
            savings = goal_allocation_amount;
            money_leftover = leftover_after_fixed - savings;
        } else if (goal === 4 && state.debts.length > 0) {
            // Goal 4: Pay off more debt - automatically apply 70%
            goal_percentage = 70;
            const extraAllocInputs = $('extraAllocInputs');
            extra_allocations = [];
            if (extraAllocInputs) {
                const inputs = extraAllocInputs.querySelectorAll('input');
                for (let i=0;i<inputs.length;i++) {
                    extra_allocations.push(parseFloat(inputs[i].value) || 0);
                }
            }
            // Calculate total from user inputs or auto-allocate 70% proportionally to debts
            let totalRequested = extra_allocations.reduce((a,b)=>a+b,0);
            if (totalRequested === 0) {
                // Auto-allocate 70% proportionally based on debt amounts
                const availableForDebt = leftover_after_fixed * 0.70;
                const totalDebtAmount = state.debts.reduce((s,d)=>s+(d.total_amount||0),0);
                extra_allocations = state.debts.map(d => {
                    const proportion = totalDebtAmount > 0 ? (d.total_amount || 0) / totalDebtAmount : 0;
                    return Math.round(availableForDebt * proportion * 100) / 100;
                });
                goal_allocation_amount = availableForDebt;
            } else {
                // Use user inputs but cap at 70%
                const maxAllowable = leftover_after_fixed * 0.70;
                if (totalRequested > maxAllowable) {
                    // Scale down proportionally
                    const factor = maxAllowable / totalRequested;
                    for (let i=0;i<extra_allocations.length;i++) {
                        extra_allocations[i] = Math.round(extra_allocations[i]*factor*100)/100;
                    }
                    goal_allocation_amount = maxAllowable;
                } else {
                    goal_allocation_amount = totalRequested;
                }
            }
            savings = 0;
            money_leftover = leftover_after_fixed - goal_allocation_amount;
        } else {
            // Fallback: save 75% if goal selection is invalid
            goal_percentage = 75;
            goal_allocation_amount = leftover_after_fixed * 0.75;
            savings = goal_allocation_amount;
            money_leftover = leftover_after_fixed - savings;
        }
    }

    state.extra_allocations = extra_allocations;
    state.goal_allocation_amount = Math.round(goal_allocation_amount*100)/100;
    state.goal_percentage = goal_percentage;
    state.savings = Math.round(savings*100)/100;
    state.money_leftover = Math.round(money_leftover*100)/100;

    // Update the wants budget header to show user's budget
    const wantsContainer = $('wants');
    const wantsBudgetHeader = wantsContainer.querySelector('#wantsBudgetHeader');
    const wantsBudgetGoalName = $('wantsBudgetGoalName');
    const wantsBudgetMax = $('wantsBudgetMax');
    const wantsBudgetRemaining = $('wantsBudgetRemaining');

    if (state.money_leftover > 0) {
        // Show the header
        wantsBudgetHeader.style.display = 'block';

        // Set goal name
        let goalNameDisplay = '';
        switch(state.goal) {
            case 1: goalNameDisplay = 'Save money (75% reserved)'; break;
            case 2: goalNameDisplay = 'Spend on wants (5% reserved)'; break;
            case 3: goalNameDisplay = 'Save and spend (50% reserved)'; break;
            case 4: goalNameDisplay = 'Pay off debt (70% reserved)'; break;
            default: goalNameDisplay = 'Unknown goal'; break;
        }
        wantsBudgetGoalName.textContent = goalNameDisplay;

        // Set budget amounts
        wantsBudgetMax.textContent = `$${state.money_leftover.toFixed(2)}`;
        wantsBudgetRemaining.textContent = `$${state.money_leftover.toFixed(2)}`;

        // Store max budget on container for real-time tracking
        wantsContainer.dataset.maxBudget = state.money_leftover.toString();
    } else {
        // Hide the header if no budget
        wantsBudgetHeader.style.display = 'none';
        wantsContainer.dataset.maxBudget = '0';
    }

    // 6. Wants (only if money_leftover > 0 after goal allocation)
    let wants_allocations = {};
    if (state.money_leftover > 0) {
        // read wants fields
        const wantsContainer = $('wants');
        let totalWants = 0;
        for (let i=0;i<wantsCategories.length;i++) {
            const amountInput = wantsContainer.querySelector(`input[data-idx="${i}"]`);
            const amount = amountInput ? (parseFloat(amountInput.value) || 0) : 0;
            wants_allocations[wantsCategories[i]] = amount;
            totalWants += amount;
        }
        if (totalWants > state.money_leftover) {
            // adjust proportionally
            const factor = state.money_leftover / totalWants;
            for (const k of Object.keys(wants_allocations)) {
                wants_allocations[k] = Math.round(wants_allocations[k]*factor*100)/100;
            }
            totalWants = state.money_leftover;
        }
        state.wants_allocations = wants_allocations;
        state.money_leftover = Math.round((state.money_leftover - totalWants)*100)/100;
    }

    // prepare summary text with clear goal allocation breakdown
    let summary = '';
    summary += `Income: $${income}\n`;
    summary += `\n──── FIXED EXPENSES ────\n`;
    summary += `Monthly debt payments total: $${monthly_debt_total}\n`;
    summary += `Essentials allocations:\n`;
    essentialsCategories.forEach((c,i) => {
        if (essentials_allocations[i] > 0) {
            summary += `  ${c}: $${essentials_allocations[i]}\n`;
        }
    });
    summary += `Total fixed expenses: $${state.fixed_expenses_total}\n`;
    summary += `\n──── LEFTOVER CALCULATION ────\n`;
    summary += `Income - Fixed Expenses = Leftover for goals/wants\n`;
    summary += `$${income} - $${state.fixed_expenses_total} = $${state.leftover_after_fixed}\n`;

    if (state.leftover_after_fixed > 0) {
        summary += `\n──── GOAL ALLOCATION ────\n`;
        let goalName = '';
        let goalDescription = '';
        switch(state.goal) {
            case 1:
                goalName = 'Save money';
                goalDescription = '75% automatically reserved for savings';
                break;
            case 2:
                goalName = 'Spend on wants';
                goalDescription = '5% automatically reserved for savings';
                break;
            case 3:
                goalName = 'Save and spend';
                goalDescription = '50% automatically reserved for savings';
                break;
            case 4:
                goalName = 'Pay off more debt';
                goalDescription = '70% automatically applied to extra debt payments';
                break;
            default:
                goalName = 'Unknown';
                goalDescription = '';
                break;
        }
        summary += `Selected Goal: ${goalName}\n`;
        summary += `\n📊 AUTOMATIC RESERVATION\n`;
        summary += `Percentage reserved: ${state.goal_percentage}%\n`;

        if (state.goal === 4 && state.debts.length > 0) {
            summary += `Amount applied to extra debt: $${state.goal_allocation_amount}\n`;
            if (state.extra_allocations.length > 0 && state.extra_allocations.some(a => a > 0)) {
                summary += `Extra debt payment allocations:\n`;
                for (let i=0;i<state.debts.length;i++) {
                    const alloc = state.extra_allocations[i] || 0;
                    if (alloc > 0) {
                        summary += `  ${state.debts[i].name}: $${alloc.toFixed(2)}\n`;
                    }
                }
            }
        } else {
            summary += `Amount automatically saved: $${state.goal_allocation_amount}\n`;
        }

        summary += `\n💰 SPENDING BALANCE\n`;
        summary += `Leftover: $${state.leftover_after_fixed}\n`;
        summary += `After reservation: $${state.money_leftover}\n`;
        summary += `Remaining available for wants: $${state.money_leftover}\n`;

        if (state.money_leftover > 0) {
            summary += `\n──── DISCRETIONARY SPENDING ────\n`;
            summary += `Maximum available for wants: $${state.money_leftover}\n`;
            if (Object.keys(state.wants_allocations).length > 0) {
                let totalWantsUsed = 0;
                summary += `Your wants allocations:\n`;
                for (const k in state.wants_allocations) {
                    if (state.wants_allocations[k] > 0) {
                        summary += `  ${k}: $${state.wants_allocations[k]}\n`;
                        totalWantsUsed += state.wants_allocations[k];
                    }
                }
                summary += `Total wants: $${totalWantsUsed.toFixed(2)}\n`;
                summary += `Final leftover: $${state.money_leftover}\n`;
            } else {
                summary += `(No wants allocated)\n`;
            }
        } else {
            summary += `\n⚠️ NO SPENDING BALANCE\n`;
            summary += `All remaining funds are reserved for the selected goal. No money available for wants.\n`;
        }
    } else {
        summary += `\n──── NO LEFTOVER ────\n`;
        summary += `All income is consumed by debt and essentials. No funds available for goals or wants.\n`;
    }

    $('summary').textContent = summary;
    $('result').style.display = 'block';

    // Calculate totals for breakdown chart
    const essentialsTotal = essentials_allocations.reduce((a,b)=>a+b,0);
    const wantsTotal = Object.values(state.wants_allocations).reduce((a,b)=>a+b,0);
    const debtTotal = monthly_debt_total;

    // Determine chart status and title
    let chartTitle = 'Budget Breakdown';
    let chartStatus = 'Healthy Budget ✓';
    const percentLeft = income > 0 ? (state.money_leftover / income) * 100 : 0;

    if (income - (essentialsTotal + wantsTotal + debtTotal) < 0) {
        chartStatus = 'Warning: Overspending ⚠️';
    } else if (percentLeft < 10 && percentLeft >= 0) {
        chartStatus = 'Tight Budget ⚠️';
    } else if (state.savings > 0) {
        chartStatus = 'Healthy Budget with Savings ✓';
    }

    const chartCanvas = document.getElementById('expensesChart');
    chartCanvas.style.display = 'block';
    chartCanvas.style.maxWidth = '360px';
    chartCanvas.style.maxHeight = '360px';
    chartCanvas.width = 360;
    chartCanvas.height = 360;
    const ctx = chartCanvas.getContext('2d');
    if (window.finalChart) window.finalChart.destroy();

    // Create chart with meaningful slices
    const chartLabels = [];
    const chartData = [];
    const chartColors = [];

    if (debtTotal > 0) {
        chartLabels.push(`Debt ($${debtTotal.toFixed(2)})`);
        chartData.push(debtTotal);
        chartColors.push('#ef4444');
    }
    if (essentialsTotal > 0) {
        chartLabels.push(`Essentials ($${essentialsTotal.toFixed(2)})`);
        chartData.push(essentialsTotal);
        chartColors.push('#10b981');
    }
    if (wantsTotal > 0) {
        chartLabels.push(`Wants ($${wantsTotal.toFixed(2)})`);
        chartData.push(wantsTotal);
        chartColors.push('#f97316');
    }
    if (state.savings > 0) {
        chartLabels.push(`Savings ($${state.savings.toFixed(2)})`);
        chartData.push(state.savings);
        chartColors.push('#3b82f6');
    }
    if (state.money_leftover > 0 && state.savings === 0) {
        chartLabels.push(`Leftover ($${state.money_leftover.toFixed(2)})`);
        chartData.push(state.money_leftover);
        chartColors.push('#60a5fa');
    }

    window.finalChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: chartLabels,
            datasets: [{ data: chartData, backgroundColor: chartColors, borderColor: '#fff', borderWidth: 2 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: `${chartStatus} (Budget: $${income})` }
            }
        }
    });

    saveStateExtensionData(money_leftover);
});

// Handle goal button clicks
document.querySelectorAll('.goal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        // Remove active class from all buttons
        document.querySelectorAll('.goal-btn').forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');

        const g = parseInt(btn.dataset.goal);
        const extraDiv = $('extraDebtAllocations');
        const extraInputs = $('extraAllocInputs');
        const wantsContainer = $('wants');
        const wantsInputs = wantsContainer.querySelectorAll('input[data-idx]');

        if (g === 4) {
            extraDiv.style.display = 'block';
            // populate inputs for each debt
            extraInputs.innerHTML = '';
            state.debts.forEach(d => {
                const row = document.createElement('div');
                row.style.display = 'flex'; row.style.gap = '8px'; row.style.alignItems = 'center';
                const label = document.createElement('label'); label.textContent = `How much extra to pay toward ${d.name} (max): `;
                const inp = document.createElement('input'); inp.type = 'number'; inp.min = 0; inp.step = '0.01'; inp.style.width = '140px';
                row.appendChild(label); row.appendChild(inp);
                extraInputs.appendChild(row);
            });
            // Disable wants inputs for goal 4 (debt payoff has priority)
            wantsInputs.forEach(input => input.disabled = true);
            wantsInputs.forEach(input => input.style.opacity = '0.5');
        } else {
            extraDiv.style.display = 'none';
            extraInputs.innerHTML = '';
            // Re-enable wants inputs for other goals
            wantsInputs.forEach(input => input.disabled = false);
            wantsInputs.forEach(input => input.style.opacity = '1');
        }

        // Handle input disabling for specific goals (only goal 4 disables wants)
        if (g === 4) {
            wantsInputs.forEach(input => input.disabled = true);
            wantsInputs.forEach(input => input.style.opacity = '0.5');
        } else {
            wantsInputs.forEach(input => input.disabled = false);
            wantsInputs.forEach(input => input.style.opacity = '1');
        }

        // Refresh live feedback and wants header immediately when switching goals
        updateRealtimeFeedback();
    });
});

// Reset button
$('reset').addEventListener('click', () => {
    resetStateExtensionData();
    location.reload();
});
