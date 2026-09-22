## Customer Churn Predictor(https://churn-predictor-lemon.vercel.app/)

A small Next.js app for exploring the Telco customer churn model:

- **Individual tab** — fill in one customer's details and get their churn probability, predicted outcome, and risk level (Low / Medium / High).
- **Overall tab** — the model's headline metrics (Accuracy, ROC-AUC), a confusion matrix, and a searchable/filterable table of every customer's prediction.

### How it's built

- `model_service/train_model.py` (in the parent folder) trains a `RandomForestClassifier` (`class_weight="balanced"`) inside an sklearn `Pipeline` (one-hot encoding + scaling), and exports:
  - `model_artifacts/model.joblib` — the fitted pipeline, used by the prediction API.
  - `model_artifacts/metrics.json`, `predictions.json`, `schema.json` — copied into `public/data/` for the Overall tab and the Individual tab's form.
- `api/predict.py` is a Vercel Python serverless function that loads the pipeline and scores a single customer record.
- `app/` is the Next.js (App Router) frontend — `IndividualTab.tsx` and `OverallTab.tsx` under `app/components/`.

### Local development

```bash
npm install
npm run dev
```

Note: the `/api/predict` Python function is only served by Vercel's runtime, not `next dev`. To test it locally end-to-end, use `vercel dev` (requires a Vercel login) or deploy to Vercel directly.

### Retraining the model

From the parent `Customer_Churn_Model/model_service` folder:

```bash
python train_model.py
```

Then copy the four output files into both `model_artifacts/` and `public/data/` in this app.

### Deploying

This is a standard Vercel project — connect the GitHub repo in the Vercel dashboard, or run `vercel` from this folder. `vercel.json` bundles `model_artifacts/` alongside the Python function so the model file is available at runtime.
