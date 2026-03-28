const battleBackgroundImage = new Image()
battleBackgroundImage.src = './images/battleBackground.png'
const battleBackground = new Sprite({
    position: {
        x: 0,
        y: 0
    },
    image: battleBackgroundImage
})

const draggle = new Monster(monsters.Draggle)
const emby = new Monster(monsters.Emby)

const renderedSprites = [draggle, emby]

const attackBox = document.querySelector('#attackBox')
attackBox.replaceChildren()

emby.attacks.forEach((attack) => {
    const button = document.createElement('button')
    button.innerHTML = attack.name
    attackBox.append(button)
})

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
attackBox.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
        const selectedAttack = attacks[e.currentTarget.innerHTML]
        emby.attack({
            attack: selectedAttack,
            recipient: draggle,
            renderedSprites
        })

        const randomAttack =
            draggle.attacks[Math.floor(Math.random() * draggle.attacks.length)]

        queue.push(() => {
            draggle.attack({
                attack: randomAttack,
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
