const battleBackgroundImage = new Image()
battleBackgroundImage.src = './images/battleBackground.png'
const battleBackground = new Sprite({
    position: {
        x: 0,
        y: 0
    },
    image: battleBackgroundImage
})

const draggleImage = new Image()
draggleImage.src = './images/draggleSprite.png'
const draggle = new Sprite({
    position: {
        x: 800,
        y: 100
    },
    image: draggleImage,
    frames: {
        max: 4,
        hold: 30
    },
    animate: true,
    isEnemy: true,
    name: 'Draggle'
})

const embyImage = new Image()
embyImage.src = './images/embySprite.png'
const emby = new Sprite({
    position: {
        x: 280,
        y: 325
    },
    image: embyImage,
    frames: {
        max: 4,
        hold: 30
    },
    animate: true,
    name: 'Emby'
})

const renderedSprites = [draggle, emby]
function animateBattle() {
    window.requestAnimationFrame(animateBattle)
    c.drawImage(battleBackgroundImage, 0, 0, canvas.width, canvas.height)

    renderedSprites.forEach((sprite) => {
        sprite.draw()
    })
}

// animate()
animateBattle()

const queue = []

//event listeners - attack button
document.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
        const selectedAttack = attacks[e.currentTarget.innerHTML]
        emby.attack({
            attack: selectedAttack,
            recipient: draggle,
            renderedSprites
        })

        queue.push(() => {
            draggle.attack({
                attack: attacks.Tackle,
                recipient: emby,
                renderedSprites
            })
        })

        queue.push(() => {
            draggle.attack({
                attack: attacks.Fireball,
                recipient: emby,
                renderedSprites
            })
        })
    })
})

document.querySelector('#dialogueBox').addEventListener('click', (e) => {
    if (queue.length > 0) {
        queue[0]()
        queue.shift()
    } else e.currentTarget.style.display = 'none'
})

//for size
const battleLayout = {
    draggle: {
        xRatio: 800 / 1024,
        yRatio: 100 / 576
    },
    emby: {
        xRatio: 280 / 1024,
        yRatio: 325 / 576
    }
}

//for size
function updateBattleSpritePositions() {
    draggle.position.x = canvas.width * battleLayout.draggle.xRatio
    draggle.position.y = canvas.height * battleLayout.draggle.yRatio
    emby.position.x = canvas.width * battleLayout.emby.xRatio
    emby.position.y = canvas.height * battleLayout.emby.yRatio
}
updateBattleSpritePositions()
