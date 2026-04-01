const battleBackgroundImage = new Image()
battleBackgroundImage.src = './img/battleBackground.png'
const battleBackground = new Sprite({
    position: {
        x: 0,
        y: 0
    },
    image: battleBackgroundImage
})

let draggle
let playerMonster
let renderedSprites
let battleAnimationId
let queue
let selectionPreviewMonsters = []
let battleLastFrameTime = 0

const playerMonsterKeys = ['charmander', 'bulbasaur', 'squirtle']

const selectionPreviewPositions = {
    charmander: { x: 0.20, y: 0.50 },
    bulbasaur: { x: 0.48, y: 0.50 },
    squirtle: { x: 0.76, y: 0.50 }
}

function getBattleRelativePositions() {
    return {
        player: { x: 0.30, y: 0.62 },
        enemy: { x: 0.78, y: 0.21 }
    }
}

function getCanvasPosition(relX, relY) {
    return {
        x: relX * canvas.width,
        y: relY * canvas.height
    }
}

function createPlayerMonster(monsterKey) {
    const positions = getBattleRelativePositions()
    return new Monster({
        ...monsters[monsterKey],
        position: getCanvasPosition(positions.player.x, positions.player.y)
    })
}

function endBattle() {
    gsap.to('#overlappingDiv', {
        opacity: 1,
        onComplete: () => {
            cancelAnimationFrame(battleAnimationId)
            restartOverworldAnimation()
            document.querySelector('#userInterface').style.display = 'none'
            document.querySelector('#userInterface').classList.remove('selection-mode')

            gsap.to('#overlappingDiv', {
                opacity: 0
            })

            battle.initiated = false
            audio.battle.stop()
            audio.victory.stop()
            if (!audio.Map.playing()) audio.Map.play()
        }
    })
}

function updatePlayerBattleUI() {
    if (!playerMonster) return

    document.querySelector('#playerMonsterName').innerHTML = playerMonster.name
    updateMonsterHealthUI({
        healthBarSelector: '#playerHealthBar',
        healthValueSelector: '#playerHealthValue',
        currentHealth: playerMonster.health,
        maxHealth: playerMonster.maxHealth,
        animate: false
    })
}

function setupAttackButtons() {
    const attacksBox = document.querySelector('#attacksBox')
    document.querySelector('#userInterface').classList.remove('selection-mode')
    document.querySelector('#battleActionPanel').style.display = 'flex'
    attacksBox.replaceChildren()

    const availableAttacks = (playerMonster.attacks || []).filter((attack) => {
        return attack && typeof attack.name === 'string'
    })

    availableAttacks.forEach((attack) => {
        const button = document.createElement('button')
        button.innerHTML = attack.name
        attacksBox.append(button)

        button.addEventListener('click', () => {
            const selectedAttack = attack

            playerMonster.attack({
                attack: selectedAttack,
                recipient: draggle,
                renderedSprites,
                onComplete: () => {
                    if (draggle.health <= 0) {
                        queue.push(() => {
                            draggle.faint()
                        })
                        queue.push(() => {
                            endBattle()
                        })
                        return
                    }

                    const enemyAttacks = (draggle.attacks || []).filter((enemyAttack) => {
                        return enemyAttack && typeof enemyAttack.name === 'string'
                    })

                    if (enemyAttacks.length === 0) return

                    const randomAttack =
                        enemyAttacks[Math.floor(Math.random() * enemyAttacks.length)]

                    queue.push(() => {
                        draggle.attack({
                            attack: randomAttack,
                            recipient: playerMonster,
                            renderedSprites,
                            onComplete: () => {
                                if (playerMonster.health <= 0) {
                                    queue.push(() => {
                                        playerMonster.faint()
                                    })
                                    queue.push(() => {
                                        endBattle()
                                    })
                                }
                            }
                        })
                    })
                }
            })
        })

        button.addEventListener('mouseenter', () => {
            const selectedAttack = attack
            document.querySelector('#attackType').innerHTML = selectedAttack.type
            document.querySelector('#attackType').style.color = selectedAttack.color
        })
    })
}

function setupMonsterSelectionUI() {
    document.querySelector('#userInterface').classList.add('selection-mode')
    document.querySelector('#battleActionPanel').style.display = 'none'

    selectionPreviewMonsters = playerMonsterKeys.map((monsterKey) => {
        return new Monster({
            ...monsters[monsterKey],
            position: getCanvasPosition(
                selectionPreviewPositions[monsterKey].x,
                selectionPreviewPositions[monsterKey].y
            )
        })
    })

    renderedSprites = [...selectionPreviewMonsters]

    const optionButtons = document.querySelectorAll('.monster-option')
    optionButtons.forEach((button) => {
        const monsterKey = button.dataset.monsterKey
        const monster = monsters[monsterKey]
        const label = monster.name.charAt(0).toUpperCase() + monster.name.slice(1)
        const attackNames = (monster.attacks || [])
            .filter((attack) => attack && typeof attack.name === 'string')
            .map((attack) => attack.name)
            .join(', ')

        const nameNode = button.querySelector('.monster-option-name')
        const attacksNode = button.querySelector('.monster-option-attacks')
        if (nameNode) nameNode.innerHTML = label
        if (attacksNode) attacksNode.innerHTML = attackNames

        button.onclick = () => {
            playerMonster = createPlayerMonster(monsterKey)
            selectionPreviewMonsters = []
            renderedSprites = [draggle, playerMonster]
            updatePlayerBattleUI()
            setupAttackButtons()
            document.querySelector('#attackType').innerHTML = 'Attack Type'
            document.querySelector('#attackType').style.color = 'black'
        }
    })
}

function initBattle() {
    battleLastFrameTime = 0
    document.querySelector('#userInterface').style.display = 'block'
    document.querySelector('#userInterface').classList.remove('selection-mode')
    document.querySelector('#dialogueBox').style.display = 'none'
    document.querySelector('#attacksBox').replaceChildren()
    document.querySelector('#battleEffects').replaceChildren()
    document.querySelector('#battleActionPanel').style.display = 'flex'

    const positions = getBattleRelativePositions()

    playerMonster = null
    selectionPreviewMonsters = []
    draggle = new Monster({
        ...monsters.Draggle,
        position: getCanvasPosition(positions.enemy.x, positions.enemy.y)
    })

    updateMonsterHealthUI({
        healthBarSelector: '#enemyHealthBar',
        healthValueSelector: '#enemyHealthValue',
        currentHealth: draggle.maxHealth,
        maxHealth: draggle.maxHealth,
        animate: false
    })

    updateMonsterHealthUI({
        healthBarSelector: '#playerHealthBar',
        healthValueSelector: '#playerHealthValue',
        currentHealth: 0,
        maxHealth: 100,
        animate: false
    })

    document.querySelector('#playerMonsterName').innerHTML = 'choose'
    document.querySelector('#playerHealthValue').innerHTML = '-- / -- HP'

    renderedSprites = [draggle]
    queue = []

    setupMonsterSelectionUI()
}

function animateBattle(currentTime = 0) {
    battleAnimationId = window.requestAnimationFrame(animateBattle)
    const baseFrameDuration = 1000 / 60
    let deltaMs = baseFrameDuration
    if (battleLastFrameTime !== 0) {
        deltaMs = currentTime - battleLastFrameTime
        if (deltaMs > 250) deltaMs = baseFrameDuration
    }
    battleLastFrameTime = currentTime

    const isSelectingMonster = selectionPreviewMonsters.length > 0 && !playerMonster

    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
    }

    c.save()
    c.setTransform(1, 0, 0, 1, 0, 0)
    c.clearRect(0, 0, canvas.width, canvas.height)
    if (isSelectingMonster) {
        c.filter = 'blur(8px)'
        c.drawImage(battleBackground.image, 0, 0, canvas.width, canvas.height)
        c.filter = 'none'
        c.fillStyle = 'rgba(0, 0, 0, 0.45)'
        c.fillRect(0, 0, canvas.width, canvas.height)
    } else {
        c.drawImage(battleBackground.image, 0, 0, canvas.width, canvas.height)
    }
    c.restore()

    if (draggle) {
        const positions = getBattleRelativePositions()
        draggle.position.x = positions.enemy.x * canvas.width
        draggle.position.y = positions.enemy.y * canvas.height
    }

    if (playerMonster) {
        const positions = getBattleRelativePositions()
        playerMonster.position.x = positions.player.x * canvas.width
        playerMonster.position.y = positions.player.y * canvas.height
    }

    if (selectionPreviewMonsters.length > 0) {
        selectionPreviewMonsters.forEach((monster, index) => {
            const monsterKey = playerMonsterKeys[index]
            monster.position.x = selectionPreviewPositions[monsterKey].x * canvas.width
            monster.position.y = selectionPreviewPositions[monsterKey].y * canvas.height
        })
    }

    renderedSprites.forEach((sprite) => {
        sprite.draw(deltaMs)
    })
}

if (typeof window.startGame === 'function') {
    window.startGame()
} else {
    animate()
}

document.querySelector('#dialogueBox').addEventListener('click', (e) => {
    if (queue.length > 0) {
        queue[0]()
        queue.shift()
    } else {
        e.currentTarget.style.display = 'none'
    }
})
