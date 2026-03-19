# 탑다운 슈팅 게임

## 폴더 구조 (전역변수 방식, import/export 미사용)

```
shooting-game/
├── index.html          # 진입점, 스크립트 로드 순서: Phaser → objects → scenes → main
├── libs/
│   └── phaser.min.js   # Phaser 3 라이브러리
└── src/
    ├── main.js         # 게임 설정, 씬 등록 (Title → CharacterSelect → Game)
    ├── scenes/         # 씬
    │   ├── TitleScene.js           # 초기화면 (게임 시작 버튼)
    │   ├── CharacterSelectScene.js # 캐릭터·능력 선택
    │   └── GameScene.js            # 메인 플레이
    └── objects/        # 게임 오브젝트
        ├── Player.js   # 플레이어 (HP바, 이동)
        ├── Bullet.js   # 총알
        └── Enemy.js    # 적 (HP바, 다양한 방향 이동, 총알 발사)
```

- **캐릭터**: 일반 / 스피드 / 탱크 (window.SELECTION.character)
- **능력**: 더블샷, 속사 (window.SELECTION.abilities)
- **플레이어**: 5회 피격 시 사망 → 팝업에서 "다시 시작" 또는 "초기화면으로"
