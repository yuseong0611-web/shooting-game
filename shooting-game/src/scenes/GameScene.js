// GameScene.js — CYBER-HUD 리디자인
// 점수 HUD, 사망 팝업, 레벨/보스 배너, 게임 클리어 화면 전면 리디자인

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  /* ══════════════════════════════════════
     파티클 시스템 (기존 로직 유지)
  ══════════════════════════════════════ */
  createParticleSystem() {
    if (!this.textures.exists('px')) {
      var g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 2, 2);
      g.generateTexture('px', 2, 2);
      g.destroy();
    }
    this.hitEmitter = null;
    this.deathEmitter = null;
    this.explosionEmitter = null;
    try {
      this.fxParticles = this.add.particles('px');
      if (this.fxParticles && this.fxParticles.setDepth) this.fxParticles.setDepth(999);
      if (this.fxParticles && this.fxParticles.createEmitter) {
        this.hitEmitter = this.fxParticles.createEmitter({ speed: { min:90,max:220 }, angle:{min:0,max:360}, scale:{start:2.1,end:0}, lifespan:260, quantity:9, tint:0x3b82f6, blendMode:Phaser.BlendModes.ADD, on:false });
        this.deathEmitter = this.fxParticles.createEmitter({ speed:{min:120,max:280}, angle:{min:0,max:360}, scale:{start:2.8,end:0}, lifespan:360, quantity:14, tint:0xef4444, blendMode:Phaser.BlendModes.ADD, on:false });
        this.explosionEmitter = this.fxParticles.createEmitter({ speed:{min:60,max:200}, angle:{min:0,max:360}, scale:{start:2.4,end:0}, lifespan:320, quantity:16, tint:0xff8833, blendMode:Phaser.BlendModes.ADD, on:false });
      } else {
        this.hitEmitter = this.add.particles(0,0,'px',{ speed:{min:90,max:220}, angle:{min:0,max:360}, scale:{start:2.1,end:0}, lifespan:260, quantity:9, tint:0x3b82f6, blendMode:Phaser.BlendModes.ADD, emitting:false });
        this.deathEmitter = this.add.particles(0,0,'px',{ speed:{min:120,max:280}, angle:{min:0,max:360}, scale:{start:2.8,end:0}, lifespan:360, quantity:14, tint:0xef4444, blendMode:Phaser.BlendModes.ADD, emitting:false });
        this.explosionEmitter = this.add.particles(0,0,'px',{ speed:{min:60,max:200}, angle:{min:0,max:360}, scale:{start:2.4,end:0}, lifespan:320, quantity:16, tint:[0xffaa33,0xff6600], blendMode:Phaser.BlendModes.ADD, emitting:false });
        if (this.hitEmitter && this.hitEmitter.setDepth) this.hitEmitter.setDepth(999);
        if (this.deathEmitter && this.deathEmitter.setDepth) this.deathEmitter.setDepth(999);
        if (this.explosionEmitter && this.explosionEmitter.setDepth) this.explosionEmitter.setDepth(999);
      }
    } catch(err) {
      this.fxParticles = null; this.hitEmitter = null; this.deathEmitter = null; this.explosionEmitter = null;
    }
    this.lastHitFxTime = 0;
    this.hitFxCooldownMs = 35;
  }

  playHitEffect(x, y) {
    var now = this.time.now;
    if (now - this.lastHitFxTime < this.hitFxCooldownMs) return;
    this.lastHitFxTime = now;
    if (!this.hitEmitter) return;
    if (this.hitEmitter.explode) this.hitEmitter.explode(9, x, y);
    else if (this.hitEmitter.emitParticleAt) this.hitEmitter.emitParticleAt(x, y, 9);
  }

  playImpactFlash(x, y, color, radius, shakeIntensity) {
    var ring = this.add.circle(x, y, radius || 12, color || 0xffffff, 0.45).setDepth(998);
    ring.setStrokeStyle(2, 0xffffff, 0.9);
    this.tweens.add({ targets: ring, alpha:0, scale:1.8, duration:130, ease:'Cubic.Out', onComplete: function() { ring.destroy(); } });
    if (this.cameras && this.cameras.main) this.cameras.main.shake(55, shakeIntensity || 0.0015);
  }

  playDeathEffect(x, y) {
    if (!this.deathEmitter) return;
    if (this.deathEmitter.explode) this.deathEmitter.explode(14, x, y);
    else if (this.deathEmitter.emitParticleAt) this.deathEmitter.emitParticleAt(x, y, 14);
  }

  playRocketExplosion(x, y) {
    if (this.explosionEmitter) {
      if (this.explosionEmitter.explode) this.explosionEmitter.explode(16, x, y);
      else if (this.explosionEmitter.emitParticleAt) this.explosionEmitter.emitParticleAt(x, y, 16);
    }
    this.playImpactFlash(x, y, 0xff8800, 24, 0.0026);
    if (this.hitEmitter) {
      if (this.hitEmitter.explode) this.hitEmitter.explode(5, x, y);
      else if (this.hitEmitter.emitParticleAt) this.hitEmitter.emitParticleAt(x, y, 5);
    }
  }

  /* ══════════════════════════════════════
     에셋 로딩 (기존 유지)
  ══════════════════════════════════════ */
  preload() {
    if (typeof window !== 'undefined') {
      var selectedCharacter = (window.SELECTION && window.SELECTION.character) || 'normal';
      var playerMap = {
        normal: ['player_survivor1', 'player_survivor1_reload'],
        fast: ['player_man_blue', 'player_man_blue_reload'],
        tank: ['player_soldier1', 'player_soldier1_reload']
      };
      var chosenPlayer = playerMap[selectedCharacter] || playerMap.normal;
      window.GAME_TEXTURES = {
        player: chosenPlayer[0], playerReload: chosenPlayer[1],
        enemy: 'enemy_zombie1_hold', enemyReload: 'enemy_zombie1_reload',
        enemyFrames: ['enemy_zombie1_stand','enemy_zombie1_hold','enemy_zombie1_gun','enemy_zombie1_machine','enemy_zombie1_reload','enemy_zombie1_silencer'],
        robot: 'enemy_robot1_hold', robotReload: 'enemy_robot1_reload',
        robotFrames: ['enemy_robot1_stand','enemy_robot1_hold','enemy_robot1_gun','enemy_robot1_machine','enemy_robot1_reload','enemy_robot1_silencer']
      };
    }
    this.load.image('player_survivor1',         'kenney_top-down-shooter/PNG/Survivor 1/survivor1_gun.png');
    this.load.image('player_survivor1_reload',  'kenney_top-down-shooter/PNG/Survivor 1/survivor1_reload.png');
    this.load.image('player_man_blue',          'kenney_top-down-shooter/PNG/Man Blue/manBlue_gun.png');
    this.load.image('player_man_blue_reload',   'kenney_top-down-shooter/PNG/Man Blue/manBlue_reload.png');
    this.load.image('player_soldier1',          'kenney_top-down-shooter/PNG/Soldier 1/soldier1_gun.png');
    this.load.image('player_soldier1_reload',   'kenney_top-down-shooter/PNG/Soldier 1/soldier1_reload.png');
    this.load.image('enemy_zombie1_stand',      'kenney_top-down-shooter/PNG/Zombie 1/zoimbie1_stand.png');
    this.load.image('enemy_zombie1_hold',       'kenney_top-down-shooter/PNG/Zombie 1/zoimbie1_hold.png');
    this.load.image('enemy_zombie1_gun',        'kenney_top-down-shooter/PNG/Zombie 1/zoimbie1_gun.png');
    this.load.image('enemy_zombie1_machine',    'kenney_top-down-shooter/PNG/Zombie 1/zoimbie1_machine.png');
    this.load.image('enemy_zombie1_reload',     'kenney_top-down-shooter/PNG/Zombie 1/zoimbie1_reload.png');
    this.load.image('enemy_zombie1_silencer',   'kenney_top-down-shooter/PNG/Zombie 1/zoimbie1_silencer.png');
    this.load.image('enemy_robot1_stand',       'kenney_top-down-shooter/PNG/Robot 1/robot1_stand.png');
    this.load.image('enemy_robot1_hold',        'kenney_top-down-shooter/PNG/Robot 1/robot1_hold.png');
    this.load.image('enemy_robot1_gun',         'kenney_top-down-shooter/PNG/Robot 1/robot1_gun.png');
    this.load.image('enemy_robot1_machine',     'kenney_top-down-shooter/PNG/Robot 1/robot1_machine.png');
    this.load.image('enemy_robot1_reload',      'kenney_top-down-shooter/PNG/Robot 1/robot1_reload.png');
    this.load.image('enemy_robot1_silencer',    'kenney_top-down-shooter/PNG/Robot 1/robot1_silencer.png');
    this.load.image('game_bg', 'Background.png');
    this.load.image('bullet', 'assets/bullet.png');
  }

  /* ══════════════════════════════════════
     씬 생성
  ══════════════════════════════════════ */
  create(data) {
    this.gameOver = false;
    this.score = 0;
    this.runKills = 0;
    this.runCoins = 0;
    this.currentLevel = (data && data.level) ? data.level : 1;
    this.level2Score = 80;
    this.level3Score = 150;
    this.level3KillCount = 0;
    this.bossSpawned = false;
    this.bossAlive = false;
    this.levelBanner = null;
    this.bossBanner = null;
    this.bossBannerGroup = null;
    this.level4BossCount = 0;
    this.level4BossKills = 0;
    this.level4Cleared = false;
    this._pendingLevel4 = false;

    if (typeof syncSelectionFromSave === 'function') syncSelectionFromSave();
    var sel = (typeof window !== 'undefined' && window.SELECTION) || { character: 'normal', abilities: [] };

    // 배경
    this.bgImage = this.add.image(400, 300, 'game_bg');
    this.bgImage.setDisplaySize(800, 600);
    this.bgImage.setDepth(-1000);

    // 반투명 그리드 오버레이
    this._drawGridOverlay();

    this.createParticleSystem();
    this.player = new Player(this, 400, 300, sel);

    this.keys = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this.bullets = [];
    this.bulletSpeed = 400;
    if (sel.abilities && sel.abilities.indexOf('speedBullet') >= 0) this.bulletSpeed = 520;
    if (sel.abilities && sel.abilities.indexOf('rapidBullet') >= 0) this.bulletSpeed = 480;

    this.enemyBullets = [];
    this.enemies = [];
    this.lastSpawnTime = 0;
    this.setupLevel(this.currentLevel);
    this.spawnInitialEnemies(this.currentLevel === 1 ? 3 : 4, this.currentLevel === 1 ? 4 : 5);

    // HUD 초기화
    this._buildHUD();
    this.showLevelBanner(this.currentLevel);

    var self = this;
    this.input.on('pointerdown', function(pointer) {
      if (self.gameOver) return;
      if (!self.player.canShoot(self.time.now)) return;
      var px = self.player.rect.x, py = self.player.rect.y;
      var mx = pointer.worldX, my = pointer.worldY;
      var dx = mx - px, dy = my - py;
      var len = Math.sqrt(dx*dx + dy*dy) || 1;
      dx /= len; dy /= len;
      var shots = [{ dx, dy }];
      if (sel.abilities && sel.abilities.indexOf('doubleShot') >= 0) {
        var a = Math.atan2(dy, dx) + 0.2;
        shots.push({ dx: Math.cos(a), dy: Math.sin(a) });
      }
      for (var s = 0; s < shots.length; s++) {
        var sx = px + shots[s].dx * 22;
        var sy = py + shots[s].dy * 22;
        var effect = null;
        var bulletColor = 0xffff00;
        if (sel.abilities && sel.abilities.indexOf('iceBullet') >= 0) {
          effect = 'ice';
          bulletColor = 0x7dd3fc;
        }
        if (sel.abilities && sel.abilities.indexOf('poisonBullet') >= 0) {
          effect = effect ? 'icePoison' : 'poison';
          bulletColor = effect === 'icePoison' ? 0xb8ffda : 0x8cff66;
        }
        self.bullets.push(new Bullet(self, sx, sy, shots[s].dx, shots[s].dy, self.bulletSpeed, bulletColor, 1, { effect: effect }));
      }
      self.player.registerShot(self.time.now);
    });
  }

  /* ══════════════════════════════════════
     HUD 빌더
  ══════════════════════════════════════ */
  _drawGridOverlay() {
    const gfx = this.add.graphics().setDepth(-500).setScrollFactor(0);
    gfx.lineStyle(1, 0x001a3a, 0.25);
    for (let y = 0; y < 600; y += 40) gfx.lineBetween(0, y, 800, y);
    for (let x = 0; x < 800; x += 40) gfx.lineBetween(x, 0, x, 600);
  }

  _buildHUD() {
    const W = 800;

    /* 상단 HUD 바 */
    const hudGfx = this.add.graphics().setDepth(400).setScrollFactor(0);
    hudGfx.fillStyle(0x000a1a, 0.88);
    hudGfx.fillRect(0, 0, W, 46);
    hudGfx.lineStyle(1, 0x00d4ff, 0.25);
    hudGfx.lineBetween(0, 46, W, 46);
    hudGfx.lineStyle(1, 0x00d4ff, 0.08);
    hudGfx.lineBetween(0, 47, W, 47);

    // HP 라벨
    this.add.text(20, 16, 'HP', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '9px', color: '#335566', letterSpacing: 4,
    }).setDepth(500).setScrollFactor(0);

    /* 우측 점수 HUD */
    this._scoreGfx = this.add.graphics().setDepth(400).setScrollFactor(0);
    this._scoreLabelTxt = this.add.text(W - 160, 10, 'SCORE', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '9px', color: '#335566', letterSpacing: 4,
    }).setDepth(500).setScrollFactor(0);
    this._scoreValueTxt = this.add.text(W - 160, 22, '000000', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '16px', color: '#00d4ff', letterSpacing: 2,
    }).setDepth(500).setScrollFactor(0);

    this._coinValueTxt = this.add.text(W - 300, 22, '+0 COIN', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '12px', color: '#ffd700', letterSpacing: 2,
    }).setDepth(500).setScrollFactor(0);

    /* 레벨 표시 (중앙) */
    this._levelLabelTxt = this.add.text(W / 2, 10, 'LEVEL', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '9px', color: '#335566', letterSpacing: 4,
    }).setOrigin(0.5, 0).setDepth(500).setScrollFactor(0);
    this._levelValueTxt = this.add.text(W / 2, 22, '01', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '14px', color: '#7fbbcc', letterSpacing: 2,
    }).setOrigin(0.5, 0).setDepth(500).setScrollFactor(0);

    // HUD 코너 마커
    const cGfx = this.add.graphics().setDepth(400).setScrollFactor(0);
    cGfx.lineStyle(2, 0x00d4ff, 0.5);
    const len = 14, pad = 8;
    // 좌상
    cGfx.lineBetween(pad, pad, pad + len, pad);
    cGfx.lineBetween(pad, pad, pad, pad + len);
    // 우상
    cGfx.lineBetween(W - pad, pad, W - pad - len, pad);
    cGfx.lineBetween(W - pad, pad, W - pad, pad + len);

    this._updateScoreHUD();
  }

  _updateScoreHUD() {
    // 점수를 6자리 0패딩
    const s = String(this.score).padStart(6, '0');
    if (this._scoreValueTxt) this._scoreValueTxt.setText(s);
    // 레벨
    if (this._levelValueTxt) {
      const lvColors = { 1: '#7fbbcc', 2: '#ffaa00', 3: '#ff4444', 4: '#ff2244' };
      this._levelValueTxt.setText(String(this.currentLevel).padStart(2, '0'));
      this._levelValueTxt.setStyle({ color: lvColors[this.currentLevel] || '#ffffff' });
    }
    if (this._coinValueTxt) this._coinValueTxt.setText('+' + this.runCoins + ' COIN');
  }

  _awardKill(wasBoss, x, y) {
    var killUnits = wasBoss ? 5 : 1;
    this.runKills += killUnits;
    var gained = typeof addCoinsForKills === 'function' ? addCoinsForKills(killUnits) : killUnits * 3;
    this.runCoins += gained;
    this._updateScoreHUD();
    var txt = this.add.text(x || 400, y || 300, '+' + gained + ' COIN', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '11px',
      color: '#ffd700',
      letterSpacing: 2
    }).setDepth(550);
    this.tweens.add({ targets: txt, alpha: 0, y: (y || 300) - 24, duration: 700, onComplete: function() { txt.destroy(); } });
    return txt;
  }

  /* ══════════════════════════════════════
     사망 팝업 — CYBER HUD 스타일
  ══════════════════════════════════════ */
  showDeathPopup() {
    this.gameOver = true;
    const W = 800, H = 600;
    const cx = W / 2, cy = H / 2;
    const pw = 400, ph = 240;

    // 반투명 오버레이
    const overlay = this.add.rectangle(cx, cy, W, H, 0x000000, 0.7).setDepth(600).setScrollFactor(0);

    // 팝업 프레임
    const frameGfx = this.add.graphics().setDepth(601).setScrollFactor(0);
    frameGfx.fillStyle(0x000a1a, 0.97);
    frameGfx.fillRect(cx - pw/2, cy - ph/2, pw, ph);
    frameGfx.lineStyle(2, 0xff2244, 0.9);
    frameGfx.strokeRect(cx - pw/2, cy - ph/2, pw, ph);
    frameGfx.lineStyle(1, 0xff2244, 0.2);
    frameGfx.strokeRect(cx - pw/2 - 4, cy - ph/2 - 4, pw + 8, ph + 8);
    // 상단 강조선
    frameGfx.lineStyle(3, 0xff2244, 1);
    frameGfx.lineBetween(cx - pw/2, cy - ph/2, cx + pw/2, cy - ph/2);
    // 코너 마커
    const len = 12;
    frameGfx.lineStyle(1, 0xff2244, 0.7);
    [[cx - pw/2 + 8, cy - ph/2 + 8], [cx + pw/2 - 8, cy - ph/2 + 8],
     [cx - pw/2 + 8, cy + ph/2 - 8], [cx + pw/2 - 8, cy + ph/2 - 8]].forEach(([x, y], i) => {
      const sx = i % 2 === 0 ? 1 : -1;
      const sy = i < 2 ? 1 : -1;
      frameGfx.lineBetween(x, y, x + len * sx, y);
      frameGfx.lineBetween(x, y, x, y + len * sy);
    });

    // 태그
    this.add.text(cx, cy - ph/2 + 12, '[ MISSION FAILED ]', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '10px', color: '#ff2244', letterSpacing: 4,
    }).setOrigin(0.5, 0).setDepth(602).setScrollFactor(0);

    // 타이틀
    this.add.text(cx, cy - 60, 'UNIT DOWN', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '32px', color: '#ff2244', letterSpacing: 6,
      stroke: '#330000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(602).setScrollFactor(0);

    // 점수
    this.add.text(cx, cy - 18, 'FINAL SCORE  ' + String(this.score).padStart(6, '0'), {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '14px', color: '#ffaa00', letterSpacing: 3,
    }).setOrigin(0.5).setDepth(602).setScrollFactor(0);

    this.add.text(cx, cy + 2, 'KILLS ' + this.runKills + '   COINS +' + this.runCoins, {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '12px', color: '#ffd700', letterSpacing: 2,
    }).setOrigin(0.5).setDepth(602).setScrollFactor(0);

    // 메시지
    var msgText = this.currentLevel >= 2
      ? 'LEVEL ' + this.currentLevel + ' — RETURNING TO BASE FROM LEVEL 1'
      : 'RETRY MISSION?';
    this.add.text(cx, cy + 24, msgText, {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '11px', color: '#556677', letterSpacing: 2,
    }).setOrigin(0.5).setDepth(602).setScrollFactor(0);

    // 버튼들
    this._buildPopupButton(cx - 80, cy + 72, 140, 40, '▶ RETRY', 0x00d4ff, '#000000', () => {
      this.scene.restart({ level: 1 });
    }, 0x00ffff, 602);
    this._buildPopupButton(cx + 80, cy + 72, 130, 40, '⌂ TITLE', 0xff2244, '#ffffff', () => {
      this.scene.start('TitleScene');
    }, 0xff6677, 602);
  }

  _buildPopupButton(bx, by, bw, bh, label, fillColor, textColor, onClick, hoverColor, depth) {
    const gfx = this.add.graphics().setDepth(depth).setScrollFactor(0);
    const draw = (hover) => {
      gfx.clear();
      gfx.fillStyle(hover ? hoverColor : fillColor, hover ? 0.25 : 0.15);
      gfx.fillRect(bx - bw/2, by - bh/2, bw, bh);
      gfx.lineStyle(1, hover ? hoverColor : fillColor, hover ? 1 : 0.8);
      gfx.strokeRect(bx - bw/2, by - bh/2, bw, bh);
    };
    draw(false);
    const txt = this.add.text(bx, by, label, {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '12px', color: textColor === '#000000' ? '#' + fillColor.toString(16).padStart(6, '0') : textColor,
      letterSpacing: 3,
    }).setOrigin(0.5).setDepth(depth + 1).setScrollFactor(0);
    const hit = this.add.rectangle(bx, by, bw, bh).setDepth(depth + 2).setScrollFactor(0).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => { draw(true); });
    hit.on('pointerout', () => { draw(false); });
    hit.on('pointerdown', onClick);
  }

  /* ══════════════════════════════════════
     레벨 배너
  ══════════════════════════════════════ */
  showLevelBanner(level) {
    if (this.levelBanner && this.levelBanner.destroy) this.levelBanner.destroy();
    const colors = { 1: '#00d4ff', 2: '#ffaa00', 3: '#ff6644', 4: '#ff2244' };
    const labels = { 1: 'SECTOR 1 — CLEARED FOR ENTRY', 2: 'SECTOR 2 — HOSTILES ESCALATING', 3: 'SECTOR 3 — HIGH THREAT ZONE', 4: 'SECTOR 4 — COMMANDER ENGAGED' };
    const color = colors[level] || '#ffffff';
    const sublabel = labels[level] || '';

    const g = this.add.container(400, 90).setDepth(300).setScrollFactor(0);

    const bg = this.add.graphics();
    bg.fillStyle(0x000a1a, 0.85);
    bg.fillRect(-200, -22, 400, 44);
    bg.lineStyle(1, parseInt(color.replace('#', ''), 16), 0.7);
    bg.strokeRect(-200, -22, 400, 44);
    bg.lineStyle(3, parseInt(color.replace('#', ''), 16), 1);
    bg.lineBetween(-200, -22, 200, -22);

    const title = this.add.text(0, -8, 'LEVEL ' + level, {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '20px', color, letterSpacing: 8,
    }).setOrigin(0.5, 0);

    const sub = this.add.text(0, 14, sublabel, {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '9px', color: '#556677', letterSpacing: 3,
    }).setOrigin(0.5, 0);

    g.add([bg, title, sub]);
    g.setAlpha(0).setScale(0.85);
    this.tweens.add({ targets: g, alpha: 1, scaleX: 1, scaleY: 1, duration: 350, ease: 'Back.easeOut' });
    this.time.delayedCall(1400, () => {
      this.tweens.add({ targets: g, alpha: 0, y: 70, duration: 300, onComplete: () => { if (g.destroy) g.destroy(true); } });
    });

    this._updateScoreHUD();
    this.levelBanner = g;
    return g;
  }

  /* ══════════════════════════════════════
     보스 배너
  ══════════════════════════════════════ */
  clearBossBannerGroup() {
    if (this.bossBannerGroup && this.bossBannerGroup.destroy) this.bossBannerGroup.destroy(true);
    this.bossBannerGroup = null;
  }

  showBossAppearBanner() {
    this.clearBossBannerGroup();
    const cx = 400, cy = 140;

    const titles = {
      3: ['COMMANDER DETECTED', '>>> FIRST BOSS ENGAGED <<<'],
      '4a': ['ENEMY COMMANDER II', '>>> SECOND COMMANDER APPROACHING <<<'],
      '4b': ['FINAL BOSS', '>>> ULTIMATE THREAT INCOMING <<<'],
    };
    let key = String(this.currentLevel);
    if (this.currentLevel === 4) key = this.level4BossCount >= 2 ? '4b' : '4a';
    const [mainTitle, subText] = titles[key] || ['BOSS DETECTED', '>>> HOSTILE COMMANDER <<<'];

    const g = this.add.container(cx, cy).setDepth(300).setScrollFactor(0);

    const bgW = 460, bgH = 80;
    const bgGfx = this.add.graphics();
    bgGfx.fillStyle(0x0a0000, 0.95);
    bgGfx.fillRect(-bgW/2, -bgH/2, bgW, bgH);
    bgGfx.lineStyle(2, 0xff2244, 0.9);
    bgGfx.strokeRect(-bgW/2, -bgH/2, bgW, bgH);
    bgGfx.lineStyle(3, 0xff2244, 1);
    bgGfx.lineBetween(-bgW/2, -bgH/2, bgW/2, -bgH/2);

    const warn = this.add.text(-bgW/2 + 12, -bgH/2 + 8, '⚠ ALERT', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '9px', color: '#ff2244', letterSpacing: 4,
    });
    const title = this.add.text(0, -6, mainTitle, {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '22px', color: '#ff4466', letterSpacing: 5,
    }).setOrigin(0.5);
    const sub = this.add.text(0, 22, subText, {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '10px', color: '#ffaa00', letterSpacing: 3,
    }).setOrigin(0.5);

    g.add([bgGfx, warn, title, sub]);
    g.setAlpha(0).setScale(0.7);

    this.tweens.add({ targets: g, alpha:1, scaleX:1, scaleY:1, duration:500, ease:'Back.easeOut' });
    this.tweens.add({ targets: g, x: { from: cx - 8, to: cx + 8 }, duration: 60, yoyo: true, repeat: 6 });

    this.time.delayedCall(2400, () => {
      this.tweens.add({ targets: g, alpha: 0, y: cy - 20, duration: 400, onComplete: () => { if (g.destroy) g.destroy(true); } });
    });

    this.bossBannerGroup = g;
    this.bossBanner = g;
  }

  showBossDefeatBanner() {
    this.clearBossBannerGroup();
    const cx = 400, cy = 140;
    const g = this.add.container(cx, cy).setDepth(300).setScrollFactor(0);

    const bgW = 400, bgH = 70;
    const bgGfx = this.add.graphics();
    bgGfx.fillStyle(0x001a0a, 0.95);
    bgGfx.fillRect(-bgW/2, -bgH/2, bgW, bgH);
    bgGfx.lineStyle(2, 0x00ff88, 0.9);
    bgGfx.strokeRect(-bgW/2, -bgH/2, bgW, bgH);
    bgGfx.lineStyle(3, 0x00ff88, 1);
    bgGfx.lineBetween(-bgW/2, -bgH/2, bgW/2, -bgH/2);

    const tag = this.add.text(-bgW/2 + 12, -bgH/2 + 8, '✓ NEUTRALIZED', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '9px', color: '#00ff88', letterSpacing: 4,
    });
    const title = this.add.text(0, -2, 'COMMANDER DOWN', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '20px', color: '#00ffaa', letterSpacing: 5,
    }).setOrigin(0.5);
    const sub = this.add.text(0, 20, '★ TARGET ELIMINATED ★', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '10px', color: '#ffcc00', letterSpacing: 3,
    }).setOrigin(0.5);

    g.add([bgGfx, tag, title, sub]);
    g.setAlpha(0).setScale(0.7);
    this.tweens.add({ targets: g, alpha:1, scaleX:1, scaleY:1, duration:450, ease:'Back.easeOut' });
    this.time.delayedCall(3000, () => {
      this.tweens.add({ targets: g, alpha:0, scaleX:1.1, scaleY:1.1, duration:400, onComplete: () => { if (g.destroy) g.destroy(true); } });
    });

    this.bossBannerGroup = g;
    this.bossBanner = g;
  }

  /* ══════════════════════════════════════
     게임 클리어 화면
  ══════════════════════════════════════ */
  showFinalClearBanner() {
    this.gameOver = true;
    const W = 800, H = 600;
    const cx = W/2, cy = H/2;

    const overlay = this.add.rectangle(cx, cy, W, H, 0x000000, 0.8).setDepth(600).setScrollFactor(0);

    // 클리어 패널
    const pw = 480, ph = 280;
    const frameGfx = this.add.graphics().setDepth(601).setScrollFactor(0);
    frameGfx.fillStyle(0x000d0a, 0.98);
    frameGfx.fillRect(cx - pw/2, cy - ph/2, pw, ph);
    frameGfx.lineStyle(2, 0x00ffaa, 0.9);
    frameGfx.strokeRect(cx - pw/2, cy - ph/2, pw, ph);
    frameGfx.lineStyle(1, 0x00ffaa, 0.2);
    frameGfx.strokeRect(cx - pw/2 - 5, cy - ph/2 - 5, pw + 10, ph + 10);
    frameGfx.lineStyle(3, 0x00ffaa, 1);
    frameGfx.lineBetween(cx - pw/2, cy - ph/2, cx + pw/2, cy - ph/2);

    this.add.text(cx, cy - ph/2 + 12, '[ MISSION COMPLETE ]', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '10px', color: '#00ffaa', letterSpacing: 4,
    }).setOrigin(0.5, 0).setDepth(602).setScrollFactor(0);

    const clearTitle = this.add.text(cx, cy - 70, 'OPERATION\nCOMPLETE', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '36px', color: '#ffd700', letterSpacing: 6,
      align: 'center', lineSpacing: -4,
      stroke: '#332200', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(602).setScrollFactor(0).setAlpha(0);

    this.add.text(cx, cy + 14, '전 구역 사령관 제거 완료', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '12px', color: '#88aacc', letterSpacing: 3,
    }).setOrigin(0.5).setDepth(602).setScrollFactor(0);

    this.add.text(cx, cy + 36, 'FINAL SCORE  ' + String(this.score).padStart(6, '0'), {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '18px', color: '#ffaa00', letterSpacing: 4,
    }).setOrigin(0.5).setDepth(602).setScrollFactor(0);

    this.tweens.add({ targets: clearTitle, alpha:1, duration: 700, delay: 300, ease:'Power2' });

    // 별 파티클 효과 (간단)
    for (let i = 0; i < 8; i++) {
      this.time.delayedCall(i * 200, () => {
        const star = this.add.text(
          cx + (Math.random() - 0.5) * 400,
          cy + (Math.random() - 0.5) * 200,
          '★', { fontSize: '14px', color: '#ffd700' }
        ).setDepth(603).setScrollFactor(0).setAlpha(0);
        this.tweens.add({ targets: star, alpha: 1, y: star.y - 30, duration: 600, ease:'Power2', yoyo: true, onComplete: () => star.destroy() });
      });
    }

    this.time.delayedCall(2200, () => {
      this._buildPopupButton(cx - 90, cy + 98, 150, 42, '▶ RETRY', 0x00d4ff, '#000000', () => {
        this.scene.restart({ level: 1 });
      }, 0x00ffff, 603);
      this._buildPopupButton(cx + 90, cy + 98, 150, 42, '⌂ TITLE', 0x00ffaa, '#000000', () => {
        this.scene.start('TitleScene');
      }, 0x00ffcc, 603);
    });
  }

  /* ══════════════════════════════════════
     레벨 설정 / 스폰 로직 (기존 유지)
  ══════════════════════════════════════ */
  setupLevel(level) {
    if (level === 1)      { this.spawnInterval = 5000; this.spawnIntervalMin = 1200; }
    else if (level === 2) { this.spawnInterval = 4200; this.spawnIntervalMin = 900; }
    else if (level === 3) { this.spawnInterval = 4200; this.spawnIntervalMin = 900; }
    else                  { this.spawnInterval = 3500; this.spawnIntervalMin = 800; }
    this.maxEnemies = 3 + level;
  }

  pickSpawnEnemyOptions() {
    if (this.currentLevel >= 2 && Math.random() < 0.34) return { enemyType: 'robot' };
    return { enemyType: 'zombie' };
  }

  spawnInitialEnemies(minCount, maxCount) {
    var c = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));
    for (var i = 0; i < c; i++) {
      if (this.enemies.length >= this.maxEnemies) break;
      this.enemies.push(new Enemy(this, 80 + Math.random()*640, 80 + Math.random()*440, this.player, this.enemyBullets, this.pickSpawnEnemyOptions()));
    }
  }

  clearCombatObjects() {
    this.bullets.forEach(b => b.destroy()); this.bullets = [];
    this.enemyBullets.forEach(b => b.destroy()); this.enemyBullets = [];
    this.enemies.forEach(e => e.destroy()); this.enemies = [];
  }

  levelUpTo2() {
    this.currentLevel = 2; this.setupLevel(2);
    this.lastSpawnTime = this.time.now;
    this.clearCombatObjects();
    this.spawnInitialEnemies(4, 5);
    this.showLevelBanner(2);
  }

  levelUpTo3() {
    this.currentLevel = 3; this.setupLevel(3);
    this.lastSpawnTime = this.time.now;
    this.clearCombatObjects();
    this.spawnInitialEnemies(4, 5);
    this.level3KillCount = 0; this.bossSpawned = false; this.bossAlive = false;
    this.showLevelBanner(3);
  }

  levelUpTo4() {
    this.currentLevel = 4; this.setupLevel(4);
    this.lastSpawnTime = this.time.now;
    this.clearCombatObjects();
    this.spawnInitialEnemies(4, 5);
    this.level4BossCount = 0; this.level4BossKills = 0;
    this.level4Cleared = false; this.bossSpawned = false; this.bossAlive = false;
    this.showLevelBanner(4);
  }

  spawnBoss() {
    if (this.enemies.length >= this.maxEnemies) {
      for (var i = this.enemies.length - 1; i >= 0; i--) {
        var e = this.enemies[i];
        if (!e || !e.isBoss) { if (e && e.destroy) e.destroy(); this.enemies.splice(i, 1); break; }
      }
      if (this.enemies.length >= this.maxEnemies) return false;
    }
    var boss = new Enemy(this, 80 + Math.random()*640, 80 + Math.random()*440, this.player, this.enemyBullets, { isBoss: true });
    this.enemies.push(boss);
    this.bossSpawned = true; this.bossAlive = true;
    if (this.currentLevel === 4) this.level4BossCount += 1;
    this.showBossAppearBanner();
    return true;
  }

  /* ══════════════════════════════════════
     업데이트 루프 (기존 로직 유지 + 점수 HUD 갱신)
  ══════════════════════════════════════ */
  handleEnemyDefeated(enemy, index) {
    if (!enemy) return;
    var wasBoss = !!enemy.isBoss;
    var deathX = enemy.x;
    var deathY = enemy.y;
    if (index >= 0) this.enemies.splice(index, 1);
    if (wasBoss) this.bossAlive = false;
    this.playDeathEffect(deathX, deathY);
    if (wasBoss) this.showBossDefeatBanner();
    this.score += wasBoss ? 50 : 10;
    this._awardKill(wasBoss, deathX, deathY);

    if (this.currentLevel === 3 && !wasBoss) {
      this.level3KillCount += 1;
      if (!this.bossSpawned && this.level3KillCount >= 3) this.spawnBoss();
    }
    if (this.currentLevel === 4 && wasBoss) {
      this.level4BossKills += 1;
      if (this.level4BossCount < 2) {
        this.time.delayedCall(1500, function() { if (!this.gameOver) this.spawnBoss(); }, null, this);
      }
      if (this.level4BossKills >= 2 && !this.level4Cleared) {
        this.level4Cleared = true;
        this.time.delayedCall(800, function() { this.showFinalClearBanner(); }, null, this);
      }
    }
    if (this.currentLevel === 4 && !wasBoss && !this.bossSpawned) this.level3KillCount += 1;
  }

  update() {
    if (this.gameOver) return;
    var time = this.time.now;
    this.player.update(this.keys, time);

    if (this.currentLevel === 1 && this.score >= this.level2Score) this.levelUpTo2();
    if (this.currentLevel === 2 && this.score >= this.level3Score) this.levelUpTo3();

    if (this.currentLevel === 3 && this.bossSpawned && !this.bossAlive && !this._pendingLevel4) {
      this._pendingLevel4 = true;
      this.time.delayedCall(2800, function() { this._pendingLevel4 = false; this.levelUpTo4(); }, null, this);
    }

    if (!this.maxEnemies) this.maxEnemies = 4;
    if (this.enemies.length > this.maxEnemies) {
      for (var trim = this.enemies.length - 1; trim >= 0 && this.enemies.length > this.maxEnemies; trim--) {
        var te = this.enemies[trim];
        if (te && te.isBoss) continue;
        if (te && te.destroy) te.destroy();
        this.enemies.splice(trim, 1);
      }
      for (var trim2 = this.enemies.length - 1; trim2 >= 0 && this.enemies.length > this.maxEnemies; trim2--) {
        var te2 = this.enemies[trim2];
        if (te2 && te2.destroy) te2.destroy();
        this.enemies.splice(trim2, 1);
      }
    }

    var waitingBoss = (this.currentLevel === 3 && !this.bossSpawned && this.level3KillCount >= 3);
    if (waitingBoss) this.spawnBoss();

    var waiting4Boss = (this.currentLevel === 4 && !this.bossSpawned && this.level3KillCount >= 3);
    if (waiting4Boss) this.spawnBoss();

    var skipSpawn = waitingBoss || waiting4Boss;
    if (!skipSpawn && time - this.lastSpawnTime >= this.spawnInterval) {
      this.lastSpawnTime = time;
      this.spawnInterval = Math.max(this.spawnIntervalMin, this.spawnInterval - 150);
      var count = 2 + Math.floor(Math.random() * 2);
      for (var si = 0; si < count; si++) {
        if (this.enemies.length >= this.maxEnemies) break;
        var side = Math.floor(Math.random() * 4);
        var spawnX, spawnY;
        if (side === 0) { spawnX = Math.random()*800; spawnY = -15; }
        else if (side === 1) { spawnX = 815; spawnY = Math.random()*600; }
        else if (side === 2) { spawnX = Math.random()*800; spawnY = 615; }
        else { spawnX = -15; spawnY = Math.random()*600; }
        this.enemies.push(new Enemy(this, spawnX, spawnY, this.player, this.enemyBullets, this.pickSpawnEnemyOptions()));
      }
    }

    for (var i = this.enemies.length - 1; i >= 0; i--) {
      this.enemies[i].update(time);
      if (this.enemies[i] && this.enemies[i].dead) this.handleEnemyDefeated(this.enemies[i], i);
    }

    for (var i = this.bullets.length - 1; i >= 0; i--) {
      var b = this.bullets[i];
      var x = b.x, y = b.y;
      if (x < -20 || x > 820 || y < -20 || y > 620) { b.destroy(); this.bullets.splice(i, 1); continue; }
      for (var j = this.enemies.length - 1; j >= 0; j--) {
        var e = this.enemies[j];
        if (Phaser.Math.Distance.Between(x, y, e.x, e.y) < 22) {
          this.playHitEffect(e.x, e.y);
          this.playImpactFlash(e.x, e.y, 0xffe08a, 11, 0.0012);
          b.destroy(); this.bullets.splice(i, 1);
          if (b.effect === 'ice' || b.effect === 'icePoison') e.applySlow(3000, 0.45);
          if (b.effect === 'poison' || b.effect === 'icePoison') e.applyPoison();
          if (e.takeDamage(1)) {
            this.handleEnemyDefeated(e, j);
          }
          break;
        }
      }
    }

    for (var i = this.enemyBullets.length - 1; i >= 0; i--) {
      var eb = this.enemyBullets[i];
      if (eb.x < -20 || eb.x > 820 || eb.y < -20 || eb.y > 620) { eb.destroy(); this.enemyBullets.splice(i, 1); }
    }

    for (var i = this.enemyBullets.length - 1; i >= 0; i--) {
      var eb = this.enemyBullets[i];
      if (Phaser.Math.Distance.Between(this.player.rect.x, this.player.rect.y, eb.x, eb.y) < 24) {
        if (eb.explosive) this.playRocketExplosion(eb.x, eb.y);
        else { this.playHitEffect(this.player.rect.x, this.player.rect.y); this.playImpactFlash(this.player.rect.x, this.player.rect.y, 0x60a5fa, 13, 0.0022); }
        var dmg = eb.damage || 1;
        eb.destroy(); this.enemyBullets.splice(i, 1);
        if (this.player.takeDamage(dmg)) { this.player.destroy(); this.showDeathPopup(); return; }
      }
    }
  }
}
