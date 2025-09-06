import os
import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression

# Paths
DATA_PATH = os.path.join("data", "train.csv")
MODEL_DIR = "models"
MODEL_PATH = os.path.join(MODEL_DIR, "pipeline.joblib")
os.makedirs(MODEL_DIR, exist_ok=True)

# 1. Charger dataset Kaggle Titanic
df = pd.read_csv(DATA_PATH)

# 2. Features / target
features = ["Pclass", "Sex", "Age", "SibSp", "Parch", "Fare", "Embarked"]
target = "Survived"

X = df[features].copy()
y = df[target].astype(int)

# 3. Preprocessing
# Traiter Pclass comme numérique (pas catégorielle)
numeric_features = ["Pclass", "Age", "SibSp", "Parch", "Fare"]
categorical_features = ["Sex", "Embarked"]

numeric_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler())
])

categorical_transformer = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("onehot", OneHotEncoder(handle_unknown="ignore"))
])

preprocess = ColumnTransformer([
    ("num", numeric_transformer, numeric_features),
    ("cat", categorical_transformer, categorical_features)
])

# 4. Modèle
model = LogisticRegression(max_iter=1000, random_state=42)

pipeline = Pipeline([
    ("preprocess", preprocess),
    ("model", model)
])

# 5. Train & save
pipeline.fit(X, y)
joblib.dump(pipeline, MODEL_PATH)

print(f"✅ Modèle entraîné et sauvegardé dans {MODEL_PATH}")

# 6. Test rapide
test_sample = pd.DataFrame({
    'Pclass': [3],
    'Sex': ['male'],
    'Age': [29.0],
    'SibSp': [0],
    'Parch': [0],
    'Fare': [32.2],
    'Embarked': ['S']
})

prediction = pipeline.predict(test_sample)[0]
probability = pipeline.predict_proba(test_sample)[0][1]

print(f"Test - Prédiction: {prediction}, Probabilité: {probability:.3f}")