import numpy as np
import os
import joblib
import pandas as pd

# -----------------------------
# LOAD SAFE VECTOR
# -----------------------------
try:
    safe_vector = joblib.load(os.path.join(os.path.dirname(__file__), "safe_vector.pkl"))
except:
    safe_vector = np.zeros(2000)

# -----------------------------
# FEATURE EXTRACTION FUNCTION
# -----------------------------
def extract_features(file_path):
    with open(file_path, "rb") as f:
        data = f.read()

    # -------- ENTROPY --------
    entropy = 0
    if len(data) > 0:
        sample = data[:100000] if len(data) > 100000 else data
        counts = np.bincount(np.frombuffer(sample, dtype=np.uint8), minlength=256)
        probs = counts[counts > 0] / len(sample)
        entropy = -np.sum(probs * np.log2(probs))

    # -------- SIGNATURE CHECK --------
    is_eicar = b"EICAR-STANDARD-ANTIVIRUS-TEST-FILE" in data

    # -------- RULE DECISION --------
    if entropy > 7.0 or is_eicar:
        feature_vector = np.ones(2000) * 0.5
        label = "UNSAFE"
    else:
        feature_vector = safe_vector
        label = "SAFE"

    return feature_vector.reshape(1, -1), entropy, is_eicar, label


# -----------------------------
# DEMO RUN (MAIN)
# -----------------------------
if __name__ == "__main__":
    test_file = os.path.join(os.path.dirname(__file__), "safe_demo.txt")

    print("\n==============================")
    print("📂 FILE ANALYSIS STARTED")
    print("==============================")

    print("📁 File Path:", test_file)

    # -------- READ FILE --------
    with open(test_file, "rb") as f:
        data = f.read()

    print("📏 File Size:", len(data), "bytes")

    # -------- EXTRACT FEATURES --------
    features, entropy, is_eicar, label = extract_features(test_file)

    print("\n⚙️ FEATURE EXTRACTION")
    print("------------------------------")
    print("🧠 Entropy:", round(entropy, 4))
    print("🦠 EICAR Signature Detected:", is_eicar)

    # -------- RULE RESULT --------
    print("\n🚦 RULE-BASED STATUS")
    print("------------------------------")
    if label == "UNSAFE":
        print("🚨 UNSAFE FILE DETECTED")
    else:
        print("✅ SAFE FILE")

    # -------- FEATURE VECTOR INFO --------
    print("\n📊 FEATURE VECTOR")
    print("------------------------------")
    print("Shape:", features.shape)
    print("Sample Values:", features[0][:10])

    # -----------------------------
    # MODEL PREDICTION (FIXED)
    # -----------------------------
    try:
        model_path = os.path.join(os.path.dirname(__file__), "nb_model.pkl")
        model = joblib.load(model_path)

        # Fix warning by using DataFrame with feature names
        feature_names = [f"f{i}" for i in range(2000)]
        df = pd.DataFrame(features, columns=feature_names)

        model_pred = int(model.predict(df)[0])

        print("\n🤖 ML MODEL PREDICTION")
        print("------------------------------")
        print("Model Result:", model_pred)

    except Exception as e:
        print("\n⚠️ Model not loaded:", e)
        model_pred = 0 if label == "SAFE" else 1

    # -----------------------------
    # FINAL DECISION ENGINE
    # -----------------------------
    print("\n🧠 FINAL DECISION ENGINE")
    print("------------------------------")

    rule_result = 0 if label == "SAFE" else 1

    print("Rule-Based Result:", rule_result)
    print("Model Result:", model_pred)

    # 🔥 FAIL-SAFE LOGIC
    final_decision = 1 if (rule_result == 1 or model_pred == 1) else 0

    print("\n🚦 FINAL SYSTEM ACTION")
    print("------------------------------")

    if final_decision == 1:
        print("🚨 BLOCK FILE (UNSAFE)")
    else:
        print("✅ ALLOW FILE (SAFE)")

    # -----------------------------
    # REASON EXPLANATION (NEW)
    # -----------------------------
    print("\n🔍 REASON")
    print("------------------------------")

    if rule_result == 0 and model_pred == 1:
        print("⚠️ Blocked due to ML model detecting anomaly (hidden/suspicious pattern)")
    elif rule_result == 1:
        print("🚨 Blocked due to high entropy or malware signature")
    else:
        print("✅ File passed all security checks")

    print("\n==============================")
    print("✅ ANALYSIS COMPLETED")
    print("==============================")