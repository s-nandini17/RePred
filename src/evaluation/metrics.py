import numpy as np
from scipy import stats
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def compute_metrics(y_true, y_pred):
    """
    Computes standard regression & correlation metrics for protein stability benchmark.
    - MAE
    - RMSE
    - R^2
    - Pearson correlation (r)
    - Spearman rank correlation (rho)
    """
    y_true = np.asarray(y_true, dtype=np.float64)
    y_pred = np.asarray(y_pred, dtype=np.float64)

    if len(y_true) != len(y_pred):
        raise ValueError(f"Shape mismatch: y_true len ({len(y_true)}) != y_pred len ({len(y_pred)})")

    if len(y_true) == 0:
        raise ValueError("Cannot compute metrics on empty arrays!")

    mae = mean_absolute_error(y_true, y_pred)
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    r2 = r2_score(y_true, y_pred)

    # Pearson correlation
    if np.std(y_true) == 0 or np.std(y_pred) == 0:
        pearson_r, pearson_p = 0.0, 1.0
    else:
        pearson_res = stats.pearsonr(y_true, y_pred)
        pearson_r, pearson_p = pearson_res.statistic, pearson_res.pvalue

    # Spearman rank correlation
    if np.std(y_true) == 0 or np.std(y_pred) == 0:
        spearman_rho, spearman_p = 0.0, 1.0
    else:
        spearman_res = stats.spearmanr(y_true, y_pred)
        spearman_rho, spearman_p = spearman_res.statistic, spearman_res.pvalue

    return {
        "MAE": float(mae),
        "RMSE": float(rmse),
        "R2": float(r2),
        "Pearson": float(pearson_r),
        "Pearson_p": float(pearson_p),
        "Spearman": float(spearman_rho),
        "Spearman_p": float(spearman_p),
        "n_samples": int(len(y_true))
    }

def print_metrics_table(metrics_dict, title="Evaluation Metrics"):
    """Pretty prints metrics dict."""
    print(f"\n--- {title} ---")
    print(f"  Samples:  {metrics_dict['n_samples']}")
    print(f"  MAE:      {metrics_dict['MAE']:.4f}")
    print(f"  RMSE:     {metrics_dict['RMSE']:.4f}")
    print(f"  R^2:      {metrics_dict['R2']:.4f}")
    print(f"  Pearson:  {metrics_dict['Pearson']:.4f} (p={metrics_dict['Pearson_p']:.2e})")
    print(f"  Spearman: {metrics_dict['Spearman']:.4f} (p={metrics_dict['Spearman_p']:.2e})")

if __name__ == "__main__":
    yt = [1.0, 2.0, 3.0, 4.0, 5.0]
    yp = [1.1, 1.9, 3.2, 3.8, 5.1]
    res = compute_metrics(yt, yp)
    print_metrics_table(res, "Sanity Check Metrics")
