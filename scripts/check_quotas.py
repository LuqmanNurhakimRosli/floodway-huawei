import pandas as pd
import numpy as np

df = pd.read_csv('datasets/jps_positives_peninsular_candidates.csv')
train = df[df['year'] <= 2019]
test = df[df['year'] >= 2020]

def allocate_quotas(subset, total):
    # Largest Remainder Method (Hamilton-Hare)
    freqs = subset['state'].value_counts()
    exact_shares = freqs / len(subset) * total
    base = exact_shares.astype(int)
    remainders = exact_shares - base
    deficit = total - base.sum()
    for s in remainders.sort_values(ascending=False).index[:deficit]:
        base[s] += 1
    return base.to_dict()

train_q = allocate_quotas(train, 165)
test_q = allocate_quotas(test, 85)

print("Train quotas (N=165):", train_q)
print("Sum train:", sum(train_q.values()))
print("Test quotas (N=85):", test_q)
print("Sum test:", sum(test_q.values()))
