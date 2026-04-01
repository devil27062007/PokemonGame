function rectangularCollision({ rectangle1, rectangle2 }) {
    return (
        rectangle1.position.x + rectangle1.width >= rectangle2.position.x &&
        rectangle1.position.x <= rectangle2.position.x + rectangle2.width &&
        rectangle1.position.y <= rectangle2.position.y + rectangle2.height &&
        rectangle1.position.y + rectangle1.height >= rectangle2.position.y
    )
}

function checkForCharacterCollision({
    characters,
    player,
    characterOffset = { x: 0, y: 0 }
}) {
    player.interactionAsset = null

    for (let i = 0; i < characters.length; i++) {
        const character = characters[i]

        if (
            rectangularCollision({
                rectangle1: player,
                rectangle2: {
                    ...character,
                    position: {
                        x: character.position.x + characterOffset.x,
                        y: character.position.y + characterOffset.y
                    }
                }
            })
        ) {
            player.interactionAsset = character
            break

        }
    }
}

function getHealthGradient(percentage) {
    if (percentage > 50) {
        return {
            start: '#29b500',
            end: '#128f00'
        }
    }
    if (percentage > 25) {
        return {
            start: '#e8be00',
            end: '#d19400'
        }
    }
    return {
        start: '#e84d3d',
        end: '#bd1e1e'
    }
}

function updateMonsterHealthUI({
    healthBarSelector,
    healthValueSelector,
    currentHealth,
    maxHealth = 100,
    animate = true
}) {
    const clampedHealth = Math.max(0, Math.min(currentHealth, maxHealth))
    const hpPercent = (clampedHealth / maxHealth) * 100
    const healthBar = document.querySelector(healthBarSelector)
    const healthValue = document.querySelector(healthValueSelector)

    if (healthBar) {
        const targetWidth = hpPercent + '%'
        const gradient = getHealthGradient(hpPercent)

        if (animate && typeof gsap !== 'undefined') {
            gsap.to(healthBar, {
                width: targetWidth,
                duration: 0.35,
                ease: 'power2.out'
            })
        } else {
            healthBar.style.width = targetWidth
        }
        healthBar.style.background = `linear-gradient(90deg, ${gradient.start} 0%, ${gradient.end} 100%)`
    }
    if (healthValue) {
        healthValue.innerHTML = `${Math.round(clampedHealth)} / ${maxHealth} HP`
    }
}

function showDamagePopup({ amount, recipient }) {
    const effectsLayer = document.querySelector('#battleEffects')

    if (!effectsLayer || !recipient) return

    const popup = document.createElement('div')
    popup.className = 'damage-popup'
    const damageValue = Number.isFinite(amount) ? amount : Number(amount) || 0
    popup.innerHTML = `-${damageValue}`

    const x = recipient.position.x + (recipient.width || 0) / 2
    const y = recipient.position.y + 4

    popup.style.left = `${x}px`
    popup.style.top = `${y}px`
    effectsLayer.append(popup)

    if (typeof gsap !== 'undefined') {
        gsap.fromTo(
            popup,
            {
                opacity: 1,
                y: 0,
                scale: 1
            },
            {
                opacity: 0,
                y: -40,
                scale: 1.05,
                duration: 0.9,
                ease: 'power2.out',
                onComplete: () => {
                    popup.remove()
                }
            }
        )
    } else {
        setTimeout(() => {
            popup.remove()
        }, 900)
    }
}