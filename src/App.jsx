import { useState, useEffect } from "react";

const SUPABASE_URL = "https://hrqppgcjzhqdnuhhvxvi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_vKvRdKlYGvsKCKNGpgvzYA_pPrtTpb6";

// ── WARNA TEMA SULAWESI TENGGARA ──
const T = {
  primary:      "#1A5C2A",
  primary2:     "#2D7A3E",
  gold:         "#C8971A",
  goldLight:    "#F5D97A",
  goldBg:       "#FFFBEA",
  dark:         "#1A1A1A",
  sidebar:      "#163D22",
  sidebarHover: "rgba(200,151,26,0.18)",
  bg:           "#F7F9F3",
};

const AKUN_DIIZINKAN = [
  { email: "protokoldata@gmail.com", password: "DinasPariwisata*", role: "admin", nama: "Admin Protokol", dinas: "Dinas Pariwisata Sultra" },
  { email: "pemasarandisparsultra@gmail.com", password: "penasaran1234", role: "tim_kreatif", nama: "Tim Kreatif Pemasaran", dinas: "Dinas Pariwisata Sultra" },
];

const supabase = {
  url: SUPABASE_URL, key: SUPABASE_ANON_KEY, token: null,
  userId: null, userRole: null, userEmail: null, userName: null,
  headers() {
    const h = { "Content-Type": "application/json", apikey: this.key };
    if (this.token) h["Authorization"] = `Bearer ${this.token}`;
    return h;
  },
  async signIn(email, password) {
    const res = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
      method: "POST", headers: { "Content-Type": "application/json", apikey: this.key },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error_description || data.error);
    this.token = data.access_token; this.userId = data.user?.id; this.userEmail = data.user?.email;
    localStorage.setItem("sb_token", data.access_token);
    return data;
  },
  async signOut() {
    try { await fetch(`${this.url}/auth/v1/logout`, { method: "POST", headers: this.headers() }); } catch(e) {}
    this.token = null; this.userId = null; this.userRole = null; this.userEmail = null; this.userName = null;
    ["sb_token","sb_email","sb_role","sb_name","sb_dinas"].forEach(k => localStorage.removeItem(k));
  },
  async getProfile() {
    const res = await fetch(`${this.url}/rest/v1/profiles?id=eq.${this.userId}&select=*`, { headers: this.headers() });
    const data = await res.json();
    if (data[0]) { this.userRole = data[0].role; this.userName = data[0].full_name || this.userEmail; }
    return data[0];
  },
  async query(table, params = "") {
    const res = await fetch(`${this.url}/rest/v1/${table}${params}`, { headers: { ...this.headers(), Prefer: "return=representation" } });
    return res.json();
  },
  async insert(table, body) {
    const res = await fetch(`${this.url}/rest/v1/${table}`, { method: "POST", headers: { ...this.headers(), Prefer: "return=representation" }, body: JSON.stringify(body) });
    return res.json();
  },
  async update(table, id, body) {
    const res = await fetch(`${this.url}/rest/v1/${table}?id=eq.${id}`, { method: "PATCH", headers: { ...this.headers(), Prefer: "return=representation" }, body: JSON.stringify(body) });
    return res.json();
  },
  async delete(table, id) {
    const res = await fetch(`${this.url}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers: this.headers() });
    return res.ok;
  },
};

const STATUS_CONFIG = {
  akan_berlangsung:   { label: "Akan Berlangsung",  color: "#1A5C2A", bg: "#E8F5EC", dot: "#1A5C2A" },
  sedang_berlangsung: { label: "Sedang Berlangsung", color: "#C8971A", bg: "#FFFBEA", dot: "#C8971A" },
  dibatalkan:         { label: "Dibatalkan",         color: "#B91C1C", bg: "#FEF2F2", dot: "#B91C1C" },
  selesai:            { label: "Selesai",            color: "#2D7A3E", bg: "#F0FDF4", dot: "#2D7A3E" },
};

const JENIS_OPTIONS = ["kunjungan","upacara","rapat","audiensi","monitoring","lainnya"];

const ROLE_CONFIG = {
  admin:       { label: "Admin",       color: "#1A1A1A", bg: "#F5D97A" },
  protokoler:  { label: "Protokoler",  color: "#1A5C2A", bg: "#D1FAE5" },
  tim_kreatif: { label: "Tim Kreatif", color: "#C8971A", bg: "#FEF9C3" },
};

const MONTHS       = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const DAYS_SHORT   = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];

function formatTanggal(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr + "T00:00:00");
  return `${String(d.getDate()).padStart(2,"0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function formatWaktu(t) { if (!t) return "-"; return t.slice(0,5); }
function parseDisplayDate(str) {
  if (!str) return "";
  const parts = str.split("/");
  if (parts.length===3 && parts[2].length===4)
    return `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
  return "";
}
function toDisplayDate(iso) {
  if (!iso) return "";
  const d = new Date(iso+"T00:00:00");
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

function LogoSultra({ size=36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="20" fill="#C8971A"/>
      <circle cx="20" cy="20" r="15" fill="#1A5C2A"/>
      <rect x="13" y="11" width="14" height="18" rx="2" fill="white" opacity="0.92"/>
      <rect x="15" y="14" width="10" height="1.5" rx="0.75" fill="#1A5C2A"/>
      <rect x="15" y="17" width="10" height="1.5" rx="0.75" fill="#1A5C2A"/>
      <rect x="15" y="20" width="7"  height="1.5" rx="0.75" fill="#1A5C2A"/>
      <rect x="15" y="23" width="5"  height="1.5" rx="0.75" fill="#1A5C2A"/>
    </svg>
  );
}

function StatusBadge({ status, large }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.akan_berlangsung;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:large?"6px 12px":"3px 9px", borderRadius:20,
      background:cfg.bg, color:cfg.color, fontSize:large?13:11, fontWeight:600, whiteSpace:"nowrap", border:`1px solid ${cfg.color}30` }}>
      <span style={{ width:6,height:6,borderRadius:"50%",background:cfg.dot,display:"inline-block",flexShrink:0 }}/>
      {cfg.label}
    </span>
  );
}

function LoadingScreen() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:T.bg }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}><LogoSultra size={56}/></div>
        <div style={{ fontSize:15, fontWeight:700, color:T.primary }}>Memuat Dashboard...</div>
        <div style={{ fontSize:12, color:"#6B7280", marginTop:4 }}>Dinas Pariwisata Prov. Sultra</div>
      </div>
    </div>
  );
}

// ── HALAMAN LOGIN ──
function AuthPage({ onLogin, notification }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true); await onLogin(email, password); setLoading(false);
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:`linear-gradient(160deg,${T.sidebar},${T.primary})`, padding:20 }}>
      <div style={{ background:"white", borderRadius:16, padding:"32px 28px", width:"100%", maxWidth:400,
        boxShadow:"0 20px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}><LogoSultra size={54}/></div>
          <div style={{ fontSize:16, fontWeight:800, color:T.primary, letterSpacing:0.3 }}>SISTEM INFORMASI DAN</div>
          <div style={{ fontSize:16, fontWeight:800, color:T.primary, letterSpacing:0.3 }}>DOKUMENTASI AGENDA PIMPINAN</div>
          <div style={{ fontSize:12, color:"#9CA3AF", marginTop:4 }}>Dinas Pariwisata Prov. Sultra</div>
        </div>

        {notification&&(
          <div style={{ padding:"10px 13px", borderRadius:8, marginBottom:14, fontSize:13,
            background:notification.type==="error"?"#FEF2F2":"#ECFDF5",
            color:notification.type==="error"?"#991B1B":"#065F46",
            border:`1px solid ${notification.type==="error"?"#FECACA":"#A7F3D0"}` }}>
            {notification.msg}
          </div>
        )}

        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:5 }}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="email@instansi.go.id"
            style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #D1D5DB", borderRadius:8,
              fontSize:13, outline:"none", boxSizing:"border-box" }}/>
        </div>
        <div style={{ marginBottom:22 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:5 }}>Password</label>
          <div style={{ position:"relative" }}>
            <input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Masukkan password"
              style={{ width:"100%", padding:"10px 12px", paddingRight:90, border:"1.5px solid #D1D5DB",
                borderRadius:8, fontSize:13, outline:"none", boxSizing:"border-box" }}/>
            <button onClick={()=>setShowPass(!showPass)} style={{ position:"absolute", right:10, top:"50%",
              transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", fontSize:11, fontWeight:600 }}>
              {showPass?"Sembunyikan":"Tampilkan"}
            </button>
          </div>
        </div>
        <button onClick={handleLogin} disabled={loading}
          style={{ width:"100%", padding:12, background:T.primary, color:"white", border:"none", borderRadius:8,
            fontSize:14, fontWeight:700, cursor:"pointer" }}>
          {loading?"Memverifikasi...":"Masuk"}
        </button>
        <div style={{ marginTop:14, padding:11, background:T.goldBg, borderRadius:8, fontSize:11,
          color:"#78350F", border:`1px solid ${T.goldLight}`, lineHeight:1.5 }}>
          Akses terbatas — hanya akun yang telah didaftarkan yang dapat masuk.
        </div>
        <div style={{ marginTop:14, textAlign:"center", fontSize:11, color:"#D1D5DB" }}>
          Dibuat oleh <span style={{ fontWeight:700, color:"#9CA3AF" }}>Fadriana</span> — Sistem Manajemen Protokoler
        </div>
      </div>
    </div>
  );
}

// ── KALENDER BULANAN ──
function KalenderView({ kegiatanList, onView }) {
  const today = new Date();
  const [currentYear,  setCurrentYear]  = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay,  setSelectedDay]  = useState(null);

  const todayStr    = today.toISOString().split("T")[0];
  const firstDay    = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth+1, 0).getDate();

  function prevMonth() {
    if (currentMonth===0) { setCurrentMonth(11); setCurrentYear(y=>y-1); }
    else setCurrentMonth(m=>m-1);
    setSelectedDay(null);
  }
  function nextMonth() {
    if (currentMonth===11) { setCurrentMonth(0); setCurrentYear(y=>y+1); }
    else setCurrentMonth(m=>m+1);
    setSelectedDay(null);
  }
  function getEventsOnDay(day) {
    const ds = `${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return kegiatanList.filter(k=>k.tanggal===ds);
  }

  const STATUS_DOT = {
    akan_berlangsung:  T.primary,
    sedang_berlangsung:T.gold,
    dibatalkan:        "#B91C1C",
    selesai:           "#2D7A3E",
  };

  const cells = [];
  for (let i=0; i<firstDay; i++) cells.push(null);
  for (let d=1; d<=daysInMonth; d++) cells.push(d);

  const selectedEvents = selectedDay ? getEventsOnDay(selectedDay) : [];

  return (
    <div>
      {/* Navigasi bulan */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
        <h2 style={{ fontSize:16,fontWeight:700,color:T.dark,margin:0 }}>Kalender Kegiatan</h2>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <button onClick={prevMonth} style={{ background:T.primary,border:"none",borderRadius:6,
            padding:"5px 14px",cursor:"pointer",color:"white",fontSize:16,fontWeight:700 }}>‹</button>
          <span style={{ fontSize:14,fontWeight:700,color:T.primary,minWidth:170,textAlign:"center" }}>
            {MONTHS[currentMonth]} {currentYear}
          </span>
          <button onClick={nextMonth} style={{ background:T.primary,border:"none",borderRadius:6,
            padding:"5px 14px",cursor:"pointer",color:"white",fontSize:16,fontWeight:700 }}>›</button>
        </div>
      </div>

      {/* Grid kalender */}
      <div style={{ background:"white",borderRadius:12,border:`2px solid ${T.gold}`,overflow:"hidden" }}>
        {/* Header hari */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:T.primary }}>
          {DAYS_SHORT.map(d=>(
            <div key={d} style={{ padding:"9px 4px",textAlign:"center",fontSize:11,fontWeight:700,
              color:d==="Min"?"#F5D97A":"rgba(255,255,255,0.9)",letterSpacing:0.3 }}>{d}</div>
          ))}
        </div>

        {/* Sel tanggal */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)" }}>
          {cells.map((day,idx)=>{
            if (!day) return <div key={`e${idx}`} style={{ minHeight:74,borderRight:"1px solid #F0F0F0",
              borderBottom:"1px solid #F0F0F0",background:"#FAFAFA" }}/>;
            const ds      = `${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const events  = getEventsOnDay(day);
            const isToday = ds===todayStr;
            const isSel   = day===selectedDay;
            const isSun   = idx%7===0;
            const isSat   = idx%7===6;
            return (
              <div key={day} onClick={()=>setSelectedDay(isSel?null:day)}
                style={{ minHeight:74,borderRight:"1px solid #F0F0F0",borderBottom:"1px solid #F0F0F0",
                  padding:"5px",cursor:"pointer",
                  background: isSel?T.goldBg: isToday?"#E8F5EC":"white",
                  outline: isSel?`2px solid ${T.gold}`:isToday?`2px solid ${T.primary}`:"none",
                  outlineOffset:"-2px",
                }}>
                <div style={{ fontSize:11,fontWeight:(isToday||isSel)?800:500,
                  width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"50%",
                  background:isToday?T.primary:"transparent",
                  color:isToday?"white":isSun?"#B91C1C":isSat?T.gold:"#374151",
                  marginBottom:3 }}>
                  {day}
                </div>
                {events.slice(0,2).map(k=>(
                  <div key={k.id} style={{ fontSize:10,fontWeight:600,padding:"2px 4px",borderRadius:3,marginBottom:2,
                    background:STATUS_DOT[k.status]+"22",color:STATUS_DOT[k.status],
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.4 }} title={k.nama_kegiatan}>
                    · {k.nama_kegiatan}
                  </div>
                ))}
                {events.length>2&&<div style={{ fontSize:10,color:T.gold,fontWeight:700 }}>+{events.length-2} lagi</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail hari terpilih */}
      {selectedDay&&(
        <div style={{ marginTop:14,background:"white",borderRadius:12,border:`1.5px solid ${T.gold}`,overflow:"hidden" }}>
          <div style={{ padding:"10px 16px",background:T.primary,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <div style={{ fontSize:13,fontWeight:700,color:"white" }}>
              {String(selectedDay).padStart(2,"0")} {MONTHS[currentMonth]} {currentYear}
            </div>
            <span style={{ fontSize:11,color:T.goldLight,fontWeight:600 }}>{selectedEvents.length} kegiatan</span>
          </div>
          {selectedEvents.length===0?(
            <div style={{ padding:"18px",textAlign:"center",color:"#9CA3AF",fontSize:13 }}>
              Tidak ada kegiatan pada tanggal ini.
            </div>
          ):selectedEvents.map(k=>(
            <div key={k.id} onClick={()=>onView(k)}
              style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 16px",cursor:"pointer",
                borderBottom:"1px solid #F3F4F6",transition:"background 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.background=T.goldBg}
              onMouseLeave={e=>e.currentTarget.style.background="white"}>
              <div style={{ width:8,height:8,borderRadius:"50%",background:STATUS_DOT[k.status],flexShrink:0 }}/>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontWeight:600,fontSize:13,color:T.dark,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                  {k.nama_kegiatan}
                </div>
                <div style={{ fontSize:11,color:"#6B7280",marginTop:1 }}>
                  {formatWaktu(k.waktu_mulai)}{k.waktu_selesai?` – ${formatWaktu(k.waktu_selesai)}`:""} · {k.lokasi||"-"}
                </div>
              </div>
              <StatusBadge status={k.status}/>
            </div>
          ))}
        </div>
      )}

      {/* Legenda */}
      <div style={{ display:"flex",gap:16,marginTop:10,flexWrap:"wrap" }}>
        {[[T.primary,"Akan Berlangsung"],[T.gold,"Sedang Berlangsung"],["#2D7A3E","Selesai"],["#B91C1C","Dibatalkan"]].map(([c,l])=>(
          <div key={l} style={{ display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#6B7280" }}>
            <div style={{ width:9,height:9,borderRadius:2,background:c,flexShrink:0 }}/>{l}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MODAL KEGIATAN ──
function KegiatanModal({ mode, data, user, isKreatif, canEdit, onSave, onUpdateLink, onClose }) {
  const initTanggal = data?.tanggal || new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    tanggal:          initTanggal,
    tanggalDisplay:   toDisplayDate(initTanggal),
    waktu_mulai:      data?.waktu_mulai||"",
    waktu_selesai:    data?.waktu_selesai||"",
    jenis_kegiatan:   data?.jenis_kegiatan||"rapat",
    nama_kegiatan:    data?.nama_kegiatan||"",
    lokasi:           data?.lokasi||"",
    peserta_undangan: data?.peserta_undangan||"",
    pic:              data?.pic||"",
    status:           data?.status||"akan_berlangsung",
    keterangan:       data?.keterangan||"",
    diinput_oleh:     data?.diinput_oleh||user.name||"",
    link_dokumentasi: data?.link_dokumentasi||"",
    id:               data?.id,
  });

  const isView   = mode==="view";
  const onlyLink = mode==="link"; // mode khusus untuk tim_kreatif input link

  function handleTanggal(val) {
    let raw = val.replace(/[^0-9]/g,"");
    let display = raw;
    if (raw.length>2) display = raw.slice(0,2)+"/"+raw.slice(2);
    if (raw.length>4) display = raw.slice(0,2)+"/"+raw.slice(2,4)+"/"+raw.slice(4,8);
    const iso = parseDisplayDate(display);
    setForm(p=>({...p,tanggalDisplay:display,tanggal:iso||p.tanggal}));
  }

  function gcLink() {
    const d  = (form.tanggal||"").replace(/-/g,"");
    const st = (form.waktu_mulai||"09:00").replace(":","")+"00";
    const et = (form.waktu_selesai||"10:00").replace(":","")+"00";
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(form.nama_kegiatan||"Kegiatan")}&dates=${d}T${st}/${d}T${et}&location=${encodeURIComponent(form.lokasi||"")}&details=${encodeURIComponent(form.keterangan||"")}`;
  }

  const iStyle = { width:"100%",padding:"9px 12px",border:"1.5px solid #E5E7EB",borderRadius:8,fontSize:13,
    outline:"none",boxSizing:"border-box",background:"white",color:"#111827" };
  const iStyleRO = { ...iStyle, background:"#F9FAFB" };

  // Field sepenuhnya reactive
  function Field({ label, field, placeholder="" }) {
    return (
      <div style={{ marginBottom:13 }}>
        <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5 }}>{label}</label>
        <input
          value={form[field]||""}
          onChange={e=>setForm(p=>({...p,[field]:e.target.value}))}
          placeholder={placeholder}
          readOnly={isView}
          style={isView?iStyleRO:iStyle}
        />
      </div>
    );
  }

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",
      justifyContent:"center",zIndex:1000,padding:16 }} onClick={onClose}>
      <div style={{ background:"white",borderRadius:14,width:"100%",maxWidth:560,maxHeight:"90vh",
        display:"flex",flexDirection:"column",boxShadow:"0 20px 50px rgba(0,0,0,0.25)",overflow:"hidden" }}
        onClick={e=>e.stopPropagation()}>

        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",
          borderBottom:`2px solid ${T.gold}`,background:T.primary }}>
          <h2 style={{ fontSize:15,fontWeight:700,color:"white",margin:0 }}>
            {isView?"Detail Kegiatan":mode==="link"?"📎 Upload Link Dokumentasi":mode==="edit"?"Edit Kegiatan":"Tambah Kegiatan Baru"}
          </h2>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.15)",border:"none",borderRadius:6,
            padding:"5px 11px",cursor:"pointer",fontSize:14,color:"white",fontWeight:700 }}>✕</button>
        </div>

        <div style={{ padding:"16px 20px",overflowY:"auto",flex:1 }}>
          {isView?(
            <div>
              <div style={{ marginBottom:14 }}><StatusBadge status={data.status} large/></div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:9 }}>
                {[["Tanggal",formatTanggal(data.tanggal)],["Waktu",`${formatWaktu(data.waktu_mulai)}${data.waktu_selesai?` – ${formatWaktu(data.waktu_selesai)}`:""}`],["Jenis",data.jenis_kegiatan],["Nama Kegiatan",data.nama_kegiatan],["Lokasi",data.lokasi],["Peserta / Undangan",data.peserta_undangan],["PIC",data.pic],["Keterangan",data.keterangan],["Diinput Oleh",data.diinput_oleh]].filter(([,v])=>v).map(([l,v])=>(
                  <div key={l} style={{ background:"#F9FAFB",borderRadius:8,padding:"9px 12px",border:"1px solid #E5E7EB" }}>
                    <div style={{ fontSize:10,fontWeight:700,color:"#9CA3AF",marginBottom:3,textTransform:"uppercase",letterSpacing:0.3 }}>{l}</div>
                    <div style={{ fontSize:13,fontWeight:500,color:"#111827" }}>{v}</div>
                  </div>
                ))}
              </div>
              {data.link_dokumentasi&&(
                <div style={{ marginTop:12,padding:"10px 14px",background:"#F0FDF4",borderRadius:8,border:"1px solid #BBF7D0" }}>
                  <div style={{ fontSize:10,fontWeight:700,color:"#6B7280",marginBottom:4,textTransform:"uppercase" }}>Link Dokumentasi</div>
                  <a href={data.link_dokumentasi} target="_blank" rel="noopener noreferrer" style={{ color:"#059669",fontSize:13,wordBreak:"break-all" }}>{data.link_dokumentasi}</a>
                </div>
              )}
            </div>
          ):onlyLink?(
            <div>
              <div style={{ padding:"11px 14px",background:T.goldBg,borderRadius:8,marginBottom:14,border:`1px solid ${T.goldLight}` }}>
                <div style={{ fontWeight:600,fontSize:13,color:T.dark }}>{data?.nama_kegiatan}</div>
                <div style={{ fontSize:12,color:"#6B7280",marginTop:2 }}>{formatTanggal(data?.tanggal)}</div>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5 }}>Link Dokumentasi</label>
                <input value={form.link_dokumentasi} onChange={e=>setForm(p=>({...p,link_dokumentasi:e.target.value}))}
                  placeholder="https://drive.google.com/..." style={iStyle}/>
                <div style={{ fontSize:11,color:"#9CA3AF",marginTop:4 }}>Google Drive, Dropbox, YouTube, atau link lainnya</div>
              </div>
            </div>
          ):(
            <div>
              <div style={{ marginBottom:13 }}>
                <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5 }}>Tanggal (HH/BB/TTTT)</label>
                <input value={form.tanggalDisplay} onChange={e=>handleTanggal(e.target.value)}
                  placeholder="contoh: 08/05/2026" maxLength={10} style={iStyle}/>
              </div>
              <div style={{ display:"flex",gap:12 }}>
                <div style={{ flex:1,marginBottom:13 }}>
                  <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5 }}>Waktu Mulai</label>
                  <input type="time" value={form.waktu_mulai} onChange={e=>setForm(p=>({...p,waktu_mulai:e.target.value}))} style={iStyle}/>
                </div>
                <div style={{ flex:1,marginBottom:13 }}>
                  <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5 }}>Waktu Selesai</label>
                  <input type="time" value={form.waktu_selesai} onChange={e=>setForm(p=>({...p,waktu_selesai:e.target.value}))} style={iStyle}/>
                </div>
              </div>
              <div style={{ marginBottom:13 }}>
                <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5 }}>Jenis Kegiatan</label>
                <select value={form.jenis_kegiatan} onChange={e=>setForm(p=>({...p,jenis_kegiatan:e.target.value}))} style={iStyle}>
                  {JENIS_OPTIONS.map(j=><option key={j} value={j}>{j.charAt(0).toUpperCase()+j.slice(1)}</option>)}
                </select>
              </div>
              <Field label="Nama Kegiatan"        field="nama_kegiatan"    placeholder="Masukkan nama kegiatan..."/>
              <Field label="Lokasi"               field="lokasi"           placeholder="Nama tempat / alamat..."/>
              <Field label="Peserta / Undangan"   field="peserta_undangan" placeholder="Nama peserta atau kelompok undangan..."/>
              <div style={{ display:"flex",gap:12 }}>
                <div style={{ flex:1 }}><Field label="PIC (Penanggung Jawab)" field="pic" placeholder="Nama PIC..."/></div>
                <div style={{ flex:1,marginBottom:13 }}>
                  <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5 }}>Status</label>
                  <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} style={iStyle}>
                    {Object.entries(STATUS_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom:13 }}>
                <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5 }}>Keterangan</label>
                <textarea value={form.keterangan} onChange={e=>setForm(p=>({...p,keterangan:e.target.value}))}
                  placeholder="Catatan atau keterangan tambahan..."
                  style={{ ...iStyle,minHeight:70,resize:"vertical",fontFamily:"inherit" }}/>
              </div>
              <Field label="Diinput Oleh"     field="diinput_oleh"      placeholder="Nama penginput..."/>
              <Field label="Link Dokumentasi" field="link_dokumentasi"  placeholder="https://drive.google.com/..."/>
            </div>
          )}
        </div>

        <div style={{ padding:"12px 20px",borderTop:"1px solid #E5E7EB",display:"flex",justifyContent:"flex-end",gap:9,flexWrap:"wrap" }}>
          <button onClick={onClose} style={{ padding:"8px 16px",border:"1px solid #E5E7EB",borderRadius:7,background:"white",cursor:"pointer",fontSize:13,fontWeight:600,color:"#374151" }}>
            {isView?"Tutup":"Batal"}
          </button>
          {!isView&&(
            <>
              {!onlyLink&&form.nama_kegiatan&&(
                <a href={gcLink()} target="_blank" rel="noopener noreferrer"
                  style={{ padding:"8px 14px",background:T.goldBg,color:T.primary,border:`1px solid ${T.goldLight}`,
                    borderRadius:7,fontSize:13,fontWeight:600,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:5 }}>
                  + Google Calendar
                </a>
              )}
              <button onClick={()=>onlyLink?onUpdateLink(form.id,form.link_dokumentasi):onSave(form)}
                style={{ padding:"8px 18px",background:T.primary,color:"white",border:"none",borderRadius:7,fontSize:13,fontWeight:600,cursor:"pointer" }}>
                {onlyLink?"Simpan Link":mode==="edit"?"Simpan Perubahan":"Tambah Kegiatan"}
              </button>
            </>
          )}
          {isView&&(
            <a href={gcLink()} target="_blank" rel="noopener noreferrer"
              style={{ padding:"8px 14px",background:T.goldBg,color:T.primary,border:`1px solid ${T.goldLight}`,
                borderRadius:7,fontSize:13,fontWeight:600,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:5 }}>
              + Google Calendar
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── APP UTAMA ──
export default function App() {
  const [isLoggedIn,        setIsLoggedIn]        = useState(false);
  const [loading,           setLoading]           = useState(true);
  const [user,              setUser]              = useState(null);
  const [activeMenu,        setActiveMenu]        = useState("dashboard");
  const [kegiatanList,      setKegiatanList]      = useState([]);
  const [notification,      setNotification]      = useState(null);
  const [showModal,         setShowModal]         = useState(false);
  const [modalMode,         setModalMode]         = useState("add");
  const [selectedKegiatan,  setSelectedKegiatan]  = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget,      setDeleteTarget]      = useState(null);
  const [filterStatus,      setFilterStatus]      = useState("semua");
  const [filterJenis,       setFilterJenis]       = useState("semua");
  const [searchText,        setSearchText]        = useState("");

  useEffect(()=>{ initApp(); },[]);

  async function initApp() {
    const savedEmail = localStorage.getItem("sb_email");
    const savedRole  = localStorage.getItem("sb_role");
    const savedName  = localStorage.getItem("sb_name");
    const savedDinas = localStorage.getItem("sb_dinas");
    const token      = localStorage.getItem("sb_token");
    if (token && savedEmail) {
      supabase.token = token; supabase.userEmail = savedEmail; supabase.userRole = savedRole; supabase.userName = savedName;
      setUser({ email:savedEmail, role:savedRole, name:savedName||savedEmail, dinas:savedDinas||"" });
      await loadData();
      setIsLoggedIn(true);
    }
    setLoading(false);
  }

  // Kedua akun (admin & tim_kreatif) berbagi data yang SAMA
  async function loadData() {
    const data = await supabase.query("kegiatan", "?select=*&order=tanggal.asc,waktu_mulai.asc");
    if (Array.isArray(data)) setKegiatanList(data);
  }

  function showNotif(msg, type="success") {
    setNotification({msg,type}); setTimeout(()=>setNotification(null),4000);
  }

  async function handleLogin(email, password) {
    // HANYA izinkan dua akun terdaftar — tolak semua email/password lain
    const akun = AKUN_DIIZINKAN.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (!akun) {
      showNotif("Akses ditolak. Email tidak terdaftar dalam sistem.", "error");
      return;
    }
    if (akun.password !== password) {
      showNotif("Password salah. Akses ditolak.", "error");
      return;
    }
    try { await supabase.signIn(email, password); } catch(e) {}
    supabase.userRole = akun.role;
    localStorage.setItem("sb_email", email);
    localStorage.setItem("sb_role", akun.role);
    localStorage.setItem("sb_name", akun.nama);
    localStorage.setItem("sb_dinas", akun.dinas);
    setUser({ email, role: akun.role, name: akun.nama, dinas: akun.dinas });
    await loadData();
    setIsLoggedIn(true);
    showNotif("Selamat datang, " + akun.nama + "!");
  }

  async function handleLogout() {
    await supabase.signOut(); setIsLoggedIn(false); setUser(null); setKegiatanList([]); setActiveMenu("dashboard");
  }

  async function handleSaveKegiatan(formData) {
    try {
      if (modalMode==="add") {
        const body = {...formData}; delete body.id; delete body.tanggalDisplay;
        if (supabase.userId) body.created_by = supabase.userId;
        const result = await supabase.insert("kegiatan", body);
        if (!result || (Array.isArray(result) && result.length===0))
          throw new Error("Data tidak tersimpan, coba lagi");
        showNotif("Kegiatan berhasil ditambahkan!");
      } else {
        const {id,created_at,tanggalDisplay,...body} = formData;
        if (supabase.userId) body.updated_by = supabase.userId;
        await supabase.update("kegiatan", formData.id, body);
        showNotif("Kegiatan berhasil diperbarui!");
      }
      await loadData(); setShowModal(false);
    } catch(e) { showNotif("Gagal: "+e.message,"error"); }
  }

  async function handleUpdateLink(id, link) {
    try {
      await supabase.update("kegiatan",id,{link_dokumentasi:link});
      showNotif("Link dokumentasi berhasil disimpan!"); await loadData(); setShowModal(false);
    } catch(e) { showNotif("Gagal: "+e.message,"error"); }
  }

  async function handleDeleteKegiatan(id) {
    try {
      await supabase.delete("kegiatan",id);
      showNotif("Kegiatan berhasil dihapus!"); await loadData(); setShowDeleteConfirm(false);
    } catch(e) { showNotif("Gagal: "+e.message,"error"); }
  }

  const filtered = kegiatanList.filter(k=>{
    const ms = filterStatus==="semua"||k.status===filterStatus;
    const mj = filterJenis==="semua"||k.jenis_kegiatan===filterJenis;
    const mq = !searchText||k.nama_kegiatan?.toLowerCase().includes(searchText.toLowerCase())||k.lokasi?.toLowerCase().includes(searchText.toLowerCase())||k.pic?.toLowerCase().includes(searchText.toLowerCase());
    return ms&&mj&&mq;
  });

  const today = new Date().toISOString().split("T")[0];
  const stats = {
    total:   kegiatanList.length,
    hariIni: kegiatanList.filter(k=>k.tanggal===today).length,
    akan:    kegiatanList.filter(k=>k.status==="akan_berlangsung").length,
    sedang:  kegiatanList.filter(k=>k.status==="sedang_berlangsung").length,
    selesai: kegiatanList.filter(k=>k.status==="selesai").length,
    batal:   kegiatanList.filter(k=>k.status==="dibatalkan").length,
  };

  if (loading)    return <LoadingScreen/>;
  if (!isLoggedIn) return <AuthPage onLogin={handleLogin} notification={notification}/>;

  const isAdmin   = user.role==="admin";
  const isKreatif = user.role==="tim_kreatif";
  const canEdit   = user.role==="admin"; // hanya admin yg bisa tambah/edit/hapus
  const openView  = k=>{ setSelectedKegiatan(k); setModalMode("view"); setShowModal(true); };

  const MENU_ITEMS = [
    {id:"dashboard", label:"🏠  Dashboard"},
    {id:"kalender",  label:"📅  Kalender"},
    {id:"kegiatan",  label:"📋  Jadwal Kegiatan"},
    ...(isAdmin?[{id:"pengguna",label:"👥  Pengguna"}]:[]),
  ];

  const HEADER_TITLES = { dashboard:"Dashboard", kalender:"Kalender Kegiatan", kegiatan:"Jadwal Kegiatan", pengguna:"Manajemen Pengguna" };

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"'Segoe UI',system-ui,sans-serif", background:T.bg, overflow:"hidden" }}>
      {notification&&(
        <div style={{ position:"fixed",top:16,right:16,padding:"11px 16px",borderRadius:8,border:"1px solid",fontSize:13,
          fontWeight:600,zIndex:9999,boxShadow:"0 4px 16px rgba(0,0,0,0.15)",
          background:notification.type==="error"?"#FEF2F2":T.goldBg,
          borderColor:notification.type==="error"?"#FECACA":T.goldLight,
          color:notification.type==="error"?"#991B1B":T.primary }}>
          {notification.msg}
        </div>
      )}

      {/* SIDEBAR */}
      <aside style={{ width:230,minWidth:230,background:T.sidebar,display:"flex",flexDirection:"column",
        position:"fixed",top:0,left:0,height:"100vh",zIndex:50 }}>
        <div style={{ padding:"16px 14px 12px",borderBottom:`1px solid ${T.gold}44` }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <LogoSultra size={42}/>
            <div>
              <div style={{ fontSize:8,fontWeight:800,color:T.goldLight,letterSpacing:0.5,lineHeight:1.5,textTransform:"uppercase" }}>Sistem Informasi &</div>
              <div style={{ fontSize:8,fontWeight:800,color:T.goldLight,letterSpacing:0.5,lineHeight:1.5,textTransform:"uppercase" }}>Dokumentasi Agenda</div>
              <div style={{ fontSize:8,fontWeight:800,color:T.goldLight,letterSpacing:0.5,lineHeight:1.5,textTransform:"uppercase" }}>Pimpinan</div>
              <div style={{ fontSize:9,color:"rgba(255,255,255,0.4)",marginTop:1 }}>{user.dinas||"Dinas Pariwisata Prov. Sultra"}</div>
            </div>
          </div>
        </div>

        <nav style={{ padding:"10px 8px",flex:1 }}>
          {MENU_ITEMS.map(item=>(
            <button key={item.id} onClick={()=>setActiveMenu(item.id)} style={{
              display:"flex",alignItems:"center",padding:"10px 14px",borderRadius:7,border:"none",
              background:activeMenu===item.id?T.sidebarHover:"transparent",
              color:activeMenu===item.id?T.goldLight:"rgba(255,255,255,0.75)",
              cursor:"pointer",width:"100%",textAlign:"left",fontSize:13,
              fontWeight:activeMenu===item.id?700:400,marginBottom:2,
              borderLeft:activeMenu===item.id?`3px solid ${T.gold}`:"3px solid transparent",
            }}>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding:"12px 12px 16px",borderTop:`1px solid ${T.gold}44` }}>
          <div style={{ display:"flex",alignItems:"center",gap:9,marginBottom:10,padding:"9px 11px",
            background:"rgba(255,255,255,0.08)",borderRadius:7,border:`1px solid ${T.gold}33` }}>
            <div style={{ width:32,height:32,borderRadius:"50%",background:T.gold,color:T.dark,
              display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,flexShrink:0 }}>
              {(user.name||"U")[0].toUpperCase()}
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:11,fontWeight:600,color:"white",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{user.name}</div>
              <span style={{ fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:5,
                background:ROLE_CONFIG[user.role]?.bg,color:ROLE_CONFIG[user.role]?.color }}>
                {ROLE_CONFIG[user.role]?.label||user.role}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:6,
            padding:"7px 12px",border:`1px solid ${T.gold}55`,borderRadius:7,background:"rgba(255,255,255,0.06)",
            color:"rgba(255,255,255,0.8)",cursor:"pointer",fontSize:12,width:"100%" }}>
            Keluar
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex:1,display:"flex",flexDirection:"column",marginLeft:230,height:"100vh",overflow:"hidden" }}>
        <header style={{ padding:"11px 22px",background:"white",borderBottom:`3px solid ${T.gold}`,
          display:"flex",alignItems:"center",gap:16 }}>
          <div style={{ fontWeight:700,fontSize:14,color:T.primary,flex:1 }}>
            {HEADER_TITLES[activeMenu]||""}
          </div>
          <div style={{ fontSize:12,color:"#9CA3AF" }}>
            {new Date().toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
          </div>
        </header>

        <div style={{ flex:1,overflowY:"auto",padding:"18px 22px",background:T.bg }}>

          {/* ── DASHBOARD ── */}
          {activeMenu==="dashboard"&&(
            <div>
              <div style={{ marginBottom:16 }}>
                <div style={{ marginBottom:10,padding:"14px 18px",background:`linear-gradient(135deg,${T.primary},${T.primary2})`,borderRadius:12,border:`2px solid ${T.gold}` }}>
                  <div style={{ fontSize:16,fontWeight:800,color:"white",letterSpacing:0.4,lineHeight:1.4 }}>SISTEM INFORMASI DAN DOKUMENTASI</div>
                  <div style={{ fontSize:16,fontWeight:800,color:T.goldLight,letterSpacing:0.4,lineHeight:1.4 }}>AGENDA PIMPINAN</div>
                  <div style={{ fontSize:12,color:"rgba(255,255,255,0.75)",marginTop:4,fontWeight:500 }}>Dinas Pariwisata Prov. Sultra</div>
                </div>
                <h1 style={{ fontSize:15,fontWeight:600,color:T.dark,margin:0 }}>Selamat Datang, {user.name} 👋</h1>
              </div>

              {/* Stat cards */}
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10,marginBottom:20 }}>
                {[
                  {label:"Total Kegiatan",   val:stats.total,  color:T.dark,    bg:"white",   border:T.gold},
                  {label:"Hari Ini",         val:stats.hariIni,color:T.primary, bg:"#E8F5EC", border:T.primary},
                  {label:"Akan Berlangsung", val:stats.akan,   color:T.primary, bg:"white",   border:T.primary},
                  {label:"Sedang Berlangsung",val:stats.sedang,color:T.gold,    bg:T.goldBg,  border:T.gold},
                  {label:"Selesai",          val:stats.selesai,color:"#065F46", bg:"#F0FDF4", border:"#A7F3D0"},
                  {label:"Dibatalkan",       val:stats.batal,  color:"#B91C1C", bg:"#FEF2F2", border:"#FECACA"},
                ].map(c=>(
                  <div key={c.label} style={{ background:c.bg,borderRadius:10,padding:"13px 15px",border:`1.5px solid ${c.border}` }}>
                    <div style={{ fontSize:26,fontWeight:800,color:c.color,lineHeight:1 }}>{c.val}</div>
                    <div style={{ fontSize:11,color:c.color,marginTop:4,fontWeight:500,opacity:0.8 }}>{c.label}</div>
                  </div>
                ))}
              </div>

              {/* Kalender di dashboard */}
              <div style={{ background:"white",borderRadius:12,padding:"16px 18px",border:`1px solid ${T.gold}55` }}>
                <KalenderView kegiatanList={kegiatanList} onView={openView}/>
              </div>
            </div>
          )}

          {/* ── KALENDER ── */}
          {activeMenu==="kalender"&&(
            <div style={{ background:"white",borderRadius:12,padding:"16px 18px",border:`1px solid ${T.gold}55` }}>
              <KalenderView kegiatanList={kegiatanList} onView={openView}/>
            </div>
          )}

          {/* ── JADWAL KEGIATAN ── */}
          {activeMenu==="kegiatan"&&(
            <div>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10 }}>
                <div>
                  <h1 style={{ fontSize:18,fontWeight:700,color:T.dark,margin:0 }}>Jadwal Kegiatan</h1>
                  <p style={{ fontSize:12,color:"#6B7280",margin:"3px 0 0" }}>Total {kegiatanList.length} kegiatan terdaftar</p>
                </div>
                {canEdit&&(
                  <button onClick={()=>{setSelectedKegiatan(null);setModalMode("add");setShowModal(true);}}
                    style={{ padding:"9px 16px",background:T.primary,color:"white",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer" }}>
                    + Tambah Kegiatan
                  </button>
                )}
              </div>
              <div style={{ display:"flex",gap:10,marginBottom:12,flexWrap:"wrap" }}>
                <input value={searchText} onChange={e=>setSearchText(e.target.value)}
                  placeholder="Cari nama, lokasi, atau PIC..."
                  style={{ flex:"1 1 200px",padding:"8px 12px",border:"1.5px solid #E5E7EB",borderRadius:8,fontSize:13,outline:"none",background:"white" }}/>
                <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
                  style={{ padding:"8px 12px",border:"1.5px solid #E5E7EB",borderRadius:8,fontSize:13,background:"white",cursor:"pointer",outline:"none" }}>
                  <option value="semua">Semua Status</option>
                  {Object.entries(STATUS_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={filterJenis} onChange={e=>setFilterJenis(e.target.value)}
                  style={{ padding:"8px 12px",border:"1.5px solid #E5E7EB",borderRadius:8,fontSize:13,background:"white",cursor:"pointer",outline:"none" }}>
                  <option value="semua">Semua Jenis</option>
                  {JENIS_OPTIONS.map(j=><option key={j} value={j}>{j.charAt(0).toUpperCase()+j.slice(1)}</option>)}
                </select>
              </div>
              {filtered.length===0?(
                <div style={{ textAlign:"center",padding:"36px 0",color:"#9CA3AF",background:"white",borderRadius:12,border:"1px solid #E5E7EB",fontSize:13 }}>
                  Belum ada kegiatan
                  {canEdit&&<div style={{marginTop:10}}><button onClick={()=>{setSelectedKegiatan(null);setModalMode("add");setShowModal(true);}}
                    style={{padding:"8px 16px",background:T.primary,color:"white",border:"none",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                    + Tambah Kegiatan Pertama</button></div>}
                </div>
              ):(
                <div style={{ background:"white",borderRadius:12,overflow:"auto",border:"1px solid #E5E7EB" }}>
                  <table style={{ width:"100%",borderCollapse:"collapse",minWidth:700 }}>
                    <thead>
                      <tr>{["Tanggal","Waktu","Jenis","Nama Kegiatan","Lokasi","PIC","Status","Aksi"].map(h=>(
                        <th key={h} style={{ padding:"10px 13px",textAlign:"left",fontSize:11,fontWeight:700,color:"white",
                          background:T.primary,whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:0.3 }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {filtered.map((k,i)=>(
                        <tr key={k.id} style={{ background:i%2===0?"#FAFAFA":"white" }}>
                          <td style={{ padding:"10px 13px",borderBottom:"1px solid #F3F4F6",verticalAlign:"middle",whiteSpace:"nowrap",fontSize:13,fontWeight:600,color:"#111827" }}>{formatTanggal(k.tanggal)}</td>
                          <td style={{ padding:"10px 13px",borderBottom:"1px solid #F3F4F6",verticalAlign:"middle",fontSize:12,color:"#6B7280",whiteSpace:"nowrap" }}>{formatWaktu(k.waktu_mulai)}{k.waktu_selesai&&` – ${formatWaktu(k.waktu_selesai)}`}</td>
                          <td style={{ padding:"10px 13px",borderBottom:"1px solid #F3F4F6",verticalAlign:"middle" }}>
                            <span style={{ padding:"2px 8px",borderRadius:5,fontSize:11,fontWeight:600,background:T.goldBg,color:T.primary,border:`1px solid ${T.goldLight}` }}>
                              {k.jenis_kegiatan?.charAt(0).toUpperCase()+k.jenis_kegiatan?.slice(1)}
                            </span>
                          </td>
                          <td style={{ padding:"10px 13px",borderBottom:"1px solid #F3F4F6",verticalAlign:"middle",maxWidth:180 }}>
                            <div style={{ fontWeight:600,color:"#111827",fontSize:13 }}>{k.nama_kegiatan}</div>
                            {k.peserta_undangan&&<div style={{ color:"#6B7280",fontSize:11,marginTop:1 }}>{k.peserta_undangan}</div>}
                          </td>
                          <td style={{ padding:"10px 13px",borderBottom:"1px solid #F3F4F6",verticalAlign:"middle",fontSize:13,color:"#374151" }}>{k.lokasi||"-"}</td>
                          <td style={{ padding:"10px 13px",borderBottom:"1px solid #F3F4F6",verticalAlign:"middle",fontSize:13,color:"#374151" }}>{k.pic||"-"}</td>
                          <td style={{ padding:"10px 13px",borderBottom:"1px solid #F3F4F6",verticalAlign:"middle" }}><StatusBadge status={k.status}/></td>
                          <td style={{ padding:"10px 13px",borderBottom:"1px solid #F3F4F6",verticalAlign:"middle" }}>
                            <div style={{ display:"flex",gap:4 }}>
                              <button onClick={()=>openView(k)} style={{ padding:"4px 9px",borderRadius:5,border:"none",background:"#F0FDFA",cursor:"pointer",fontSize:11,fontWeight:600,color:"#374151" }}>Lihat</button>
                              {isAdmin&&<button onClick={()=>{setSelectedKegiatan(k);setModalMode("edit");setShowModal(true);}} style={{ padding:"4px 9px",borderRadius:5,border:"none",background:T.goldBg,cursor:"pointer",fontSize:11,fontWeight:600,color:T.primary }}>Edit</button>}
                              {isKreatif&&<button onClick={()=>{setSelectedKegiatan(k);setModalMode("link");setShowModal(true);}} style={{ padding:"4px 9px",borderRadius:5,border:"none",background:"#ECFDF5",cursor:"pointer",fontSize:11,fontWeight:600,color:"#065F46" }}>📎 Link</button>}
                              {isAdmin&&<button onClick={()=>{setDeleteTarget(k);setShowDeleteConfirm(true);}} style={{ padding:"4px 9px",borderRadius:5,border:"none",background:"#FEF2F2",cursor:"pointer",fontSize:11,fontWeight:600,color:"#DC2626" }}>Hapus</button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── PENGGUNA ── */}
          {activeMenu==="pengguna"&&isAdmin&&(
            <div>
              <div style={{ marginBottom:16 }}>
                <h1 style={{ fontSize:18,fontWeight:700,color:T.dark,margin:0 }}>Manajemen Pengguna</h1>
                <p style={{ fontSize:12,color:"#6B7280",margin:"3px 0 0" }}>Daftar akun yang terdaftar di sistem</p>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12,marginBottom:18 }}>
                {AKUN_DIIZINKAN.map(a=>(
                  <div key={a.email} style={{ background:"white",borderRadius:12,padding:16,display:"flex",alignItems:"center",gap:12,border:`1.5px solid ${T.gold}55` }}>
                    <div style={{ width:42,height:42,borderRadius:"50%",background:T.gold,color:T.dark,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,flexShrink:0 }}>{a.nama[0]}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontWeight:600,fontSize:13,color:"#111827",marginBottom:2 }}>{a.nama}</div>
                      <div style={{ fontSize:11,color:"#6B7280",marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{a.email}</div>
                      <span style={{ fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:5,background:ROLE_CONFIG[a.role]?.bg,color:ROLE_CONFIG[a.role]?.color }}>{ROLE_CONFIG[a.role]?.label}</span>
                    </div>
                    <div style={{ fontSize:11,color:"#059669",fontWeight:600 }}>Aktif</div>
                  </div>
                ))}
              </div>
              <div style={{ background:T.goldBg,border:`1px solid ${T.goldLight}`,borderRadius:12,padding:"14px 16px",marginBottom:14 }}>
                <h3 style={{ margin:"0 0 10px",fontSize:13,color:T.primary,fontWeight:700 }}>Ringkasan Hak Akses</h3>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:10 }}>
                  {[["admin","Akses penuh: tambah, edit, hapus kegiatan & kelola pengguna"],["tim_kreatif","Akses terbatas: hanya bisa lihat kegiatan & upload link dokumentasi"]].map(([role,desc])=>(
                    <div key={role} style={{ background:"white",borderRadius:8,padding:"10px 12px",borderLeft:`3px solid ${ROLE_CONFIG[role].color}` }}>
                      <div style={{ fontWeight:700,color:ROLE_CONFIG[role].color,marginBottom:3,fontSize:12 }}>{ROLE_CONFIG[role].label}</div>
                      <div style={{ fontSize:11,color:"#6B7280",lineHeight:1.5 }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign:"center",padding:"12px 0",borderTop:"1px solid #E5E7EB" }}>
                <span style={{ fontSize:11,color:"#9CA3AF" }}>Dibuat oleh </span>
                <span style={{ fontSize:11,fontWeight:700,color:"#6B7280" }}>Fadriana</span>
                <span style={{ fontSize:11,color:"#9CA3AF" }}> · Sistem Manajemen Kegiatan v2.0 · 2026</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {showModal&&(
        <KegiatanModal mode={modalMode} data={selectedKegiatan} user={user}
          isKreatif={isKreatif} canEdit={canEdit}
          onSave={handleSaveKegiatan} onUpdateLink={handleUpdateLink}
          onClose={()=>setShowModal(false)}/>
      )}

      {showDeleteConfirm&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16 }}>
          <div style={{ background:"white",borderRadius:12,width:"100%",maxWidth:340,padding:24,textAlign:"center",boxShadow:"0 20px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize:14,fontWeight:700,color:"#111827",marginBottom:7 }}>Hapus Kegiatan?</div>
            <p style={{ color:"#6B7280",margin:"0 0 18px",fontSize:13,lineHeight:1.5 }}>"{deleteTarget?.nama_kegiatan}" akan dihapus secara permanen.</p>
            <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
              <button onClick={()=>{setShowDeleteConfirm(false);setDeleteTarget(null);}} style={{ padding:"8px 18px",border:"1px solid #E5E7EB",borderRadius:7,background:"white",cursor:"pointer",fontSize:13,fontWeight:600 }}>Batal</button>
              <button onClick={()=>handleDeleteKegiatan(deleteTarget.id)} style={{ padding:"8px 18px",background:"#DC2626",color:"white",border:"none",borderRadius:7,fontSize:13,fontWeight:600,cursor:"pointer" }}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
