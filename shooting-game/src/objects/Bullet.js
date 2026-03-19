// Bullet.js: 총알 오브젝트. 화면 밖으로 나갈 때까지 직선 비행 (전역 클래스)

class Bullet {
  constructor(scene, x, y, dirX, dirY, speed, color) {
    this.scene = scene;
    this.speed = speed || 400;
    this.color = color !== undefined ? color : 0xffff00;

    this.graphic = scene.add.circle(x, y, 6, this.color);
    scene.physics.add.existing(this.graphic);
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
