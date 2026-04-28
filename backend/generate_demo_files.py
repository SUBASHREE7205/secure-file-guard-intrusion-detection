import os
import joblib
from extract_features import extract_features

# Load model
model = joblib.load('xgb_model.pkl')

print("Generating SAFE demo file...")
with open("safe_demo.txt", "wb") as f:
    f.write(b"This is a normal text file containing report data for Q1. " * 300)

feats = extract_features("safe_demo.txt")
pred = model.predict(feats)[0]
if pred == 0:
    print("SUCCESS: safe_demo.txt predicted as SAFE (0)")

print("\nGenerating UNSAFE demo file...")
with open("unsafe_demo.pdf", "wb") as f:
    f.write(os.urandom(150000))

feats_unsafe = extract_features("unsafe_demo.pdf")
pred_unsafe = model.predict(feats_unsafe)[0]
if pred_unsafe == 1:
    print("SUCCESS: unsafe_demo.pdf predicted as UNSAFE (1)")
