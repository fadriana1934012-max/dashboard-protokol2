import { useState, useEffect } from "react";

const SUPABASE_URL = "https://hrqppgcjzhqdnuhhvxvi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_vKvRdKlYGvsKCKNGpgvzYA_pPrtTpb6";

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
  async signUp(email, password, fullName, dinas) {
    const res = await fetch(`${this.url}/auth/v1/signup`, {
      method: "POST", headers: { "Content-Type": "application/json", apikey: this.key },
      body: JSON.stringify({ email, password, options: { data: { full_name: fullName, dinas, role: "admin" } } }),
    });
    return res.json();
  },
  async signOut() {
    try { await fetch(`${this.url}/auth/v1/logout`, { method: "POST", headers: this.headers() }); } catch(e) {}
    this.token = null; this.userId = null; this.userRole = null; this.userEmail = null; this.userName = null;
    ["sb_token","sb_email","sb_role","sb_name","sb_dinas"].forEach(k=>localStorage.removeItem(k));
  },
  async restoreSession() {
    const token = localStorage.getItem("sb_token");
    if (!token) return false;
    this.token = token;
    try {
      const res = await fetch(`${this.url}/auth/v1/user`, { headers: this.headers() });
      const data = await res.json();
      if (data.id) { this.userId = data.id; this.userEmail = data.email; return true; }
    } catch(e) {}
    this.token = null; localStorage.removeItem("sb_token"); return false;
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
  akan_berlangsung: { label: "Akan Berlangsung", color: "#2563EB", bg: "#EFF6FF", dot: "#2563EB" },
  sedang_berlangsung: { label: "Sedang Berlangsung", color: "#0F766E", bg: "#F0FDFA", dot: "#0F766E" },
  dibatalkan: { label: "Dibatalkan", color: "#DC2626", bg: "#FEF2F2", dot: "#DC2626" },
  selesai: { label: "Selesai", color: "#059669", bg: "#ECFDF5", dot: "#059669" },
};

const JENIS_OPTIONS = ["kunjungan","upacara","rapat","audiensi","monitoring","lainnya"];

const ROLE_CONFIG = {
  admin: { label: "Admin", color: "#6D28D9", bg: "#EDE9FE" },
  protokoler: { label: "Protokoler", color: "#0F766E", bg: "#CCFBF1" },
  tim_kreatif: { label: "Tim Kreatif", color: "#065F46", bg: "#D1FAE5" },
};

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

function formatTanggal(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr + "T00:00:00");
  return `${String(d.getDate()).padStart(2,"0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function formatWaktu(t) { if (!t) return "-"; return t.slice(0,5); }
function parseDisplayDate(str) {
  if (!str) return "";
  const parts = str.split("/");
  if (parts.length===3 && parts[2].length===4) return `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
  return "";
}
function toDisplayDate(iso) {
  if (!iso) return "";
  const d = new Date(iso+"T00:00:00");
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

function LogoProtokol({ size=36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#0F766E"/>
      <rect x="9" y="7" width="15" height="20" rx="2" fill="white" opacity="0.95"/>
      <rect x="11" y="11" width="11" height="1.5" rx="0.75" fill="#0F766E"/>
      <rect x="11" y="14" width="11" height="1.5" rx="0.75" fill="#0F766E"/>
      <rect x="11" y="17" width="8" height="1.5" rx="0.75" fill="#0F766E"/>
      <rect x="11" y="20" width="6" height="1.5" rx="0.75" fill="#0F766E"/>
      <circle cx="28" cy="28" r="8" fill="#0F766E"/>
      <path d="M24 28l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function StatusBadge({ status, large }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.akan_berlangsung;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:large?"6px 12px":"3px 9px", borderRadius:20, background:cfg.bg, color:cfg.color, fontSize:large?13:11, fontWeight:600, whiteSpace:"nowrap", border:`1px solid ${cfg.color}20` }}>
      <span style={{ width:6,height:6,borderRadius:"50%",background:cfg.dot,display:"inline-block",flexShrink:0 }}/>
      {cfg.label}
    </span>
  );
}

function LoadingScreen() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#F0FDFA" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}><LogoProtokol size={52}/></div>
        <div style={{ fontSize:15, fontWeight:600, color:"#134E4A" }}>Memuat Dashboard...</div>
      </div>
    </div>
  );
}

const L = { display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:5 };
const I = { width:"100%", padding:"9px 12px", border:"1.5px solid #E5E7EB", borderRadius:8, fontSize:13, outline:"none", boxSizing:"border-box", color:"#111827", background:"white" };
const BtnPrimary = { width:"100%", padding:12, background:"#134E4A", color:"white", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:"pointer" };

function AuthPage({ onLogin, notification }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true); await onLogin(email, password); setLoading(false);
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(160deg,#0F2950,#1E3A5F)", padding:20 }}>
      <div style={{ background:"white", borderRadius:16, padding:"32px 28px", width:"100%", maxWidth:400, boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}><LogoProtokol size={48}/></div>
          <div style={{ fontSize:18, fontWeight:800, color:"#1E3A5F", letterSpacing:0.5 }}>SISTEM PROTOKOLER</div>
          <div style={{ fontSize:12, color:"#9CA3AF", marginTop:3 }}>Dinas Pariwisata Sulawesi Tenggara</div>
        </div>

        {notification && (
          <div style={{ padding:"10px 13px", borderRadius:8, marginBottom:14, fontSize:13, background:notification.type==="error"?"#FEF2F2":"#ECFDF5", color:notification.type==="error"?"#991B1B":"#065F46", border:`1px solid ${notification.type==="error"?"#FECACA":"#A7F3D0"}` }}>
            {notification.msg}
          </div>
        )}

        <div style={{ marginBottom:14 }}>
          <label style={L}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="email@instansi.go.id" style={I}/>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={L}>Password</label>
          <div style={{ position:"relative" }}>
            <input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Masukkan password" style={{...I,paddingRight:80}}/>
            <button onClick={()=>setShowPass(!showPass)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#9CA3AF", fontSize:11, fontWeight:600 }}>{showPass?"Sembunyikan":"Tampilkan"}</button>
          </div>
        </div>
        <button onClick={handleLogin} disabled={loading} style={BtnPrimary}>{loading?"Memverifikasi...":"Masuk"}</button>
        <div style={{ marginTop:12, padding:11, background:"#FFFBEB", borderRadius:8, fontSize:11, color:"#92400E", border:"1px solid #FDE68A", lineHeight:1.5 }}>
          Akses terbatas — hanya akun yang telah didaftarkan yang dapat masuk.
        </div>
        <div style={{ marginTop:16, textAlign:"center", fontSize:11, color:"#D1D5DB" }}>
          Dibuat oleh <span style={{ fontWeight:700, color:"#9CA3AF" }}>Fadriana</span> — Sistem Manajemen Protokoler
        </div>
      </div>
    </div>
  );
}


export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [kegiatanList, setKegiatanList] = useState([]);
  const [notification, setNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedKegiatan, setSelectedKegiatan] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterStatus, setFilterStatus] = useState("semua");
  const [filterJenis, setFilterJenis] = useState("semua");
  const [searchText, setSearchText] = useState("");

  useEffect(()=>{ initApp(); },[]);

  async function initApp() {
    const savedEmail = localStorage.getItem("sb_email");
    const savedRole = localStorage.getItem("sb_role");
    const savedName = localStorage.getItem("sb_name");
    const savedDinas = localStorage.getItem("sb_dinas");
    const token = localStorage.getItem("sb_token");
    if (token && savedEmail) {
      supabase.token = token; supabase.userEmail = savedEmail; supabase.userRole = savedRole; supabase.userName = savedName;
      setUser({ email:savedEmail, role:savedRole, name:savedName||savedEmail, dinas:savedDinas||"" });
      await loadData(); setIsLoggedIn(true);
    }
    setLoading(false);
  }

  async function loadData() {
    const emailKey = localStorage.getItem("sb_email")||"";
    const params = emailKey
      ? `?select=*&order=tanggal.asc,waktu_mulai.asc&user_email=eq.${encodeURIComponent(emailKey)}`
      : "?select=*&order=tanggal.asc,waktu_mulai.asc";
    const data = await supabase.query("kegiatan", params);
    if (Array.isArray(data)) setKegiatanList(data);
  }

  function showNotif(msg, type="success") {
    setNotification({msg,type}); setTimeout(()=>setNotification(null),4000);
  }

  async function handleLogin(email, password) {
    // Cek apakah email ada di daftar akun khusus (hardcoded)
    const akunKhusus = AKUN_DIIZINKAN.find(a => a.email.toLowerCase() === email.toLowerCase());

    if (akunKhusus) {
      // Akun khusus: password harus cocok persis
      if (akunKhusus.password !== password) {
        showNotif("Email atau password salah. Akses ditolak.", "error");
        return;
      }
      // Login ke Supabase juga
      try { await supabase.signIn(email, password); } catch(e) {}
      const finalRole = akunKhusus.role;
      const finalName = akunKhusus.nama;
      const finalDinas = akunKhusus.dinas;
      supabase.userRole = finalRole;
      localStorage.setItem("sb_email", email);
      localStorage.setItem("sb_role", finalRole);
      localStorage.setItem("sb_name", finalName);
      localStorage.setItem("sb_dinas", finalDinas);
      setUser({ email, role: finalRole, name: finalName, dinas: finalDinas });
      await loadData();
      setIsLoggedIn(true);
      showNotif(`Selamat datang, ${finalName}!`);
    } else {
      // Akun daftar mandiri: validasi lewat Supabase
      try {
        await supabase.signIn(email, password);
        const profile = await supabase.getProfile();
        const finalRole = profile?.role || supabase.userRole || "admin";
        const finalName = profile?.full_name || supabase.userName || email;
        const finalDinas = profile?.dinas || localStorage.getItem("sb_dinas") || "";
        supabase.userRole = finalRole;
        localStorage.setItem("sb_email", email);
        localStorage.setItem("sb_role", finalRole);
        localStorage.setItem("sb_name", finalName);
        localStorage.setItem("sb_dinas", finalDinas);
        setUser({ email, role: finalRole, name: finalName, dinas: finalDinas });
        await loadData();
        setIsLoggedIn(true);
        showNotif(`Selamat datang, ${finalName}!`);
      } catch(e) {
        showNotif("Email atau password salah. Akses ditolak.", "error");
      }
    }
  }

    if (password.length < 8) {
      showNotif("Password minimal 8 karakter!", "error");
      return;
    }
    try {
      const result = await supabase.signUp(email, password, nama, dinas);
      if (result.error) throw new Error(result.error_description || result.error);
      showNotif("Pendaftaran berhasil! Silakan cek email untuk konfirmasi, lalu login.");
    } catch(e) { showNotif("Gagal mendaftar: " + e.message, "error"); }
  }

  async function handleLogout() {
    await supabase.signOut(); setIsLoggedIn(false); setUser(null); setKegiatanList([]); setActiveMenu("dashboard");
  }

  async function handleSaveKegiatan(formData) {
    try {
      if (modalMode==="add") {
        const body={...formData}; delete body.id; delete body.tanggalDisplay;
        if (supabase.userId) body.created_by=supabase.userId;
        body.user_email = localStorage.getItem("sb_email")||"";
        await supabase.insert("kegiatan",body);
        showNotif("Kegiatan berhasil ditambahkan!");
      } else {
        const {id,created_at,tanggalDisplay,...body}=formData;
        if (supabase.userId) body.updated_by=supabase.userId;
        await supabase.update("kegiatan",formData.id,body);
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
      await supabase.delete("kegiatan",id); showNotif("Kegiatan berhasil dihapus!"); await loadData(); setShowDeleteConfirm(false);
    } catch(e) { showNotif("Gagal: "+e.message,"error"); }
  }

  const filtered = kegiatanList.filter(k=>{
    const ms=filterStatus==="semua"||k.status===filterStatus;
    const mj=filterJenis==="semua"||k.jenis_kegiatan===filterJenis;
    const mq=!searchText||k.nama_kegiatan?.toLowerCase().includes(searchText.toLowerCase())||k.lokasi?.toLowerCase().includes(searchText.toLowerCase())||k.pic?.toLowerCase().includes(searchText.toLowerCase());
    return ms&&mj&&mq;
  });

  const today=new Date().toISOString().split("T")[0];
  const stats={ total:kegiatanList.length, hariIni:kegiatanList.filter(k=>k.tanggal===today).length, akan:kegiatanList.filter(k=>k.status==="akan_berlangsung").length, sedang:kegiatanList.filter(k=>k.status==="sedang_berlangsung").length, selesai:kegiatanList.filter(k=>k.status==="selesai").length, batal:kegiatanList.filter(k=>k.status==="dibatalkan").length };
  const upcoming=kegiatanList.filter(k=>k.tanggal>=today&&k.status!=="dibatalkan"&&k.status!=="selesai").slice(0,5);

  if (loading) return <LoadingScreen/>;
  if (!isLoggedIn) return <AuthPage onLogin={handleLogin} notification={notification}/>;

  const isAdmin=user.role==="admin";
  const isKreatif=user.role==="tim_kreatif";
  const canEdit=user.role==="admin"||user.role==="protokoler";

  return (
    <div style={{ display:"flex", height:"100vh", fontFamily:"'Segoe UI',system-ui,sans-serif", background:"#F0FDFA", overflow:"hidden" }}>
      {notification&&(
        <div style={{ position:"fixed", top:16, right:16, padding:"11px 16px", borderRadius:8, border:"1px solid", fontSize:13, fontWeight:600, zIndex:9999, boxShadow:"0 4px 16px rgba(0,0,0,0.12)", background:notification.type==="error"?"#FEF2F2":"#F0FDFA", borderColor:notification.type==="error"?"#FECACA":"#99F6E4", color:notification.type==="error"?"#991B1B":"#0F766E" }}>
          {notification.msg}
        </div>
      )}

      {/* SIDEBAR */}
      <aside style={{ width:230, minWidth:230, background:"#134E4A", display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, height:"100vh", zIndex:50 }}>
        <div style={{ padding:"18px 16px 14px", borderBottom:"1px solid rgba(255,255,255,0.25)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <LogoProtokol size={38}/>
            <div>
              <div style={{ fontSize:9, fontWeight:800, color:"white", letterSpacing:0.5, lineHeight:1.3, textShadow:"0 1px 2px rgba(0,0,0,0.2)" }}>SISTEM INFORMASI DAN DOKUMENTASI</div><div style={{ fontSize:9, fontWeight:800, color:"white", letterSpacing:0.5, lineHeight:1.3 }}>AGENDA PIMPINAN</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.45)", marginTop:1, lineHeight:1.3 }}>{user.dinas||"Manajemen Kegiatan"}</div>
            </div>
          </div>
        </div>
        <nav style={{ padding:"10px 8px", flex:1 }}>
          {[{id:"dashboard",label:"Dashboard"},{id:"kegiatan",label:"Jadwal Kegiatan"},{id:"kalender",label:"Kalender"},{id:"laporan",label:"Laporan"},...(isAdmin?[{id:"pengguna",label:"Manajemen Pengguna"}]:[])].map(item=>(
            <button key={item.id} onClick={()=>setActiveMenu(item.id)} style={{ display:"flex", alignItems:"center", padding:"10px 14px", borderRadius:7, border:"none", background:activeMenu===item.id?"rgba(255,255,255,0.20)":"transparent", color:activeMenu===item.id?"white":"rgba(255,255,255,0.80)", cursor:"pointer", width:"100%", textAlign:"left", fontSize:13, fontWeight:activeMenu===item.id?600:400, marginBottom:2 }}>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding:"12px 12px 16px", borderTop:"1px solid rgba(255,255,255,0.25)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:10, padding:"9px 11px", background:"rgba(255,255,255,0.15)", borderRadius:7 }}>
            <div style={{ width:30,height:30,borderRadius:"50%",background:"#0F766E",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,flexShrink:0 }}>{(user.name||"U")[0].toUpperCase()}</div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:11,fontWeight:600,color:"white",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{user.name}</div>
              <span style={{ fontSize:10,fontWeight:600,padding:"1px 6px",borderRadius:5,background:ROLE_CONFIG[user.role]?.bg,color:ROLE_CONFIG[user.role]?.color }}>{ROLE_CONFIG[user.role]?.label||user.role}</span>
            </div>
          </div>
          <button onClick={handleLogout} style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"7px 12px",border:"1px solid rgba(255,255,255,0.35)",borderRadius:7,background:"rgba(255,255,255,0.12)",color:"white",cursor:"pointer",fontSize:12,width:"100%" }}>Keluar</button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex:1, display:"flex", flexDirection:"column", marginLeft:230, height:"100vh", overflow:"hidden" }}>
        <header style={{ padding:"11px 22px", background:"white", borderBottom:"2px solid #99F6E4", display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ fontWeight:600,fontSize:14,color:"#111827",flex:1 }}>
            {activeMenu==="dashboard"&&"Dashboard"}
            {activeMenu==="kegiatan"&&"Jadwal Kegiatan"}
            {activeMenu==="pengguna"&&"Manajemen Pengguna"}
          </div>
          <div style={{ fontSize:12,color:"#9CA3AF" }}>{new Date().toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
        </header>

        <div style={{ flex:1, overflowY:"auto", padding:"18px 22px", background:"#F0FDFA" }}>

          {/* DASHBOARD */}
          {activeMenu==="dashboard"&&(
            <div>
              <div style={{ marginBottom:18 }}>
                <h1 style={{ fontSize:18,fontWeight:700,color:"#111827",margin:0 }}>Selamat Datang, {user.name}</h1>
                <p style={{ fontSize:12,color:"#6B7280",margin:"3px 0 0" }}>{user.dinas||"Sistem Informasi dan Dokumentasi Agenda Pimpinan"}</p>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(145px,1fr))",gap:10,marginBottom:18 }}>
                {[{label:"Total Kegiatan",val:stats.total,color:"#4F46E5",bg:"#EEF2FF",border:"#99F6E4"},{label:"Hari Ini",val:stats.hariIni,color:"#134E4A",bg:"#F0F9FF",border:"#99F6E4"},{label:"Akan Berlangsung",val:stats.akan,color:"#2563EB",bg:"#EFF6FF",border:"#BFDBFE"},{label:"Sedang Berlangsung",val:stats.sedang,color:"#0F766E",bg:"#F0FDFA",border:"#99F6E4"},{label:"Selesai",val:stats.selesai,color:"#059669",bg:"#ECFDF5",border:"#A7F3D0"},{label:"Dibatalkan",val:stats.batal,color:"#DC2626",bg:"#FEF2F2",border:"#FECACA"}].map(c=>(
                  <div key={c.label} style={{ background:c.bg,borderRadius:10,padding:"13px 15px",border:`1px solid ${c.border}` }}>
                    <div style={{ fontSize:24,fontWeight:800,color:c.color,lineHeight:1 }}>{c.val}</div>
                    <div style={{ fontSize:11,color:c.color,marginTop:4,fontWeight:500,opacity:0.75 }}>{c.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:"white",borderRadius:12,padding:18,border:"1px solid #E5E7EB" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
                  <h2 style={{ fontSize:14,fontWeight:700,color:"#111827",margin:0 }}>Kegiatan Mendatang</h2>
                  <button onClick={()=>setActiveMenu("kegiatan")} style={{ background:"none",border:"none",color:"#134E4A",cursor:"pointer",fontWeight:600,fontSize:12 }}>Lihat Semua</button>
                </div>
                {upcoming.length===0?(
                  <div style={{ textAlign:"center",padding:"24px 0",color:"#9CA3AF",fontSize:13 }}>
                    Belum ada kegiatan mendatang.
                    {canEdit&&<div style={{marginTop:10}}><button onClick={()=>setActiveMenu("kegiatan")} style={{padding:"8px 16px",background:"#134E4A",color:"white",border:"none",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"}}>Tambah Kegiatan</button></div>}
                  </div>
                ):upcoming.map(k=>(
                  <div key={k.id} onClick={()=>{setSelectedKegiatan(k);setModalMode("view");setShowModal(true);}} style={{ display:"flex",alignItems:"center",gap:12,padding:"9px 11px",borderRadius:8,background:"#F9FAFB",cursor:"pointer",marginBottom:7,border:"1px solid #E5E7EB" }}>
                    <div style={{ width:42,height:46,borderRadius:8,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:STATUS_CONFIG[k.status]?.bg,flexShrink:0 }}>
                      <div style={{ fontSize:16,fontWeight:800,color:STATUS_CONFIG[k.status]?.color,lineHeight:1 }}>{new Date(k.tanggal+"T00:00:00").getDate()}</div>
                      <div style={{ fontSize:10,color:STATUS_CONFIG[k.status]?.color,fontWeight:600 }}>{MONTHS_SHORT[new Date(k.tanggal+"T00:00:00").getMonth()]}</div>
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontWeight:600,fontSize:13,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{k.nama_kegiatan}</div>
                      <div style={{ fontSize:11,color:"#6B7280",marginTop:2 }}>{formatWaktu(k.waktu_mulai)} · {k.lokasi||"-"} · {k.pic||"-"}</div>
                    </div>
                    <StatusBadge status={k.status}/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KEGIATAN */}
          {activeMenu==="kegiatan"&&(
            <div>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10 }}>
                <div>
                  <h1 style={{ fontSize:18,fontWeight:700,color:"#111827",margin:0 }}>Jadwal Kegiatan</h1>
                  <p style={{ fontSize:12,color:"#6B7280",margin:"3px 0 0" }}>Total {kegiatanList.length} kegiatan terdaftar</p>
                </div>
                {canEdit&&(
                  <button onClick={()=>{setSelectedKegiatan(null);setModalMode("add");setShowModal(true);}} style={{ padding:"9px 16px",background:"#134E4A",color:"white",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer" }}>
                    + Tambah Kegiatan
                  </button>
                )}
              </div>
              <div style={{ display:"flex",gap:10,marginBottom:12,flexWrap:"wrap" }}>
                <input value={searchText} onChange={e=>setSearchText(e.target.value)} placeholder="Cari nama, lokasi, atau PIC..." style={{ flex:"1 1 200px",padding:"8px 12px",border:"1.5px solid #E5E7EB",borderRadius:8,fontSize:13,outline:"none",background:"white" }}/>
                <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{ padding:"8px 12px",border:"1.5px solid #E5E7EB",borderRadius:8,fontSize:13,background:"white",cursor:"pointer",outline:"none" }}>
                  <option value="semua">Semua Status</option>
                  {Object.entries(STATUS_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={filterJenis} onChange={e=>setFilterJenis(e.target.value)} style={{ padding:"8px 12px",border:"1.5px solid #E5E7EB",borderRadius:8,fontSize:13,background:"white",cursor:"pointer",outline:"none" }}>
                  <option value="semua">Semua Jenis</option>
                  {JENIS_OPTIONS.map(j=><option key={j} value={j}>{j.charAt(0).toUpperCase()+j.slice(1)}</option>)}
                </select>
              </div>
              {filtered.length===0?(
                <div style={{ textAlign:"center",padding:"36px 0",color:"#9CA3AF",background:"white",borderRadius:12,border:"1px solid #E5E7EB",fontSize:13 }}>
                  Belum ada kegiatan
                  {canEdit&&<div style={{marginTop:10}}><button onClick={()=>{setSelectedKegiatan(null);setModalMode("add");setShowModal(true);}} style={{padding:"8px 16px",background:"#134E4A",color:"white",border:"none",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"}}>+ Tambah Kegiatan Pertama</button></div>}
                </div>
              ):(
                <div style={{ background:"white",borderRadius:12,overflow:"auto",border:"1px solid #E5E7EB" }}>
                  <table style={{ width:"100%",borderCollapse:"collapse",minWidth:700 }}>
                    <thead>
                      <tr>{["Tanggal","Waktu","Jenis","Nama Kegiatan","Lokasi","PIC","Status","Aksi"].map(h=>(
                        <th key={h} style={{ padding:"10px 13px",textAlign:"left",fontSize:11,fontWeight:700,color:"#6B7280",background:"#F9FAFB",borderBottom:"1px solid #E5E7EB",whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:0.3 }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {filtered.map((k,i)=>(
                        <tr key={k.id} style={{ background:i%2===0?"#FAFAFA":"white" }}>
                          <td style={{ padding:"10px 13px",borderBottom:"1px solid #F3F4F6",verticalAlign:"middle",whiteSpace:"nowrap",fontSize:13,fontWeight:600,color:"#111827" }}>{formatTanggal(k.tanggal)}</td>
                          <td style={{ padding:"10px 13px",borderBottom:"1px solid #F3F4F6",verticalAlign:"middle",fontSize:12,color:"#6B7280",whiteSpace:"nowrap" }}>{formatWaktu(k.waktu_mulai)}{k.waktu_selesai&&` – ${formatWaktu(k.waktu_selesai)}`}</td>
                          <td style={{ padding:"10px 13px",borderBottom:"1px solid #F3F4F6",verticalAlign:"middle" }}><span style={{ padding:"2px 8px",borderRadius:5,fontSize:11,fontWeight:600,background:"#CCFBF1",color:"#1D4ED8" }}>{k.jenis_kegiatan?.charAt(0).toUpperCase()+k.jenis_kegiatan?.slice(1)}</span></td>
                          <td style={{ padding:"10px 13px",borderBottom:"1px solid #F3F4F6",verticalAlign:"middle",maxWidth:180 }}>
                            <div style={{ fontWeight:600,color:"#111827",fontSize:13 }}>{k.nama_kegiatan}</div>
                            {k.peserta_undangan&&<div style={{ color:"#6B7280",fontSize:11,marginTop:1 }}>{k.peserta_undangan}</div>}
                          </td>
                          <td style={{ padding:"10px 13px",borderBottom:"1px solid #F3F4F6",verticalAlign:"middle",fontSize:13,color:"#374151" }}>{k.lokasi||"-"}</td>
                          <td style={{ padding:"10px 13px",borderBottom:"1px solid #F3F4F6",verticalAlign:"middle",fontSize:13,color:"#374151" }}>{k.pic||"-"}</td>
                          <td style={{ padding:"10px 13px",borderBottom:"1px solid #F3F4F6",verticalAlign:"middle" }}><StatusBadge status={k.status}/></td>
                          <td style={{ padding:"10px 13px",borderBottom:"1px solid #F3F4F6",verticalAlign:"middle" }}>
                            <div style={{ display:"flex",gap:4 }}>
                              <button onClick={()=>{setSelectedKegiatan(k);setModalMode("view");setShowModal(true);}} style={{ padding:"4px 9px",borderRadius:5,border:"none",background:"#F0FDFA",cursor:"pointer",fontSize:11,fontWeight:600,color:"#374151" }}>Lihat</button>
                              {canEdit&&<button onClick={()=>{setSelectedKegiatan(k);setModalMode("edit");setShowModal(true);}} style={{ padding:"4px 9px",borderRadius:5,border:"none",background:"#CCFBF1",cursor:"pointer",fontSize:11,fontWeight:600,color:"#1D4ED8" }}>Edit</button>}
                              {isKreatif&&<button onClick={()=>{setSelectedKegiatan(k);setModalMode("edit");setShowModal(true);}} style={{ padding:"4px 9px",borderRadius:5,border:"none",background:"#ECFDF5",cursor:"pointer",fontSize:11,fontWeight:600,color:"#065F46" }}>Link</button>}
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

          {/* PENGGUNA */}
          {activeMenu==="pengguna"&&isAdmin&&(
            <div>
              <div style={{ marginBottom:16 }}>
                <h1 style={{ fontSize:18,fontWeight:700,color:"#111827",margin:0 }}>Manajemen Pengguna</h1>
                <p style={{ fontSize:12,color:"#6B7280",margin:"3px 0 0" }}>Daftar akun yang terdaftar di sistem</p>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12,marginBottom:18 }}>
                {AKUN_DIIZINKAN.map(a=>(
                  <div key={a.email} style={{ background:"white",borderRadius:12,padding:16,display:"flex",alignItems:"center",gap:12,border:"1px solid #E5E7EB" }}>
                    <div style={{ width:42,height:42,borderRadius:"50%",background:"#134E4A",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16,flexShrink:0 }}>{a.nama[0]}</div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontWeight:600,fontSize:13,color:"#111827",marginBottom:2 }}>{a.nama}</div>
                      <div style={{ fontSize:11,color:"#6B7280",marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{a.email}</div>
                      <span style={{ fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:5,background:ROLE_CONFIG[a.role]?.bg,color:ROLE_CONFIG[a.role]?.color }}>{ROLE_CONFIG[a.role]?.label}</span>
                    </div>
                    <div style={{ fontSize:11,color:"#059669",fontWeight:600 }}>Aktif</div>
                  </div>
                ))}
              </div>
              <div style={{ background:"#F0FDFA",border:"1px solid #99F6E4",borderRadius:12,padding:"14px 16px",marginBottom:14 }}>
                <h3 style={{ margin:"0 0 10px",fontSize:13,color:"#134E4A",fontWeight:700 }}>Ringkasan Hak Akses</h3>
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
                <span style={{ fontSize:11,color:"#9CA3AF" }}>Dashboard Protokoler dirancang dan dibuat oleh </span>
                <span style={{ fontSize:11,fontWeight:700,color:"#6B7280" }}>Fadriana</span>
                <span style={{ fontSize:11,color:"#9CA3AF" }}> · Sistem Manajemen Kegiatan v1.0 · 2026</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {showModal&&<KegiatanModal mode={modalMode} data={selectedKegiatan} user={user} isKreatif={isKreatif} canEdit={canEdit} onSave={handleSaveKegiatan} onUpdateLink={handleUpdateLink} onClose={()=>setShowModal(false)}/>}

      {showDeleteConfirm&&(
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16 }}>
          <div style={{ background:"white",borderRadius:12,width:"100%",maxWidth:340,padding:24,textAlign:"center",boxShadow:"0 20px 50px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize:14,fontWeight:700,color:"#111827",marginBottom:7 }}>Hapus Kegiatan?</div>
            <p style={{ color:"#6B7280",margin:"0 0 18px",fontSize:13,lineHeight:1.5 }}>"{deleteTarget?.nama_kegiatan}" akan dihapus secara permanen dan tidak dapat dikembalikan.</p>
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

// ── KOMPONEN KALENDER ──
function KalenderView({ kegiatanList, onView }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [searchQ, setSearchQ] = useState("");

  const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const DAYS = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const todayStr = today.toISOString().split("T")[0];

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y=>y-1); }
    else setCurrentMonth(m=>m-1);
  }
  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y=>y+1); }
    else setCurrentMonth(m=>m+1);
  }

  function getKegiatanOnDay(day) {
    const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return kegiatanList.filter(k=>k.tanggal===dateStr);
  }

  const STATUS_COLOR = {
    akan_berlangsung: "#2563EB",
    sedang_berlangsung: "#D97706",
    dibatalkan: "#DC2626",
    selesai: "#059669",
  };

  // Filter pencarian
  const filtered = searchQ
    ? kegiatanList.filter(k =>
        k.nama_kegiatan?.toLowerCase().includes(searchQ.toLowerCase()) ||
        k.lokasi?.toLowerCase().includes(searchQ.toLowerCase()) ||
        k.pic?.toLowerCase().includes(searchQ.toLowerCase()) ||
        formatTanggal(k.tanggal).toLowerCase().includes(searchQ.toLowerCase())
      )
    : [];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div style={{ marginBottom:16 }}>
        <h1 style={{ fontSize:18,fontWeight:700,color:"#111827",margin:0 }}>Kalender Kegiatan</h1>
        <p style={{ fontSize:12,color:"#6B7280",margin:"3px 0 0" }}>Jadwal kegiatan dalam tampilan kalender</p>
      </div>

      {/* PENCARIAN */}
      <div style={{ background:"white",borderRadius:12,padding:"14px 16px",border:"1px solid #E5E7EB",marginBottom:16 }}>
        <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:6 }}>Cari Kegiatan</label>
        <input
          value={searchQ}
          onChange={e=>setSearchQ(e.target.value)}
          placeholder="Ketik nama kegiatan, lokasi, atau PIC..."
          style={{ width:"100%",padding:"9px 13px",border:"1.5px solid #E5E7EB",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box" }}
        />
        {searchQ && (
          <div style={{ marginTop:10 }}>
            {filtered.length===0?(
              <div style={{ fontSize:13,color:"#9CA3AF",padding:"8px 0" }}>Tidak ada kegiatan ditemukan</div>
            ):filtered.map(k=>(
              <div key={k.id} onClick={()=>onView(k)} style={{ display:"flex",alignItems:"center",gap:12,padding:"9px 12px",borderRadius:8,background:"#F9FAFB",cursor:"pointer",marginBottom:6,border:"1px solid #E5E7EB" }}>
                <div style={{ width:8,height:8,borderRadius:"50%",background:STATUS_COLOR[k.status]||"#6B7280",flexShrink:0 }}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontWeight:600,fontSize:13,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{k.nama_kegiatan}</div>
                  <div style={{ fontSize:11,color:"#6B7280",marginTop:1 }}>{formatTanggal(k.tanggal)} · {k.lokasi||"-"}</div>
                </div>
                <div style={{ fontSize:11,fontWeight:600,color:STATUS_COLOR[k.status],whiteSpace:"nowrap" }}>
                  {k.status==="akan_berlangsung"?"Akan Berlangsung":k.status==="sedang_berlangsung"?"Berlangsung":k.status==="selesai"?"Selesai":"Batal"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KALENDER */}
      <div style={{ background:"white",borderRadius:12,border:"1px solid #E5E7EB",overflow:"hidden" }}>
        {/* Header navigasi bulan */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderBottom:"1px solid #E5E7EB",background:"#1E3A5F" }}>
          <button onClick={prevMonth} style={{ background:"rgba(255,255,255,0.15)",border:"none",borderRadius:6,padding:"6px 12px",cursor:"pointer",color:"white",fontSize:16,fontWeight:600 }}>‹</button>
          <div style={{ fontSize:15,fontWeight:700,color:"white" }}>{MONTHS[currentMonth]} {currentYear}</div>
          <button onClick={nextMonth} style={{ background:"rgba(255,255,255,0.15)",border:"none",borderRadius:6,padding:"6px 12px",cursor:"pointer",color:"white",fontSize:16,fontWeight:600 }}>›</button>
        </div>

        {/* Nama hari */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:"1px solid #E5E7EB" }}>
          {DAYS.map(d=>(
            <div key={d} style={{ padding:"8px 4px",textAlign:"center",fontSize:11,fontWeight:700,color:"#6B7280",background:"#F9FAFB" }}>{d}</div>
          ))}
        </div>

        {/* Grid tanggal */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)" }}>
          {cells.map((day,idx)=>{
            if (!day) return <div key={`e${idx}`} style={{ minHeight:80,borderRight:"1px solid #F3F4F6",borderBottom:"1px solid #F3F4F6",background:"#FAFAFA" }}/>;
            const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const events = getKegiatanOnDay(day);
            const isToday = dateStr===todayStr;
            const isSun = idx%7===0;
            const isSat = idx%7===6;
            return (
              <div key={day} style={{ minHeight:80,borderRight:"1px solid #F3F4F6",borderBottom:"1px solid #F3F4F6",padding:"4px",background:isToday?"#EFF6FF":"white",position:"relative" }}>
                <div style={{ fontSize:12,fontWeight:isToday?800:500,color:isToday?"#2563EB":isSun?"#DC2626":isSat?"#0369A1":"#374151",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"50%",background:isToday?"#2563EB":"transparent",color:isToday?"white":isSun?"#DC2626":isSat?"#0369A1":"#374151",marginBottom:2,fontSize:11 }}>
                  {day}
                </div>
                {events.slice(0,2).map(k=>(
                  <div key={k.id} onClick={()=>onView(k)} style={{ fontSize:10,fontWeight:600,padding:"2px 4px",borderRadius:3,marginBottom:2,cursor:"pointer",background:STATUS_COLOR[k.status]+"20",color:STATUS_COLOR[k.status],overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.4 }} title={k.nama_kegiatan}>
                    {k.nama_kegiatan}
                  </div>
                ))}
                {events.length>2&&(
                  <div style={{ fontSize:10,color:"#6B7280",fontWeight:600 }}>+{events.length-2} lagi</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* LEGENDA */}
      <div style={{ display:"flex",gap:16,marginTop:12,flexWrap:"wrap" }}>
        {[["#2563EB","Akan Berlangsung"],["#D97706","Sedang Berlangsung"],["#059669","Selesai"],["#DC2626","Dibatalkan"]].map(([c,l])=>(
          <div key={l} style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#6B7280" }}>
            <div style={{ width:10,height:10,borderRadius:2,background:c,flexShrink:0 }}/>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}


function KegiatanModal({ mode, data, user, isKreatif, canEdit, onSave, onUpdateLink, onClose }) {
  const initTanggal = data?.tanggal || new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    tanggal: initTanggal,
    tanggalDisplay: toDisplayDate(initTanggal),
    waktu_mulai:data?.waktu_mulai||"", waktu_selesai:data?.waktu_selesai||"",
    jenis_kegiatan:data?.jenis_kegiatan||"rapat", nama_kegiatan:data?.nama_kegiatan||"",
    lokasi:data?.lokasi||"", peserta_undangan:data?.peserta_undangan||"",
    pic:data?.pic||"", status:data?.status||"akan_berlangsung",
    keterangan:data?.keterangan||"", diinput_oleh:data?.diinput_oleh||user.name||"",
    link_dokumentasi:data?.link_dokumentasi||"", id:data?.id,
  });

  const isView=mode==="view";
  const onlyLink=isKreatif&&mode==="edit";

  function handleTanggal(val) {
    let raw=val.replace(/[^0-9]/g,"");
    let display=raw;
    if (raw.length>2) display=raw.slice(0,2)+"/"+raw.slice(2);
    if (raw.length>4) display=raw.slice(0,2)+"/"+raw.slice(2,4)+"/"+raw.slice(4,8);
    const iso=parseDisplayDate(display);
    setForm(p=>({...p,tanggalDisplay:display,tanggal:iso||p.tanggal}));
  }

  function gcLink() {
    const d=(form.tanggal||"").replace(/-/g,"");
    const st=(form.waktu_mulai||"09:00").replace(":","")+"00";
    const et=(form.waktu_selesai||"10:00").replace(":","")+"00";
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(form.nama_kegiatan||"Kegiatan")}&dates=${d}T${st}/${d}T${et}&location=${encodeURIComponent(form.lokasi||"")}&details=${encodeURIComponent(form.keterangan||"")}`;
  }

  function Field({ label, field, type="text", placeholder="" }) {
    return (
      <div style={{ marginBottom:13 }}>
        <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5 }}>{label}</label>
        <input
          type={type}
          defaultValue={form[field]||""}
          onBlur={e=>setForm(p=>({...p,[field]:e.target.value}))}
          onChange={e=>{ form[field]=e.target.value; }}
          placeholder={placeholder}
          readOnly={isView}
          style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #E5E7EB",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box",background:isView?"#F9FAFB":"white",color:"#111827" }}
        />
      </div>
    );
  }

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16 }} onClick={onClose}>
      <div style={{ background:"white",borderRadius:14,width:"100%",maxWidth:560,maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 20px 50px rgba(0,0,0,0.2)",overflow:"hidden" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"15px 20px",borderBottom:"1px solid #E5E7EB" }}>
          <h2 style={{ fontSize:15,fontWeight:700,color:"#111827",margin:0 }}>
            {isView?"Detail Kegiatan":mode==="edit"?(onlyLink?"Upload Link Dokumentasi":"Edit Kegiatan"):"Tambah Kegiatan Baru"}
          </h2>
          <button onClick={onClose} style={{ background:"#F0FDFA",border:"none",borderRadius:6,padding:"5px 10px",cursor:"pointer",fontSize:13,color:"#6B7280" }}>✕</button>
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
              <div style={{ padding:"11px 14px",background:"#F0FDFA",borderRadius:8,marginBottom:14,border:"1px solid #99F6E4" }}>
                <div style={{ fontWeight:600,fontSize:13,color:"#111827" }}>{data?.nama_kegiatan}</div>
                <div style={{ fontSize:12,color:"#6B7280",marginTop:2 }}>{formatTanggal(data?.tanggal)}</div>
              </div>
              <div style={{ marginBottom:12 }}>
                <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5 }}>Link Dokumentasi</label>
                <input value={form.link_dokumentasi} onChange={e=>setForm(p=>({...p,link_dokumentasi:e.target.value}))} placeholder="https://drive.google.com/..." style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #E5E7EB",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box" }}/>
                <div style={{ fontSize:11,color:"#9CA3AF",marginTop:4 }}>Google Drive, Dropbox, YouTube, atau link lainnya</div>
              </div>
            </div>
          ):(
            <div>
              <div style={{ marginBottom:13 }}>
                <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5 }}>Tanggal (HH/BB/TTTT)</label>
                <input value={form.tanggalDisplay} onChange={e=>handleTanggal(e.target.value)} placeholder="contoh: 08/05/2026" maxLength={10} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #E5E7EB",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box" }}/>
              </div>
              <div style={{ display:"flex",gap:12 }}>
                <div style={{ flex:1,marginBottom:13 }}>
                  <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5 }}>Waktu Mulai</label>
                  <input type="time" value={form.waktu_mulai} onChange={e=>setForm(p=>({...p,waktu_mulai:e.target.value}))} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #E5E7EB",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box" }}/>
                </div>
                <div style={{ flex:1,marginBottom:13 }}>
                  <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5 }}>Waktu Selesai</label>
                  <input type="time" value={form.waktu_selesai} onChange={e=>setForm(p=>({...p,waktu_selesai:e.target.value}))} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #E5E7EB",borderRadius:8,fontSize:13,outline:"none",boxSizing:"border-box" }}/>
                </div>
              </div>
              <div style={{ marginBottom:13 }}>
                <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5 }}>Jenis Kegiatan</label>
                <select value={form.jenis_kegiatan} onChange={e=>setForm(p=>({...p,jenis_kegiatan:e.target.value}))} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #E5E7EB",borderRadius:8,fontSize:13,outline:"none",background:"white" }}>
                  {JENIS_OPTIONS.map(j=><option key={j} value={j}>{j.charAt(0).toUpperCase()+j.slice(1)}</option>)}
                </select>
              </div>
              <Field label="Nama Kegiatan" field="nama_kegiatan" placeholder="Masukkan nama kegiatan..."/>
              <Field label="Lokasi" field="lokasi" placeholder="Nama tempat / alamat..."/>
              <Field label="Peserta / Undangan" field="peserta_undangan" placeholder="Nama peserta atau kelompok undangan..."/>
              <div style={{ display:"flex",gap:12 }}>
                <div style={{ flex:1 }}><Field label="PIC (Penanggung Jawab)" field="pic" placeholder="Nama PIC..."/></div>
                <div style={{ flex:1,marginBottom:13 }}>
                  <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5 }}>Status</label>
                  <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #E5E7EB",borderRadius:8,fontSize:13,outline:"none",background:"white" }}>
                    {Object.entries(STATUS_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom:13 }}>
                <label style={{ display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:5 }}>Keterangan</label>
                <textarea
                  defaultValue={form.keterangan}
                  onBlur={e=>setForm(p=>({...p,keterangan:e.target.value}))}
                  onChange={e=>{ form.keterangan=e.target.value; }}
                  placeholder="Catatan atau keterangan tambahan..."
                  style={{ width:"100%",padding:"9px 12px",border:"1.5px solid #E5E7EB",borderRadius:8,fontSize:13,outline:"none",minHeight:70,resize:"vertical",boxSizing:"border-box",fontFamily:"inherit" }}
                />
              </div>
              <Field label="Diinput Oleh" field="diinput_oleh" placeholder="Nama penginput..."/>
              <Field label="Link Dokumentasi" field="link_dokumentasi" placeholder="https://drive.google.com/..."/>
            </div>
          )}
        </div>

        <div style={{ padding:"13px 20px",borderTop:"1px solid #E5E7EB",display:"flex",justifyContent:"flex-end",gap:9,flexWrap:"wrap" }}>
          <button onClick={onClose} style={{ padding:"8px 16px",border:"1px solid #E5E7EB",borderRadius:7,background:"white",cursor:"pointer",fontSize:13,fontWeight:600,color:"#374151" }}>
            {isView?"Tutup":"Batal"}
          </button>
          {!isView&&(
            <>
              {!onlyLink&&form.nama_kegiatan&&(
                <a href={gcLink()} target="_blank" rel="noopener noreferrer" style={{ padding:"8px 14px",background:"#F0FDF4",color:"#065F46",border:"1px solid #BBF7D0",borderRadius:7,fontSize:13,fontWeight:600,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:5 }}>
                  Tambah ke Google Calendar
                </a>
              )}
              <button onClick={()=>onlyLink?onUpdateLink(form.id,form.link_dokumentasi):onSave(form)} style={{ padding:"8px 18px",background:"#134E4A",color:"white",border:"none",borderRadius:7,fontSize:13,fontWeight:600,cursor:"pointer" }}>
                {onlyLink?"Simpan Link":mode==="edit"?"Simpan Perubahan":"Tambah Kegiatan"}
              </button>
            </>
          )}
          {isView&&(
            <a href={gcLink()} target="_blank" rel="noopener noreferrer" style={{ padding:"8px 14px",background:"#F0FDF4",color:"#065F46",border:"1px solid #BBF7D0",borderRadius:7,fontSize:13,fontWeight:600,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:5 }}>
              Tambah ke Google Calendar
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
