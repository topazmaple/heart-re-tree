// 動画プレーヤー:画面に入ったら音なしで自動再生、操作は再生バーと(音声ありの動画のみ)音のボタンだけ。
// JSが動かない環境では、ブラウザ標準のコントロールがそのまま残る。
(function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function hasAudio(video) {
    if (typeof video.mozHasAudio === 'boolean') return video.mozHasAudio;
    if (video.webkitAudioDecodedByteCount > 0) return true;
    if (video.audioTracks && video.audioTracks.length > 0) return true;
    return false;
  }

  document.querySelectorAll('[data-player]').forEach(function (fig) {
    var video = fig.querySelector('video');
    if (!video) return;
    video.removeAttribute('controls');
    video.muted = true;

    var bar = document.createElement('div');
    bar.className = 'player__bar';

    var seek = document.createElement('input');
    seek.type = 'range';
    seek.min = 0;
    seek.max = 1000;
    seek.step = 1;
    seek.value = 0;
    seek.className = 'player__seek';
    seek.setAttribute('aria-label', '再生位置');
    bar.appendChild(seek);

    var sound = document.createElement('button');
    sound.type = 'button';
    sound.className = 'player__sound';
    sound.hidden = true;
    function renderSound() {
      var on = !video.muted;
      sound.setAttribute('aria-pressed', on ? 'true' : 'false');
      sound.setAttribute('aria-label', on ? '音を消す' : '音を出す');
      sound.innerHTML = on
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none"/></svg>';
    }
    renderSound();
    sound.addEventListener('click', function () {
      video.muted = !video.muted;
      if (!video.muted && video.paused) video.play();
      renderSound();
    });
    bar.appendChild(sound);
    fig.appendChild(bar);

    // 音声トラックがある動画だけ音ボタンを出す
    function checkAudio() { if (hasAudio(video)) sound.hidden = false; }
    video.addEventListener('loadeddata', checkAudio);
    video.addEventListener('timeupdate', function () {
      if (sound.hidden) checkAudio();
      if (!seeking && video.duration) seek.value = Math.round(video.currentTime / video.duration * 1000);
    });
    if (fig.hasAttribute('data-audio')) sound.hidden = false;

    var seeking = false;
    seek.addEventListener('input', function () {
      seeking = true;
      if (video.duration) video.currentTime = seek.value / 1000 * video.duration;
    });
    seek.addEventListener('change', function () { seeking = false; });

    // 映像をクリックで一時停止/再開
    var userPaused = false;
    video.addEventListener('click', function () {
      if (video.paused) { userPaused = false; video.play(); }
      else { userPaused = true; video.pause(); }
    });

    // 画面に入ったら再生、出たら一時停止
    if ('IntersectionObserver' in window && !reduceMotion) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { if (!userPaused) { var p = video.play(); if (p && p.catch) p.catch(function () {}); } }
          else if (!video.paused) video.pause();
        });
      }, { threshold: 0.5 }).observe(video);
    }
  });
})();
