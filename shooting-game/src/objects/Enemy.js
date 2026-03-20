// Enemy.js: 적 오브젝트. HP/HP바, 여러 방향 이동, 주기적 총알 발사 (전역 클래스)

class Enemy {
  constructor(scene, x, y, player, enemyBulletsArray, options) {
    this.scene = scene;
    this.player = player;
    this.enemyBullets = enemyBulletsArray;
    this.options = options || {};
    this.isBoss = !!this.options.isBoss;
    this.speed = 70;
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

    var enemyTexture = (typeof window !== 'undefined' && window.GAME_TEXTURES && window.GAME_TEXTURES.enemy) || '';
    if (enemyTexture && scene.textures.exists(enemyTexture)) {
      this.rect = scene.physics.add.image(x, y, enemyTexture);
      this.rect.setDisplaySize(this.isBoss ? 52 : 34, this.isBoss ? 52 : 34);
    } else {
      this.rect = scene.add.rectangle(x, y, 28, 28, 0xff0000);
      scene.physics.add.existing(this.rect);
    }
    this.body = this.rect.body;
    this.body.setCollideWorldBounds(true);
    this.enemyFrames = (typeof window !== 'undefined' && window.GAME_TEXTURES && window.GAME_TEXTURES.enemyFrames) || [];
    this.enemyReloadTexture = (typeof window !== 'undefined' && window.GAME_TEXTURES && window.GAME_TEXTURES.enemyReload) || '';
    this.enemyFrameIndex = 0;
    this.animInterval = 140;
    this.lastAnimTime = 0;

    this.dirChangeInterval = 900;
    this.lastDirChange = 0;
    this.moveAngle = Math.atan2(player.rect.y - y, player.rect.x - x);

    this.hpBarWidth = 28;
    if (this.isBoss) this.hpBarWidth = 48;
    this.hpBarHeight = 5;
    this.hpBarBg = scene.add.rectangle(x, y - 22, this.hpBarWidth, this.hpBarHeight, 0x333333);
    this.hpBarFg = scene.add.rectangle(x, y - 22, this.hpBarWidth, this.hpBarHeight, 0x00ff00);
    this.hpBarFg.setOrigin(0.5, 0.5);
    this.hpBarBg.setOrigin(0.5, 0.5);
  }

  get x() {
    return this.rect.x;
  }

  get y() {
    return this.rect.y;
  }

  takeDamage(amount) {
    this.hp = this.hp - amount;
    if (this.hp < 0) this.hp = 0;
    if (this.hp <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  update(time) {
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

    var lookAngle = Math.atan2(py - ey, px - ex);
    this.rect.rotation = lookAngle;

    var vx = Math.cos(this.moveAngle) * this.speed;
    var vy = Math.sin(this.moveAngle) * this.speed;
    this.body.setVelocity(vx, vy);

    if (this.isReloading && time >= this.reloadEndTime) {
      this.isReloading = false;
    }

    if (!this.isReloading && this.enemyFrames.length > 0 && this.rect.setTexture && time - this.lastAnimTime >= this.animInterval) {
      this.lastAnimTime = time;
      this.enemyFrameIndex = (this.enemyFrameIndex + 1) % this.enemyFrames.length;
      this.rect.setTexture(this.enemyFrames[this.enemyFrameIndex]);
    }

    this.hpBarBg.setPosition(ex, ey - 22);
    this.hpBarFg.setOrigin(0, 0.5);
    this.hpBarFg.setPosition(ex - this.hpBarWidth / 2, ey - 22);
    this.hpBarFg.setSize(this.hpBarWidth * (this.hp / this.maxHp), this.hpBarHeight);

    if (!this.isReloading && time - this.lastShotTime >= this.shootInterval) {
      this.lastShotTime = time;
      var bdx = px - ex;
      var bdy = py - ey;
      var blen = Math.sqrt(bdx * bdx + bdy * bdy);
      if (blen === 0) blen = 1;
      bdx /= blen;
      bdy /= blen;
      var sx = ex + bdx * 20;
      var sy = ey + bdy * 20;
      if (this.isBoss) {
        this.bulletDamage = Math.max(1, Math.ceil(this.player.maxHp / 3));
      }
      var bullet = new Bullet(this.scene, sx, sy, bdx, bdy, this.bulletSpeed, 0xff4444, this.bulletDamage);
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
    this.rect.destroy();
    this.hpBarBg.destroy();
    this.hpBarFg.destroy();
  }
}
