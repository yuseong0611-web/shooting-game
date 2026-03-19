// CharacterSelectScene.js: 캐릭터·능력 선택 화면 (전역변수 방식)

if (typeof window !== 'undefined') window.SELECTION = { character: 'normal', abilities: [] };

var CHAR_OPTIONS = [
  { key: 'normal', label: '일반', desc: '속도·체력 균형' },
  { key: 'fast',   label: '스피드', desc: '이동 빠름' },
  { key: 'tank',   label: '탱크', desc: '체력 많음' }
];

var ABILITY_OPTIONS = [
  { key: 'doubleShot',  label: '더블샷', desc: '클릭 시 2발' },
  { key: 'speedBullet',  label: '속사',   desc: '총알 속도 UP' }
];

class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create() {
    var sel = window.SELECTION || { character: 'normal', abilities: [] };
    sel.abilities = sel.abilities || [];

    this.add.text(400, 60, '캐릭터 선택', { fontSize: 28, color: '#fff' }).setOrigin(0.5);
    var charBoxes = [];
    for (var i = 0; i < CHAR_OPTIONS.length; i++) {
      var c = CHAR_OPTIONS[i];
      var x = 200 + i * 200;
      var box = this.add.rectangle(x, 180, 120, 100, sel.character === c.key ? 0x4ade80 : 0x3a3a5e).setInteractive({ useHandCursor: true });
      this.add.text(x, 150, c.label, { fontSize: 18, color: '#fff' }).setOrigin(0.5);
      this.add.text(x, 180, c.desc, { fontSize: 12, color: '#aaa' }).setOrigin(0.5);
      (function(optKey) {
        box.on('pointerdown', function() {
          window.SELECTION.character = optKey;
          charBoxes.forEach(function(cb, idx) {
            cb.setFillStyle(CHAR_OPTIONS[idx].key === window.SELECTION.character ? 0x4ade80 : 0x3a3a5e);
          });
        });
      })(c.key);
      charBoxes.push(box);
    }

    this.add.text(400, 280, '능력 선택 (복수 가능)', { fontSize: 28, color: '#fff' }).setOrigin(0.5);
    var abilityToggles = [];
    for (var j = 0; j < ABILITY_OPTIONS.length; j++) {
      var a = ABILITY_OPTIONS[j];
      var ax = 250 + j * 280;
      var isOn = sel.abilities.indexOf(a.key) >= 0;
      var tog = this.add.rectangle(ax, 360, 180, 70, isOn ? 0x4ade80 : 0x3a3a5e).setInteractive({ useHandCursor: true });
      this.add.text(ax, 340, a.label, { fontSize: 18, color: '#fff' }).setOrigin(0.5);
      this.add.text(ax, 365, a.desc, { fontSize: 12, color: '#aaa' }).setOrigin(0.5);
      (function(opt, t) {
        tog.on('pointerdown', function() {
          var idx = window.SELECTION.abilities.indexOf(opt.key);
          if (idx >= 0) {
            window.SELECTION.abilities.splice(idx, 1);
            t.setFillStyle(0x3a3a5e);
          } else {
            window.SELECTION.abilities.push(opt.key);
            t.setFillStyle(0x4ade80);
          }
        });
      })(a, tog);
      abilityToggles.push(tog);
    }

    var startBtn = this.add.rectangle(400, 480, 180, 50, 0x6366f1).setInteractive({ useHandCursor: true });
    this.add.text(400, 480, '게임 시작', { fontSize: 22, color: '#fff' }).setOrigin(0.5);
    startBtn.on('pointerdown', function() {
      this.scene.start('GameScene');
    }, this);
    startBtn.on('pointerover', function() { startBtn.setFillStyle(0x818cf8); });
    startBtn.on('pointerout', function() { startBtn.setFillStyle(0x6366f1); });
  }
}
