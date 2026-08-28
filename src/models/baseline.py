import numpy as np
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

def create_ridge_baseline(alpha=10.0, random_state=42):
    """Ridge Regression pipeline with StandardScaler."""
    return Pipeline([
        ('scaler', StandardScaler()),
        ('regressor', Ridge(alpha=alpha, random_state=random_state))
    ])

def create_random_forest_baseline(
    n_estimators=150,
    max_depth=12,
    min_samples_split=2,
    min_samples_leaf=1,
    max_features=1.0,
    random_state=42
):
    """
    Random Forest Regressor.
    Note: Random Forest does not require feature scaling, so it operates directly on raw features.
    """
    return RandomForestRegressor(
        n_estimators=n_estimators,
        max_depth=max_depth,
        min_samples_split=min_samples_split,
        min_samples_leaf=min_samples_leaf,
        max_features=max_features,
        random_state=random_state,
        n_jobs=-1
    )

def create_gradient_boosting_baseline(n_estimators=150, learning_rate=0.05, max_depth=5, random_state=42):
    """Gradient Boosting Regressor pipeline."""
    return Pipeline([
        ('scaler', StandardScaler()),
        ('regressor', GradientBoostingRegressor(
            n_estimators=n_estimators,
            learning_rate=learning_rate,
            max_depth=max_depth,
            random_state=random_state
        ))
    ])

def get_baseline_models(random_state=42):
    """
    Returns a dictionary of standard baseline models for sequence-based ddG prediction.
    """
    return {
        "Ridge": create_ridge_baseline(alpha=10.0, random_state=random_state),
        "RandomForest": create_random_forest_baseline(n_estimators=150, max_depth=12, random_state=random_state),
        "GradientBoosting": create_gradient_boosting_baseline(n_estimators=150, learning_rate=0.05, max_depth=5, random_state=random_state)
    }

if __name__ == "__main__":
    models = get_baseline_models()
    print("Baseline models instantiated:")
    for name, model in models.items():
        print(f"  - {name}: {model}")
