// main.js: Phaser 게임 설정 및 시작 (전역변수 방식)

var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: [TitleScene, ShopScene, CharacterSelectScene, GameScene]
};

var game = new Phaser.Game(config);
