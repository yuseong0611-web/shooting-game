// Player.js — CYBER-HUD 리디자인
// HP바: 세그먼트형 + 글로우, 리로드 인디케이터

var PLAYER_CONFIG = {
  normal: { speed: 200, color: 0x00d4ff, maxHp: 10 },
  fast:   { speed: 280, color: 0x00ffaa, maxHp: 10 },
  tank:   { speed: 150, color: 0xff6644, maxHp: 50 }
};

// 캐릭터별 액센트 색상 (hex string)
var PLAYER_ACCENT = {
  normal: 0x00d4ff,
  fast:   0x00ffaa,
  tank:   0xff6644
};

class Player {
  constructor(scene, x, y, options) {
    this.scene = scene;
    var sel = options || (typeof window !== 'undefined' && window.SELECTION) || {};
    var charKey = sel.character || 'normal';
    var cfg = PLAYER_CONFIG[charKey] || PLAYER_CONFIG.normal;
    this.speed = cfg.speed;
    this.maxHp = cfg.maxHp;
    this.hp = this.maxHp;
    this.accentColor = PLAYER_ACCENT[charKey] || 0x00d4ff;
    this.shotCount = 0;
    this.reloadDuration = 900;
    this.reloadEndTime = 0;
    this.isReloading = false;
    this._lastHp = this.maxHp;

    var playerTexture = (typeof window !== 'undefined' && window.GAME_TEXTURES && window.GAME_TEXTURES.player) || '';
    this.playerBaseTexture = playerTexture;
    this.playerReloadTexture = (typeof window !== 'undefined' && window.GAME_TEXTURES && window.GAME_TEXTURES.playerReload) || '';

    if (playerTexture && scene.textures.exists(playerTexture)) {
      this.rect = scene.physics.add.image(x, y, playerTexture);
      this.rect.setDisplaySize(38, 38);
    } else {
      this.rect = scene.add.rectangle(x, y, 32, 32, cfg.color);
      scene.physics.add.existing(this.rect);
    }
    this.body = this.rect.body;
    this.body.setCollideWorldBounds(true);

    // HP 바 (세그먼트형) — 화면 상단 HUD에 고정
    this._hpBarGfx = scene.add.graphics().setDepth(500).setScrollFactor(0);
    this._reloadGfx = scene.add.graphics().setDepth(500).setScrollFactor(0);
    this._hpLabel = scene.add.text(20, 18, 'HP', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '10px', color: '#556677', letterSpacing: 3,
    }).setDepth(500).setScrollFactor(0);

    // 위험 경고 관련 상태
    this._criticalWarningShown = false;
    this._criticalOverlay = null;
    this._criticalBorderGfx = null;
    this._criticalBorderTween = null;
    this._criticalLabelTxt = null;

    this._drawHpBar();
  }

  /* ── 위험 경고 팝업 & 화면 테두리 ─────────────────── */
  _showCriticalWarning() {
    if (this._criticalWarningShown) return;
    this._criticalWarningShown = true;
    const scene = this.scene;
    const W = 800, H = 600;

    /* 1. 화면 테두리 붉은 펄스 */
    this._criticalBorderGfx = scene.add.graphics().setDepth(800).setScrollFactor(0);
    const drawBorder = (alpha) => {
      const g = this._criticalBorderGfx;
      if (!g || !g.clear) return;
      g.clear();
      g.lineStyle(6, 0xff2244, alpha);
      g.strokeRect(3, 3, W - 6, H - 6);
      g.lineStyle(2, 0xff4466, alpha * 0.5);
      g.strokeRect(9, 9, W - 18, H - 18);
    };
    drawBorder(0.8);
    this._criticalBorderTween = scene.tweens.add({
      targets: { v: 0.8 },
      v: 0.15,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => { drawBorder(tween.targets[0].v); },
    });

    /* 2. 경고 팝업 */
    const pw = 340, ph = 90;
    const cx = W / 2, cy = H / 2;
    const popupDepth = 810;

    const popGfx = scene.add.graphics().setDepth(popupDepth).setScrollFactor(0);
    popGfx.fillStyle(0x0a0000, 0.97);
    popGfx.fillRect(cx - pw/2, cy - ph/2, pw, ph);
    popGfx.lineStyle(2, 0xff2244, 1);
    popGfx.strokeRect(cx - pw/2, cy - ph/2, pw, ph);
    popGfx.lineStyle(1, 0xff2244, 0.25);
    popGfx.strokeRect(cx - pw/2 - 5, cy - ph/2 - 5, pw + 10, ph + 10);
    // 상단 강조선
    popGfx.lineStyle(3, 0xff2244, 1);
    popGfx.lineBetween(cx - pw/2, cy - ph/2, cx + pw/2, cy - ph/2);
    // 코너
    const cl = 10;
    [[cx-pw/2+8, cy-ph/2+8],[cx+pw/2-8, cy-ph/2+8],[cx-pw/2+8, cy+ph/2-8],[cx+pw/2-8, cy+ph/2-8]]
      .forEach(([x,y], i) => {
        popGfx.lineStyle(1, 0xff2244, 0.7);
        const sx = i%2===0?1:-1, sy = i<2?1:-1;
        popGfx.lineBetween(x, y, x+cl*sx, y);
        popGfx.lineBetween(x, y, x, y+cl*sy);
      });

    const tagTxt = scene.add.text(cx, cy - ph/2 + 10, '⚠  CRITICAL ALERT  ⚠', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '9px', color: '#ff2244', letterSpacing: 5,
    }).setOrigin(0.5, 0).setDepth(popupDepth + 1).setScrollFactor(0);

    const mainTxt = scene.add.text(cx, cy - 8, 'UNIT CRITICAL', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '22px', color: '#ff4466', letterSpacing: 6,
      stroke: '#330000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(popupDepth + 1).setScrollFactor(0);

    const subTxt = scene.add.text(cx, cy + 20, 'HP BELOW THRESHOLD — IMMEDIATE ACTION REQUIRED', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '9px', color: '#ffaa00', letterSpacing: 2,
    }).setOrigin(0.5).setDepth(popupDepth + 1).setScrollFactor(0);

    // 팝업 등장 애니메이션
    const popItems = [popGfx, tagTxt, mainTxt, subTxt];
    popItems.forEach(t => t.setAlpha(0));
    scene.tweens.add({ targets: popItems, alpha: 1, duration: 250, ease: 'Power2' });

    // 텍스트 깜빡임
    scene.tweens.add({
      targets: mainTxt,
      alpha: { from: 1, to: 0.4 },
      duration: 400, yoyo: true, repeat: -1,
    });

    // 2.5초 후 팝업 자동 제거 (테두리 효과는 유지)
    scene.time.delayedCall(2500, () => {
      scene.tweens.add({
        targets: popItems,
        alpha: 0,
        duration: 400,
        onComplete: () => popItems.forEach(t => { if (t && t.destroy) t.destroy(); }),
      });
    });
  }

  _hideCriticalWarning() {
    // HP가 회복되면 테두리 제거
    if (this._criticalBorderTween) { this._criticalBorderTween.stop(); this._criticalBorderTween = null; }
    if (this._criticalBorderGfx) { this._criticalBorderGfx.destroy(); this._criticalBorderGfx = null; }
    this._criticalWarningShown = false;
  }

  _getCriticalThresholdHp() {
    // 요구사항: 기준은 "20%와 5HP 중 더 큰 값"
    return Math.max(this.maxHp * 0.2, 5);
  }

  _drawHpBar() {
    const gfx = this._hpBarGfx;
    gfx.clear();

    const totalW = 180;
    const segCount = Math.min(this.maxHp, 20); // 최대 20세그먼트 표시
    const segGap = 2;
    const segW = (totalW - segGap * (segCount - 1)) / segCount;
    const barH = 8;
    const startX = 40;
    const startY = 20;

    const hpRatio = this.hp / this.maxHp;
    const filledCount = Math.ceil(segCount * hpRatio);

    // 배경 바
    gfx.fillStyle(0x001122, 0.9);
    gfx.fillRect(startX - 2, startY - 2, totalW + 4, barH + 4);
    gfx.lineStyle(1, this.accentColor, 0.3);
    gfx.strokeRect(startX - 2, startY - 2, totalW + 4, barH + 4);

    for (let i = 0; i < segCount; i++) {
      const sx = startX + i * (segW + segGap);
      if (i < filledCount) {
        // 채워진 세그먼트
        const ratio = i / segCount;
        let color = this.accentColor;
        if (hpRatio < 0.25) color = 0xff3344;
        else if (hpRatio < 0.5) color = 0xffaa00;

        gfx.fillStyle(color, 0.9);
        gfx.fillRect(sx, startY, segW, barH);
        // 하이라이트
        gfx.fillStyle(0xffffff, 0.15);
        gfx.fillRect(sx, startY, segW, 2);
      } else {
        // 빈 세그먼트
        gfx.fillStyle(0x001a3a, 1);
        gfx.fillRect(sx, startY, segW, barH);
        gfx.lineStyle(1, 0x112233, 0.8);
        gfx.strokeRect(sx, startY, segW, barH);
      }
    }

    // HP 수치
    gfx.fillStyle(0x000000, 0);  // 투명 (텍스트는 별도)
    if (!this._hpNumText) {
      this._hpNumText = this.scene.add.text(startX + totalW + 8, startY - 1, '', {
        fontFamily: '"Share Tech Mono", "Courier New", monospace',
        fontSize: '10px', color: '#00d4ff',
      }).setDepth(500).setScrollFactor(0);
    }
    const hpColor = this.hp / this.maxHp < 0.25 ? '#ff3344'
      : this.hp / this.maxHp < 0.5 ? '#ffaa00'
      : '#00d4ff';
    this._hpNumText.setStyle({ color: hpColor });
    this._hpNumText.setText(this.hp + '/' + this.maxHp);
  }

  _drawReloadBar(time) {
    const gfx = this._reloadGfx;
    gfx.clear();
    if (!this.isReloading) return;

    const progress = 1 - Math.max(0, (this.reloadEndTime - time) / this.reloadDuration);
    const bw = 60;
    const bh = 4;
    const bx = 40;
    const by = 34;

    gfx.fillStyle(0x001122, 0.9);
    gfx.fillRect(bx, by, bw, bh);
    gfx.fillStyle(0xffaa00, 0.9);
    gfx.fillRect(bx, by, bw * progress, bh);
    gfx.lineStyle(1, 0xffaa00, 0.4);
    gfx.strokeRect(bx, by, bw, bh);

    if (!this._reloadLabel) {
      this._reloadLabel = this.scene.add.text(bx + bw + 6, by - 2, 'RELOAD', {
        fontFamily: '"Share Tech Mono", "Courier New", monospace',
        fontSize: '8px', color: '#ffaa00', letterSpacing: 2,
      }).setDepth(500).setScrollFactor(0);
    }
    this._reloadLabel.setVisible(true);
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    var criticalThreshold = this._getCriticalThresholdHp();
    if (this.hp > 0 && this.hp <= criticalThreshold) {
      this._showCriticalWarning();
    } else if (this.hp > criticalThreshold) {
      this._hideCriticalWarning();
    }
    this._drawHpBar();
    return this.hp <= 0;
  }

  canShoot(time) {
    if (!this.isReloading) return true;
    if (time >= this.reloadEndTime) {
      this.isReloading = false;
      if (this._reloadLabel) this._reloadLabel.setVisible(false);
      if (this.playerBaseTexture && this.rect.setTexture && this.scene.textures.exists(this.playerBaseTexture)) {
        this.rect.setTexture(this.playerBaseTexture);
      }
      return true;
    }
    return false;
  }

  registerShot(time) {
    this.shotCount += 1;
    if (this.shotCount >= 3) {
      this.shotCount = 0;
      this.isReloading = true;
      this.reloadEndTime = time + this.reloadDuration;
      if (this.playerReloadTexture && this.rect.setTexture && this.scene.textures.exists(this.playerReloadTexture)) {
        this.rect.setTexture(this.playerReloadTexture);
      }
    }
  }

  update(keys, time) {
    var vx = 0, vy = 0;
    if (keys.left.isDown)  vx = -this.speed;
    if (keys.right.isDown) vx = this.speed;
    if (keys.up.isDown)    vy = -this.speed;
    if (keys.down.isDown)  vy = this.speed;
    this.body.setVelocity(vx, vy);

    this.canShoot(time || 0);

    var pointer = this.scene.input.activePointer;
    if (pointer) {
      var aim = Math.atan2(pointer.worldY - this.rect.y, pointer.worldX - this.rect.x);
      this.rect.rotation = aim;
    }

    // HP 변화 시에만 바 갱신
    if (this._lastHp !== this.hp) {
      this._lastHp = this.hp;
      this._drawHpBar();
    }

    this._drawReloadBar(time);
  }

  destroy() {
    this._hideCriticalWarning();
    this.rect.destroy();
    if (this._hpBarGfx) this._hpBarGfx.destroy();
    if (this._reloadGfx) this._reloadGfx.destroy();
    if (this._hpLabel) this._hpLabel.destroy();
    if (this._hpNumText) this._hpNumText.destroy();
    if (this._reloadLabel) this._reloadLabel.destroy();
  }
}