// Enemy.js: 적 오브젝트. HP/HP바, 여러 방향 이동, 주기적 총알 발사 (전역 클래스)

class Enemy {
  constructor(scene, x, y, player, enemyBulletsArray) {
    this.scene = scene;
    this.player = player;
    this.enemyBullets = enemyBulletsArray;
    this.speed = 70;
    this.shootInterval = 1500;
    this.lastShotTime = 0;
    this.bulletSpeed = 280;

    this.maxHp = 3;
    this.hp = this.maxHp;

    this.rect = scene.add.rectangle(x, y, 28, 28, 0xff0000);
    scene.physics.add.existing(this.rect);
    this.body = this.rect.body;
    this.body.setCollideWorldBounds(true);

    this.dirChangeInterval = 900;
    this.lastDirChange = 0;
    this.moveAngle = Math.atan2(player.rect.y - y, player.rect.x - x);

    this.hpBarWidth = 28;
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
    var vx = Math.cos(this.moveAngle) * this.speed;
    var vy = Math.sin(this.moveAngle) * this.speed;
    this.body.setVelocity(vx, vy);

    this.hpBarBg.setPosition(ex, ey - 22);
    this.hpBarFg.setOrigin(0, 0.5);
    this.hpBarFg.setPosition(ex - this.hpBarWidth / 2, ey - 22);
    this.hpBarFg.setSize(this.hpBarWidth * (this.hp / this.maxHp), this.hpBarHeight);

    if (time - this.lastShotTime >= this.shootInterval) {
      this.lastShotTime = time;
      var bdx = px - ex;
      var bdy = py - ey;
      var blen = Math.sqrt(bdx * bdx + bdy * bdy);
      if (blen === 0) blen = 1;
      bdx /= blen;
      bdy /= blen;
      var bullet = new Bullet(this.scene, ex, ey, bdx, bdy, this.bulletSpeed, 0xff4444);
      this.enemyBullets.push(bullet);
    }
  }

  destroy() {
    this.rect.destroy();
    this.hpBarBg.destroy();
    this.hpBarFg.destroy();
  }
}
