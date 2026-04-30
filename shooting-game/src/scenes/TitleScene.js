// TitleScene.js — CYBER-HUD 리디자인
// 글리치 애니메이션, 스캔라인, 파티클 효과 포함

class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
    this._glitchTimer = 0;
    this._particles = [];
    this._scanY = 0;
    this._frameCount = 0;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    /* ── 배경 레이어 ─────────────────────────────── */
    // 그라디언트 배경 (Graphics로 시뮬레이션)
    const bgGfx = this.add.graphics();
    bgGfx.fillGradientStyle(0x000814, 0x000814, 0x001233, 0x001233, 1);
    bgGfx.fillRect(0, 0, W, H);

    // 그리드 라인 (원근감 있는 격자)
    this._drawGrid(W, H);

    // 코너 데코레이션 (HUD 프레임)
    this._drawHUDCorners(W, H);

    /* ── 상단 상태바 ─────────────────────────────── */
    this._drawStatusBar(W);

    /* ── 메인 타이틀 ─────────────────────────────── */
    // 글로우 효과를 위한 쉐도우 레이어
    const glowTitle = this.add.text(W / 2, 200, 'TACTICAL\nSHOOTER', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '64px',
      color: '#003366',
      align: 'center',
      lineSpacing: -10,
      letterSpacing: 12,
    }).setOrigin(0.5).setAlpha(0.6);

    // 실제 타이틀 텍스트
    this._titleText = this.add.text(W / 2, 200, 'TACTICAL\nSHOOTER', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '64px',
      color: '#00d4ff',
      align: 'center',
      lineSpacing: -10,
      letterSpacing: 12,
      stroke: '#004466',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // 서브타이틀
    this._subText = this.add.text(W / 2, 295, '[ TOP-DOWN COMBAT SYSTEM v2.1 ]', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '14px',
      color: '#00ffaa',
      letterSpacing: 4,
    }).setOrigin(0.5).setAlpha(0);

    // 서브타이틀 페이드인
    this.tweens.add({
      targets: this._subText,
      alpha: 1,
      duration: 800,
      delay: 600,
      ease: 'Power2',
    });

    /* ── 구분선 ─────────────────────────────── */
    const lineGfx = this.add.graphics();
    lineGfx.lineStyle(1, 0x00d4ff, 0.4);
    lineGfx.lineBetween(W / 2 - 200, 320, W / 2 + 200, 320);
    lineGfx.lineStyle(1, 0x00ffaa, 0.3);
    lineGfx.lineBetween(W / 2 - 120, 325, W / 2 + 120, 325);

    /* ── 설명 텍스트 ─────────────────────────────── */
    this.add.text(W / 2, 355, '캐릭터와 전술 능력을 선택하고 전장에 투입하라', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '13px',
      color: '#7faacc',
      letterSpacing: 2,
    }).setOrigin(0.5);

    /* ── 시작 버튼 ─────────────────────────────── */
    this._buildStartButton(W, H);

    /* ── 하단 정보 ─────────────────────────────── */
    this._drawFooter(W, H);

    /* ── 스캔라인 오버레이 ─────────────────────────────── */
    this._scanLine = this.add.graphics();
    this._scanLine.setDepth(100);

    /* ── 파티클 초기화 ─────────────────────────────── */
    this._initParticles(W, H);

    /* ── 타이틀 등장 애니메이션 ─────────────────────────────── */
    this._titleText.setAlpha(0).setY(180);
    glowTitle.setAlpha(0).setY(180);
    this.tweens.add({
      targets: [this._titleText, glowTitle],
      alpha: { from: 0, to: 1 },
      y: 200,
      duration: 1000,
      ease: 'Power3',
    });

    /* ── 글리치 타이머 ─────────────────────────────── */
    this.time.addEvent({
      delay: Phaser.Math.Between(2000, 4000),
      callback: this._triggerGlitch,
      callbackScope: this,
      loop: false,
    });

    /* ── update 등록 ─────────────────────────────── */
    this._scanY = 0;
  }

  _drawGrid(W, H) {
    const gfx = this.add.graphics();

    // 수평선
    gfx.lineStyle(1, 0x001a3a, 0.8);
    for (let y = 0; y < H; y += 40) {
      gfx.lineBetween(0, y, W, y);
    }
    // 수직선
    for (let x = 0; x < W; x += 40) {
      gfx.lineBetween(x, 0, x, H);
    }

    // 원근감 수렴선 (하단 중심 → 상단 모서리)
    gfx.lineStyle(1, 0x003366, 0.3);
    const cx = W / 2;
    const vanishY = H * 0.6;
    for (let i = 0; i <= 8; i++) {
      const tx = (W / 8) * i;
      gfx.lineBetween(cx, vanishY, tx, 0);
    }
  }

  _drawHUDCorners(W, H) {
    const gfx = this.add.graphics();
    const len = 30;
    const pad = 20;
    gfx.lineStyle(2, 0x00d4ff, 0.9);

    // 좌상
    gfx.lineBetween(pad, pad, pad + len, pad);
    gfx.lineBetween(pad, pad, pad, pad + len);
    // 우상
    gfx.lineBetween(W - pad, pad, W - pad - len, pad);
    gfx.lineBetween(W - pad, pad, W - pad, pad + len);
    // 좌하
    gfx.lineBetween(pad, H - pad, pad + len, H - pad);
    gfx.lineBetween(pad, H - pad, pad, H - pad - len);
    // 우하
    gfx.lineBetween(W - pad, H - pad, W - pad - len, H - pad);
    gfx.lineBetween(W - pad, H - pad, W - pad, H - pad - len);

    // 중간 코너 포인트 (작은 사각형)
    gfx.fillStyle(0x00d4ff, 1);
    [[pad, pad], [W - pad, pad], [pad, H - pad], [W - pad, H - pad]].forEach(([x, y]) => {
      gfx.fillRect(x - 2, y - 2, 4, 4);
    });
  }

  _drawStatusBar(W) {
    const gfx = this.add.graphics();
    gfx.fillStyle(0x00d4ff, 0.06);
    gfx.fillRect(0, 0, W, 36);
    gfx.lineStyle(1, 0x00d4ff, 0.3);
    gfx.lineBetween(0, 36, W, 36);

    this.add.text(30, 11, '■ SYS.ONLINE', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '11px', color: '#00ffaa',
    });
    this.add.text(W / 2, 11, 'UNIT COMMAND CENTER — SECTOR 7', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '11px', color: '#4488aa',
    }).setOrigin(0.5, 0);

    // 깜빡이는 점
    const dot = this.add.text(W - 80, 11, '● REC', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '11px', color: '#ff3344',
    });
    this.tweens.add({ targets: dot, alpha: 0, duration: 700, yoyo: true, repeat: -1 });
  }

  _buildStartButton(W, H) {
    const bx = W / 2;
    const by = 450;
    const bw = 240;
    const bh = 52;

    // 버튼 외곽 프레임
    const frame = this.add.graphics();
    frame.lineStyle(1, 0x00d4ff, 0.5);
    frame.strokeRect(bx - bw / 2 - 4, by - bh / 2 - 4, bw + 8, bh + 8);
    frame.lineStyle(1, 0x00ffaa, 0.2);
    frame.strokeRect(bx - bw / 2 - 8, by - bh / 2 - 8, bw + 16, bh + 16);

    // 버튼 배경
    const btnBg = this.add.graphics();
    const drawBtn = (hover) => {
      btnBg.clear();
      if (hover) {
        btnBg.fillStyle(0x00d4ff, 0.25);
        btnBg.fillRect(bx - bw / 2, by - bh / 2, bw, bh);
        btnBg.lineStyle(2, 0x00ffff, 1);
        btnBg.strokeRect(bx - bw / 2, by - bh / 2, bw, bh);
      } else {
        btnBg.fillStyle(0x001a3a, 0.9);
        btnBg.fillRect(bx - bw / 2, by - bh / 2, bw, bh);
        btnBg.lineStyle(2, 0x00d4ff, 0.8);
        btnBg.strokeRect(bx - bw / 2, by - bh / 2, bw, bh);
      }
    };
    drawBtn(false);

    // 버튼 텍스트
    const btnTxt = this.add.text(bx, by - 2, '▶  DEPLOY NOW', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '16px',
      color: '#00d4ff',
      letterSpacing: 4,
    }).setOrigin(0.5);

    const subTxt = this.add.text(bx, by + 16, 'PRESS TO INITIATE', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '9px', color: '#4488aa', letterSpacing: 3,
    }).setOrigin(0.5);

    // 히트존
    const hitZone = this.add.rectangle(bx, by, bw, bh).setInteractive({ useHandCursor: true });
    hitZone.on('pointerover', () => {
      drawBtn(true);
      btnTxt.setColor('#ffffff');
      this.tweens.add({ targets: btnTxt, scaleX: 1.04, scaleY: 1.04, duration: 100 });
    });
    hitZone.on('pointerout', () => {
      drawBtn(false);
      btnTxt.setColor('#00d4ff');
      this.tweens.add({ targets: btnTxt, scaleX: 1, scaleY: 1, duration: 100 });
    });
    hitZone.on('pointerdown', () => {
      // 클릭 플래시
      const flash = this.add.graphics();
      flash.fillStyle(0x00d4ff, 0.4);
      flash.fillRect(0, 0, this.scale.width, this.scale.height);
      this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
      this.time.delayedCall(200, () => this.scene.start('CharacterSelectScene'));
    });

    // 버튼 펄스 애니메이션
    this.tweens.add({
      targets: frame,
      alpha: { from: 0.6, to: 1 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  _drawFooter(W, H) {
    const gfx = this.add.graphics();
    gfx.fillStyle(0x00d4ff, 0.04);
    gfx.fillRect(0, H - 36, W, 36);
    gfx.lineStyle(1, 0x00d4ff, 0.2);
    gfx.lineBetween(0, H - 36, W, H - 36);

    this.add.text(30, H - 22, 'VER 2.1.0 — CLASSIFIED', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '10px', color: '#335566',
    });
    this.add.text(W - 30, H - 22, 'ANTHROPIC MILITARY SIM', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '10px', color: '#335566',
    }).setOrigin(1, 0);
  }

  _initParticles(W, H) {
    this._particles = [];
    for (let i = 0; i < 40; i++) {
      this._particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        speed: 0.3 + Math.random() * 0.8,
        alpha: 0.1 + Math.random() * 0.4,
        size: Math.random() < 0.7 ? 1 : 2,
        color: Math.random() < 0.5 ? 0x00d4ff : 0x00ffaa,
      });
    }
    this._particleGfx = this.add.graphics().setDepth(5);
  }

  _triggerGlitch() {
    if (!this._titleText || !this._titleText.active) return;

    const origX = this._titleText.x;
    const sequence = [
      { dx: -6, delay: 0 },
      { dx: 8, delay: 40 },
      { dx: -4, delay: 80 },
      { dx: 0, delay: 120 },
    ];
    sequence.forEach(({ dx, delay }) => {
      this.time.delayedCall(delay, () => {
        if (this._titleText && this._titleText.active) {
          this._titleText.setX(origX + dx);
        }
      });
    });

    // 다음 글리치 예약
    this.time.addEvent({
      delay: Phaser.Math.Between(3000, 6000),
      callback: this._triggerGlitch,
      callbackScope: this,
    });
  }

  update(time, delta) {
    const W = this.scale.width;
    const H = this.scale.height;
    this._frameCount++;

    /* 파티클 업데이트 */
    this._particleGfx.clear();
    this._particles.forEach(p => {
      p.y -= p.speed;
      if (p.y < 0) {
        p.y = H;
        p.x = Math.random() * W;
      }
      this._particleGfx.fillStyle(p.color, p.alpha);
      this._particleGfx.fillRect(p.x, p.y, p.size, p.size);
    });

    /* 스캔라인 */
    this._scanLine.clear();
    this._scanY += 1.5;
    if (this._scanY > H) this._scanY = 0;
    this._scanLine.fillStyle(0x00d4ff, 0.04);
    this._scanLine.fillRect(0, this._scanY, W, 3);
    this._scanLine.fillStyle(0x00d4ff, 0.02);
    this._scanLine.fillRect(0, this._scanY - 6, W, 6);
  }
}