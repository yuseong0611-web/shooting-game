// CharacterSelectScene.js — TACTICAL LOADOUT 리디자인
// 전술 카드 UI, 능력 토글, 애니메이션 포함

if (typeof window !== 'undefined') window.SELECTION = { character: 'normal', abilities: [] };

var CHAR_OPTIONS = [
  {
    key: 'normal',
    label: 'RANGER',
    subLabel: '일반형',
    desc: '속도·체력 균형',
    stats: { spd: 3, hp: 3, atk: 3 },
    icon: '⬡',
    accent: 0x00d4ff,
    accentHex: '#00d4ff',
    tag: 'BALANCED',
  },
  {
    key: 'fast',
    label: 'SCOUT',
    subLabel: '고속형',
    desc: '이동 빠름, 회피 특화',
    stats: { spd: 5, hp: 2, atk: 3 },
    icon: '▶▶',
    accent: 0x00ffaa,
    accentHex: '#00ffaa',
    tag: 'SWIFT',
  },
  {
    key: 'tank',
    label: 'VANGUARD',
    subLabel: '중장갑형',
    desc: '최대 체력, 강인한 방어',
    stats: { spd: 2, hp: 5, atk: 4 },
    icon: '◆',
    accent: 0xff6644,
    accentHex: '#ff6644',
    tag: 'HEAVY',
  },
];

var ABILITY_OPTIONS = [
  {
    key: 'doubleShot',
    label: 'TWIN FIRE',
    subLabel: '더블샷',
    desc: '클릭 시 2발 동시 발사',
    icon: '◈◈',
    accent: 0xffd700,
    accentHex: '#ffd700',
    category: 'OFFENSE',
  },
  {
    key: 'speedBullet',
    label: 'HYPERBOLT',
    subLabel: '속사',
    desc: '탄속 +60% 관통력 증가',
    icon: '▸▸▸',
    accent: 0xff44aa,
    accentHex: '#ff44aa',
    category: 'OFFENSE',
  },
];

class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelectScene' });
    this._charBoxes = [];
    this._abilityToggles = [];
    this._particles = [];
    this._scanY = 0;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const sel = window.SELECTION || { character: 'normal', abilities: [] };
    sel.abilities = sel.abilities || [];

    /* ── 배경 ─────────────────────────────── */
    const bgGfx = this.add.graphics();
    bgGfx.fillGradientStyle(0x000a1a, 0x000a1a, 0x000d22, 0x000d22, 1);
    bgGfx.fillRect(0, 0, W, H);
    this._drawGrid(W, H);
    this._drawHUDCorners(W, H);

    /* ── 상단 헤더 ─────────────────────────────── */
    this._drawHeader(W);

    /* ── 섹션 1: 캐릭터 선택 ─────────────────────────────── */
    this.add.text(40, 70, 'UNIT SELECTION', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '11px', color: '#00ffaa', letterSpacing: 6,
    });
    this.add.text(40, 86, '운용 유닛을 선택하십시오', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '10px', color: '#334455',
    });

    /* ── 캐릭터 카드 ─────────────────────────────── */
    this._charBoxes = [];
    for (let i = 0; i < CHAR_OPTIONS.length; i++) {
      const c = CHAR_OPTIONS[i];
      const cx = 150 + i * 190;
      const cy = 200;
      const isSelected = sel.character === c.key;
      const cardObj = this._buildCharCard(cx, cy, c, isSelected);
      this._charBoxes.push({ ...cardObj, optKey: c.key });
    }

    // 클릭 이벤트 연결
    this._charBoxes.forEach((cb, idx) => {
      cb.hitZone.on('pointerdown', () => {
        window.SELECTION.character = cb.optKey;
        this._charBoxes.forEach((b, i) => {
          this._updateCharCard(b, CHAR_OPTIONS[i].key === cb.optKey, CHAR_OPTIONS[i]);
        });
      });
      cb.hitZone.on('pointerover', () => {
        if (window.SELECTION.character !== cb.optKey) {
          cb.bgGfx.clear();
          this._drawCardBg(cb.bgGfx, cb.cx, cb.cy, CHAR_OPTIONS[idx], false, true);
        }
      });
      cb.hitZone.on('pointerout', () => {
        if (window.SELECTION.character !== cb.optKey) {
          cb.bgGfx.clear();
          this._drawCardBg(cb.bgGfx, cb.cx, cb.cy, CHAR_OPTIONS[idx], false, false);
        }
      });
    });

    /* ── 구분선 ─────────────────────────────── */
    const divGfx = this.add.graphics();
    divGfx.lineStyle(1, 0x001a3a, 1);
    divGfx.lineBetween(40, 335, W - 40, 335);
    divGfx.lineStyle(1, 0x00d4ff, 0.15);
    divGfx.lineBetween(40, 337, W - 40, 337);

    /* ── 섹션 2: 능력 선택 ─────────────────────────────── */
    this.add.text(40, 350, 'TACTICAL LOADOUT', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '11px', color: '#00ffaa', letterSpacing: 6,
    });
    this.add.text(40, 366, '전술 능력을 장착하십시오 (복수 선택 가능)', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '10px', color: '#334455',
    });

    /* ── 능력 카드 ─────────────────────────────── */
    this._abilityToggles = [];
    for (let j = 0; j < ABILITY_OPTIONS.length; j++) {
      const a = ABILITY_OPTIONS[j];
      const ax = 200 + j * 260;
      const ay = 430;
      const isOn = sel.abilities.indexOf(a.key) >= 0;
      const togObj = this._buildAbilityCard(ax, ay, a, isOn);
      this._abilityToggles.push({ ...togObj, optKey: a.key });
    }

    this._abilityToggles.forEach((tb, idx) => {
      tb.hitZone.on('pointerdown', () => {
        const aidx = window.SELECTION.abilities.indexOf(tb.optKey);
        if (aidx >= 0) {
          window.SELECTION.abilities.splice(aidx, 1);
          this._updateAbilityCard(tb, ABILITY_OPTIONS[idx], false);
        } else {
          window.SELECTION.abilities.push(tb.optKey);
          this._updateAbilityCard(tb, ABILITY_OPTIONS[idx], true);
        }
      });
      tb.hitZone.on('pointerover', () => {
        const isOn = window.SELECTION.abilities.indexOf(tb.optKey) >= 0;
        if (!isOn) {
          tb.bgGfx.clear();
          this._drawAbilityBg(tb.bgGfx, tb.ax, tb.ay, ABILITY_OPTIONS[idx], false, true);
        }
      });
      tb.hitZone.on('pointerout', () => {
        const isOn = window.SELECTION.abilities.indexOf(tb.optKey) >= 0;
        if (!isOn) {
          tb.bgGfx.clear();
          this._drawAbilityBg(tb.bgGfx, tb.ax, tb.ay, ABILITY_OPTIONS[idx], false, false);
        }
      });
    });

    /* ── 시작 버튼 ─────────────────────────────── */
    this._buildDeployButton(W, H);

    /* ── 스캔라인 & 파티클 ─────────────────────────────── */
    this._scanLine = this.add.graphics().setDepth(100);
    this._initParticles(W, H);

    /* ── 카드 등장 애니메이션 ─────────────────────────────── */
    this._charBoxes.forEach((cb, i) => {
      const targets = [cb.bgGfx, cb.iconTxt, cb.labelTxt, cb.subTxt, cb.descTxt, cb.statGfx, cb.tagTxt].filter(Boolean);
      targets.forEach(t => { if (t) { t.setAlpha(0); t.setY(t.y + 20); } });
      this.tweens.add({
        targets,
        alpha: 1,
        y: '-=20',
        duration: 500,
        delay: 300 + i * 120,
        ease: 'Power2',
      });
    });
  }

  /* ── 캐릭터 카드 빌더 ─────────────────────────────── */
  _buildCharCard(cx, cy, opt, isSelected) {
    const cw = 170, ch = 220;

    const bgGfx = this.add.graphics();
    this._drawCardBg(bgGfx, cx, cy, opt, isSelected, false);

    // 태그
    const tagTxt = this.add.text(cx, cy - ch / 2 + 18, `[ ${opt.tag} ]`, {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '9px', color: opt.accentHex, letterSpacing: 3,
    }).setOrigin(0.5);

    // 아이콘
    const iconTxt = this.add.text(cx, cy - 50, opt.icon, {
      fontFamily: '"Courier New", monospace',
      fontSize: '36px', color: opt.accentHex,
    }).setOrigin(0.5);

    // 라벨
    const labelTxt = this.add.text(cx, cy + 8, opt.label, {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '16px', color: '#ffffff', letterSpacing: 3,
    }).setOrigin(0.5);

    const subTxt = this.add.text(cx, cy + 30, opt.subLabel, {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '10px', color: '#556677',
    }).setOrigin(0.5);

    const descTxt = this.add.text(cx, cy + 52, opt.desc, {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '10px', color: '#7799aa',
      wordWrap: { width: 140 }, align: 'center',
    }).setOrigin(0.5);

    // 스탯 바
    const statGfx = this.add.graphics();
    this._drawStatBars(statGfx, cx, cy + 80, opt);

    const hitZone = this.add.rectangle(cx, cy, cw, ch)
      .setInteractive({ useHandCursor: true });

    return { bgGfx, iconTxt, labelTxt, subTxt, descTxt, statGfx, tagTxt, hitZone, cx, cy, cw, ch };
  }

  _drawCardBg(gfx, cx, cy, opt, isSelected, isHover) {
    const cw = 170, ch = 220;
    const x = cx - cw / 2, y = cy - ch / 2;

    if (isSelected) {
      gfx.fillStyle(opt.accent, 0.12);
      gfx.fillRect(x, y, cw, ch);
      gfx.lineStyle(2, opt.accent, 1);
      gfx.strokeRect(x, y, cw, ch);
      // 상단 강조선
      gfx.lineStyle(3, opt.accent, 1);
      gfx.lineBetween(x, y, x + cw, y);
      // 내부 코너
      gfx.lineStyle(1, opt.accent, 0.5);
      gfx.lineBetween(x + 8, y + 8, x + 20, y + 8);
      gfx.lineBetween(x + 8, y + 8, x + 8, y + 20);
      gfx.lineBetween(x + cw - 8, y + 8, x + cw - 20, y + 8);
      gfx.lineBetween(x + cw - 8, y + 8, x + cw - 8, y + 20);
    } else if (isHover) {
      gfx.fillStyle(opt.accent, 0.07);
      gfx.fillRect(x, y, cw, ch);
      gfx.lineStyle(1, opt.accent, 0.6);
      gfx.strokeRect(x, y, cw, ch);
    } else {
      gfx.fillStyle(0x001122, 0.9);
      gfx.fillRect(x, y, cw, ch);
      gfx.lineStyle(1, 0x223344, 0.8);
      gfx.strokeRect(x, y, cw, ch);
      gfx.lineStyle(1, 0x001a3a, 1);
      gfx.lineBetween(x, y, x + cw, y);
    }
  }

  _drawStatBars(gfx, cx, cy, opt) {
    gfx.clear();
    const labels = [['SPD', opt.stats.spd], ['HP', opt.stats.hp], ['ATK', opt.stats.atk]];
    labels.forEach(([lbl, val], i) => {
      const y = cy + i * 16;
      // 라벨은 텍스트로 대신 직접 안 그리고 gfx로 처리 불가 → 별도 text 사용 불가하므로 바만 그림
      gfx.fillStyle(0x001a3a, 1);
      gfx.fillRect(cx - 55, y, 110, 6);
      gfx.fillStyle(opt.accent, 0.9);
      gfx.fillRect(cx - 55, y, (110 * val) / 5, 6);
      gfx.lineStyle(1, opt.accent, 0.3);
      gfx.strokeRect(cx - 55, y, 110, 6);
    });
  }

  _updateCharCard(cb, isSelected, opt) {
    cb.bgGfx.clear();
    this._drawCardBg(cb.bgGfx, cb.cx, cb.cy, opt, isSelected, false);
    if (isSelected) {
      this.tweens.add({ targets: cb.bgGfx, scaleX: 1.03, scaleY: 1.03, duration: 80, yoyo: true });
    }
  }

  /* ── 능력 카드 빌더 ─────────────────────────────── */
  _buildAbilityCard(ax, ay, opt, isOn) {
    const aw = 220, ah = 90;
    const bgGfx = this.add.graphics();
    this._drawAbilityBg(bgGfx, ax, ay, opt, isOn, false);

    const catTxt = this.add.text(ax - aw / 2 + 12, ay - ah / 2 + 10, opt.category, {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '8px', color: opt.accentHex, letterSpacing: 3,
    });

    const iconTxt = this.add.text(ax - aw / 2 + 28, ay, opt.icon, {
      fontFamily: '"Courier New", monospace', fontSize: '20px', color: opt.accentHex,
    }).setOrigin(0.5);

    const labelTxt = this.add.text(ax - aw / 2 + 65, ay - 12, opt.label, {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '12px', color: '#ffffff', letterSpacing: 2,
    });

    const subTxt = this.add.text(ax - aw / 2 + 65, ay + 6, opt.subLabel, {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '9px', color: '#556677',
    });

    const descTxt = this.add.text(ax - aw / 2 + 65, ay + 20, opt.desc, {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '9px', color: '#7799aa', wordWrap: { width: 140 },
    });

    // 선택 표시 체크박스
    const checkGfx = this.add.graphics();
    this._drawCheck(checkGfx, ax + aw / 2 - 18, ay - ah / 2 + 18, isOn, opt.accent);

    const hitZone = this.add.rectangle(ax, ay, aw, ah).setInteractive({ useHandCursor: true });

    return { bgGfx, iconTxt, labelTxt, subTxt, descTxt, catTxt, checkGfx, hitZone, ax, ay, aw, ah };
  }

  _drawAbilityBg(gfx, ax, ay, opt, isOn, isHover) {
    const aw = 220, ah = 90;
    const x = ax - aw / 2, y = ay - ah / 2;
    if (isOn) {
      gfx.fillStyle(opt.accent, 0.15);
      gfx.fillRect(x, y, aw, ah);
      gfx.lineStyle(2, opt.accent, 1);
      gfx.strokeRect(x, y, aw, ah);
      gfx.lineStyle(3, opt.accent, 1);
      gfx.lineBetween(x, y, x + aw, y);
    } else if (isHover) {
      gfx.fillStyle(opt.accent, 0.06);
      gfx.fillRect(x, y, aw, ah);
      gfx.lineStyle(1, opt.accent, 0.5);
      gfx.strokeRect(x, y, aw, ah);
    } else {
      gfx.fillStyle(0x001122, 0.9);
      gfx.fillRect(x, y, aw, ah);
      gfx.lineStyle(1, 0x223344, 0.7);
      gfx.strokeRect(x, y, aw, ah);
    }
  }

  _drawCheck(gfx, x, y, isOn, accentColor) {
    gfx.clear();
    if (isOn) {
      gfx.fillStyle(accentColor, 1);
      gfx.fillRect(x - 6, y - 6, 12, 12);
      gfx.fillStyle(0x000000, 1);
      gfx.fillRect(x - 3, y - 3, 6, 6);
    } else {
      gfx.lineStyle(1, 0x334455, 1);
      gfx.strokeRect(x - 6, y - 6, 12, 12);
    }
  }

  _updateAbilityCard(tb, opt, isOn) {
    tb.bgGfx.clear();
    this._drawAbilityBg(tb.bgGfx, tb.ax, tb.ay, opt, isOn, false);
    tb.checkGfx && this._drawCheck(tb.checkGfx, tb.ax + tb.aw / 2 - 18, tb.ay - tb.ah / 2 + 18, isOn, opt.accent);
  }

  /* ── DEPLOY 버튼 ─────────────────────────────── */
  _buildDeployButton(W, H) {
    const bx = W / 2, by = 545, bw = 260, bh = 48;

    const frame = this.add.graphics();
    frame.lineStyle(1, 0x00d4ff, 0.3);
    frame.strokeRect(bx - bw / 2 - 6, by - bh / 2 - 6, bw + 12, bh + 12);

    const btnBg = this.add.graphics();
    const draw = (hover) => {
      btnBg.clear();
      if (hover) {
        btnBg.fillStyle(0x00d4ff, 0.2);
        btnBg.fillRect(bx - bw / 2, by - bh / 2, bw, bh);
        btnBg.lineStyle(2, 0x00ffff, 1);
        btnBg.strokeRect(bx - bw / 2, by - bh / 2, bw, bh);
      } else {
        btnBg.fillStyle(0x001a3a, 0.95);
        btnBg.fillRect(bx - bw / 2, by - bh / 2, bw, bh);
        btnBg.lineStyle(2, 0x00d4ff, 0.7);
        btnBg.strokeRect(bx - bw / 2, by - bh / 2, bw, bh);
      }
    };
    draw(false);

    const btnTxt = this.add.text(bx, by - 2, '▶  MISSION START', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '15px', color: '#00d4ff', letterSpacing: 5,
    }).setOrigin(0.5);

    const hitZone = this.add.rectangle(bx, by, bw, bh).setInteractive({ useHandCursor: true });
    hitZone.on('pointerover', () => { draw(true); btnTxt.setColor('#ffffff'); });
    hitZone.on('pointerout', () => { draw(false); btnTxt.setColor('#00d4ff'); });
    hitZone.on('pointerdown', () => {
      const flash = this.add.graphics();
      flash.fillStyle(0x00d4ff, 0.35);
      flash.fillRect(0, 0, W, H);
      this.tweens.add({ targets: flash, alpha: 0, duration: 300, onComplete: () => flash.destroy() });
      this.time.delayedCall(200, () => this.scene.start('GameScene'));
    });

    // 펄스
    this.tweens.add({ targets: frame, alpha: { from: 0.5, to: 1 }, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /* ── 공통 배경 요소 ─────────────────────────────── */
  _drawGrid(W, H) {
    const gfx = this.add.graphics();
    gfx.lineStyle(1, 0x001122, 0.9);
    for (let y = 0; y < H; y += 40) gfx.lineBetween(0, y, W, y);
    for (let x = 0; x < W; x += 40) gfx.lineBetween(x, 0, x, H);
  }

  _drawHUDCorners(W, H) {
    const gfx = this.add.graphics();
    const len = 24, pad = 16;
    gfx.lineStyle(2, 0x00d4ff, 0.7);
    [[pad, pad], [W - pad, pad], [pad, H - pad], [W - pad, H - pad]].forEach(([x, y], i) => {
      const sx = i % 2 === 0 ? 1 : -1;
      const sy = i < 2 ? 1 : -1;
      gfx.lineBetween(x, y, x + len * sx, y);
      gfx.lineBetween(x, y, x, y + len * sy);
      gfx.fillStyle(0x00d4ff, 1);
      gfx.fillRect(x - 2, y - 2, 4, 4);
    });
  }

  _drawHeader(W) {
    const gfx = this.add.graphics();
    gfx.fillStyle(0x00d4ff, 0.05);
    gfx.fillRect(0, 0, W, 48);
    gfx.lineStyle(1, 0x00d4ff, 0.25);
    gfx.lineBetween(0, 48, W, 48);

    this.add.text(W / 2, 14, 'TACTICAL LOADOUT CONFIGURATION', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '13px', color: '#00d4ff', letterSpacing: 5,
    }).setOrigin(0.5, 0);

    const dot = this.add.text(W - 30, 14, '●', { fontSize: '10px', color: '#ff3344' });
    this.tweens.add({ targets: dot, alpha: 0, duration: 600, yoyo: true, repeat: -1 });
  }

  _initParticles(W, H) {
    this._particles = [];
    for (let i = 0; i < 25; i++) {
      this._particles.push({
        x: Math.random() * W, y: Math.random() * H,
        speed: 0.2 + Math.random() * 0.5,
        alpha: 0.08 + Math.random() * 0.2,
        size: 1,
        color: Math.random() < 0.5 ? 0x00d4ff : 0x00ffaa,
      });
    }
    this._particleGfx = this.add.graphics().setDepth(5);
  }

  update() {
    const W = this.scale.width, H = this.scale.height;

    this._particleGfx.clear();
    this._particles.forEach(p => {
      p.y -= p.speed;
      if (p.y < 0) { p.y = H; p.x = Math.random() * W; }
      this._particleGfx.fillStyle(p.color, p.alpha);
      this._particleGfx.fillRect(p.x, p.y, p.size, p.size);
    });

    this._scanLine.clear();
    this._scanY += 1.2;
    if (this._scanY > H) this._scanY = 0;
    this._scanLine.fillStyle(0x00d4ff, 0.03);
    this._scanLine.fillRect(0, this._scanY, W, 3);
  }
}