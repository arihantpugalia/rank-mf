import pandas as pd
s = pd.Series([0.01, -0.02, 0.03, 0.01, -0.01])
print(s.std(ddof=1))
print(s.std(ddof=0))
