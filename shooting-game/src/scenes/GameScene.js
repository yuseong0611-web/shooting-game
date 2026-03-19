// GameScene.js: 메인 게임 화면. 플레이어 HP, 적, 총알, 사망 팝업 (전역변수 방식)

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.gameOver = false;
    this.score = 0;
    var sel = (typeof window !== 'undefined' && window.SELECTION) || { character: 'normal', abilities: [] };

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
    this.spawnInterval = 5000;
    this.spawnIntervalMin = 1200;
    var positions = [[200, 150], [600, 450]];
    for (var i = 0; i < positions.length; i++) {
      var e = new Enemy(this, positions[i][0], positions[i][1], this.player, this.enemyBullets);
      this.enemies.push(e);
    }

    this.scoreText = this.add.text(20, 20, '점수: 0', { fontSize: 24, color: '#fff' });

    var self = this;
    this.input.on('pointerdown', function(pointer) {
      if (self.gameOver) return;
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
        var bullet = new Bullet(self, px, py, shots[s].dx, shots[s].dy, self.bulletSpeed);
        self.bullets.push(bullet);
      }
    });
  }

  showDeathPopup() {
    this.gameOver = true;
    var w = 800, h = 600;
    var bg = this.add.rectangle(400, 300, w, h, 0x000000, 0.75);
    var panel = this.add.rectangle(400, 280, 360, 200, 0x2a2a3e);
    var title = this.add.text(400, 200, '게임 오버', { fontSize: 32, color: '#fff' }).setOrigin(0.5);
    var finalScore = this.add.text(400, 245, '최종 점수: ' + this.score, { fontSize: 22, color: '#fbbf24' }).setOrigin(0.5);
    var msg = this.add.text(400, 280, '다시 하시겠습니까?', { fontSize: 18, color: '#ccc' }).setOrigin(0.5);

    var btnRestart = this.add.rectangle(280, 355, 140, 44, 0x4ade80).setInteractive({ useHandCursor: true });
    var txtRestart = this.add.text(280, 355, '다시 시작', { fontSize: 18, color: '#000' }).setOrigin(0.5);
    btnRestart.on('pointerdown', function() {
      this.scene.restart();
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

  update() {
    if (this.gameOver) return;
    var time = this.time.now;
    this.player.update(this.keys);

    // 적 스폰 (시작 뒤엔 한 번에 2~3명, 점점 더 빠르게)
    if (time - this.lastSpawnTime >= this.spawnInterval) {
      this.lastSpawnTime = time;
      this.spawnInterval = Math.max(this.spawnIntervalMin, this.spawnInterval - 150);
      var count = 2 + Math.floor(Math.random() * 2);
      for (var si = 0; si < count; si++) {
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
          b.destroy();
          this.bullets.splice(i, 1);
          if (e.takeDamage(1)) {
            this.enemies.splice(j, 1);
            this.score += 10;
            this.scoreText.setText('점수: ' + this.score);
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
        eb.destroy();
        this.enemyBullets.splice(i, 1);
        if (this.player.takeDamage(1)) {
          this.player.destroy();
          this.showDeathPopup();
          return;
        }
      }
    }
  }
}
