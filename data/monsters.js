const monsters = {
  charmander: {
    position: {
      x: 280,
      y: 325
    },
    image: {
      src: './img/charmanderSprite.png'
    },
    frames: {
      max: 4,
      hold: 30
    },
    animate: true,
    name: 'charmander',
    attacks: [
      attacks.Tackle,
      attacks.FlameBurst,
      attacks.CinderHeal,
      attacks.BlazingGuard
    ]
  },
  squirtle: {
    position: {
      x: 280,
      y: 325
    },
    image: {
      src: './img/squirtle.png'
    },
    frames: {
      max: 4,
      hold: 30
    },
    animate: true,
    name: 'Squirtle',
    attacks: [
      attacks.ShockWave,
      attacks.AquaJet,
      attacks.TidalRecover,
      attacks.BubbleBarrier
    ]
  },
  bulbasaur: {
    position: {
      x: 280,
      y: 325
    },
    image: {
      src: './img/bulbasaur.png'
    },
    frames: {
      max: 4,
      hold: 30
    },
    animate: true,
    name: 'Bulbasaur',
    attacks: [
      attacks.PoisonStink,
      attacks.VineWhip,
      attacks.NatureMend,
      attacks.LeafGuard
    ]
  },
  Draggle: {
    position: {
      x: 800,
      y: 100
    },
    image: {
      src: './img/draggleSprite.png'
    },
    frames: {
      max: 4,
      hold: 30
    },
    animate: true,
    isEnemy: true,
    name: 'Draggle',
    attacks: [attacks.Tackle, attacks.Fireball, attacks.BlazingGuard]
  }
}
