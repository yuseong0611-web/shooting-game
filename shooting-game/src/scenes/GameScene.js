// GameScene.js: 메인 게임 화면. 플레이어 HP, 적, 총알, 사망 팝업 (전역변수 방식)

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  createParticleSystem() {
    // 파티클용 1x1 흰 점 텍스처 생성 (내장 파티클 시스템 사용)
    if (!this.textures.exists('px')) {
      var g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 2, 2);
      g.generateTexture('px', 2, 2);
      g.destroy();
    }

    // 성능용: 파티클/이미터를 한 번만 만들고 재사용
    // Phaser 버전(3.5x / 3.6x+) 차이를 모두 지원
    this.hitEmitter = null;
    this.deathEmitter = null;
    try {
      this.fxParticles = this.add.particles('px');
      if (this.fxParticles && this.fxParticles.setDepth) {
        // Phaser 3.5x: ParticleEmitterManager
        this.fxParticles.setDepth(999);
      }
      if (this.fxParticles && this.fxParticles.createEmitter) {
        // Phaser 3.5x 방식
        this.hitEmitter = this.fxParticles.createEmitter({
          speed: { min: 90, max: 220 },
          angle: { min: 0, max: 360 },
          scale: { start: 2.1, end: 0 },
          lifespan: 260,
          quantity: 9,
          tint: 0x3b82f6,
          blendMode: Phaser.BlendModes.ADD,
          on: false
        });
        this.deathEmitter = this.fxParticles.createEmitter({
          speed: { min: 120, max: 280 },
          angle: { min: 0, max: 360 },
          scale: { start: 2.8, end: 0 },
          lifespan: 360,
          quantity: 14,
          tint: 0xef4444,
          blendMode: Phaser.BlendModes.ADD,
          on: false
        });
      } else {
        // Phaser 3.6x+ 방식: add.particles(x, y, key, config) -> Emitter
        this.hitEmitter = this.add.particles(0, 0, 'px', {
          speed: { min: 90, max: 220 },
          angle: { min: 0, max: 360 },
          scale: { start: 2.1, end: 0 },
          lifespan: 260,
          quantity: 9,
          tint: 0x3b82f6,
          blendMode: Phaser.BlendModes.ADD,
          emitting: false
        });
        this.deathEmitter = this.add.particles(0, 0, 'px', {
          speed: { min: 120, max: 280 },
          angle: { min: 0, max: 360 },
          scale: { start: 2.8, end: 0 },
          lifespan: 360,
          quantity: 14,
          tint: 0xef4444,
          blendMode: Phaser.BlendModes.ADD,
          emitting: false
        });
        if (this.hitEmitter && this.hitEmitter.setDepth) this.hitEmitter.setDepth(999);
        if (this.deathEmitter && this.deathEmitter.setDepth) this.deathEmitter.setDepth(999);
      }
    } catch (err) {
      this.fxParticles = null;
      this.hitEmitter = null;
      this.deathEmitter = null;
    }
    this.lastHitFxTime = 0;
    this.hitFxCooldownMs = 35;
  }

  playHitEffect(x, y) {
    var now = this.time.now;
    if (now - this.lastHitFxTime < this.hitFxCooldownMs) return;
    this.lastHitFxTime = now;
    if (!this.hitEmitter) return;
    if (this.hitEmitter.explode) {
      this.hitEmitter.explode(9, x, y);
    } else if (this.hitEmitter.emitParticleAt) {
      this.hitEmitter.emitParticleAt(x, y, 9);
    }
  }

  playImpactFlash(x, y, color, radius, shakeIntensity) {
    var ring = this.add.circle(x, y, radius || 12, color || 0xffffff, 0.45).setDepth(998);
    ring.setStrokeStyle(2, 0xffffff, 0.9);
    this.tweens.add({
      targets: ring,
      alpha: 0,
      scale: 1.8,
      duration: 130,
      ease: 'Cubic.Out',
      onComplete: function() { ring.destroy(); }
    });
    if (this.cameras && this.cameras.main) {
      this.cameras.main.shake(55, shakeIntensity || 0.0015);
    }
  }

  playDeathEffect(x, y) {
    if (!this.deathEmitter) return;
    if (this.deathEmitter.explode) {
      this.deathEmitter.explode(14, x, y);
    } else if (this.deathEmitter.emitParticleAt) {
      this.deathEmitter.emitParticleAt(x, y, 14);
    }
  }

  preload() {
    if (typeof window !== 'undefined') {
      window.GAME_TEXTURES = {
        player: 'player_survivor1',
        playerReload: 'player_survivor1_reload',
        enemy: 'enemy_zombie1_hold',
        enemyReload: 'enemy_zombie1_reload',
        enemyFrames: [
          'enemy_zombie1_stand',
          'enemy_zombie1_hold',
          'enemy_zombie1_gun',
          'enemy_zombie1_machine',
          'enemy_zombie1_reload',
          'enemy_zombie1_silencer'
        ]
      };
    }
    this.load.image(
      'player_survivor1',
      'kenney_top-down-shooter/PNG/Survivor 1/survivor1_gun.png'
    );
    this.load.image(
      'player_survivor1_reload',
      'kenney_top-down-shooter/PNG/Survivor 1/survivor1_reload.png'
    );
    this.load.image(
      'enemy_zombie1_stand',
      'kenney_top-down-shooter/PNG/Zombie 1/zoimbie1_stand.png'
    );
    this.load.image(
      'enemy_zombie1_hold',
      'kenney_top-down-shooter/PNG/Zombie 1/zoimbie1_hold.png'
    );
    this.load.image(
      'enemy_zombie1_gun',
      'kenney_top-down-shooter/PNG/Zombie 1/zoimbie1_gun.png'
    );
    this.load.image(
      'enemy_zombie1_machine',
      'kenney_top-down-shooter/PNG/Zombie 1/zoimbie1_machine.png'
    );
    this.load.image(
      'enemy_zombie1_reload',
      'kenney_top-down-shooter/PNG/Zombie 1/zoimbie1_reload.png'
    );
    this.load.image(
      'enemy_zombie1_silencer',
      'kenney_top-down-shooter/PNG/Zombie 1/zoimbie1_silencer.png'
    );
    this.load.image('game_bg', 'Background.png');
  }

  create(data) {
    this.gameOver = false;
    this.score = 0;
    this.currentLevel = (data && data.level) ? data.level : 1;
    this.level2Score = 80;
    this.level3Score = 150;
    this.level3KillCount = 0;
    this.bossSpawned = false;
    this.bossAlive = false;
    this.levelBanner = null;
    this.bossBanner = null;
    var sel = (typeof window !== 'undefined' && window.SELECTION) || { character: 'normal', abilities: [] };

    this.bgImage = this.add.image(400, 300, 'game_bg');
    this.bgImage.setDisplaySize(800, 600);
    this.bgImage.setDepth(-1000);

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

    this.scoreText = this.add.text(20, 20, '점수: 0', { fontSize: 24, color: '#fff' });
    this.showLevelBanner(this.currentLevel);

    var self = this;
    this.input.on('pointerdown', function(pointer) {
      if (self.gameOver) return;
      if (!self.player.canShoot(self.time.now)) return;
      var px = self.player.rect.x;
      var py = self.player.rect.y;
      var mx = pointer.worldX;
      var my = pointer.worldY;
      var dx = mx - px;
      var dy = my - py;
      var len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) len = 1;
      dx /= len;
      dy /= len;

      var shots = [{ dx: dx, dy: dy }];
      if (sel.abilities && sel.abilities.indexOf('doubleShot') >= 0) {
        var a = Math.atan2(dy, dx) + 0.2;
        shots.push({ dx: Math.cos(a), dy: Math.sin(a) });
      }
      for (var s = 0; s < shots.length; s++) {
        var sx = px + shots[s].dx * 22;
        var sy = py + shots[s].dy * 22;
        var bullet = new Bullet(self, sx, sy, shots[s].dx, shots[s].dy, self.bulletSpeed);
        self.bullets.push(bullet);
      }
      self.player.registerShot(self.time.now);
    });
  }

  showDeathPopup() {
    this.gameOver = true;
    var w = 800, h = 600;
    var bg = this.add.rectangle(400, 300, w, h, 0x000000, 0.75);
    var panel = this.add.rectangle(400, 280, 360, 200, 0x2a2a3e);
    var title = this.add.text(400, 200, '게임 오버', { fontSize: 32, color: '#fff' }).setOrigin(0.5);
    var finalScore = this.add.text(400, 245, '최종 점수: ' + this.score, { fontSize: 22, color: '#fbbf24' }).setOrigin(0.5);
    var msgText = this.currentLevel >= 2 ? '2~3레벨 사망: 1레벨부터 다시 시작됩니다.' : '다시 하시겠습니까?';
    var msg = this.add.text(400, 280, msgText, { fontSize: 18, color: '#ccc' }).setOrigin(0.5);

    var btnRestart = this.add.rectangle(280, 355, 140, 44, 0x4ade80).setInteractive({ useHandCursor: true });
    var txtRestart = this.add.text(280, 355, '다시 시작', { fontSize: 18, color: '#000' }).setOrigin(0.5);
    btnRestart.on('pointerdown', function() {
      this.scene.restart({ level: 1 });
    }, this);
    btnRestart.on('pointerover', function() { btnRestart.setFillStyle(0x86efac); });
    btnRestart.on('pointerout', function() { btnRestart.setFillStyle(0x4ade80); });

    var btnTitle = this.add.rectangle(520, 355, 140, 44, 0xf87171).setInteractive({ useHandCursor: true });
    var txtTitle = this.add.text(520, 355, '초기화면으로', { fontSize: 18, color: '#fff' }).setOrigin(0.5);
    btnTitle.on('pointerdown', function() {
      this.scene.start('TitleScene');
    }, this);
    btnTitle.on('pointerover', function() { btnTitle.setFillStyle(0xfca5a5); });
    btnTitle.on('pointerout', function() { btnTitle.setFillStyle(0xf87171); });
  }

  showBanner(text, color, durationMs) {
    var t = this.add.text(400, 90, text, { fontSize: 34, color: color || '#fff' })
      .setOrigin(0.5)
      .setDepth(200)
      .setAlpha(0.95);
    this.time.delayedCall(durationMs || 1200, function() {
      if (t && t.destroy) t.destroy();
    }, null, this);
    return t;
  }

  showLevelBanner(level) {
    if (this.levelBanner && this.levelBanner.destroy) this.levelBanner.destroy();
    var color = level === 1 ? '#7dd3fc' : (level === 2 ? '#f59e0b' : '#ef4444');
    this.levelBanner = this.showBanner('LEVEL ' + level, color, 1200);
  }

  setupLevel(level) {
    if (level === 1) {
      this.spawnInterval = 5000;
      this.spawnIntervalMin = 1200;
    } else if (level === 2) {
      this.spawnInterval = 4200;
      this.spawnIntervalMin = 900;
    } else {
      this.spawnInterval = 4200;
      this.spawnIntervalMin = 900;
    }
    // 레벨별 최대 적 수: 1레벨 4명, 레벨당 +1
    this.maxEnemies = 3 + level;
  }

  spawnInitialEnemies(minCount, maxCount) {
    var initialCount = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));
    for (var i = 0; i < initialCount; i++) {
      if (this.enemies.length >= this.maxEnemies) break;
      var spawnX = 80 + Math.random() * 640;
      var spawnY = 80 + Math.random() * 440;
      var e = new Enemy(this, spawnX, spawnY, this.player, this.enemyBullets);
      this.enemies.push(e);
    }
  }

  clearCombatObjects() {
    for (var i = this.bullets.length - 1; i >= 0; i--) {
      this.bullets[i].destroy();
    }
    this.bullets = [];
    for (var j = this.enemyBullets.length - 1; j >= 0; j--) {
      this.enemyBullets[j].destroy();
    }
    this.enemyBullets = [];
    for (var k = this.enemies.length - 1; k >= 0; k--) {
      this.enemies[k].destroy();
    }
    this.enemies = [];
  }

  levelUpTo2() {
    this.currentLevel = 2;
    this.setupLevel(2);
    this.lastSpawnTime = this.time.now;
    this.clearCombatObjects();
    this.spawnInitialEnemies(4, 5);
    this.showLevelBanner(2);
  }

  levelUpTo3() {
    this.currentLevel = 3;
    this.setupLevel(3);
    this.lastSpawnTime = this.time.now;
    this.clearCombatObjects();
    this.spawnInitialEnemies(4, 5);
    this.level3KillCount = 0;
    this.bossSpawned = false;
    this.bossAlive = false;
    this.showLevelBanner(3);
  }

  spawnBoss() {
    // 최대 적 수를 절대 넘기지 않음. 자리가 없으면 일반 적 1마리를 제거하고 보스 스폰
    if (this.enemies.length >= this.maxEnemies) {
      for (var i = this.enemies.length - 1; i >= 0; i--) {
        var e = this.enemies[i];
        if (!e || !e.isBoss) {
          if (e && e.destroy) e.destroy();
          this.enemies.splice(i, 1);
          break;
        }
      }
      if (this.enemies.length >= this.maxEnemies) return false;
    }
    var spawnX = 80 + Math.random() * 640;
    var spawnY = 80 + Math.random() * 440;
    var boss = new Enemy(this, spawnX, spawnY, this.player, this.enemyBullets, { isBoss: true });
    this.enemies.push(boss);
    this.bossSpawned = true;
    this.bossAlive = true;
    if (this.bossBanner && this.bossBanner.destroy) this.bossBanner.destroy();
    this.bossBanner = this.showBanner('BOSS 등장!', '#f87171', 1200);
    return true;
  }

  update() {
    if (this.gameOver) return;
    var time = this.time.now;
    this.player.update(this.keys, time);

    if (this.currentLevel === 1 && this.score >= this.level2Score) {
      this.levelUpTo2();
    }
    if (this.currentLevel === 2 && this.score >= this.level3Score) {
      this.levelUpTo3();
    }

    // 안전장치: 어떤 이유로든 적이 최대치를 넘으면 즉시 정리
    if (!this.maxEnemies) this.maxEnemies = 4;
    if (this.enemies.length > this.maxEnemies) {
      for (var trim = this.enemies.length - 1; trim >= 0 && this.enemies.length > this.maxEnemies; trim--) {
        var te = this.enemies[trim];
        // 보스는 우선 보존하고 일반 적을 먼저 제거
        if (te && te.isBoss) continue;
        if (te && te.destroy) te.destroy();
        this.enemies.splice(trim, 1);
      }
      // 그래도 넘치면(보스만 남았는데도) 뒤에서부터 제거
      for (var trim2 = this.enemies.length - 1; trim2 >= 0 && this.enemies.length > this.maxEnemies; trim2--) {
        var te2 = this.enemies[trim2];
        if (te2 && te2.destroy) te2.destroy();
        this.enemies.splice(trim2, 1);
      }
    }

    // 3레벨: 3킬 달성 시 보스 스폰. 보스가 뜰 때까지 일반 스폰은 잠깐 대기
    var waitingBoss = (this.currentLevel === 3 && !this.bossSpawned && this.level3KillCount >= 3);
    if (waitingBoss) {
      this.spawnBoss();
    }

    // 적 스폰 (시작 뒤엔 한 번에 2~3명, 점점 더 빠르게)
    if (!waitingBoss && time - this.lastSpawnTime >= this.spawnInterval) {
      this.lastSpawnTime = time;
      this.spawnInterval = Math.max(this.spawnIntervalMin, this.spawnInterval - 150);
      var count = 2 + Math.floor(Math.random() * 2);
      for (var si = 0; si < count; si++) {
        if (this.enemies.length >= this.maxEnemies) break;
        var side = Math.floor(Math.random() * 4);
        var spawnX, spawnY;
        if (side === 0) { spawnX = Math.random() * 800; spawnY = -15; }
        else if (side === 1) { spawnX = 815; spawnY = Math.random() * 600; }
        else if (side === 2) { spawnX = Math.random() * 800; spawnY = 615; }
        else { spawnX = -15; spawnY = Math.random() * 600; }
        var e = new Enemy(this, spawnX, spawnY, this.player, this.enemyBullets);
        this.enemies.push(e);
      }
    }

    // 적 업데이트 (이동 + 총알 발사)
    for (var i = 0; i < this.enemies.length; i++) {
      this.enemies[i].update(time);
    }

    // 화면 밖으로 나간 플레이어 총알 제거 + 적과 충돌 시 데미지 (한 방에 안 죽음)
    for (var i = this.bullets.length - 1; i >= 0; i--) {
      var b = this.bullets[i];
      var x = b.x, y = b.y;
      if (x < -20 || x > 820 || y < -20 || y > 620) {
        b.destroy();
        this.bullets.splice(i, 1);
        continue;
      }
      for (var j = this.enemies.length - 1; j >= 0; j--) {
        var e = this.enemies[j];
        var dist = Phaser.Math.Distance.Between(x, y, e.x, e.y);
        if (dist < 22) {
          this.playHitEffect(e.x, e.y);
          this.playImpactFlash(e.x, e.y, 0xffe08a, 11, 0.0012);
          b.destroy();
          this.bullets.splice(i, 1);
          if (e.takeDamage(1)) {
            var wasBoss = !!e.isBoss;
            this.enemies.splice(j, 1);
            if (wasBoss) this.bossAlive = false;
            this.playDeathEffect(e.x, e.y);
            this.score += 10;
            this.scoreText.setText('점수: ' + this.score);
            if (this.currentLevel === 3 && !wasBoss) {
              this.level3KillCount += 1;
              if (!this.bossSpawned && this.level3KillCount >= 3) {
                this.spawnBoss();
              }
            }
          }
          break;
        }
      }
    }

    // 화면 밖으로 나간 적 총알 제거
    for (var i = this.enemyBullets.length - 1; i >= 0; i--) {
      var eb = this.enemyBullets[i];
      var ex = eb.x, ey = eb.y;
      if (ex < -20 || ex > 820 || ey < -20 || ey > 620) {
        eb.destroy();
        this.enemyBullets.splice(i, 1);
      }
    }

    // 플레이어와 적 총알 충돌 → 플레이어 데미지, 5번 맞으면 사망 → 팝업
    for (var i = this.enemyBullets.length - 1; i >= 0; i--) {
      var eb = this.enemyBullets[i];
      var dist = Phaser.Math.Distance.Between(this.player.rect.x, this.player.rect.y, eb.x, eb.y);
      if (dist < 24) {
        this.playHitEffect(this.player.rect.x, this.player.rect.y);
        this.playImpactFlash(this.player.rect.x, this.player.rect.y, 0x60a5fa, 13, 0.0022);
        eb.destroy();
        this.enemyBullets.splice(i, 1);
        var dmg = eb.damage || 1;
        if (this.player.takeDamage(dmg)) {
          this.player.destroy();
          this.showDeathPopup();
          return;
        }
      }
    }
  }
}
