// Enemy.js — CYBER-HUD 리디자인
// HP바: 적은 얇은 세그먼트 바, 보스는 넓은 HUD 바

class Enemy {
  constructor(scene, x, y, player, enemyBulletsArray, options) {
    this.scene = scene;
    this.player = player;
    this.enemyBullets = enemyBulletsArray;
    this.options = options || {};
    this.isBoss = !!this.options.isBoss;
    this.enemyType = this.isBoss ? 'zombie' : (this.options.enemyType === 'robot' ? 'robot' : 'zombie');

    this.speed = 70;
    this.baseSpeed = this.speed;
    this.shootInterval = 1500;
    this.lastShotTime = 0;
    this.bulletSpeed = 280;
    this.shotCount = 0;
    this.reloadDuration = 1000;
    this.reloadEndTime = 0;
    this.isReloading = false;

    this.maxHp = this.isBoss ? 9 : 3;
    this.hp = this.maxHp;
    this.bulletDamage = this.isBoss ? 0 : 1;
    this.robotBulletDamage = 2;
    this.slowUntil = 0;
    this.slowFactor = 1;
    this.poisonUntil = 0;
    this.nextPoisonTick = 0;
    this.dead = false;

    var GT = (typeof window !== 'undefined' && window.GAME_TEXTURES) || {};
    var enemyTexture = '';
    var enemyFramesList = [];
    var enemyReloadTex = '';
    if (this.isBoss) {
      enemyTexture = GT.enemy || '';
      enemyFramesList = GT.enemyFrames || [];
      enemyReloadTex = GT.enemyReload || '';
    } else if (this.enemyType === 'robot') {
      enemyTexture = GT.robot || '';
      enemyFramesList = GT.robotFrames || [];
      enemyReloadTex = GT.robotReload || '';
      this.maxHp = 4;
      this.hp = 4;
      this.shootInterval = 2500;
      this.bulletSpeed = 240;
      this.baseSpeed = this.speed;
      var bossDmg = Math.max(1, Math.ceil(this.player.maxHp / 3));
      var desired = Math.max(2, Math.floor(bossDmg * 0.55));
      this.robotBulletDamage = bossDmg > 1 ? Math.min(bossDmg - 1, desired) : 1;
    } else {
      enemyTexture = GT.enemy || '';
      enemyFramesList = GT.enemyFrames || [];
      enemyReloadTex = GT.enemyReload || '';
    }

    if (enemyTexture && scene.textures.exists(enemyTexture)) {
      this.rect = scene.physics.add.image(x, y, enemyTexture);
      this.rect.setDisplaySize(this.isBoss ? 52 : 34, this.isBoss ? 52 : 34);
    } else {
      this.rect = scene.add.rectangle(x, y, 28, 28, this.isBoss ? 0xff2244 : 0xff4444);
      scene.physics.add.existing(this.rect);
    }
    this.body = this.rect.body;
    this.body.setCollideWorldBounds(true);
    this.enemyFrames = enemyFramesList;
    this.enemyReloadTexture = enemyReloadTex;
    this.enemyFrameIndex = 0;
    this.animInterval = 140;
    this.lastAnimTime = 0;

    this.dirChangeInterval = 900;
    this.lastDirChange = 0;
    this.moveAngle = Math.atan2(player.rect.y - y, player.rect.x - x);

    // HP 바 (Graphics 기반, 사이버 스타일)
    this._hpGfx = scene.add.graphics().setDepth(50);
    this._drawHpBar();
  }

  get x() { return this.rect ? this.rect.x : (this.deathX || 0); }
  get y() { return this.rect ? this.rect.y : (this.deathY || 0); }

  _drawHpBar() {
    const gfx = this._hpGfx;
    gfx.clear();
    const ex = this.rect.x;
    const ey = this.rect.y;

    if (this.isBoss) {
      // 보스: 화면 상단 넓은 HUD 바
      const bw = 300, bh = 12;
      const bx = (800 - bw) / 2;
      const by = 50;
      const ratio = this.hp / this.maxHp;

      // 외곽 프레임
      gfx.fillStyle(0x000a1a, 0.95);
      gfx.fillRect(bx - 3, by - 3, bw + 6, bh + 6);
      gfx.lineStyle(1, 0xff2244, 0.7);
      gfx.strokeRect(bx - 3, by - 3, bw + 6, bh + 6);
      gfx.lineStyle(1, 0xff2244, 0.2);
      gfx.strokeRect(bx - 7, by - 7, bw + 14, bh + 14);

      // 채워진 바 (세그먼트 10개)
      const segCount = 10;
      const segGap = 2;
      const segW = (bw - segGap * (segCount - 1)) / segCount;
      const filledCount = Math.ceil(segCount * ratio);

      for (let i = 0; i < segCount; i++) {
        const sx = bx + i * (segW + segGap);
        if (i < filledCount) {
          const pulse = 0.85 + 0.15 * Math.sin(Date.now() / 200 + i);
          gfx.fillStyle(0xff2244, pulse);
          gfx.fillRect(sx, by, segW, bh);
          gfx.fillStyle(0xffffff, 0.12);
          gfx.fillRect(sx, by, segW, 3);
        } else {
          gfx.fillStyle(0x1a0008, 1);
          gfx.fillRect(sx, by, segW, bh);
          gfx.lineStyle(1, 0x330011, 1);
          gfx.strokeRect(sx, by, segW, bh);
        }
      }

      // 보스 이름 (HP바 위)
      if (!this._bossLabel) {
        this._bossLabel = this.scene.add.text(400, by - 16, '[ ENEMY COMMANDER ]', {
          fontFamily: '"Share Tech Mono", "Courier New", monospace',
          fontSize: '10px', color: '#ff2244', letterSpacing: 4,
        }).setOrigin(0.5, 0).setDepth(501).setScrollFactor(0);
      }
      if (!this._bossHpText) {
        this._bossHpText = this.scene.add.text(400, by + bh + 6, '', {
          fontFamily: '"Share Tech Mono", "Courier New", monospace',
          fontSize: '9px', color: '#ff6677',
        }).setOrigin(0.5, 0).setDepth(501).setScrollFactor(0);
      }
      this._bossHpText.setText(this.hp + ' / ' + this.maxHp);

    } else {
      // 일반 적: 캐릭터 위에 작은 세그먼트 바
      const bw = this.enemyType === 'robot' ? 32 : 26;
      const bh = 4;
      const bx = ex - bw / 2;
      const by = ey - (this.isBoss ? 36 : 26);
      const ratio = this.hp / this.maxHp;
      const segCount = this.maxHp;
      const segGap = 1;
      const segW = (bw - segGap * (segCount - 1)) / segCount;
      const filledCount = Math.ceil(segCount * ratio);

      // 배경
      gfx.fillStyle(0x000a1a, 0.85);
      gfx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);

      for (let i = 0; i < segCount; i++) {
        const sx = bx + i * (segW + segGap);
        if (i < filledCount) {
          const color = this.enemyType === 'robot' ? 0xff7722 : 0xff3344;
          gfx.fillStyle(color, 0.95);
          gfx.fillRect(sx, by, segW, bh);
        } else {
          gfx.fillStyle(0x220008, 1);
          gfx.fillRect(sx, by, segW, bh);
        }
      }
      gfx.lineStyle(1, this.enemyType === 'robot' ? 0xff7722 : 0xff3344, 0.4);
      gfx.strokeRect(bx - 1, by - 1, bw + 2, bh + 2);
    }
  }

  takeDamage(amount) {
    if (this.dead) return true;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.deathX = this.x;
      this.deathY = this.y;
      this.dead = true;
      this.destroy();
      return true;
    }
    this._drawHpBar();
    return false;
  }

  applySlow(durationMs, factor) {
    var now = this.scene.time.now || 0;
    this.slowUntil = Math.max(this.slowUntil || 0, now + durationMs);
    this.slowFactor = Math.min(this.slowFactor || 1, factor || 0.5);
    if (this.rect && this.rect.setTint) this.rect.setTint(0x9bdcff);
  }

  applyPoison() {
    var now = this.scene.time.now || 0;
    this.applySlow(1000, 0.55);
    this.poisonUntil = Math.max(this.poisonUntil || 0, now + 6000);
    this.nextPoisonTick = now + 3000;
    if (this.rect && this.rect.setTint) this.rect.setTint(0x8cff66);
  }

  _updateStatusEffects(time) {
    if (this.dead) return;
    if (this.poisonUntil && time <= this.poisonUntil && time >= this.nextPoisonTick) {
      this.nextPoisonTick += 3000;
      if (this.takeDamage(1)) return;
      if (this.scene.playImpactFlash) this.scene.playImpactFlash(this.x, this.y, 0x8cff66, 10, 0.0008);
    }
    if (this.poisonUntil && time > this.poisonUntil) {
      this.poisonUntil = 0;
      this.nextPoisonTick = 0;
    }
    if (this.slowUntil && time > this.slowUntil) {
      this.slowUntil = 0;
      this.slowFactor = 1;
      if (!this.poisonUntil && this.rect && this.rect.clearTint) this.rect.clearTint();
    }
  }

  update(time) {
    if (this.dead) return;
    this._updateStatusEffects(time);
    if (this.dead) return;
    var ex = this.rect.x;
    var ey = this.rect.y;
    var px = this.player.rect.x;
    var py = this.player.rect.y;

    if (time - this.lastDirChange >= this.dirChangeInterval) {
      this.lastDirChange = time;
      var angleToPlayer = Math.atan2(py - ey, px - ex);
      var randomOffset = (Math.random() - 0.5) * 2.2;
      this.moveAngle = angleToPlayer + randomOffset;
    }

    this.rect.rotation = Math.atan2(py - ey, px - ex);

    var activeSpeed = this.speed * ((this.slowUntil && time <= this.slowUntil) ? this.slowFactor : 1);
    var vx = Math.cos(this.moveAngle) * activeSpeed;
    var vy = Math.sin(this.moveAngle) * activeSpeed;
    this.body.setVelocity(vx, vy);

    if (this.isReloading && time >= this.reloadEndTime) {
      this.isReloading = false;
    }

    if (!this.isReloading && this.enemyFrames.length > 0 && this.rect.setTexture && time - this.lastAnimTime >= this.animInterval) {
      this.lastAnimTime = time;
      this.enemyFrameIndex = (this.enemyFrameIndex + 1) % this.enemyFrames.length;
      this.rect.setTexture(this.enemyFrames[this.enemyFrameIndex]);
    }

    // HP바 업데이트 (보스는 매 프레임, 일반은 위치만)
    this._drawHpBar();

    if (!this.isReloading && time - this.lastShotTime >= this.shootInterval) {
      this.lastShotTime = time;
      var bdx = px - ex;
      var bdy = py - ey;
      var blen = Math.sqrt(bdx * bdx + bdy * bdy) || 1;
      bdx /= blen;
      bdy /= blen;
      var sx = ex + bdx * 20;
      var sy = ey + bdy * 20;
      if (this.isBoss) {
        this.bulletDamage = Math.max(1, Math.ceil(this.player.maxHp / 3));
      }
      var bullet;
      if (this.enemyType === 'robot' && !this.isBoss) {
        bullet = new Bullet(this.scene, sx, sy, bdx, bdy, this.bulletSpeed, 0xff7722, this.robotBulletDamage, { explosive: true });
      } else {
        bullet = new Bullet(this.scene, sx, sy, bdx, bdy, this.bulletSpeed, 0xff4444, this.bulletDamage);
      }
      this.enemyBullets.push(bullet);
      this.shotCount += 1;
      if (this.shotCount >= 3) {
        this.shotCount = 0;
        this.isReloading = true;
        this.reloadEndTime = time + this.reloadDuration;
        if (this.enemyReloadTexture && this.rect.setTexture && this.scene.textures.exists(this.enemyReloadTexture)) {
          this.rect.setTexture(this.enemyReloadTexture);
        }
      }
    }
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this.dead = true;
    this.rect.destroy();
    if (this._hpGfx) this._hpGfx.destroy();
    if (this._bossLabel) this._bossLabel.destroy();
    if (this._bossHpText) this._bossHpText.destroy();
  }
}
