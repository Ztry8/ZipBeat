(function () {
  const ROWS = 10;
  const COLS = 1000;
  const COL_W = 36;
  const ROW_H = 40;
  let BLOCK_MS = 50;

  const COLOR_BG      = '#0a0a0f';
  const COLOR_GRID_BG = '#13131f';
  const COLOR_BORDER  = '#2a2a3e';
  const COLOR_CELL_H  = 'rgba(124,58,237,0.18)';
  const COLOR_BLOCK   = '#7c3aed';
  const COLOR_BLOCK_HL= '#9f67ff';
  const COLOR_PLAYHEAD= '#f59e0b';
  const COLOR_PLAYHEAD_BG = 'rgba(245,158,11,0.12)';
  const COLOR_TEXT    = '#64748b';

  const canvas  = document.getElementById('gridCanvas');
  const ctx     = canvas.getContext('2d');
  const wrap    = document.getElementById('gridWrap');

  let cells = {};
  let playheadCol = 0;
  let isPlaying = false;
  let playStartTime = null;
  let playStartCol = 0;
  let animFrameId = null;
  let hoverCol = -1;
  let hoverRow = -1;
  let isDraggingPlayhead = false;
  let audioCtx = null;
  let loopEnabled = false;
  let isPainting = false;
  let paintMode = null;

  const totalW = COLS * COL_W;
  const totalH = ROWS * ROW_H;

  canvas.width  = totalW;
  canvas.height = totalH;
  canvas.style.width  = totalW + 'px';
  canvas.style.height = totalH + 'px';

  function cellKey(r, c) { return r + ',' + c; }

  function getAudioCtx() {
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function playColumn(col) {
    const ac = getAudioCtx();
    for (let r = 0; r < ROWS; r++) {
      const cell = cells[cellKey(r, col)];
      if (!cell) continue;
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.type      = cell.type;
      osc.frequency.value = cell.freq;
      osc.detune.value = cell.detune ?? 0;
      const vol = (cell.vol !== undefined) ? cell.vol : 0.18;
      gain.gain.setValueAtTime(vol, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + BLOCK_MS / 1000);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + BLOCK_MS / 1000 + 0.01);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, totalW, totalH);
    ctx.fillStyle = COLOR_GRID_BG;
    ctx.fillRect(0, 0, totalW, totalH);

    ctx.strokeStyle = COLOR_BORDER;
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * COL_W, 0);
      ctx.lineTo(c * COL_W, totalH);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * ROW_H);
      ctx.lineTo(totalW, r * ROW_H);
      ctx.stroke();
    }

    if (hoverCol >= 0 && hoverRow >= 0 && !cells[cellKey(hoverRow, hoverCol)]) {
      ctx.fillStyle = COLOR_CELL_H;
      ctx.fillRect(hoverCol * COL_W + 1, hoverRow * ROW_H + 1, COL_W - 2, ROW_H - 2);
    }

    for (const key in cells) {
      const cell = cells[key];
      const [r, c] = key.split(',').map(Number);
      const isActive = (c === playheadCol && isPlaying);
      ctx.fillStyle = isActive ? COLOR_BLOCK_HL : COLOR_BLOCK;
      const rx = c * COL_W + 2;
      const ry = r * ROW_H + 2;
      const rw = COL_W - 4;
      const rh = ROW_H - 4;
      roundRect(ctx, rx, ry, rw, rh, 4);
      ctx.fill();

      if (isActive) {
        ctx.shadowColor = 'rgba(124,58,237,0.9)';
        ctx.shadowBlur  = 12;
        roundRect(ctx, rx, ry, rw, rh, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = `500 9px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = cell.type[0].toUpperCase() + ' ' + cell.note;
      ctx.fillText(label, c * COL_W + COL_W / 2, r * ROW_H + ROW_H / 2);
    }

    ctx.fillStyle = COLOR_PLAYHEAD_BG;
    ctx.fillRect(playheadCol * COL_W, 0, COL_W, totalH);
    ctx.strokeStyle = COLOR_PLAYHEAD;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(playheadCol * COL_W + COL_W / 2, 0);
    ctx.lineTo(playheadCol * COL_W + COL_W / 2, totalH);
    ctx.stroke();

    ctx.fillStyle = COLOR_PLAYHEAD;
    const tx = playheadCol * COL_W + COL_W / 2;
    ctx.beginPath();
    ctx.moveTo(tx - 7, 0);
    ctx.lineTo(tx + 7, 0);
    ctx.lineTo(tx, 10);
    ctx.closePath();
    ctx.fill();

    updateStatus();
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  let lastPlayedCol = -1;

  function tick() {
    if (!isPlaying) return;
    const elapsed = performance.now() - playStartTime;
    const col = playStartCol + Math.floor(elapsed / BLOCK_MS);

    if (col >= COLS) {
      stopPlayback();
      playheadCol = 0;
      draw();
      return;
    }

    const hasMore = checkAnyBlockAfter(col);
    if (!hasMore && col > playStartCol + 5) {
      if (loopEnabled) {
        playStartTime = performance.now();
        playStartCol  = 0;
        playheadCol   = 0;
        lastPlayedCol = -1;
      } else {
        stopPlayback();
        playheadCol = 0;
        draw();
        return;
      }
    }

    if (col !== playheadCol) {
      playheadCol = col;
      scrollToPlayhead();
    }

    if (col !== lastPlayedCol) {
      lastPlayedCol = col;
      playColumn(col);
    }

    draw();
    animFrameId = requestAnimationFrame(tick);
  }

  function checkAnyBlockAfter(col) {
    for (const key in cells) {
      const c = parseInt(key.split(',')[1]);
      if (c >= col) return true;
    }
    return false;
  }

  function scrollToPlayhead() {
    const x = playheadCol * COL_W;
    const vw = wrap.clientWidth;
    const sl = wrap.scrollLeft;
    if (x < sl || x > sl + vw - COL_W * 2) {
      wrap.scrollLeft = Math.max(0, x - vw / 2);
    }
  }

  function startPlayback() {
    if (isPlaying) return;
    isPlaying = true;
    playStartTime = performance.now();
    playStartCol  = playheadCol;
    lastPlayedCol = -1;
    document.getElementById('playLabel').textContent = 'Pause';
    const icon = document.getElementById('playIcon');
    icon.classList.remove('fa-play');
    icon.classList.add('fa-pause');
    animFrameId = requestAnimationFrame(tick);
  }

  function pausePlayback() {
    if (!isPlaying) return;
    isPlaying = false;
    cancelAnimationFrame(animFrameId);
    document.getElementById('playLabel').textContent = 'Play';
    const icon = document.getElementById('playIcon');
    icon.classList.remove('fa-pause');
    icon.classList.add('fa-play');
    draw();
  }

  function stopPlayback() {
    isPlaying = false;
    cancelAnimationFrame(animFrameId);
    document.getElementById('playLabel').textContent = 'Play';
    const icon = document.getElementById('playIcon');
    icon.classList.remove('fa-pause');
    icon.classList.add('fa-play');
  }

  function updateStatus() {
    document.getElementById('statBlocks').textContent = Object.keys(cells).length;
    document.getElementById('statCol').textContent    = playheadCol;
    document.getElementById('statStatus').textContent = isPlaying ? '▶ Playing' : 'Stopped';
  }

  function canvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = wrap.scrollLeft;
    const sy = wrap.scrollTop;
    const x  = e.clientX - rect.left + sx;
    const y  = e.clientY - rect.top  + sy;
    return { col: Math.floor(x / COL_W), row: Math.floor(y / ROW_H) };
  }

  function isOnPlayhead(e) {
    const { col } = canvasCoords(e);
    return col === playheadCol;
  }

  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  canvas.addEventListener('mousedown', function (e) {
    if (isDraggingPlayhead) return;
    if (isOnPlayhead(e) && e.button === 0) {
      isDraggingPlayhead = true;
      return;
    }
    const { col, row } = canvasCoords(e);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;

    if (e.button === 2) {
      delete cells[cellKey(row, col)];
      isPainting = true;
      paintMode = 'erase';
      draw();
      return;
    }

    if (e.button === 0) {
      const key = cellKey(row, col);
      if (cells[key]) {
        delete cells[key];
        paintMode = 'erase';
      } else {
        cells[key] = {
          type:   document.getElementById('selType').value,
          freq:   parseFloat(document.getElementById('selNote').value) || 440,
          note:   document.getElementById('selNote').selectedOptions[0].text,
          vol:    Math.max(0, Math.min(1, parseFloat(document.getElementById('inpVol').value) || 0.18))
        };
        paintMode = 'draw';
      }
      isPainting = true;
      draw();
    }
  });

  canvas.addEventListener('mousemove', function (e) {
    if (isDraggingPlayhead) {
      const { col } = canvasCoords(e);
      playheadCol = Math.max(0, Math.min(COLS - 1, col));
      if (isPlaying) {
        playStartTime = performance.now();
        playStartCol  = playheadCol;
        lastPlayedCol = -1;
      }
      draw();
      return;
    }

    const { col, row } = canvasCoords(e);
    hoverCol = col; hoverRow = row;

    if (isPainting && col >= 0 && col < COLS && row >= 0 && row < ROWS) {
      const key = cellKey(row, col);
      if (paintMode === 'erase') {
        delete cells[key];
      } else if (paintMode === 'draw' && !cells[key]) {
        cells[key] = {
          type:   document.getElementById('selType').value,
          freq:   parseFloat(document.getElementById('selNote').value) || 440,
          note:   document.getElementById('selNote').selectedOptions[0].text,
          vol:    Math.max(0, Math.min(1, parseFloat(document.getElementById('inpVol').value) || 0.18))
        };
      }
    }

    draw();
  });

  canvas.addEventListener('mouseleave', function () {
    hoverCol = -1; hoverRow = -1;
    isDraggingPlayhead = false;
    draw();
  });

  document.addEventListener('mouseup', function () {
    isDraggingPlayhead = false;
    isPainting = false;
    paintMode = null;
  });

  document.getElementById('btnPlay').addEventListener('click', function () {
    if (isPlaying) pausePlayback(); else startPlayback();
  });

  document.getElementById('btnStop').addEventListener('click', function () {
    stopPlayback();
    playheadCol = 0;
    draw();
  });

  document.getElementById('btnRewind').addEventListener('click', function () {
    stopPlayback();
    playheadCol = 0;
    if (isPlaying) { startPlayback(); }
    draw();
  });

  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (isPlaying) pausePlayback(); else startPlayback();
    }
  });

  document.getElementById('btnSave').addEventListener('click', function () {
    const data = { version: 1, cells };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'zipbeat-project.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('btnLoad').addEventListener('click', function () {
    document.getElementById('fileInput').click();
  });

  document.getElementById('fileInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      try {
        const data = JSON.parse(ev.target.result);
        if (data && data.cells) {
          cells = data.cells;
          stopPlayback();
          playheadCol = 0;
          draw();
        }
      } catch (err) {
        alert('Invalid project file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('btnClear').addEventListener('click', function () {
    if (!confirm('Clear all blocks?')) return;
    cells = {};
    stopPlayback();
    playheadCol = 0;
    draw();
  });

  document.getElementById('expCancel').addEventListener('click', function () {
    document.getElementById('exportModal').classList.remove('open');
  });

  document.getElementById('expGo').addEventListener('click', function () {
    document.getElementById('exportModal').classList.remove('open');
    exportAudio();
  });

  async function exportAudio() {
    const colKeys = Object.keys(cells).map(k => parseInt(k.split(',')[1]));
    if (colKeys.length === 0) { alert('No blocks to export.'); return; }
    const maxCol  = Math.max(...colKeys);
    const format  = document.getElementById('expFormat').value;
    const bitrate = parseInt(document.getElementById('expBitrate').value);
    const blockMs = parseInt(document.getElementById('expGap').value);

    if (!MediaRecorder.isTypeSupported(format.split(';')[0])) {
      alert('This format is not supported in your browser. Try WebM.');
      return;
    }

    const ac   = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
    const dest = ac.createMediaStreamDestination();
    const rec  = new MediaRecorder(dest.stream, { mimeType: format, audioBitsPerSecond: bitrate });
    const chunks = [];
    rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

    rec.onstop = function () {
      const ext  = format.startsWith('audio/ogg') ? 'ogg' : 'webm';
      const blob = new Blob(chunks, { type: format.split(';')[0] });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'zipbeat-export.' + ext;
      a.click();
      URL.revokeObjectURL(url);
      ac.close();
    };

    rec.start();

    for (let c = 0; c <= maxCol; c++) {
      for (let r = 0; r < ROWS; r++) {
        const cell = cells[cellKey(r, c)];
        if (!cell) continue;
        const osc  = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = cell.type;
        osc.frequency.value = cell.freq;
        osc.detune.value = cell.detune ?? 0;
        const t0 = ac.currentTime + (c * blockMs) / 1000;
        const vol = (cell.vol !== undefined) ? cell.vol : 0.18;
        gain.gain.setValueAtTime(vol, t0);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + blockMs / 1000);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t0);
        osc.stop(t0 + blockMs / 1000 + 0.02);
      }
    }

    const totalDur = ((maxCol + 2) * blockMs);
    await new Promise(r => setTimeout(r, totalDur + 200));
    rec.stop();
  }

  document.getElementById('btnLoop').addEventListener('click', function () {
    loopEnabled = !loopEnabled;
    this.classList.toggle('active', loopEnabled);
  });
  draw();
  document.getElementById('btnExport').addEventListener('click', function () {
    document.getElementById('expGap').value = String(BLOCK_MS);
    document.getElementById('exportModal').classList.add('open');
  });
})();