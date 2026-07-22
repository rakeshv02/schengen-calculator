const { useState, useCallback } = React;

function daysInWindow(trips, refDate) {
  const windowStart = new Date(refDate);
  windowStart.setDate(windowStart.getDate() - 179);
  let days = 0;
  for (const t of trips) {
    const entry = new Date(t.entry), exit = new Date(t.exit);
    if (isNaN(entry) || isNaN(exit) || exit < entry) continue;
    const overlapStart = entry < windowStart ? windowStart : entry;
    const overlapEnd = exit > refDate ? refDate : exit;
    if (overlapStart <= overlapEnd) days += Math.round((overlapEnd - overlapStart) / 86400000) + 1;
  }
  return days;
}

function earliestEntry(trips, stayDays) {
  const today = new Date(); today.setHours(0,0,0,0);
  for (let d = 0; d <= 365; d++) {
    const candidate = new Date(today); candidate.setDate(today.getDate() + d);
    let ok = true;
    for (let s = 0; s < stayDays; s++) {
      const day = new Date(candidate); day.setDate(candidate.getDate() + s);
      if (daysInWindow(trips, day) + (s + 1) > 90) { ok = false; break; }
    }
    if (ok) return candidate;
  }
  return null;
}

const fmtDate = d => d ? new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }) : "—";
const daysBetween = (a, b) => Math.round((b - a) / 86400000);

export default function SchengenCalculator() {
  const today = new Date(); today.setHours(0,0,0,0);
  const todayStr = today.toISOString().split("T")[0];
  const [trips, setTrips] = useState([{ entry:"", exit:"", id:1 }]);
  const [plannedDays, setPlannedDays] = useState("14");
  const [result, setResult] = useState(null);
  const [nextId, setNextId] = useState(2);

  const addTrip = () => { setTrips(t => [...t, { entry:"", exit:"", id:nextId }]); setNextId(n=>n+1); };
  const removeTrip = id => setTrips(t => t.filter(x => x.id !== id));
  const updateTrip = (id, field, val) => setTrips(t => t.map(x => x.id === id ? {...x, [field]:val} : x));

  const calculate = useCallback(() => {
    const validTrips = trips.filter(t => t.entry && t.exit && new Date(t.exit) >= new Date(t.entry));
    const usedToday = daysInWindow(validTrips, today);
    const remaining = Math.max(0, 90 - usedToday);
    const planned = parseInt(plannedDays) || 14;
    const canEnterToday = daysInWindow(validTrips, today) + planned <= 90;
    const nextEntry = canEnterToday ? today : earliestEntry(validTrips, planned);
    setResult({ usedToday, remaining, validTrips, planned, nextEntry, canEnterToday });
  }, [trips, plannedDays, today]);

  const inputStyle = { padding:"10px 12px", border:"2px solid #bae6fd", borderRadius:9, fontSize:15, outline:"none", background:"#fff" };

  return (
    <div style={{ fontFamily:"'Segoe UI',Arial,sans-serif", background:"#f0f9ff", minHeight:"100vh", padding:"20px" }}>
      <div style={{ maxWidth:820, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>🛂</div>
          <h1 style={{ margin:0, fontSize:32, fontWeight:800, color:"#1a1a2e" }}>Schengen Visa Days Calculator</h1>
          <p style={{ margin:"8px 0 0", color:"#555", fontSize:16 }}>Track your 90/180 rule — know exactly how many days you have left</p>
        </div>

        <div style={{ background:"#fff3cd", border:"1px solid #ffc107", borderRadius:12, padding:16, marginBottom:24, fontSize:14, color:"#664d03" }}>
          <strong>The 90/180 rule:</strong> You may stay in the Schengen Area for a maximum of <strong>90 days</strong> in any <strong>180-day rolling window</strong>. The window moves daily, not per calendar year.
        </div>

        <div style={{ background:"#fff", borderRadius:16, padding:28, boxShadow:"0 4px 24px rgba(0,0,0,0.08)", marginBottom:24 }}>
          <h3 style={{ margin:"0 0 16px", fontSize:16, fontWeight:700, color:"#1a1a2e" }}>📅 Enter Your Schengen Trips</h3>
          {trips.map((trip) => (
            <div key={trip.id} style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:12, marginBottom:12, alignItems:"end" }}>
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#555", marginBottom:4 }}>Entry Date</label>
                <input type="date" value={trip.entry} max={todayStr} onChange={e=>updateTrip(trip.id,"entry",e.target.value)} style={{ ...inputStyle, width:"100%" }} />
              </div>
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#555", marginBottom:4 }}>Exit Date</label>
                <input type="date" value={trip.exit} max={todayStr} onChange={e=>updateTrip(trip.id,"exit",e.target.value)} style={{ ...inputStyle, width:"100%" }} />
              </div>
              <button onClick={()=>removeTrip(trip.id)} style={{ padding:"10px 14px", background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:9, cursor:"pointer", fontWeight:700, fontSize:16 }}>✕</button>
            </div>
          ))}
          <button onClick={addTrip} style={{ padding:"10px 18px", background:"#eff6ff", color:"#3b82f6", border:"2px solid #bfdbfe", borderRadius:9, cursor:"pointer", fontWeight:600, fontSize:14 }}>+ Add Trip</button>

          <div style={{ marginTop:24, paddingTop:20, borderTop:"1px solid #f1f3f5" }}>
            <label style={{ display:"block", fontSize:14, fontWeight:600, color:"#333", marginBottom:8 }}>Planned future stay (days)</label>
            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
              <input type="number" value={plannedDays} min="1" max="90" onChange={e=>setPlannedDays(e.target.value)} style={{ ...inputStyle, width:120 }} />
              <span style={{ fontSize:14, color:"#666" }}>days in Schengen</span>
            </div>
          </div>
          <button onClick={calculate} style={{ width:"100%", marginTop:24, padding:"16px", background:"linear-gradient(135deg, #0369a1, #0284c7)", color:"#fff", border:"none", borderRadius:12, fontSize:18, fontWeight:700, cursor:"pointer" }}>
            Check My Schengen Status
          </button>
        </div>

        {result && <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(170px,1fr))", gap:16, marginBottom:24 }}>
            {[
              { label:"Days Used (last 180 days)", value:result.usedToday, color:result.usedToday>80?"#dc2626":result.usedToday>60?"#d97706":"#0369a1", bg:"#f0f9ff" },
              { label:"Days Remaining", value:result.remaining, color:result.remaining<10?"#dc2626":result.remaining<30?"#d97706":"#059669", bg:result.remaining<10?"#fff5f5":"#f0fdf4" },
              { label:"Planned Trip", value:`${result.planned} days`, color:"#7c3aed", bg:"#faf5ff" },
              { label:"Can Enter Today?", value:result.canEnterToday?"✅ Yes":"❌ No", color:result.canEnterToday?"#059669":"#dc2626", bg:result.canEnterToday?"#f0fdf4":"#fff5f5" },
            ].map((item,i)=>(
              <div key={i} style={{ background:item.bg, borderRadius:14, padding:20, textAlign:"center", border:`2px solid ${item.color}22` }}>
                <div style={{ fontSize:26, fontWeight:800, color:item.color }}>{item.value}</div>
                <div style={{ fontSize:13, color:"#555", marginTop:4, fontWeight:500 }}>{item.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background:"#fff", borderRadius:16, padding:24, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", marginBottom:24 }}>
            <h3 style={{ margin:"0 0 16px", fontSize:16, fontWeight:700, color:"#1a1a2e" }}>90-Day Usage Bar</h3>
            <div style={{ height:24, background:"#f1f3f5", borderRadius:12, overflow:"hidden", marginBottom:8 }}>
              <div style={{ height:"100%", width:`${Math.min(100,(result.usedToday/90)*100)}%`, background:result.usedToday>80?"#dc2626":result.usedToday>60?"#f59e0b":"#0369a1", borderRadius:12 }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#666" }}>
              <span><strong style={{ color:"#0369a1" }}>{result.usedToday} days used</strong></span>
              <span><strong style={{ color:"#059669" }}>{result.remaining} days remaining</strong> of 90</span>
            </div>
          </div>

          <div style={{ background:result.canEnterToday?"#f0fdf4":"#fff5f5", borderRadius:16, padding:24, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", marginBottom:24, border:`2px solid ${result.canEnterToday?"#bbf7d0":"#fecaca"}` }}>
            <h3 style={{ margin:"0 0 8px", fontSize:16, fontWeight:700, color:"#1a1a2e" }}>
              {result.canEnterToday ? "✅ You can enter the Schengen Area today" : "⏳ Earliest safe entry for your planned stay"}
            </h3>
            {!result.canEnterToday && result.nextEntry && (
              <div style={{ fontSize:28, fontWeight:800, color:"#0369a1", marginTop:8 }}>
                {fmtDate(result.nextEntry)}
                <span style={{ fontSize:15, fontWeight:400, color:"#666", marginLeft:12 }}>({daysBetween(today, result.nextEntry)} days from now)</span>
              </div>
            )}
            {result.canEnterToday && <div style={{ fontSize:16, color:"#059669" }}>Your {result.planned}-day trip fits within your remaining {result.remaining} days.</div>}
          </div>

          {result.validTrips.length > 0 && (
            <div style={{ background:"#fff", borderRadius:16, padding:24, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
              <h3 style={{ margin:"0 0 16px", fontSize:16, fontWeight:700, color:"#1a1a2e" }}>Your Trips Summary</h3>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
                <thead><tr style={{ background:"#f0f9ff" }}>{["Entry","Exit","Duration","In 180-day window?"].map(h=><th key={h} style={{ padding:"10px 14px", textAlign:"left", fontWeight:700 }}>{h}</th>)}</tr></thead>
                <tbody>
                  {result.validTrips.map((t,i) => {
                    const entry = new Date(t.entry), exit = new Date(t.exit);
                    const dur = daysBetween(entry,exit)+1;
                    const windowStart = new Date(today); windowStart.setDate(today.getDate()-179);
                    const inWindow = exit >= windowStart;
                    return (
                      <tr key={i} style={{ borderBottom:"1px solid #f1f3f5" }}>
                        <td style={{ padding:"10px 14px" }}>{fmtDate(entry)}</td>
                        <td style={{ padding:"10px 14px" }}>{fmtDate(exit)}</td>
                        <td style={{ padding:"10px 14px", fontWeight:600 }}>{dur} day{dur!==1?"s":""}</td>
                        <td style={{ padding:"10px 14px", color:inWindow?"#059669":"#9ca3af", fontWeight:600 }}>{inWindow?"✅ Yes":"No (too old)"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>}

        <div style={{ background:"#fff", borderRadius:16, padding:24, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", marginTop:24 }}>
          <h3 style={{ margin:"0 0 12px", fontSize:16, fontWeight:700, color:"#1a1a2e" }}>🇪🇺 Schengen Area Countries (27)</h3>
          <p style={{ fontSize:13, color:"#666", lineHeight:1.7 }}>Austria · Belgium · Croatia · Czech Republic · Denmark · Estonia · Finland · France · Germany · Greece · Hungary · Iceland · Italy · Latvia · Liechtenstein · Lithuania · Luxembourg · Malta · Netherlands · Norway · Poland · Portugal · Slovakia · Slovenia · Spain · Sweden · Switzerland</p>
          <p style={{ fontSize:13, color:"#888", marginTop:8 }}>Ireland and Cyprus are EU but not Schengen. Bulgaria and Romania are partially Schengen (air/sea) since March 2024.</p>
        </div>
      </div>
    </div>
  );
}
