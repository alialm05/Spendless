# Ask for income first
income = int(input("Enter your monthly income: "))

# Essential spending categories
categories = ["Rent", "Food", "Utilities", "Transportation", "Internet"]
allocations = []

print("\nEssential Spending Checklist")

# Ask how much to allocate to each category
for category in categories:
    answer = input(f"Do you want to allocate money to {category}? (y/n): ")

    if answer.lower() == "y":
        amount = float(input(f"How much will you allocate to {category}? $"))
        allocations.append(amount)
    else:
        allocations.append(0)

# Calculate totals
total_allocated = sum(allocations)
leftover = income - total_allocated

print("\nTotal allocated:", total_allocated)
print("Money left over:", leftover)

# Goals section
print("\nWhat is your main financial goal?")
print("1 - Save money")
print("2 - Spend on wants")
print("3 - Save and spend")

goal = int(input("Enter 1, 2, or 3: "))

# Recommend savings
if goal == 1:
    recommended_savings = leftover * 0.8
elif goal == 2:
    recommended_savings = leftover * 0.3
elif goal == 3:
    recommended_savings = leftover * 0.5
else:
    recommended_savings = 0
    print("Invalid choice")

money_after_saving = leftover - recommended_savings

# Final output
print("\nSavings Recommendation")
print("Recommended monthly savings:", recommended_savings)
print("Money left after saving:", money_after_saving)
