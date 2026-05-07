if (typeof window !== 'undefined' && !window.SELECTION) window.SELECTION = { character: 'normal', abilities: [] };

var CHAR_OPTIONS = typeof CHARACTER_ITEMS !== 'undefined' ? CHARACTER_ITEMS : [
  { key: 'normal', label: 'RANGER', desc: 'Balanced speed and health.', price: 0, accent: 0x00d4ff, accentHex: '#00d4ff' },
  { key: 'fast', label: 'SCOUT', desc: 'Moves faster, lighter armor.', price: 120, accent: 0x00ffaa, accentHex: '#00ffaa' },
  { key: 'tank', label: 'VANGUARD', desc: 'Heavy armor and high HP.', price: 160, accent: 0xff6644, accentHex: '#ff6644' }
];

var ABILITY_OPTIONS = typeof ABILITY_ITEMS !== 'undefined' ? ABILITY_ITEMS : [
  { key: 'doubleShot', label: 'TWIN FIRE', desc: 'Shoots two bullets at once.', price: 150, accent: 0xffd700, accentHex: '#ffd700' },
  { key: 'speedBullet', label: 'HYPERBOLT', desc: 'Bullets travel faster.', price: 150, accent: 0xff44aa, accentHex: '#ff44aa' },
  { key: 'iceBullet', label: 'ICE ROUND', desc: 'Hits slow enemies for 3 seconds.', price: 150, accent: 0x7dd3fc, accentHex: '#7dd3fc' },
  { key: 'poisonBullet', label: 'TOXIN ROUND', desc: '1 second slow and poison damage over 6 seconds.', price: 150, accent: 0x8cff66, accentHex: '#8cff66' }
];

class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelectScene' });
    this.charCards = [];
    this.abilityCards = [];
  }

  create() {
    this.save = typeof syncSelectionFromSave === 'function' ? syncSelectionFromSave() : {
      coins: 0,
      ownedCharacters: ['normal'],
      ownedAbilities: [],
      selectedCharacter: 'normal',
      selectedAbilities: []
    };
    this._drawBackground();
    this._drawHeader();
    this._drawCharacterSection();
    this._drawAbilitySection();
    this._drawBottomButtons();
  }

  _drawBackground() {
    var W = this.scale.width, H = this.scale.height;
    var bg = this.add.graphics();
    bg.fillGradientStyle(0x020914, 0x06131f, 0x02060d, 0x00040a, 1);
    bg.fillRect(0, 0, W, H);
    bg.lineStyle(1, 0x123044, 0.55);
    for (var y = 0; y < H; y += 40) bg.lineBetween(0, y, W, y);
    for (var x = 0; x < W; x += 40) bg.lineBetween(x, 0, x, H);
  }

  _drawHeader() {
    this.add.text(40, 28, 'CHARACTER SETUP', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '26px',
      color: '#00d4ff',
      letterSpacing: 5
    });
    this.add.text(760, 34, 'COINS ' + this.save.coins, {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '16px',
      color: '#ffd700',
      letterSpacing: 2
    }).setOrigin(1, 0);
    this.add.text(40, 66, 'Select owned characters and owned abilities. Buy more in the shop.', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '12px',
      color: '#8fa8b8'
    });
  }

  _drawCharacterSection() {
    this.add.text(40, 112, 'UNITS', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '13px',
      color: '#00ffaa',
      letterSpacing: 5
    });
    for (var i = 0; i < CHAR_OPTIONS.length; i++) {
      var opt = CHAR_OPTIONS[i];
      var owned = this.save.ownedCharacters.indexOf(opt.key) >= 0;
      this.charCards.push(this._drawSelectCard(60 + i * 240, 145, 210, 130, opt, owned, this.save.selectedCharacter === opt.key, () => {}));
    }
    this._refreshCharacterCards();
  }

  _drawAbilitySection() {
    this.add.text(40, 312, 'ABILITIES', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '13px',
      color: '#00ffaa',
      letterSpacing: 5
    });
    for (var i = 0; i < ABILITY_OPTIONS.length; i++) {
      var opt = ABILITY_OPTIONS[i];
      var owned = this.save.ownedAbilities.indexOf(opt.key) >= 0;
      var selected = this.save.selectedAbilities.indexOf(opt.key) >= 0;
      this.abilityCards.push(this._drawSelectCard(60 + (i % 2) * 360, 345 + Math.floor(i / 2) * 92, 320, 76, opt, owned, selected, () => {}));
    }
    this._refreshAbilityCards();
  }

  _drawSelectCard(x, y, w, h, opt, owned, selected) {
    var gfx = this.add.graphics();
    var title = this.add.text(x + 14, y + 14, opt.label, {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '14px',
      color: owned ? '#ffffff' : '#667788',
      letterSpacing: 2
    });
    var desc = this.add.text(x + 14, y + 38, opt.desc, {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '10px',
      color: owned ? '#8fa8b8' : '#445566',
      wordWrap: { width: w - 28 }
    });
    var status = this.add.text(x + w - 14, y + h - 22, '', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '11px',
      color: '#00ffaa',
      letterSpacing: 2
    }).setOrigin(1, 0);
    var hit = this.add.rectangle(x + w / 2, y + h / 2, w, h).setInteractive({ useHandCursor: true });
    return { x: x, y: y, w: w, h: h, opt: opt, owned: owned, selected: selected, gfx: gfx, title: title, desc: desc, status: status, hit: hit };
  }

  _drawCardState(card, hover) {
    card.gfx.clear();
    var color = card.opt.accent;
    card.gfx.fillStyle(card.selected ? color : 0x071827, card.selected ? 0.16 : 0.9);
    card.gfx.fillRect(card.x, card.y, card.w, card.h);
    card.gfx.lineStyle(card.selected ? 2 : 1, hover ? 0xffffff : color, card.owned ? 0.9 : 0.25);
    card.gfx.strokeRect(card.x, card.y, card.w, card.h);
    card.gfx.lineStyle(3, color, card.selected ? 1 : 0.35);
    card.gfx.lineBetween(card.x, card.y, card.x + card.w, card.y);
    card.status.setText(card.owned ? (card.selected ? 'SELECTED' : 'READY') : 'LOCKED');
    card.status.setStyle({ color: card.owned ? (card.selected ? '#00ffaa' : '#ffd700') : '#556677' });
  }

  _refreshCharacterCards() {
    this.charCards.forEach((card) => {
      card.owned = this.save.ownedCharacters.indexOf(card.opt.key) >= 0;
      card.selected = this.save.selectedCharacter === card.opt.key;
      this._drawCardState(card, false);
      card.hit.removeAllListeners();
      card.hit.on('pointerover', () => this._drawCardState(card, true));
      card.hit.on('pointerout', () => this._drawCardState(card, false));
      card.hit.on('pointerdown', () => {
        if (!card.owned) {
          this.scene.start('ShopScene');
          return;
        }
        this.save.selectedCharacter = card.opt.key;
        this._persistSelection();
        this._refreshCharacterCards();
      });
    });
  }

  _refreshAbilityCards() {
    this.abilityCards.forEach((card) => {
      card.owned = this.save.ownedAbilities.indexOf(card.opt.key) >= 0;
      card.selected = this.save.selectedAbilities.indexOf(card.opt.key) >= 0;
      this._drawCardState(card, false);
      card.hit.removeAllListeners();
      card.hit.on('pointerover', () => this._drawCardState(card, true));
      card.hit.on('pointerout', () => this._drawCardState(card, false));
      card.hit.on('pointerdown', () => {
        if (!card.owned) {
          this.scene.start('ShopScene');
          return;
        }
        var idx = this.save.selectedAbilities.indexOf(card.opt.key);
        if (idx >= 0) this.save.selectedAbilities.splice(idx, 1);
        else this.save.selectedAbilities.push(card.opt.key);
        this._persistSelection();
        this._refreshAbilityCards();
      });
    });
  }

  _persistSelection() {
    if (typeof saveGameSave === 'function') saveGameSave(this.save);
    if (typeof syncSelectionFromSave === 'function') syncSelectionFromSave();
  }

  _drawBottomButtons() {
    this._button(260, 555, 170, 42, 'TITLE', 0x00d4ff, () => {
      this._persistSelection();
      this.scene.start('TitleScene');
    });
    this._button(400, 555, 170, 42, 'SHOP', 0xffd700, () => {
      this._persistSelection();
      this.scene.start('ShopScene');
    });
    this._button(560, 555, 190, 42, 'MISSION START', 0x00ffaa, () => {
      this._persistSelection();
      this.scene.start('GameScene');
    });
  }

  _button(x, y, w, h, label, color, onClick) {
    var gfx = this.add.graphics();
    var draw = (hover) => {
      gfx.clear();
      gfx.fillStyle(color, hover ? 0.22 : 0.12);
      gfx.fillRect(x - w / 2, y - h / 2, w, h);
      gfx.lineStyle(2, color, hover ? 1 : 0.75);
      gfx.strokeRect(x - w / 2, y - h / 2, w, h);
    };
    draw(false);
    this.add.text(x, y, label, {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '12px',
      color: '#ffffff',
      letterSpacing: 3
    }).setOrigin(0.5);
    var hit = this.add.rectangle(x, y, w, h).setInteractive({ useHandCursor: true });
    hit.on('pointerover', function() { draw(true); });
    hit.on('pointerout', function() { draw(false); });
    hit.on('pointerdown', onClick);
  }
}
