// Pustaka bersama (kamera + pengenalan wajah) untuk halaman siswa dan admin.
(() => {
  const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";
  const $ = id => document.getElementById(id);
  let stream = null;
  let modelsReady = false;

  function setStatus(id, msg, good = false) {
    const el = $(id);
    if (!el) return;
    el.textContent = msg;
    el.style.color = good ? "#147443" : "#65758a";
  }

  async function loadModels(statusId) {
    if (!window.faceapi) {
      setStatus(statusId, "Pustaka wajah gagal dimuat. Periksa internet lalu muat ulang.");
      return false;
    }
    try {
      setStatus(statusId, "Mengunduh model pengenalan wajah…");
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      modelsReady = true;
      setStatus(statusId, "Model siap. Nyalakan kamera.", true);
      return true;
    } catch (e) {
      setStatus(statusId, "Model gagal dimuat. Periksa internet dan muat ulang.");
      return false;
    }
  }

  async function startCamera(statusId) {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus(statusId, "Kamera perlu browser yang mendukung HTTPS.");
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      $("video").srcObject = stream;
      $("cameraPlaceholder").hidden = true;
      await $("video").play();
      setStatus(statusId, "Kamera aktif. Posisikan satu wajah di tengah.", true);
    } catch (e) {
      setStatus(statusId, "Kamera tidak bisa dibuka. Izinkan akses kamera di browser.");
    }
  }

  function stopCamera() {
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null;
    const v = $("video");
    if (v) v.srcObject = null;
    const p = $("cameraPlaceholder");
    if (p) p.hidden = false;
  }

  async function getDescriptor() {
    if (!modelsReady) throw Error("Model wajah belum siap.");
    if (!stream || $("video").readyState < 2) throw Error("Nyalakan kamera terlebih dahulu.");
    const d = await faceapi
      .detectSingleFace($("video"), new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (!d) throw Error("Wajah tidak terdeteksi. Perbaiki pencahayaan dan posisi.");
    return Array.from(d.descriptor);
  }

  window.FaceKit = { $, setStatus, loadModels, startCamera, stopCamera, getDescriptor, isReady: () => modelsReady };
})();
