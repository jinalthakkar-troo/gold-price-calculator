import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [grams, setGrams] = useState("");
  const [goldType, setGoldType] = useState("24K");
  const [pricePerGram, setPricePerGram] = useState(null);
  const [finalPrice, setFinalPrice] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gold prices based on current market rates
  const goldPrices = {
    "24K": 11615.24,
    "22K": 10647.30,
    "18K": 8713.65,
  };

  // Load previous history from LocalStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("gold-history")) || [];
    setHistory(saved);
    setPricePerGram(goldPrices[goldType]);
    setLoading(false);
  }, []);

  // Update price when gold type changes
  useEffect(() => {
    setPricePerGram(goldPrices[goldType]);
  }, [goldType]);

  const calculate = () => {
    if (!pricePerGram || !grams) {
      alert("Please enter gold weight in grams");
      return;
    }

    const gramsValue = parseFloat(grams);
    if (gramsValue <= 0) {
      alert("Please enter a valid gold weight");
      return;
    }

    const base = pricePerGram * gramsValue;
    const gst = base * 0.03; // 3% GST
    const making = base * 0.10; // 10% Making charges
    const total = base + gst + making;

    setFinalPrice(total.toFixed(2));

    const entry = {
      date: new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata"
      }),
      grams: gramsValue,
      goldType,
      base: base.toFixed(2),
      gst: gst.toFixed(2),
      making: making.toFixed(2),
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
        {loading ? (
          <p className="loading">Loading gold prices...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <p className="current-price">
            Current {goldType} Gold Price: <strong>₹{formatIndianCurrency(pricePerGram)}/g</strong>
          </p>
        )}
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
            <small>
              {type === "24K" ? "99.9% Pure" : 
               type === "22K" ? "91.6% Pure" : "75% Pure"}
            </small>
          </div>
        ))}
      </div>

      <div className="input-section">
        <div className="input-group">
          <label>Gold Type:</label>
          <select value={goldType} onChange={(e) => setGoldType(e.target.value)}>
            <option value="24K">24K Gold (99.9% Pure)</option>
            <option value="22K">22K Gold (91.6% Pure)</option>
            <option value="18K">18K Gold (75% Pure)</option>
          </select>
        </div>

        <div className="input-group">
          <label>Gold Weight (grams):</label>
          <input
            type="number"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            placeholder="Enter gold weight in grams"
            min="0"
            step="0.01"
          />
        </div>
        
        <button onClick={calculate} disabled={!grams}>
          Calculate Final Price
        </button>
      </div>

      {finalPrice && (
        <div className="result-section">
          <h2>💎 Price Breakdown</h2>
          <div className="breakdown">
            <p>Base Price ({grams}g × ₹{formatIndianCurrency(pricePerGram)}/g): 
              <strong> ₹{formatIndianCurrency(pricePerGram * grams)}</strong>
            </p>
            <p>GST (3%): <strong>₹{formatIndianCurrency(pricePerGram * grams * 0.03)}</strong></p>
            <p>Making Charges (10%): <strong>₹{formatIndianCurrency(pricePerGram * grams * 0.10)}</strong></p>
            <p className="final-price">Final Price: <strong>₹{finalPrice}</strong></p>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="history-section">
          <div className="history-header">
            <h3>📊 Calculation History (Last 10)</h3>
            <button onClick={clearHistory} className="clear-btn">Clear History</button>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Grams</th>
                <th>Rate/g</th>
                <th>Final Price</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i}>
                  <td>{h.date}</td>
                  <td>{h.goldType}</td>
                  <td>{h.grams}g</td>
                  <td>₹{formatIndianCurrency(h.rate)}</td>
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