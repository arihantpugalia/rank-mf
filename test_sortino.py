import numpy as np

# Suppose 36 monthly excess returns: 10 negative, 26 positive
np.random.seed(42)
excess = np.random.normal(0.01, 0.05, 36)
downside_returns = excess[excess < 0]

# My old calculation (wrong!)
wrong_dd = np.sqrt(np.mean(downside_returns**2))

# Correct calculation (Morningstar)
# Replace positive returns with 0 and take sqrt of mean of squares across ALL 36 periods
correct_dd = np.sqrt(np.mean(np.minimum(excess, 0)**2))

print(f"Wrong DD: {wrong_dd}")
print(f"Correct DD: {correct_dd}")
