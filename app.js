// Halaman SISWA: hanya absensi. Tidak ada kunci admin, daftar siswa, atau riwayat di sini.
(() => {
  const { $, setStatus, loadModels, startCamera, stopCamera, getDescriptor, isReady } = FaceKit;
  let busy = false;

  async function recognize() {
    if (busy) return;
    busy = true;
    $("recognizeBtn").disabled = true;
    $("recognitionResult").textContent = "Memeriksa wajah dan menyimpan absensi…";
    try {
      const face = await getDescriptor();
      const r = await fetch("/api/public/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descriptor: face, status: $("mode").value })
      });
      const j = await r.json().catch(() => ({ error: "Respons server tidak valid" }));
      if (!r.ok) throw Error(j.error || "Absensi gagal (" + r.status + ").");
      const rec = j.record;
      $("recognitionResult").textContent = "✅ Absensi berhasil: " + rec.name + " • " + rec.cls + " • " + rec.status + " • " + rec.time;
    } catch (e) {
      $("recognitionResult").textContent = e.message;
    } finally {
      busy = false;
      $("recognizeBtn").disabled = !isReady();
    }
  }

  $("startCamera").onclick = () => startCamera("modelStatus");
  $("stopCamera").onclick = stopCamera;
  $("recognizeBtn").onclick = recognize;
  loadModels("modelStatus").then(ok => { $("recognizeBtn").disabled = !ok; });
})();
