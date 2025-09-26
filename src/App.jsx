import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [grams, setGrams] = useState("");
  const [goldType, setGoldType] = useState("24K");
  const [finalPrice, setFinalPrice] = useState(null);
  const [history, setHistory] = useState([]);

  // Fixed gold prices (API se pehle fixed use karein)
  const goldPrices = {
    "24K": 11615.24,
    "22K": 10647.30,
    "18K": 8713.65,
  };

  const pricePerGram = goldPrices[goldType];

  // Load history from LocalStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("gold-history")) || [];
    setHistory(saved);
  }, []);

  const calculate = () => {
    if (!grams) {
      alert("Please enter gold weight in grams");
      return;
    }

    const gramsValue = parseFloat(grams);
    if (gramsValue <= 0) {
      alert("Please enter a valid gold weight");
      return;
    }

    const base = pricePerGram * gramsValue;
    const gst = base * 0.03;
    const making = base * 0.10;
    const total = base + gst + making;

    setFinalPrice(total.toFixed(2));

    const entry = {
      date: new Date().toLocaleString("en-IN"),
      grams: gramsValue,
      goldType,
      total: total.toFixed(2),
      rate: pricePerGram
    };

    const newHistory = [entry, ...history.slice(0, 9)];
    setHistory(newHistory);
    localStorage.setItem("gold-history", JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("gold-history");
  };

  const formatIndianCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="container">
      <h1>🇮🇳 Gold Price Calculator (INR)</h1>
      
      <div className="price-info">
        <p className="current-price">
          Current {goldType} Gold Price: <strong>₹{formatIndianCurrency(pricePerGram)}/g</strong>
        </p>
      </div>

      <div className="gold-types">
        {["24K", "22K", "18K"].map(type => (
          <div 
            key={type}
            className={`gold-type ${goldType === type ? "active" : ""}`} 
            onClick={() => setGoldType(type)}
          >
            <h3>{type} Gold</h3>
            <div className="price">₹{formatIndianCurrency(goldPrices[type])}/g</div>
          </div>
        ))}
      </div>

      <div className="input-section">
        <input
          type="number"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          placeholder="Enter gold weight in grams"
          min="0"
          step="0.01"
        />
        
        <button onClick={calculate} disabled={!grams}>
          Calculate Final Price
        </button>
      </div>

      {finalPrice && (
        <div className="result-section">
          <h2>Final Price: ₹{finalPrice}</h2>
        </div>
      )}

      {history.length > 0 && (
        <div className="history-section">
          <h3>Calculation History</h3>
          <button onClick={clearHistory} className="clear-btn">Clear History</button>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Grams</th>
                <th>Final Price</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i}>
                  <td>{h.date}</td>
                  <td>{h.grams}g</td>
                  <td>₹{h.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;