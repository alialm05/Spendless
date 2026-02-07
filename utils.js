// Better approach: Define risk thresholds in ascending order
class Threshold {
    constructor(threshold, level, color, message) {
        this.threshold = threshold;
        this.level = level;
        this.color = color;
        this.message = message;
    }
}

const riskThresholds = [
    new Threshold(0, 'Low', '#4CAF50', 'Safe spending level'),
    new Threshold(15, 'Medium', '#FFC107', 'Moderate spending - monitor closely'),
    new Threshold(25, 'High', '#FF9800', 'High spending - consider reducing'),
    new Threshold(40, 'Critical', '#F44336', 'Critical level - immediate action needed'),
];


function getRiskLevel(percentage) {

    let currThreshold = riskThresholds[0];

    for (t of riskThresholds) {
        if (percentage >= t.threshold) {
            currThreshold = t;
        }else{
            break;
        }
    }
    return { level: currThreshold.level, color: currThreshold.color, message: currThreshold.message };
}

function calculateBudgetRisk(currentBudget, spendingAmount) {
    const percentageUsed = (spendingAmount / currentBudget) * 100;
    return percentageUsed
}

// Make functions available globally for browser environment
if (typeof window !== 'undefined') {
    window.calculateBudgetRisk = calculateBudgetRisk;
    window.riskThresholds = riskThresholds;
}
