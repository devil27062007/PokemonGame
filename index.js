const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
c.imageSmoothingEnabled = false

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const howToPlayButton = document.querySelector('#howToPlayBtn')
const howToPlayOverlay = document.querySelector('#howToPlayOverlay')
const closeHowToPlayButton = document.querySelector('#closeHowToPlayBtn')
const loadingScreen = document.querySelector('#loadingScreen')
const loadingStatus = document.querySelector('#loadingStatus')
const loadingBarFill = document.querySelector('#loadingBarFill')
const loadingPercent = document.querySelector('#loadingPercent')

const imageAssetPaths = [
  './img/Pellet Town.png',
  './img/foregroundObjects.png',
  './img/playerDown.png',
  './img/playerUp.png',
  './img/playerLeft.png',
  './img/playerRight.png',
  './img/battleBackground.png',
  './img/bg.png',
  './img/villager/Idle.png',
  './img/oldMan/Idle.png',
  './img/charmanderSprite.png',
  './img/squirtle.png',
  './img/bulbasaur.png',
  './img/draggleSprite.png',
  './img/fireball.png',
  './img/encounter1.png',
  './img/encounter2.png'
]

const audioAssetHowls = Object.values(audio || {}).filter((value) => {
  return value && typeof value.once === 'function'
})

function updateLoadingProgress(done, total, label) {
  const safeTotal = Math.max(1, total)
  const percent = Math.min(100, Math.round((done / safeTotal) * 100))
  if (loadingBarFill) loadingBarFill.style.width = `${percent}%`
  if (loadingPercent) loadingPercent.textContent = `${percent}%`
  if (loadingStatus && label) loadingStatus.textContent = label
}

function loadImageAsset(path) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ ok: true, path })
    img.onerror = () => resolve({ ok: false, path })
    img.src = path
  })
}

function loadHowlAsset(howl, label) {
  return new Promise((resolve) => {
    const finish = (ok) => resolve({ ok, label })

    if (howl.state && howl.state() === 'loaded') {
      finish(true)
      return
    }

    howl.once('load', () => finish(true))
    howl.once('loaderror', () => finish(false))

    try {
      howl.load()
    } catch (error) {
      finish(false)
    }
  })
}

async function preloadGameAssets() {
  const uniqueImageAssets = [...new Set(imageAssetPaths)]
  const totalAssets = uniqueImageAssets.length + audioAssetHowls.length
  let doneAssets = 0

  updateLoadingProgress(0, totalAssets, 'Loading images and audio assets...')

  for (const imagePath of uniqueImageAssets) {
    await loadImageAsset(imagePath)
    doneAssets++
    updateLoadingProgress(doneAssets, totalAssets, `Loading image: ${imagePath.split('/').pop()}`)
  }

  for (const [index, howl] of audioAssetHowls.entries()) {
    await loadHowlAsset(howl, `audio-${index}`)
    doneAssets++
    updateLoadingProgress(doneAssets, totalAssets, `Loading audio ${index + 1}/${audioAssetHowls.length}...`)
  }

  updateLoadingProgress(totalAssets, totalAssets, 'Loading complete. Starting game...')
}

let hasStartedGame = false

async function startGame() {
  if (hasStartedGame) return
  hasStartedGame = true

  try {
    await preloadGameAssets()
  } catch (error) {
    if (loadingStatus) loadingStatus.textContent = 'Some assets failed, starting anyway...'
  }

  setTimeout(() => {
    if (loadingScreen) {
      loadingScreen.classList.add('hidden')
    }
    animate()
  }, 220)
}

window.startGame = startGame

function isHowToPlayOpen() {
  return howToPlayOverlay && howToPlayOverlay.classList.contains('open')
}

function openHowToPlay() {
  if (!howToPlayOverlay) return
  howToPlayOverlay.classList.add('open')
  howToPlayOverlay.setAttribute('aria-hidden', 'false')
  resetOverworldInputState()
}

function closeHowToPlay() {
  if (!howToPlayOverlay) return
  howToPlayOverlay.classList.remove('open')
  howToPlayOverlay.setAttribute('aria-hidden', 'true')
}

if (howToPlayButton) {
  howToPlayButton.addEventListener('click', (e) => {
    e.stopPropagation()
    openHowToPlay()
  })
}

if (closeHowToPlayButton) {
  closeHowToPlayButton.addEventListener('click', (e) => {
    e.stopPropagation()
    closeHowToPlay()
  })
}

if (howToPlayOverlay) {
  howToPlayOverlay.addEventListener('click', (e) => {
    if (e.target === howToPlayOverlay) {
      closeHowToPlay()
    }
  })
}

const collisionsData =
  typeof collisions !== 'undefined' && Array.isArray(collisions)
    ? collisions
    : Array.isArray(window.collisions)
      ? window.collisions
      : []

const battleZonesDataset =
  typeof battleZonesData !== 'undefined' && Array.isArray(battleZonesData)
    ? battleZonesData
    : Array.isArray(window.battleZonesData)
      ? window.battleZonesData
      : []

const charactersDataset =
  typeof charactersMapData !== 'undefined' && Array.isArray(charactersMapData)
    ? charactersMapData
    : Array.isArray(window.charactersMapData)
      ? window.charactersMapData
      : []

if (battleZonesDataset.length === 0) {
  console.warn('battleZonesData missing. Battles will be disabled until data/battleZones.js loads correctly.')
}

const collisionsMap = []
for (let i = 0; i < collisionsData.length; i += 70) {
  collisionsMap.push(collisionsData.slice(i, 70 + i))
}

const battleZonesMap = []
for (let i = 0; i < battleZonesDataset.length; i += 70) {
  battleZonesMap.push(battleZonesDataset.slice(i, 70 + i))
}

const charactersMap = []
for (let i = 0; i < charactersDataset.length; i += 70) {
  charactersMap.push(charactersDataset.slice(i, 70 + i))
}


const boundaries = []
const offset = {
  x: -735,
  y: -650
}

collisionsMap.forEach((row, i) => {
  row.forEach((symbol, j) => {
    if (symbol === 1025)
      boundaries.push(
        new Boundary({
          position: {
            x: j * Boundary.width + offset.x,
            y: i * Boundary.height + offset.y
          }
        })
      )
  })
})

const battleZones = []

battleZonesMap.forEach((row, i) => {
  row.forEach((symbol, j) => {
    if (symbol === 1025)
      battleZones.push(
        new Boundary({
          position: {
            x: j * Boundary.width + offset.x,
            y: i * Boundary.height + offset.y
          }
        })
      )
  })
})

const characters = []
const villagerImg = new Image()
villagerImg.src = './img/villager/Idle.png'

const oldManImg = new Image()
oldManImg.src = './img/oldMan/Idle.png'

charactersMap.forEach((row, i) => {
  row.forEach((symbol, j) => {
    // 1026 === villager
    if (symbol === 1026) {
      characters.push(
        new Character({
          position: {
            x: j * Boundary.width + offset.x,
            y: i * Boundary.height + offset.y
          },
          image: villagerImg,
          frames: {
            max: 4,
            hold: 60
          },
          scale: 3,
          animate: true,
          dialogue: ['...', 'Hey mister , Have you seen my Doggochu ?']
        })
      )
    }
    // 1031 === oldMan
    else if (symbol === 1031) {
      characters.push(
        new Character({
          position: {
            x: j * Boundary.width + offset.x,
            y: i * Boundary.height + offset.y
          },
          image: oldManImg,
          frames: {
            max: 4,
            hold: 60
          },
          scale: 3,
          dialogue: ['My bones hurt .']
        })
      )
    }

    if (symbol !== 0) {
      boundaries.push(
        new Boundary({
          position: {
            x: j * Boundary.width + offset.x,
            y: i * Boundary.height + offset.y
          }
        })
      )
    }
  })
})

const image = new Image()
image.src = './img/Pellet Town.png'

const worldBackdropImage = new Image()
worldBackdropImage.src = './img/bg.png'

const foregroundImage = new Image()
foregroundImage.src = './img/foregroundObjects.png'

const playerDownImage = new Image()
playerDownImage.src = './img/playerDown.png'

const playerUpImage = new Image()
playerUpImage.src = './img/playerUp.png'

const playerLeftImage = new Image()
playerLeftImage.src = './img/playerLeft.png'

const playerRightImage = new Image()
playerRightImage.src = './img/playerRight.png'

const player = new Sprite({
  position: {
    x: canvas.width / 2 - 192 / 4 / 2 - 250,
    y: canvas.height / 2 - 68 / 2 - 115
  },
  image: playerDownImage,
  frames: {
    max: 4,
    hold: 10
  },
  sprites: {
    up: playerUpImage,
    left: playerLeftImage,
    right: playerRightImage,
    down: playerDownImage
  }
})

const background = new Sprite({
  position: {
    x: offset.x,
    y: offset.y
  },
  image: image
})

const foreground = new Sprite({
  position: {
    x: offset.x,
    y: offset.y
  },
  image: foregroundImage
})

const keys = {
  w: {
    pressed: false
  },
  a: {
    pressed: false
  },
  s: {
    pressed: false
  },
  d: {
    pressed: false
  }
}

const movables = [
  background,
  ...boundaries,
  foreground,
  ...battleZones,
  ...characters
]
const renderables = [
  background,
  ...boundaries,
  ...battleZones,
  ...characters,
  player,
  foreground
]

const battle = {
  initiated: false
}

function ensureTownMapAudio() {
  if (battle.initiated) return
  if (!audio.Map.playing()) {
    audio.Map.play()
  }
}

function getBaseFrameDuration() {
  return 1000 / 60
}

function getWorldSpeedPerBaseFrame() {
  return 3
}
let lastFrameTime = 0

function resetOverworldInputState() {
  keys.w.pressed = false
  keys.a.pressed = false
  keys.s.pressed = false
  keys.d.pressed = false
  player.animate = false
  lastKey = ''
}

function restartOverworldAnimation() {
  lastFrameTime = 0
  resetOverworldInputState()
  animate()
}

function tryMoveWorld({ x, y }) {
  checkForCharacterCollision({
    characters,
    player,
    characterOffset: { x, y }
  })

  for (let i = 0; i < boundaries.length; i++) {
    const boundary = boundaries[i]
    if (
      rectangularCollision({
        rectangle1: player,
        rectangle2: {
          ...boundary,
          position: {
            x: boundary.position.x + x,
            y: boundary.position.y + y
          }
        }
      })
    ) {
      return false
    }
  }

  movables.forEach((movable) => {
    movable.position.x += x
    movable.position.y += y
  })

  return true
}

function moveWorldInSteps({ x, y }) {
  const maxStep = getWorldSpeedPerBaseFrame()
  const distance = Math.hypot(x, y)

  if (distance === 0) return

  const steps = Math.max(1, Math.ceil(distance / maxStep))
  const stepX = x / steps
  const stepY = y / steps

  for (let i = 0; i < steps; i++) {
    if (!tryMoveWorld({ x: stepX, y: stepY })) break
  }
}

function animate(currentTime = 0) {
  const animationId = window.requestAnimationFrame(animate)
  const baseFrameDuration = getBaseFrameDuration()
  let deltaMs = baseFrameDuration
  if (lastFrameTime !== 0) {
    deltaMs = currentTime - lastFrameTime
    if (deltaMs > 250) deltaMs = baseFrameDuration
  }
  lastFrameTime = currentTime

  const movementDistance =
    getWorldSpeedPerBaseFrame() * (deltaMs / baseFrameDuration)

  c.clearRect(0, 0, canvas.width, canvas.height)
  if (worldBackdropImage.complete && worldBackdropImage.naturalWidth > 0) {
    c.drawImage(worldBackdropImage, 0, 0, canvas.width, canvas.height)
  } else {
    c.fillStyle = 'black'
    c.fillRect(0, 0, canvas.width, canvas.height)
  }

  renderables.forEach((renderable) => {
    renderable.draw(deltaMs)
  })

  player.animate = false

  if (battle.initiated) return

  // activate a battle
  if (keys.w.pressed || keys.a.pressed || keys.s.pressed || keys.d.pressed) {
    for (let i = 0; i < battleZones.length; i++) {
      const battleZone = battleZones[i]
      const overlappingArea =
        (Math.min(
          player.position.x + player.width,
          battleZone.position.x + battleZone.width
        ) -
          Math.max(player.position.x, battleZone.position.x)) *
        (Math.min(
          player.position.y + player.height,
          battleZone.position.y + battleZone.height
        ) -
          Math.max(player.position.y, battleZone.position.y))
      if (
        rectangularCollision({
          rectangle1: player,
          rectangle2: battleZone
        }) &&
        overlappingArea > (player.width * player.height) / 2 &&
        Math.random() < 0.01
      ) {
        // deactivate current animation loop
        resetOverworldInputState()
        window.cancelAnimationFrame(animationId)

        audio.Map.stop()
        audio.victory.stop()
        audio.initBattle.play()
        audio.battle.play()

        battle.initiated = true
        gsap.to('#overlappingDiv', {
          opacity: 1,
          repeat: 3,
          yoyo: true,
          duration: 0.4,
          onComplete() {
            gsap.to('#overlappingDiv', {
              opacity: 1,
              duration: 0.4,
              onComplete() {
                // activate a new animation loop
                initBattle()
                animateBattle()
                gsap.to('#overlappingDiv', {
                  opacity: 0,
                  duration: 0.4
                })
              }
            })
          }
        })
        break
      }
    }
  }

  if (keys.w.pressed && lastKey === 'w') {
    player.animate = true
    player.image = player.sprites.up

    moveWorldInSteps({ x: 0, y: movementDistance })
  } else if (keys.a.pressed && lastKey === 'a') {
    player.animate = true
    player.image = player.sprites.left

    moveWorldInSteps({ x: movementDistance, y: 0 })
  } else if (keys.s.pressed && lastKey === 's') {
    player.animate = true
    player.image = player.sprites.down

    moveWorldInSteps({ x: 0, y: -movementDistance })
  } else if (keys.d.pressed && lastKey === 'd') {
    player.animate = true
    player.image = player.sprites.right

    moveWorldInSteps({ x: -movementDistance, y: 0 })
  }
}
// animate()
let lastKey = ''
window.addEventListener('keydown', (e) => {
  ensureTownMapAudio()

  if (isHowToPlayOpen()) {
    if (e.key === 'Escape') closeHowToPlay()
    return
  }

  if (player.isInteracting) {
    switch (e.key) {
      case ' ':
        player.interactionAsset.dialogueIndex++

        const { dialogueIndex, dialogue } = player.interactionAsset
        if (dialogueIndex <= dialogue.length - 1) {
          document.querySelector('#characterDialogueBox').innerHTML =
            player.interactionAsset.dialogue[dialogueIndex]
          return
        }

        // finish conversation
        player.isInteracting = false
        player.interactionAsset.dialogueIndex = 0
        document.querySelector('#characterDialogueBox').style.display = 'none'

        break
    }
    return
  }

  switch (e.key) {
    case ' ':
      if (!player.interactionAsset) return


      const firstMessage = player.interactionAsset.dialogue[0]
      document.querySelector('#characterDialogueBox').innerHTML = firstMessage
      document.querySelector('#characterDialogueBox').style.display = 'flex'
      player.isInteracting = true
      break
    case 'w':
      keys.w.pressed = true
      lastKey = 'w'
      break
    case 'a':
      keys.a.pressed = true
      lastKey = 'a'
      break

    case 's':
      keys.s.pressed = true
      lastKey = 's'
      break

    case 'd':
      keys.d.pressed = true
      lastKey = 'd'
      break
  }
})

window.addEventListener('keyup', (e) => {
  switch (e.key) {
    case 'w':
      keys.w.pressed = false
      break
    case 'a':
      keys.a.pressed = false
      break
    case 's':
      keys.s.pressed = false
      break
    case 'd':
      keys.d.pressed = false
      break
  }
})

window.addEventListener('pointerdown', ensureTownMapAudio)
window.addEventListener('touchstart', ensureTownMapAudio)
window.addEventListener('mousedown', ensureTownMapAudio)
