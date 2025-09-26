import { useState, useEffect } from "react";
import { db, calculationsCollection } from './firebase';
import { addDoc, getDocs, query, orderBy, limit, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import "./App.css";

function App() {
  const [grams, setGrams] = useState("");
  const [goldType, setGoldType] = useState("24K");
  const [pricePerGram, setPricePerGram] = useState(null);
  const [finalPrice, setFinalPrice] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firebaseError, setFirebaseError] = useState(null);

  // Gold prices based on current market rates
  const goldPrices = {
    "24K": 11615.24,
    "22K": 10647.30,
    "18K": 8713.65,
  };

  // Load history only from Firebase
  useEffect(() => {
    loadHistoryFromFirebase();
    setPricePerGram(goldPrices[goldType]);
  }, []);

  // Load history from Firebase
  const loadHistoryFromFirebase = async () => {
    try {
      setLoading(true);
      setFirebaseError(null);
      
      console.log("📡 Loading data from Firebase...");
      
      const q = query(
        calculationsCollection,
        orderBy("timestamp", "desc"),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      console.log("✅ Firebase data loaded:", querySnapshot.docs.length, "calculations");
      
      const historyData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert timestamp to readable date
        date: doc.data().timestamp ? 
          new Date(doc.data().timestamp.toDate()).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata"
          }) : 
          new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata"
          })
      }));
      
      setHistory(historyData);
      
    } catch (error) {
      console.error("❌ Firebase load error:", error);
      setFirebaseError("Cloud data unavailable. Please check your connection.");
      setHistory([]); // Empty array if Firebase fails
    } finally {
      setLoading(false);
    }
  };

  // Update price when gold type changes
  useEffect(() => {
    setPricePerGram(goldPrices[goldType]);
  }, [goldType]);

  // Save calculation to Firebase
  const saveToFirebase = async (calculationData) => {
    try {
      console.log("💾 Saving to Firebase...");
      
      const docRef = await addDoc(calculationsCollection, {
        ...calculationData,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
        goldType: calculationData.goldType,
        grams: calculationData.grams,
        rate: calculationData.rate,
        total: calculationData.total
      });
      
      console.log("✅ Saved to Firebase with ID:", docRef.id);
      return { success: true, id: docRef.id };
      
    } catch (error) {
      console.error("❌ Error saving to Firebase:", error);
      return { success: false, error: error.message };
    }
  };

  // Delete calculation from Firebase
  const deleteFromFirebase = async (calculationId) => {
    try {
      await deleteDoc(doc(db, "calculations", calculationId));
      console.log("🗑️ Deleted from Firebase:", calculationId);
      return true;
    } catch (error) {
      console.error("❌ Error deleting from Firebase:", error);
      return false;
    }
  };

  // Clear all history from Firebase
  const clearAllHistory = async () => {
    if (window.confirm("Are you sure you want to delete ALL calculation history from cloud? This action cannot be undone.")) {
      try {
        setLoading(true);
        
        // Delete all documents one by one
        const deletePromises = history.map(item => 
          deleteFromFirebase(item.id)
        );
        
        await Promise.all(deletePromises);
        console.log("✅ All history cleared from Firebase");
        
        // Reload empty history
        setHistory([]);
        setFirebaseError(null);
        
      } catch (error) {
        console.error("❌ Error clearing history:", error);
        setFirebaseError("Error clearing history. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Calculate final price
  const calculate = async () => {
    if (!pricePerGram || !grams) {
      alert("Please enter gold weight in grams");
      return;
    }

    const gramsValue = parseFloat(grams);
    if (gramsValue <= 0) {
      alert("Please enter a valid gold weight");
      return;
    }

    // Calculate prices
    const base = pricePerGram * gramsValue;
    const gst = base * 0.03;
    const making = base * 0.10;
    const total = base + gst + making;

    setFinalPrice(total.toFixed(2));
    setSaving(true);

    // Prepare calculation data
    const calculationData = {
      grams: gramsValue,
      goldType,
      base: base.toFixed(2),
      gst: gst.toFixed(2),
      making: making.toFixed(2),
      total: total.toFixed(2),
      rate: pricePerGram,
      ratePerGram: pricePerGram,
      goldPurity: goldType === "24K" ? 99.9 : goldType === "22K" ? 91.6 : 75.0,
      calculatedAt: new Date().toISOString()
    };

    // Save to Firebase
    const saveResult = await saveToFirebase(calculationData);
    
    if (saveResult.success) {
      // Add to local state with proper date
      const newEntry = {
        id: saveResult.id,
        ...calculationData,
        date: new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata"
        })
      };
      
      // Update UI
      const newHistory = [newEntry, ...history.slice(0, 9)];
      setHistory(newHistory);
      setFirebaseError(null);
      
    } else {
      setFirebaseError("Failed to save calculation. Please try again.");
    }
    
    setSaving(false);
  };

  // Format Indian currency
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
        {firebaseError && (
          <div className="firebase-error">
            ⚠️ {firebaseError}
          </div>
        )}
        
        {loading ? (
          <p className="loading">📡 Loading from cloud...</p>
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
        
        <button onClick={calculate} disabled={!grams || saving}>
          {saving ? "💾 Saving to Cloud..." : "🧮 Calculate & Save"}
        </button>
      </div>

      {/* ✅ PRICE BREAKDOWN SECTION - YEH RAHEGA */}
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

      <div className="history-section">
        <div className="history-header">
          <h3>📊 Cloud History (Last 10)</h3>
          {history.length > 0 && (
            <button onClick={clearAllHistory} className="clear-btn danger">
              🗑️ Clear Cloud History
            </button>
          )}
        </div>
        
        {loading ? (
          <p className="loading">Loading history...</p>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <p>📝 No calculations yet</p>
            <small>Your calculations will be saved to cloud automatically</small>
          </div>
        ) : (
          <>
            <div className="cloud-info">
              <small>☁️ All data stored in Firebase Cloud</small>
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
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>{item.goldType}</td>
                    <td>{item.grams}g</td>
                    <td>₹{formatIndianCurrency(item.rate)}</td>
                    <td>₹{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

export default App;