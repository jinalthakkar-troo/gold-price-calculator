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
  const [lastUpdated, setLastUpdated] = useState(null);

  // Gold purity percentages
  const goldPurity = {
    "24K": 0.999, // 99.9% pure
    "22K": 0.916, // 91.6% pure  
    "18K": 0.750  // 75.0% pure
  };

  // Load previous history from LocalStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("gold-history")) || [];
    setHistory(saved);
  }, []);

  // Fetch LIVE gold price from API
  useEffect(() => {
    const fetchLiveGoldPrice = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log("Fetching live gold price...");
        
        // Option 1: MetalPriceAPI (Your API key)
        const response = await axios.get("https://api.metalpriceapi.com/v1/latest", {
          params: {
            api_key: "28195e9cd7d6f5c3ff053741e52ada93",
            base: "XAU", // Gold
            currencies: "INR"
          }
        });
        
        if (response.data && response.data.rates && response.data.rates.INR) {
          // Convert price per ounce to price per gram (1 ounce = 31.1035 grams)
          const pricePerOunce = response.data.rates.INR;
          const live24KPricePerGram = pricePerOunce / 31.1035;
          
          console.log("Live 24K price per gram:", live24KPricePerGram);
          
          // Calculate prices for different gold types based on purity
          const calculatedPrices = {
            "24K": live24KPricePerGram,
            "22K": live24KPricePerGram * goldPurity["22K"],
            "18K": live24KPricePerGram * goldPurity["18K"]
          };
          
          // Store prices in localStorage for offline use
          localStorage.setItem("gold-prices", JSON.stringify({
            prices: calculatedPrices,
            lastUpdated: new Date().toISOString()
          }));
          
          setPricePerGram(calculatedPrices[goldType]);
          setLastUpdated(new Date());
          setError(null);
        } else {
          throw new Error("Invalid API response");
        }
        
      } catch (error) {
        console.error("Error fetching live price:", error);
        
        // Fallback: Try to use cached prices
        try {
          const cached = localStorage.getItem("gold-prices");
          if (cached) {
            const { prices, lastUpdated: cachedTime } = JSON.parse(cached);
            const lastUpdate = new Date(cachedTime);
            const hoursSinceUpdate = (new Date() - lastUpdate) / (1000 * 60 * 60);
            
            if (hoursSinceUpdate < 24) { // Use cache if less than 24 hours old
              setPricePerGram(prices[goldType]);
              setLastUpdated(lastUpdate);
              setError(`Live price unavailable. Using cached price from ${lastUpdate.toLocaleString()}`);
            } else {
              throw new Error("Cache too old");
            }
          } else {
            throw new Error("No cached data available");
          }
        } catch (cacheError) {
          // Final fallback: Use fixed prices from Google
          const fixedPrices = {
            "24K": 11615.24,
            "22K": 10647.30,
            "18K": 8713.65
          };
          setPricePerGram(fixedPrices[goldType]);
          setLastUpdated(new Date());
          setError("Live price unavailable. Using fixed market prices.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLiveGoldPrice();

    // Refresh price every 30 minutes
    const interval = setInterval(fetchLiveGoldPrice, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [goldType]);

  // Update price when gold type changes
  useEffect(() => {
    if (pricePerGram) {
      // Get current prices from state or recalculate
      const cached = localStorage.getItem("gold-prices");
      if (cached) {
        const { prices } = JSON.parse(cached);
        setPricePerGram(prices[goldType]);
      }
    }
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

    setFinalPrice(total);

    const entry = {
      date: new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata"
      }),
      grams: gramsValue,
      goldType,
      base: base,
      gst: gst,
      making: making,
      total: total,
      rate: pricePerGram,
      isLivePrice: !error || error.includes("cached")
    };

    const newHistory = [entry, ...history.slice(0, 9)];
    setHistory(newHistory);
    localStorage.setItem("gold-history", JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("gold-history");
  };

  const refreshPrices = async () => {
    setLoading(true);
    // Force refresh by clearing cache
    localStorage.removeItem("gold-prices");
    
    // Re-fetch prices
    const fetchLiveGoldPrice = async () => {
      try {
        const response = await axios.get("https://api.metalpriceapi.com/v1/latest", {
          params: {
            api_key: "28195e9cd7d6f5c3ff053741e52ada93",
            base: "XAU",
            currencies: "INR"
          }
        });
        
        const pricePerOunce = response.data.rates.INR;
        const live24KPricePerGram = pricePerOunce / 31.1035;
        
        const calculatedPrices = {
          "24K": live24KPricePerGram,
          "22K": live24KPricePerGram * goldPurity["22K"],
          "18K": live24KPricePerGram * goldPurity["18K"]
        };
        
        localStorage.setItem("gold-prices", JSON.stringify({
          prices: calculatedPrices,
          lastUpdated: new Date().toISOString()
        }));
        
        setPricePerGram(calculatedPrices[goldType]);
        setLastUpdated(new Date());
        setError(null);
      } catch (error) {
        setError("Failed to refresh prices. Try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchLiveGoldPrice();
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
          <div className="loading">
            <p>🔄 Fetching live gold prices...</p>
          </div>
        ) : error ? (
          <div className="error-warning">
            <p>⚠️ {error}</p>
          </div>
        ) : (
          <div className="price-success">
            <p>✅ Live prices loaded successfully!</p>
          </div>
        )}
        
        {pricePerGram && (
          <>
            <p className="current-price">
              Current {goldType} Gold Price: <strong>₹{formatIndianCurrency(pricePerGram)}/g</strong>
            </p>
            <p className="last-updated">
              Last updated: {lastUpdated ? lastUpdated.toLocaleString("en-IN") : "N/A"}
              {!error || error.includes("cached") ? " (Live)" : " (Fixed)"}
            </p>
          </>
        )}
        
        <button 
          onClick={refreshPrices} 
          disabled={loading}
          className="refresh-btn"
        >
          {loading ? "Refreshing..." : "🔄 Refresh Live Prices"}
        </button>
      </div>

      <div className="gold-types">
        {["24K", "22K", "18K"].map(type => (
          <div 
            key={type}
            className={`gold-type ${goldType === type ? "active" : ""}`} 
            onClick={() => setGoldType(type)}
          >
            <h3>{type} Gold</h3>
            <div className="price">
              {pricePerGram ? (
                `₹${formatIndianCurrency(pricePerGram)}/g`
              ) : (
                "Loading..."
              )}
            </div>
            <small>{(goldPurity[type] * 100).toFixed(1)}% Pure</small>
          </div>
        ))}
      </div>

      <div className="input-section">
        <div className="input-group">
          <label>Gold Type:</label>
          <select value={goldType} onChange={(e) => setGoldType(e.target.value)}>
            <option value="24K">24K Gold (99.9% Pure)</option>
            <option value="22K">22K Gold (91.6% Pure)</option>
            <option value="18K">18K Gold (75.0% Pure)</option>
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
        
        <button onClick={calculate} disabled={!grams || !pricePerGram}>
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
            <p className="final-price">Final Price: <strong>₹{formatIndianCurrency(finalPrice)}</strong></p>
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
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i}>
                  <td>{h.date}</td>
                  <td>{h.goldType}</td>
                  <td>{h.grams}g</td>
                  <td>₹{formatIndianCurrency(h.rate)}</td>
                  <td>₹{formatIndianCurrency(h.total)}</td>
                  <td>{h.isLivePrice ? "Live" : "Fixed"}</td>
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