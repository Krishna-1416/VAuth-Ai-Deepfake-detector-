/**
 * DecodeX Deepfake Detection System
 * Monochrome Minimalist (Zen) Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const previewStage = document.getElementById('preview-stage');
    const mediaPreview = document.getElementById('media-preview');
    const btnAnalyze = document.getElementById('btn-analyze');
    const btnCancel = document.getElementById('btn-cancel');
    const btnReset = document.getElementById('btn-reset');
    const progressFill = document.getElementById('progress-fill');
    const microLogs = document.getElementById('micro-logs');
    const verdictDashboard = document.getElementById('verdict-dashboard');
    const finalVerdict = document.getElementById('final-verdict');
    const confidenceScore = document.getElementById('confidence-score');
    const nexusContainer = document.getElementById('nexus-container');

    let selectedFile = null;

    // --- File Handling ---

    const handleFile = (file) => {
        if (!file) return;
        const validTypes = ['image/', 'video/', 'audio/'];
        if (!validTypes.some(type => file.type.startsWith(type))) {
            alert('File type not supported. Please upload Image, Video, or Audio.');
            return;
        }

        selectedFile = file;
        showPreview(file);
    };

    const showPreview = (file) => {
        nexusContainer.classList.add('hidden');
        previewStage.classList.remove('hidden');
        mediaPreview.innerHTML = '';

        const reader = new FileReader();

        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            reader.onload = (e) => img.src = e.target.result;
            reader.readAsDataURL(file);
            mediaPreview.appendChild(img);
        } else if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.controls = false; video.autoplay = true; video.muted = true; video.loop = true;
            reader.onload = (e) => video.src = e.target.result;
            reader.readAsDataURL(file);
            mediaPreview.appendChild(video);
        } else if (file.type.startsWith('audio/')) {
            const audio = document.createElement('audio');
            audio.controls = true;
            reader.onload = (e) => audio.src = e.target.result;
            reader.readAsDataURL(file);
            mediaPreview.appendChild(audio);
        }
    };

    // --- Analysis ---

    const addLog = (text, delay) => {
        return new Promise(resolve => {
            setTimeout(() => {
                const log = document.createElement('div');
                log.className = 'log-entry';
                log.textContent = `> ${text}`;
                microLogs.prepend(log); // Show newest at top
                resolve();
            }, delay);
        });
    };

    const runAnalysis = async () => {
        btnAnalyze.disabled = true;
        btnAnalyze.textContent = 'Analyzing...';
        
        // Progress Logic
        progressFill.style.width = '0%';
        setTimeout(() => progressFill.style.width = '100%', 100);

        // Zen Logs
        await addLog('Extracting noise variance...', 400);
        await addLog('Mapping biometric landmark consistency...', 600);
        await addLog('Verifying EXIF signature...', 300);
        await addLog('Finalizing verdict...', 500);

        setTimeout(() => displayResult(), 200);
    };

    const displayResult = () => {
        const isFake = Math.random() > 0.5;
        const conf = Math.floor(Math.random() * 20) + 75;

        previewStage.classList.add('hidden');
        verdictDashboard.classList.remove('hidden');

        finalVerdict.textContent = isFake ? 'FAKE' : 'REAL';
        confidenceScore.textContent = `Confidence: ${conf}%`;
    };

    const resetUI = () => {
        selectedFile = null;
        nexusContainer.classList.remove('hidden');
        previewStage.classList.add('hidden');
        verdictDashboard.classList.add('hidden');
        microLogs.innerHTML = '';
        progressFill.style.width = '0%';
        btnAnalyze.disabled = false;
        btnAnalyze.textContent = 'Run Analysis';
        fileInput.value = '';
    };

    // --- Events ---

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); });

    btnAnalyze.addEventListener('click', runAnalysis);
    btnCancel.addEventListener('click', resetUI);
    btnReset.addEventListener('click', resetUI);
});
