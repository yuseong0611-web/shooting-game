// TitleScene.js: 초기화면 (전역변수 방식)

class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    this.add.text(400, 220, '탑다운 슈팅', { fontSize: 42, color: '#fff' }).setOrigin(0.5);
    this.add.text(400, 280, '캐릭터와 능력을 선택한 뒤 게임을 시작하세요.', { fontSize: 16, color: '#aaa' }).setOrigin(0.5);

    var btn = this.add.rectangle(400, 380, 200, 50, 0x4ade80).setInteractive({ useHandCursor: true });
    this.add.text(400, 380, '게임 시작', { fontSize: 22, color: '#000' }).setOrigin(0.5);
    btn.on('pointerdown', function() {
      this.scene.start('CharacterSelectScene');
    }, this);
    btn.on('pointerover', function() { btn.setFillStyle(0x86efac); });
    btn.on('pointerout', function() { btn.setFillStyle(0x4ade80); });
  }
}
