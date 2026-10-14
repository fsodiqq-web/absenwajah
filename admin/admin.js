// Halaman ADMIN: login, pendaftaran wajah, data siswa, riwayat absensi, ekspor CSV.
(() => {
  const { $, setStatus, loadModels, startCamera, stopCamera, getDescriptor, isReady } = FaceKit;
  let adminKey = sessionStorage.getItem("absensi_admin_key") || "";
  let students = [], attendance = [], busy = false, modelsStarted = false;

  const today = () => {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  };

  async function api(path, options = {}) {
    const headers = { "Content-Type": "application/json", "x-admin-key": adminKey, ...(options.headers || {}) };
    const r = await fetch("/api/" + path, { ...options, headers });
    const j = await r.json().catch(() => ({ error: "Respons server tidak valid" }));
    if (!r.ok) throw new Error(j.error || "Permintaan gagal (" + r.status + ")");
    return j;
  }

  function showPanel(show) {
    $("adminPanel").hidden = !show;
    $("logoutBtn").hidden = !show;
  }

  async function refresh() {
    if (!adminKey) throw new Error("Masukkan kunci admin terlebih dahulu.");
    const [s, a] = await Promise.all([api("students"), api("attendance")]);
    students = s.students || [];
    attendance = a.attendance || [];
    render();
  }

  async function connect() {
    adminKey = $("adminKey").value.trim();
    if (!adminKey) { setStatus("apiStatus", "Masukkan kunci admin."); return; }
    sessionStorage.setItem("absensi_admin_key", adminKey);
    try {
      await refresh();
      setStatus("apiStatus", "Berhasil terhubung ke database Netlify.", true);
      showPanel(true);
      if (!modelsStarted) {
        modelsStarted = true;
        const ok = await loadModels("modelStatus");
        $("registerBtn").disabled = !ok;
      }
    } catch (e) {
      sessionStorage.removeItem("absensi_admin_key");
      adminKey = "";
      showPanel(false);
      setStatus("apiStatus", "Gagal terhubung: " + e.message);
    }
  }

  function logout() {
    stopCamera();
    sessionStorage.removeItem("absensi_admin_key");
    adminKey = "";
    students = []; attendance = [];
    render();
    showPanel(false);
    $("adminKey").value = "";
    setStatus("apiStatus", "Anda sudah keluar.");
  }

  async function register() {
    if (busy) return;
    if (!adminKey) { setStatus("registerStatus", "Hubungkan admin terlebih dahulu."); return; }
    const name = $("studentName").value.trim(), nis = $("studentNis").value.trim(), cls = $("studentClass").value.trim();
    if (!name || !nis || !cls) { setStatus("registerStatus", "Isi nama, NIS, dan kelas."); return; }
    if (students.some(s => s.nis.toLowerCase() === nis.toLowerCase())) { setStatus("registerStatus", "NIS sudah terdaftar."); return; }
    busy = true;
    $("registerBtn").disabled = true;
    try {
      const face = await getDescriptor();
      await api("students", { method: "POST", body: JSON.stringify({ name, nis, cls, descriptor: face }) });
      $("studentName").value = $("studentNis").value = $("studentClass").value = "";
      await refresh();
      setStatus("registerStatus", "Wajah " + name + " tersimpan di database online.", true);
    } catch (e) {
      setStatus("registerStatus", e.message);
    } finally {
      busy = false;
      $("registerBtn").disabled = !isReady();
    }
  }

  function render() {
    $("studentCount").textContent = students.length + " siswa";
    $("recordCount").textContent = attendance.length + " catatan";
    const list = $("studentsList");
    list.replaceChildren();
    if (!students.length) list.textContent = "Belum ada siswa terdaftar.";
    students.forEach(s => {
      const row = document.createElement("div");
      row.className = "student-row";
      const info = document.createElement("div"), strong = document.createElement("strong"), small = document.createElement("small");
      strong.textContent = s.name;
      small.textContent = s.nis + " • " + s.cls;
      info.append(strong, small);
      const btn = document.createElement("button");
      btn.className = "danger";
      btn.textContent = "Hapus";
      btn.onclick = async () => {
        if (!confirm("Hapus data wajah " + s.name + "?")) return;
        try { await api("students", { method: "DELETE", body: JSON.stringify({ nis: s.nis }) }); await refresh(); }
        catch (e) { alert(e.message); }
      };
      row.append(info, btn);
      list.append(row);
    });
    const body = $("attendanceBody");
    body.replaceChildren();
    if (!attendance.length) {
      const tr = document.createElement("tr"), td = document.createElement("td");
      td.colSpan = 6; td.className = "empty"; td.textContent = "Belum ada catatan.";
      tr.append(td); body.append(tr);
    }
    attendance.slice(0, 500).forEach(r => {
      const tr = document.createElement("tr");
      [r.date, r.time, r.name, r.nis, r.cls, r.status].forEach(v => {
        const td = document.createElement("td");
        td.textContent = v ?? "";
        tr.append(td);
      });
      body.append(tr);
    });
  }

  function exportCSV() {
    if (!attendance.length) { alert("Tidak ada catatan untuk diekspor."); return; }
    const rows = [["Tanggal", "Jam", "Nama", "NIS", "Kelas", "Status"], ...attendance.map(r => [r.date, r.time, r.name, r.nis, r.cls, r.status])];
    const csv = "\uFEFF" + rows.map(r => r.map(v => '"' + String(v ?? "").replace(/"/g, '""') + '"').join(",")).join("\r\n");
    const u = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = u; a.download = "rekap_absensi_" + today() + ".csv"; a.click();
    URL.revokeObjectURL(u);
  }

  $("connectBtn").onclick = connect;
  $("logoutBtn").onclick = logout;
  $("adminKey").addEventListener("keydown", e => { if (e.key === "Enter") connect(); });
  $("refreshBtn").onclick = () => refresh().catch(e => setStatus("apiStatus", "Gagal memuat data: " + e.message));
  $("startCamera").onclick = () => startCamera("modelStatus");
  $("stopCamera").onclick = stopCamera;
  $("registerBtn").onclick = register;
  $("exportBtn").onclick = exportCSV;
  if (adminKey) { $("adminKey").value = adminKey; connect(); }
})();
