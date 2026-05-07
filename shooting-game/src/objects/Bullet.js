// Bullet.js: 총알 오브젝트. 화면 밖으로 나갈 때까지 직선 비행 (전역 클래스)

class Bullet {
  constructor(scene, x, y, dirX, dirY, speed, color, damage, bulletOptions) {
    this.scene = scene;
    this.speed = speed || 400;
    this.color = color !== undefined ? color : 0xffff00;
    this.damage = damage || 1;
    this.bulletOptions = bulletOptions || {};
    this.explosive = !!this.bulletOptions.explosive;
    this.effect = this.bulletOptions.effect || null;

    if (scene.textures && scene.textures.exists('bullet')) {
      var angle = Math.atan2(dirY, dirX);
      this.graphic = scene.physics.add.image(x, y, 'bullet');
      this.graphic.setDisplaySize(this.explosive ? 34 : 28, this.explosive ? 10 : 7);
      this.graphic.setRotation(angle);
      this.graphic.setDepth(80);
      if (this.color !== 0xffff00 && this.graphic.setTint) this.graphic.setTint(this.color);
    } else {
      var radius = this.explosive ? 9 : 6;
      this.graphic = scene.add.circle(x, y, radius, this.color);
      scene.physics.add.existing(this.graphic);
    }
    this.body = this.graphic.body;

    this.body.setVelocity(dirX * this.speed, dirY * this.speed);
    this.body.setCollideWorldBounds(false);
  }

  get x() {
    return this.graphic.x;
  }

  get y() {
    return this.graphic.y;
  }

  destroy() {
    this.graphic.destroy();
  }
}
