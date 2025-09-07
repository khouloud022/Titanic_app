import React, { useState, useEffect } from "react";

const TitanicApp = () => {
  const [form, setForm] = useState({
    Pclass: 3,
    Sex: "male",
    Age: 29,
    SibSp: 0,
    Parch: 0,
    Fare: 32.2,
    Embarked: "S",
  });
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [apiStatus, setApiStatus] = useState('unknown');

  // Vérifier le statut de l'API au chargement
  useEffect(() => {
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const response = await fetch("http://localhost:8000/");
      if (response.ok) {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
    } catch {
      setApiStatus('offline');
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setForm({ ...form, [e.target.name]: value });
    setError(null);
  };

  const resetForm = () => {
    setForm({
      Pclass: 3,
      Sex: "male",
      Age: 29,
      SibSp: 0,
      Parch: 0,
      Fare: 32.2,
      Embarked: "S",
    });
    setResult(null);
    setShowResult(false);
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setShowResult(false);
    
    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === "error") {
        throw new Error(data.error);
      }
      
      setResult(data);
      setShowResult(true);
      setApiStatus('online');
      
      // Ajouter à l'historique
      const newPrediction = {
        id: Date.now(),
        timestamp: new Date().toLocaleString('fr-FR'),
        passenger: { ...form },
        result: data
      };
      setPredictionHistory(prev => [newPrediction, ...prev.slice(0, 4)]); // Garder 5 dernières prédictions
      
    } catch (err) {
      setError(err.message);
      setApiStatus('offline');
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSurvivalMessage = (prediction, probability) => {
    const percentage = (probability * 100).toFixed(1);
    
    if (prediction === 1) {
      if (probability > 0.8) {
        return {
          icon: "🎉",
          text: "Très forte chance de survie",
          color: "#10b981",
          bgColor: "#d1fae5",
          description: `Avec ${percentage}% de probabilité, ce passager aurait eu d'excellentes chances de survivre au naufrage du Titanic.`
        };
      } else if (probability > 0.6) {
        return {
          icon: "✅",
          text: "Bonne chance de survie",
          color: "#059669",
          bgColor: "#ecfdf5",
          description: `Avec ${percentage}% de probabilité, ce passager aurait probablement survécu.`
        };
      } else {
        return {
          icon: "🤞",
          text: "Chance de survie modérée",
          color: "#0891b2",
          bgColor: "#e0f7fa",
          description: `Avec ${percentage}% de probabilité, ce passager aurait eu des chances mitigées.`
        };
      }
    } else {
      if (probability < 0.2) {
        return {
          icon: "😔",
          text: "Très faible chance de survie",
          color: "#dc2626",
          bgColor: "#fee2e2",
          description: `Avec seulement ${percentage}% de probabilité, ce passager aurait eu très peu de chances de survivre.`
        };
      } else if (probability < 0.4) {
        return {
          icon: "❌",
          text: "Faible chance de survie",
          color: "#e11d48",
          bgColor: "#fce7f3",
          description: `Avec ${percentage}% de probabilité, ce passager n'aurait probablement pas survécu.`
        };
      } else {
        return {
          icon: "⚠️",
          text: "Survie incertaine",
          color: "#ea580c",
          bgColor: "#fed7aa",
          description: `Avec ${percentage}% de probabilité, la survie de ce passager était incertaine.`
        };
      }
    }
  };

  const getClassLabel = (pclass) => {
    const labels = { 1: "Première classe", 2: "Deuxième classe", 3: "Troisième classe" };
    return labels[pclass];
  };

  const getPortLabel = (embarked) => {
    const ports = { S: "Southampton", C: "Cherbourg", Q: "Queenstown" };
    return ports[embarked];
  };

  const StatusIndicator = () => (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.5rem 1rem",
      borderRadius: "20px",
      fontSize: "0.9rem",
      fontWeight: "500",
      backgroundColor: apiStatus === 'online' ? '#d1fae5' : '#fee2e2',
      color: apiStatus === 'online' ? '#065f46' : '#991b1b',
      border: `1px solid ${apiStatus === 'online' ? '#a7f3d0' : '#fca5a5'}`
    }}>
      <div style={{
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        backgroundColor: apiStatus === 'online' ? '#10b981' : '#ef4444'
      }} />
      API {apiStatus === 'online' ? 'Connectée' : 'Déconnectée'}
    </div>
  );

  const FormField = ({ label, children, tooltip }) => (
    <div style={{ position: "relative" }}>
      <label style={{ 
        display: "block", 
        marginBottom: "0.5rem", 
        fontWeight: "600",
        color: "#374151",
        fontSize: "0.95rem"
      }}>
        {label}
        {tooltip && (
          <span style={{ 
            marginLeft: "0.25rem",
            color: "#6b7280",
            cursor: "help",
            fontSize: "0.8rem"
          }} title={tooltip}>
            ℹ️
          </span>
        )}
      </label>
      {children}
    </div>
  );

  const inputStyle = {
    width: "100%",
    padding: "0.75rem",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "1rem",
    transition: "all 0.2s ease",
    backgroundColor: "white"
  };

  const inputFocusStyle = {
    ...inputStyle,
    borderColor: "#3b82f6",
    outline: "none",
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)"
  };

  return (
    <div style={{ 
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "2rem 1rem"
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderRadius: "20px",
          padding: "2rem",
          textAlign: "center",
          marginBottom: "2rem",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)"
        }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🚢</div>
          <h1 style={{ 
            margin: "0 0 0.5rem 0", 
            fontSize: "2.5rem",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontWeight: "bold"
          }}>
            Titanic Survival Predictor
          </h1>
          <p style={{ 
            margin: "0 0 1rem 0", 
            color: "#6b7280", 
            fontSize: "1.2rem",
            maxWidth: "600px",
            marginLeft: "auto",
            marginRight: "auto"
          }}>
            Découvrez vos chances de survie lors du naufrage du Titanic grâce à l'intelligence artificielle
          </p>
          <StatusIndicator />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "2rem" }}>
          {/* Formulaire principal */}
          <div style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            borderRadius: "20px",
            padding: "2rem",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <h2 style={{ margin: 0, color: "#374151", fontSize: "1.8rem" }}>
                👤 Profil du passager
              </h2>
              <button
                onClick={resetForm}
                style={{
                  background: "none",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "0.5rem 1rem",
                  cursor: "pointer",
                  color: "#6b7280",
                  fontSize: "0.9rem",
                  transition: "all 0.2s"
                }}
                onMouseOver={(e) => {
                  e.target.style.borderColor = "#3b82f6";
                  e.target.style.color = "#3b82f6";
                }}
                onMouseOut={(e) => {
                  e.target.style.borderColor = "#e5e7eb";
                  e.target.style.color = "#6b7280";
                }}
              >
                🔄 Réinitialiser
              </button>
            </div>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
              marginBottom: "2rem"
            }}>
              <FormField 
                label="🎫 Classe du billet" 
                tooltip="La classe sociale déterminait l'accès aux canots de sauvetage"
              >
                <select 
                  name="Pclass" 
                  value={form.Pclass} 
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value={1}>🏆 Première classe</option>
                  <option value={2}>🥈 Deuxième classe</option>
                  <option value={3}>🥉 Troisième classe</option>
                </select>
              </FormField>

              <FormField 
                label="👤 Sexe" 
                tooltip="Les femmes avaient la priorité pour les canots de sauvetage"
              >
                <select 
                  name="Sex" 
                  value={form.Sex} 
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="female">👩 Femme</option>
                  <option value="male">👨 Homme</option>
                </select>
              </FormField>

              <FormField 
                label="🎂 Âge" 
                tooltip="Les enfants avaient également la priorité"
              >
                <input 
                  type="number" 
                  name="Age" 
                  value={form.Age} 
                  onChange={handleChange}
                  min="0"
                  max="100"
                  style={inputStyle}
                />
              </FormField>

              <FormField 
                label="👨‍👩‍👧‍👦 Frères/Sœurs/Époux" 
                tooltip="Nombre de frères, sœurs ou époux à bord"
              >
                <input 
                  type="number" 
                  name="SibSp" 
                  value={form.SibSp} 
                  onChange={handleChange}
                  min="0"
                  style={inputStyle}
                />
              </FormField>

              <FormField 
                label="👶👴 Parents/Enfants" 
                tooltip="Nombre de parents ou enfants à bord"
              >
                <input 
                  type="number" 
                  name="Parch" 
                  value={form.Parch} 
                  onChange={handleChange}
                  min="0"
                  style={inputStyle}
                />
              </FormField>

              <FormField 
                label="💰 Prix du billet (£)" 
                tooltip="Le prix reflétait souvent la classe sociale et l'emplacement de la cabine"
              >
                <input 
                  type="number" 
                  name="Fare" 
                  value={form.Fare} 
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                  style={inputStyle}
                />
              </FormField>

              <FormField 
                label="🏃‍♀️ Port d'embarquement" 
                tooltip="Le port d'embarquement peut indiquer la nationalité et la classe sociale"
              >
                <select 
                  name="Embarked" 
                  value={form.Embarked} 
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="S">🇬🇧 Southampton</option>
                  <option value="C">🇫🇷 Cherbourg</option>
                  <option value="Q">🇮🇪 Queenstown</option>
                </select>
              </FormField>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={loading || apiStatus === 'offline'}
              style={{
                width: "100%",
                padding: "1.2rem 2rem",
                background: loading ? "#9ca3af" : "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "1.2rem",
                fontWeight: "bold",
                cursor: loading || apiStatus === 'offline' ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                boxShadow: loading ? "none" : "0 4px 15px rgba(59, 130, 246, 0.4)",
                transform: loading ? "none" : "translateY(0)",
              }}
              onMouseOver={(e) => {
                if (!loading && apiStatus === 'online') {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.5)";
                }
              }}
              onMouseOut={(e) => {
                if (!loading && apiStatus === 'online') {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.4)";
                }
              }}
            >
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <div style={{
                    width: "20px",
                    height: "20px",
                    border: "2px solid #ffffff40",
                    borderTop: "2px solid #ffffff",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }} />
                  Prédiction en cours...
                </div>
              ) : apiStatus === 'offline' ? (
                "⚠️ API Déconnectée"
              ) : (
                "🔮 Prédire la survie"
              )}
            </button>

            {error && (
              <div style={{
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                borderRadius: "8px",
                padding: "1rem",
                marginTop: "1rem",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <span style={{ fontSize: "1.2rem" }}>⚠️</span>
                <div>
                  <strong>Erreur:</strong> {error}
                  <button 
                    onClick={checkApiStatus}
                    style={{
                      marginLeft: "1rem",
                      background: "none",
                      border: "1px solid #dc2626",
                      borderRadius: "4px",
                      padding: "0.25rem 0.5rem",
                      color: "#dc2626",
                      cursor: "pointer",
                      fontSize: "0.8rem"
                    }}
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Panel de droite - Résultats et historique */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Résultat de la prédiction */}
            {showResult && result && (
              <div style={{
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
                borderRadius: "20px",
                padding: "2rem",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                textAlign: "center",
                animation: "slideIn 0.5s ease-out"
              }}>
                <h2 style={{ margin: "0 0 1rem 0", color: "#374151", fontSize: "1.5rem" }}>
                  🎯 Résultat de la prédiction
                </h2>
                
                <div style={{
                  fontSize: "4rem",
                  margin: "1rem 0",
                  fontWeight: "bold",
                  background: `linear-gradient(135deg, ${getSurvivalMessage(result.prediction, result.probability).color}, ${getSurvivalMessage(result.prediction, result.probability).color}dd)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent"
                }}>
                  {(result.probability * 100).toFixed(1)}%
                </div>
                
                <div style={{
                  background: getSurvivalMessage(result.prediction, result.probability).bgColor,
                  color: getSurvivalMessage(result.prediction, result.probability).color,
                  padding: "1rem",
                  borderRadius: "12px",
                  marginBottom: "1rem",
                  border: `2px solid ${getSurvivalMessage(result.prediction, result.probability).color}20`
                }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                    {getSurvivalMessage(result.prediction, result.probability).icon}
                  </div>
                  <div style={{ fontWeight: "bold", fontSize: "1.2rem", marginBottom: "0.5rem" }}>
                    {getSurvivalMessage(result.prediction, result.probability).text}
                  </div>
                  <div style={{ fontSize: "0.9rem", lineHeight: "1.4" }}>
                    {getSurvivalMessage(result.prediction, result.probability).description}
                  </div>
                </div>

                {/* Résumé du profil */}
                <div style={{
                  background: "#f8fafc",
                  borderRadius: "8px",
                  padding: "1rem",
                  fontSize: "0.9rem",
                  textAlign: "left"
                }}>
                  <div style={{ fontWeight: "bold", marginBottom: "0.5rem", color: "#374151" }}>
                    📋 Profil analysé:
                  </div>
                  <div style={{ color: "#6b7280", lineHeight: "1.6" }}>
                    {form.Sex === 'female' ? 'Femme' : 'Homme'} de {form.Age} ans, 
                    {getClassLabel(form.Pclass).toLowerCase()}, 
                    embarqué à {getPortLabel(form.Embarked)}.
                    {form.SibSp > 0 && ` ${form.SibSp} membre(s) de famille à bord.`}
                    {form.Parch > 0 && ` ${form.Parch} parent(s)/enfant(s) à bord.`}
                  </div>
                </div>
              </div>
            )}

            {/* Historique des prédictions */}
            {predictionHistory.length > 0 && (
              <div style={{
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
                borderRadius: "20px",
                padding: "1.5rem",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)"
              }}>
                <h3 style={{ margin: "0 0 1rem 0", color: "#374151", fontSize: "1.2rem" }}>
                  📜 Historique des prédictions
                </h3>
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {predictionHistory.map((pred, index) => (
                    <div key={pred.id} style={{
                      padding: "0.75rem",
                      marginBottom: "0.5rem",
                      background: index === 0 ? "#eff6ff" : "#f8fafc",
                      borderRadius: "8px",
                      fontSize: "0.8rem",
                      border: index === 0 ? "1px solid #bfdbfe" : "1px solid #e2e8f0"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: "bold", color: getSurvivalMessage(pred.result.prediction, pred.result.probability).color }}>
                          {getSurvivalMessage(pred.result.prediction, pred.result.probability).icon} {(pred.result.probability * 100).toFixed(1)}%
                        </span>
                        <span style={{ color: "#6b7280" }}>{pred.timestamp}</span>
                      </div>
                      <div style={{ color: "#6b7280", marginTop: "0.25rem" }}>
                        {pred.passenger.Sex === 'female' ? 'F' : 'H'}, {pred.passenger.Age}ans, Classe {pred.passenger.Pclass}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Informations sur le modèle */}
            <div style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px",
              padding: "1.5rem",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              fontSize: "0.9rem"
            }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "#374151", fontSize: "1.1rem" }}>
                🤖 À propos du modèle
              </h3>
              <div style={{ color: "#6b7280", lineHeight: "1.6" }}>
                <p style={{ margin: "0 0 0.5rem 0" }}>
                  Ce modèle utilise la régression logistique entraînée sur les données historiques 
                  des 891 passagers du Titanic.
                </p>
                <p style={{ margin: "0" }}>
                  Les facteurs les plus importants sont le sexe, l'âge, la classe sociale 
                  et le port d'embarquement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes slideIn {
            0% { 
              opacity: 0; 
              transform: translateY(20px); 
            }
            100% { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
          @media (max-width: 1024px) {
            .container {
              grid-template-columns: 1fr !important;
            }
          }
        `
      }} />
    </div>
  );
};

export default TitanicApp;