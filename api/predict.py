"""
Vercel Python serverless function.
POST a raw customer record (matching schema.json's fields) and get back
a churn prediction + probability, using the trained sklearn Pipeline.
"""
import json
import os
from http.server import BaseHTTPRequestHandler

import joblib
import pandas as pd

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "model_artifacts", "model.joblib")

_model = None


def get_model():
    global _model
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    return _model


FEATURE_ORDER = [
    "tenure", "MonthlyCharges", "TotalCharges",
    "gender", "SeniorCitizen", "Partner", "Dependents", "PhoneService", "PaperlessBilling",
    "MultipleLines", "InternetService", "OnlineSecurity", "OnlineBackup",
    "DeviceProtection", "TechSupport", "StreamingTV", "StreamingMovies",
    "Contract", "PaymentMethod",
]


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get("content-length", 0))
            body = json.loads(self.rfile.read(length) or "{}")

            missing = [f for f in FEATURE_ORDER if f not in body]
            if missing:
                self._send_json(400, {"error": f"Missing fields: {missing}"})
                return

            row = {f: body[f] for f in FEATURE_ORDER}
            row["SeniorCitizen"] = str(row["SeniorCitizen"])
            X = pd.DataFrame([row], columns=FEATURE_ORDER)

            model = get_model()
            proba = float(model.predict_proba(X)[0, 1])
            prediction = int(proba >= 0.5)

            self._send_json(200, {
                "churnProbability": proba,
                "predictedChurn": prediction,
                "riskLevel": self._risk_level(proba),
            })
        except Exception as exc:  # noqa: BLE001
            self._send_json(500, {"error": str(exc)})

    @staticmethod
    def _risk_level(proba: float) -> str:
        if proba >= 0.66:
            return "High"
        if proba >= 0.33:
            return "Medium"
        return "Low"

    def _send_json(self, status: int, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)
