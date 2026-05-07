var GAME_STORE_KEY = 'tacticalShooterSaveV1';

var CHARACTER_ITEMS = [
  { key: 'normal', label: 'RANGER', desc: 'Balanced speed and health.', price: 0, accent: 0x00d4ff, accentHex: '#00d4ff' },
  { key: 'fast', label: 'SCOUT', desc: 'Moves faster, lighter armor.', price: 120, accent: 0x00ffaa, accentHex: '#00ffaa' },
  { key: 'tank', label: 'VANGUARD', desc: 'Heavy armor and high HP.', price: 160, accent: 0xff6644, accentHex: '#ff6644' }
];

var ABILITY_ITEMS = [
  { key: 'doubleShot', label: 'TWIN FIRE', desc: 'Shoots two bullets at once.', price: 150, accent: 0xffd700, accentHex: '#ffd700' },
  { key: 'speedBullet', label: 'HYPERBOLT', desc: 'Bullets travel faster.', price: 150, accent: 0xff44aa, accentHex: '#ff44aa' },
  { key: 'iceBullet', label: 'ICE ROUND', desc: 'Hits slow enemies for 3 seconds.', price: 150, accent: 0x7dd3fc, accentHex: '#7dd3fc' },
  { key: 'poisonBullet', label: 'TOXIN ROUND', desc: '1 second slow, then 1 HP damage every 3 seconds for 6 seconds.', price: 150, accent: 0x8cff66, accentHex: '#8cff66' }
];

function getGameSave() {
  var fallback = {
    coins: 0,
    totalKills: 0,
    ownedCharacters: ['normal'],
    ownedAbilities: [],
    selectedCharacter: 'normal',
    selectedAbilities: []
  };
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    var parsed = JSON.parse(window.localStorage.getItem(GAME_STORE_KEY) || '{}');
    var save = Object.assign({}, fallback, parsed);
    save.ownedCharacters = Array.isArray(save.ownedCharacters) ? save.ownedCharacters : ['normal'];
    save.ownedAbilities = Array.isArray(save.ownedAbilities) ? save.ownedAbilities : [];
    save.selectedAbilities = Array.isArray(save.selectedAbilities) ? save.selectedAbilities : [];
    if (save.ownedCharacters.indexOf('normal') < 0) save.ownedCharacters.push('normal');
    if (save.ownedCharacters.indexOf(save.selectedCharacter) < 0) save.selectedCharacter = 'normal';
    save.selectedAbilities = save.selectedAbilities.filter(function(key) {
      return save.ownedAbilities.indexOf(key) >= 0;
    });
    return save;
  } catch (err) {
    return fallback;
  }
}

function saveGameSave(save) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(GAME_STORE_KEY, JSON.stringify(save));
}

function syncSelectionFromSave() {
  var save = getGameSave();
  if (typeof window !== 'undefined') {
    window.SELECTION = {
      character: save.selectedCharacter || 'normal',
      abilities: (save.selectedAbilities || []).slice()
    };
  }
  return save;
}

function addCoinsForKills(kills) {
  var save = getGameSave();
  var gained = Math.max(0, kills || 0) * 3;
  save.coins += gained;
  save.totalKills += Math.max(0, kills || 0);
  saveGameSave(save);
  syncSelectionFromSave();
  return gained;
}

if (typeof window !== 'undefined') {
  window.getGameSave = getGameSave;
  window.saveGameSave = saveGameSave;
  window.syncSelectionFromSave = syncSelectionFromSave;
  window.addCoinsForKills = addCoinsForKills;
  window.CHARACTER_ITEMS = CHARACTER_ITEMS;
  window.ABILITY_ITEMS = ABILITY_ITEMS;
}

class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' });
  }

  create() {
    this.save = getGameSave();
    this._drawBackground();
    this._drawHeader();
    this._drawItems();
    this._drawBackButton();
  }

  _drawBackground() {
    var W = this.scale.width, H = this.scale.height;
    var bg = this.add.graphics();
    bg.fillGradientStyle(0x030914, 0x061420, 0x07101c, 0x02050c, 1);
    bg.fillRect(0, 0, W, H);
    bg.lineStyle(1, 0x143044, 0.55);
    for (var y = 0; y < H; y += 40) bg.lineBetween(0, y, W, y);
    for (var x = 0; x < W; x += 40) bg.lineBetween(x, 0, x, H);
  }

  _drawHeader() {
    this.add.text(40, 28, 'SHOP', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '30px',
      color: '#00d4ff',
      letterSpacing: 6
    });
    this.coinText = this.add.text(760, 34, 'COINS ' + this.save.coins, {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '18px',
      color: '#ffd700',
      letterSpacing: 2
    }).setOrigin(1, 0);
    this.add.text(40, 70, 'Earn 3 coins per enemy kill. New abilities cost about 50 kills.', {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '12px',
      color: '#8fa8b8'
    });
  }

  _drawItems() {
    this.add.text(40, 112, 'ABILITIES', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '13px',
      color: '#00ffaa',
      letterSpacing: 5
    });
    for (var i = 0; i < ABILITY_ITEMS.length; i++) {
      this._drawShopCard(60 + (i % 2) * 360, 145 + Math.floor(i / 2) * 112, 320, 86, ABILITY_ITEMS[i], 'ability');
    }

    this.add.text(40, 380, 'CHARACTERS', {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '13px',
      color: '#00ffaa',
      letterSpacing: 5
    });
    for (var c = 0; c < CHARACTER_ITEMS.length; c++) {
      this._drawShopCard(60 + c * 240, 414, 210, 92, CHARACTER_ITEMS[c], 'character');
    }
  }

  _drawShopCard(x, y, w, h, item, type) {
    var ownedList = type === 'character' ? this.save.ownedCharacters : this.save.ownedAbilities;
    var owned = ownedList.indexOf(item.key) >= 0;
    var affordable = this.save.coins >= item.price;
    var gfx = this.add.graphics();
    var draw = (hover) => {
      gfx.clear();
      gfx.fillStyle(owned ? item.accent : 0x071827, owned ? 0.12 : 0.92);
      gfx.fillRect(x, y, w, h);
      gfx.lineStyle(owned ? 2 : 1, hover ? 0xffffff : item.accent, owned || affordable ? 0.9 : 0.35);
      gfx.strokeRect(x, y, w, h);
      gfx.lineStyle(3, item.accent, owned ? 1 : 0.45);
      gfx.lineBetween(x, y, x + w, y);
    };
    draw(false);

    this.add.text(x + 14, y + 14, item.label, {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '14px',
      color: owned ? '#ffffff' : item.accentHex,
      letterSpacing: 2
    });
    this.add.text(x + 14, y + 38, item.desc, {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '10px',
      color: '#8fa8b8',
      wordWrap: { width: w - 28 }
    });
    var status = owned ? 'OWNED' : (affordable ? item.price + ' COINS' : item.price + ' COINS');
    var statusColor = owned ? '#00ffaa' : (affordable ? '#ffd700' : '#556677');
    this.add.text(x + w - 14, y + h - 22, status, {
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: '11px',
      color: statusColor,
      letterSpacing: 2
    }).setOrigin(1, 0);

    if (!owned) {
      var hit = this.add.rectangle(x + w / 2, y + h / 2, w, h).setInteractive({ useHandCursor: true });
      hit.on('pointerover', function() { draw(true); });
      hit.on('pointerout', function() { draw(false); });
      hit.on('pointerdown', () => {
        if (this.save.coins < item.price) {
          this._toast('NOT ENOUGH COINS', 0xff4466);
          return;
        }
        this.save.coins -= item.price;
        ownedList.push(item.key);
        saveGameSave(this.save);
        this.scene.restart();
      });
    }
  }

  _drawBackButton() {
    this._button(400, 555, 220, 42, 'BACK TO TITLE', 0x00d4ff, () => {
      syncSelectionFromSave();
      this.scene.start('TitleScene');
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
      fontSize: '13px',
      color: '#ffffff',
      letterSpacing: 3
    }).setOrigin(0.5);
    var hit = this.add.rectangle(x, y, w, h).setInteractive({ useHandCursor: true });
    hit.on('pointerover', function() { draw(true); });
    hit.on('pointerout', function() { draw(false); });
    hit.on('pointerdown', onClick);
  }

  _toast(message, color) {
    var txt = this.add.text(400, 92, message, {
      fontFamily: '"Orbitron", "Courier New", monospace',
      fontSize: '14px',
      color: '#' + (color || 0xffffff).toString(16).padStart(6, '0'),
      letterSpacing: 3
    }).setOrigin(0.5);
    this.tweens.add({ targets: txt, alpha: 0, y: 76, duration: 900, onComplete: function() { txt.destroy(); } });
  }
}
