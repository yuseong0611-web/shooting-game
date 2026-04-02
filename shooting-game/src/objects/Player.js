// Player.js: 플레이어 캐릭터. HP/HP바, WASD 이동 (전역 클래스)
// 옵션: window.SELECTION.character, SELECTION.abilities 반영

var PLAYER_CONFIG = {
  normal: { speed: 200, color: 0x00ff00, maxHp: 10 },
  fast:   { speed: 280, color: 0x00ccff, maxHp: 10 },
  tank:   { speed: 150, color: 0xff8800, maxHp: 50 }
};

class Player {
  constructor(scene, x, y, options) {
    this.scene = scene;
    var sel = options || (typeof window !== 'undefined' && window.SELECTION) || {};
    var charKey = sel.character || 'normal';
    var cfg = PLAYER_CONFIG[charKey] || PLAYER_CONFIG.normal;
    this.speed = cfg.speed;
    this.maxHp = cfg.maxHp;
    this.hp = this.maxHp;
    this.shotCount = 0;
    this.reloadDuration = 900;
    this.reloadEndTime = 0;
    this.isReloading = false;

    var playerTexture = (typeof window !== 'undefined' && window.GAME_TEXTURES && window.GAME_TEXTURES.player) || '';
    this.playerBaseTexture = playerTexture;
    this.playerReloadTexture = (typeof window !== 'undefined' && window.GAME_TEXTURES && window.GAME_TEXTURES.playerReload) || '';
    if (playerTexture && scene.textures.exists(playerTexture)) {
      this.rect = scene.physics.add.image(x, y, playerTexture);
      this.rect.setDisplaySize(38, 38);
    } else {
      this.rect = scene.add.rectangle(x, y, 32, 32, cfg.color);
      scene.physics.add.existing(this.rect);
    }
    this.body = this.rect.body;
    this.body.setCollideWorldBounds(true);

    this.hpBarWidth = 32;
    this.hpBarHeight = 5;
    this.hpBarBg = scene.add.rectangle(x, y - 24, this.hpBarWidth, this.hpBarHeight, 0x333333);
    this.hpBarFg = scene.add.rectangle(x, y - 24, this.hpBarWidth, this.hpBarHeight, 0x00ff00);
    this.hpBarBg.setOrigin(0.5, 0.5);
    this.hpBarFg.setOrigin(0, 0.5);
  }

  takeDamage(amount) {
    this.hp = this.hp - amount;
    if (this.hp < 0) this.hp = 0;
    if (this.hp <= 0) return true;
    return false;
  }

  canShoot(time) {
    if (!this.isReloading) return true;
    if (time >= this.reloadEndTime) {
      this.isReloading = false;
      if (this.playerBaseTexture && this.rect.setTexture && this.scene.textures.exists(this.playerBaseTexture)) {
        this.rect.setTexture(this.playerBaseTexture);
      }
      return true;
    }
    return false;
  }

  registerShot(time) {
    this.shotCount += 1;
    if (this.shotCount >= 3) {
      this.shotCount = 0;
      this.isReloading = true;
      this.reloadEndTime = time + this.reloadDuration;
      if (this.playerReloadTexture && this.rect.setTexture && this.scene.textures.exists(this.playerReloadTexture)) {
        this.rect.setTexture(this.playerReloadTexture);
      }
    }
  }

  update(keys, time) {
    var vx = 0, vy = 0;
    if (keys.left.isDown)  vx = -this.speed;
    if (keys.right.isDown) vx = this.speed;
    if (keys.up.isDown)    vy = -this.speed;
    if (keys.down.isDown)  vy = this.speed;
    this.body.setVelocity(vx, vy);

    this.canShoot(time || 0);

    var pointer = this.scene.input.activePointer;
    if (pointer) {
      var aim = Math.atan2(pointer.worldY - this.rect.y, pointer.worldX - this.rect.x);
      this.rect.rotation = aim;
    }

    var ex = this.rect.x, ey = this.rect.y;
    this.hpBarBg.setPosition(ex, ey - 24);
    this.hpBarFg.setPosition(ex - this.hpBarWidth / 2, ey - 24);
    this.hpBarFg.setSize(this.hpBarWidth * (this.hp / this.maxHp), this.hpBarHeight);
    this.hpBarFg.setOrigin(0, 0.5);
  }

  destroy() {
    this.rect.destroy();
    this.hpBarBg.destroy();
    this.hpBarFg.destroy();
  }
}
