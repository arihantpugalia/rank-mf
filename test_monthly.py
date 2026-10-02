import pandas as pd
import numpy as np

# Test resampling daily to monthly
df = pd.DataFrame({
    'date': pd.date_range(start='2020-01-01', end='2020-03-31', freq='D'),
    'val': np.random.uniform(90, 110, 91)
})
df.set_index('date', inplace=True)
monthly = df.resample('ME').last() # Month-End last available NAV
monthly['monthly_return'] = monthly['val'].pct_change()
print(monthly)
