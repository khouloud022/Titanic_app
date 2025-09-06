from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import os

# Charger le modèle
MODEL_PATH = os.path.join("models", "pipeline.joblib")
pipeline = joblib.load(MODEL_PATH)

app = FastAPI(title="Titanic Survival Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Schéma des entrées
class Passenger(BaseModel):
    Pclass: int
    Sex: str
    Age: float
    SibSp: int
    Parch: int
    Fare: float
    Embarked: str

@app.get("/")
def root():
    return {"message": "Titanic API is running 🚀"}

@app.post("/predict")
def predict(passenger: Passenger):
    
    input_data = pd.DataFrame({
        'Pclass': [passenger.Pclass],
        'Sex': [passenger.Sex],
        'Age': [passenger.Age],
        'SibSp': [passenger.SibSp],
        'Parch': [passenger.Parch],
        'Fare': [passenger.Fare],
        'Embarked': [passenger.Embarked]
    })
    
    try:
        prediction = pipeline.predict(input_data)[0]
        proba = pipeline.predict_proba(input_data)[0][1]  
        
        return {
            "prediction": int(prediction), 
            "probability": round(float(proba), 3),
            "status": "success"
        }
    except Exception as e:
        return {
            "error": str(e),
            "status": "error"
        }