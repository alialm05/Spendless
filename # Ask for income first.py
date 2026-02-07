# ----------------------------
# Multi-Debt Budget & Planning Tool
# ----------------------------

# --- FUNCTIONS ---

def get_income():
    return float(input("Enter your monthly income: $"))

def get_multiple_debts():
    debts = []
    has_debt = input("Do you have any monthly debt payments? (y/n): ").lower()
    if has_debt == "y":
        num_debts = int(input("How many debts do you have? "))
        for i in range(1, num_debts + 1):
            print(f"\nDebt {i}:")
            name = input("Enter the name of the debt (e.g., Credit Card, Loan): ")
            monthly_payment = float(input("Enter monthly payment: $"))
            total_amount = float(input("Enter total debt amount: $"))
            months_to_payoff = total_amount / monthly_payment if monthly_payment > 0 else float('inf')
            print(f"Estimated payoff time: {round(months_to_payoff, 1)} months")
            debts.append({"name": name, "monthly_payment": monthly_payment, "total_amount": total_amount})
    return debts

def total_monthly_debt(debts):
    return sum(d['monthly_payment'] for d in debts)

def allocate_categories(categories, leftover):
    allocations = []
    print(f"\nAllocating money for: {', '.join(categories)}")
    for category in categories:
        answer = input(f"Do you want to allocate money to {category}? (y/n): ").lower()
        if answer == "y":
            amount = float(input(f"How much will you allocate to {category}? $"))
            allocations.append(amount)
        else:
            allocations.append(0)
    total_allocated = sum(allocations)
    leftover -= total_allocated
    return allocations, leftover

goal_allocations = {
    1: 0.8,  # Save
    2: 0.3,  # Spend on wants
    3: 0.5,  # Save & spend
    4: 0.7   # Extra debt payment
}

def calculate_recommended(goal, leftover):
    return leftover * goal_allocations.get(goal, 0)

def allocate_leftover_after_goal(leftover, goal, on_track):
    recommended = calculate_recommended(goal, leftover)
    money_left_after_goal = leftover - recommended
    savings = 0
    if goal == 4 and on_track.lower() == "y" and money_left_after_goal > 0:
        savings = money_left_after_goal
        money_left_after_goal -= savings
        print(f"\nSince you're on track with debt, it's recommended to save: ${round(savings,2)}")
    return recommended, savings, money_left_after_goal

def allocate_wants(money_left, categories=None):
    if categories is None:
        categories = ["Entertainment", "Dining Out", "Shopping", "Travel"]
    allocations = []
    print("\nWants Spending Checklist")
    for category in categories:
        answer = input(f"Do you want to spend money on {category}? (y/n): ").lower()
        if answer == "y":
            amount = float(input(f"How much will you allocate to {category}? $"))
            allocations.append(amount)
        else:
            allocations.append(0)
    total = sum(allocations)
    if total > money_left:
        print("\nWarning: Allocated more than available money! Adjusting proportionally.")
        allocations = [round(x * money_left / total, 2) for x in allocations]
    return dict(zip(categories, allocations))

def extra_debt_payment_process(debts, leftover):
    print("\n--- Extra Debt Payment Allocation ---")
    print("Current debts:")
    for i, d in enumerate(debts, 1):
        print(f"{i}. {d['name']} - Remaining: ${d['total_amount']}")
    recommended_extra = leftover
    print(f"\nYou have ${round(leftover,2)} to allocate toward extra debt payments.")
    allocations = []
    for d in debts:
        if recommended_extra <= 0:
            allocations.append(0)
            continue
        amount = float(input(f"How much extra to pay toward {d['name']} (max ${round(recommended_extra,2)}): $"))
        amount = min(amount, recommended_extra)
        allocations.append(amount)
        recommended_extra -= amount
    print("\nExtra debt payment allocations:")
    for i, d in enumerate(debts):
        print(f"{d['name']}: ${allocations[i]}")
    leftover_after_extra = recommended_extra
    return allocations, leftover_after_extra

# --- MAIN SCRIPT ---

# 1. Income
income = get_income()

# 2. Debts
debts = get_multiple_debts()
monthly_debt_total = total_monthly_debt(debts)
income_after_debt = income - monthly_debt_total

# 3. Essentials
essentials_categories = ["Rent", "Food", "Utilities", "Transportation", "Internet", "Insurance", "Other Essentials"]
essentials_allocations, leftover = allocate_categories(essentials_categories, income_after_debt)

print("\nMoney left after essentials and debt: $", round(leftover, 2))

# 4. Goal
if leftover > 0:
    print("\nWhat is your main financial goal for the leftover money?")
    print("1 - Save money")
    print("2 - Spend on wants")
    print("3 - Save and spend")
    if debts:
        print("4 - Pay off more debt")
    
    goal = int(input("Enter 1, 2, 3, or 4: "))
    
    if goal == 4 and debts:
        extra_allocations, leftover_after_extra = extra_debt_payment_process(debts, leftover)
        money_leftover = leftover_after_extra
        recommended = sum(extra_allocations)
        savings = 0
        print(f"Total extra toward debt: ${recommended}")
    else:
        on_track = input("\nAre you on track to meet your financial goal? (y/n): ")
        recommended, savings, money_leftover = allocate_leftover_after_goal(leftover, goal, on_track)
    
    # 5. Output Plan
    print("\n--- Updated Plan ---")
    if goal == 4 and debts:
        for i, d in enumerate(debts):
            print(f"Extra toward {d['name']}: ${extra_allocations[i]}")
    else:
        print("Monthly amount toward goal: $", round(recommended, 2))
    if savings > 0:
        print("Automatically saved: $", round(savings, 2))
    print("Money remaining after goal: $", round(money_leftover, 2))
    
    # 6. Wants allocation
    if money_leftover > 0:
        use_wants = input("\nDo you want to allocate any remaining money into spending categories? (y/n): ")
        if use_wants.lower() == "y":
            wants_allocations = allocate_wants(money_leftover)
            print("\nYour wants allocations:")
            for category, amount in wants_allocations.items():
                print(f"{category}: ${amount}")
else:
    print("\nNo leftover money after debt and essentials. Focus on essentials and debt repayment first.")
