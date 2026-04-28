# ============================================
# RANSOMWARE DETECTION - MODEL TRAINING
# Algorithms: Naive Bayes, SVM, XGBoost, Hybrid
# ============================================

import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report

from xgboost import XGBClassifier


# -----------------------------------------
# STEP 1: Load Dataset
# -----------------------------------------
print("Loading dataset...")

df = pd.read_csv("ransomware.csv")

print("Dataset shape:", df.shape)


# -----------------------------------------
# STEP 2: Features & Labels
# -----------------------------------------
y = df['RG']   # Target column (0=Benign,1=Ransomware)

X = df.drop(['ID', 'Filename', 'RG', 'Family'], axis=1)

feature_names = X.columns

print("Total Features:", len(feature_names))


# -----------------------------------------
# STEP 3: Train-Test Split
# -----------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)


# -----------------------------------------
# STEP 4: Feature Scaling (For SVM)
# -----------------------------------------
scaler = StandardScaler()

X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)


# -----------------------------------------
# STEP 5: Naive Bayes Model
# -----------------------------------------
print("\nTraining Naive Bayes...")

nb_model = GaussianNB()

nb_model.fit(X_train, y_train)

nb_pred = nb_model.predict(X_test)

nb_acc = accuracy_score(y_test, nb_pred)


# -----------------------------------------
# STEP 6: SVM Model
# -----------------------------------------
print("Training SVM...")

svm_model = SVC(kernel='linear', probability=True)

svm_model.fit(X_train_scaled, y_train)

svm_pred = svm_model.predict(X_test_scaled)

svm_acc = accuracy_score(y_test, svm_pred)


# -----------------------------------------
# STEP 7: XGBoost Model
# -----------------------------------------
print("Training XGBoost...")

xgb_model = XGBClassifier(
    n_estimators=120,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    eval_metric="logloss",
    use_label_encoder=False
)

xgb_model.fit(X_train, y_train)

xgb_pred = xgb_model.predict(X_test)

xgb_acc = accuracy_score(y_test, xgb_pred)


# -----------------------------------------
# STEP 8: Hybrid Model
# Rule:
# If ANY model predicts ransomware → ransomware
# -----------------------------------------
print("Calculating Hybrid Model...")

hybrid_pred = np.where(
    (nb_pred == 1) |
    (svm_pred == 1) |
    (xgb_pred == 1),
    1,
    0
)

hybrid_acc = accuracy_score(y_test, hybrid_pred)


# -----------------------------------------
# STEP 9: Model Results
# -----------------------------------------
print("\n==============================")
print("MODEL ACCURACY RESULTS")
print("==============================")

print("Naive Bayes :", round(nb_acc, 4))
print("SVM         :", round(svm_acc, 4))
print("XGBoost     :", round(xgb_acc, 4))
print("Hybrid      :", round(hybrid_acc, 4))


# -----------------------------------------
# STEP 10: Classification Report
# -----------------------------------------
print("\nClassification Report (XGBoost):")

print(classification_report(y_test, xgb_pred))


# -----------------------------------------
# STEP 11: Save Models
# -----------------------------------------
print("\nSaving models...")

joblib.dump(nb_model, "nb_model.pkl")
joblib.dump(svm_model, "svm_model.pkl")
joblib.dump(xgb_model, "xgb_model.pkl")
joblib.dump(scaler, "scaler.pkl")
joblib.dump(feature_names.tolist(), "features.pkl")

print("\nModels saved successfully!")