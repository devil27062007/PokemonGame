class Sprite {
  constructor({
    position,
    velocity,
    image,
    frames = { max: 1, hold: 10 },
    sprites,
    animate = false,
    rotation = 0,
    scale = 1
  }) {
    this.position = position
    this.image = new Image()
    this.frames = { ...frames, val: 0, elapsed: 0 }
    this.image.onload = () => {
      this.width = (this.image.width / this.frames.max) * scale
      this.height = this.image.height * scale
    }
    this.image.src = image.src

    this.animate = animate
    this.sprites = sprites
    this.opacity = 1

    this.rotation = rotation
    this.scale = scale
  }

  draw(deltaMs = 1000 / 60) {
    c.save()
    c.translate(
      this.position.x + this.width / 2,
      this.position.y + this.height / 2
    )
    c.rotate(this.rotation)
    c.translate(
      -this.position.x - this.width / 2,
      -this.position.y - this.height / 2
    )
    c.globalAlpha = this.opacity

    const crop = {
      position: {
        x: this.frames.val * (this.width / this.scale),
        y: 0
      },
      width: this.image.width / this.frames.max,
      height: this.image.height
    }

    const image = {
      position: {
        x: this.position.x,
        y: this.position.y
      },
      width: this.image.width / this.frames.max,
      height: this.image.height
    }

    c.drawImage(
      this.image,
      crop.position.x,
      crop.position.y,
      crop.width,
      crop.height,
      image.position.x,
      image.position.y,
      image.width * this.scale,
      image.height * this.scale
    )

    c.restore()

    if (!this.animate) return

    if (this.frames.max <= 1) return

    this.frames.elapsed += deltaMs / (1000 / 60)

    while (this.frames.elapsed >= this.frames.hold) {
      this.frames.elapsed -= this.frames.hold
      if (this.frames.val < this.frames.max - 1) this.frames.val++
      else this.frames.val = 0
    }
  }
}

class Monster extends Sprite {
  constructor({
    position,
    velocity,
    image,
    frames = { max: 1, hold: 10 },
    sprites,
    animate = false,
    rotation = 0,
    isEnemy = false,
    name,
    attacks,
    maxHealth = 100
  }) {
    super({
      position,
      velocity,
      image,
      frames,
      sprites,
      animate,
      rotation
    })
    this.maxHealth = maxHealth
    this.health = maxHealth
    this.shieldPoints = 0
    this.isEnemy = isEnemy
    this.name = name
    this.attacks = attacks
  }

  faint() {
    document.querySelector('#dialogueBox').innerHTML = this.name + ' fainted!'
    gsap.to(this.position, {
      y: this.position.y + 20
    })
    gsap.to(this, {
      opacity: 0
    })
    audio.battle.stop()
    audio.victory.play()
  }

  attack({ attack, recipient, renderedSprites, onComplete }) {
    if (!attack) {
      if (onComplete) onComplete()
      return
    }

    document.querySelector('#dialogueBox').style.display = 'block'
    document.querySelector('#dialogueBox').innerHTML =
      this.name + ' used ' + attack.name

    const getHealthSelectors = (monster) => {
      if (monster.isEnemy) {
        return {
          healthBar: '#enemyHealthBar',
          healthValue: '#enemyHealthValue'
        }
      }
      return {
        healthBar: '#playerHealthBar',
        healthValue: '#playerHealthValue'
      }
    }

    let rotation = 1
    if (this.isEnemy) rotation = -2.2

    const updateHealthUi = (monster) => {
      const { healthBar, healthValue } = getHealthSelectors(monster)
      updateMonsterHealthUI({
        healthBarSelector: healthBar,
        healthValueSelector: healthValue,
        currentHealth: monster.health,
        maxHealth: monster.maxHealth
      })
    }

    const getMonsterCenter = (monster) => {
      return {
        x: monster.position.x + ((monster.width || 0) / 2),
        y: monster.position.y + ((monster.height || 0) / 2)
      }
    }

    const showFloatingText = ({ text, x, y, color = '#ffffff' }) => {
      const effectsLayer = document.querySelector('#battleEffects')
      if (!effectsLayer) return

      const node = document.createElement('div')
      node.style.position = 'absolute'
      node.style.left = `${x}px`
      node.style.top = `${y}px`
      node.style.transform = 'translate(-50%, -50%)'
      node.style.color = color
      node.style.fontSize = '12px'
      node.style.fontWeight = '700'
      node.style.pointerEvents = 'none'
      node.style.textShadow = '-1px 0 #111, 0 1px #111, 1px 0 #111, 0 -1px #111'
      node.innerHTML = text
      effectsLayer.append(node)

      gsap.to(node, {
        y: -28,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => node.remove()
      })
    }

    const animateRecipientImpact = () => {
      if (!recipient) return

      gsap.to(recipient.position, {
        x: recipient.position.x + 10,
        yoyo: true,
        repeat: 5,
        duration: 0.05
      })

      gsap.to(recipient, {
        opacity: 0,
        yoyo: true,
        repeat: 5,
        duration: 0.08
      })
    }

    const applyDamage = (hitSound = audio.tackleHit) => {
      if (!recipient) {
        if (onComplete) onComplete()
        return
      }

      hitSound.play()

      const incomingDamage = Number(attack.damage) || 0
      const blockedDamage = Math.min(recipient.shieldPoints || 0, incomingDamage)
      recipient.shieldPoints = Math.max(0, (recipient.shieldPoints || 0) - blockedDamage)
      const damageDealt = Math.min(incomingDamage - blockedDamage, recipient.health)
      recipient.health = Math.max(0, recipient.health - damageDealt)

      document.querySelector('#dialogueBox').innerHTML =
        blockedDamage > 0
          ? recipient.name + ' took ' + damageDealt + ' damage (' + blockedDamage + ' blocked)!'
          : recipient.name + ' took ' + damageDealt + ' damage!'

      updateHealthUi(recipient)

      if (damageDealt > 0) {
        showDamagePopup({
          amount: damageDealt,
          recipient
        })
        animateRecipientImpact()
      }

      if (blockedDamage > 0) {
        const center = getMonsterCenter(recipient)
        showFloatingText({
          text: 'Shield -' + blockedDamage,
          x: center.x,
          y: center.y - 26,
          color: '#8fd4ff'
        })
      }

      if (onComplete) onComplete()
    }

    const applyHeal = () => {
      const healAmount = Number(attack.heal) || 0
      const healed = Math.min(healAmount, this.maxHealth - this.health)
      this.health = Math.min(this.maxHealth, this.health + healed)
      updateHealthUi(this)

      const center = getMonsterCenter(this)
      showFloatingText({
        text: '+' + healed + ' HP',
        x: center.x,
        y: center.y - 26,
        color: '#8dff8f'
      })

      document.querySelector('#dialogueBox').innerHTML =
        this.name + ' recovered ' + healed + ' HP!'

      if (onComplete) onComplete()
    }

    const applyShield = () => {
      const shieldAmount = Number(attack.shield) || 0
      this.shieldPoints = (this.shieldPoints || 0) + shieldAmount

      const center = getMonsterCenter(this)
      showFloatingText({
        text: '+' + shieldAmount + ' Shield',
        x: center.x,
        y: center.y - 26,
        color: '#7fd4ff'
      })

      document.querySelector('#dialogueBox').innerHTML =
        this.name + ' gained shield +' + shieldAmount + '!'

      if (onComplete) onComplete()
    }

    const createEffectNode = ({ width, height, borderRadius = '999px', background, boxShadow }) => {
      const node = document.createElement('div')
      node.style.position = 'absolute'
      node.style.width = width
      node.style.height = height
      node.style.borderRadius = borderRadius
      node.style.pointerEvents = 'none'
      node.style.transform = 'translate(-50%, -50%)'
      node.style.background = background
      if (boxShadow) node.style.boxShadow = boxShadow
      return node
    }

    const launchFireProjectile = () => {
      if (!recipient) {
        if (onComplete) onComplete()
        return
      }

      audio.initFireball.play()
      const fireballImage = new Image()
      fireballImage.src = './img/fireball.png'
      const fireball = new Sprite({
        position: {
          x: this.position.x,
          y: this.position.y
        },
        image: fireballImage,
        frames: {
          max: 4,
          hold: 10
        },
        animate: true,
        rotation
      })
      renderedSprites.splice(1, 0, fireball)

      gsap.to(fireball.position, {
        x: recipient.position.x,
        y: recipient.position.y,
        onComplete: () => {
          applyDamage(audio.fireballHit)
          renderedSprites.splice(1, 1)
        }
      })
    }

    const launchShockWave = () => {
      const effectsLayer = document.querySelector('#battleEffects')
      if (!effectsLayer || !recipient) {
        applyDamage(audio.tackleHit)
        return
      }

      const start = getMonsterCenter(this)
      const end = getMonsterCenter(recipient)
      const wave = createEffectNode({
        width: '34px',
        height: '34px',
        background: 'radial-gradient(circle at 30% 30%, #cff6ff, #2d79ff)',
        boxShadow: '0 0 24px #2f6eff'
      })
      wave.style.left = `${start.x}px`
      wave.style.top = `${start.y}px`
      effectsLayer.append(wave)

      for (let i = 0; i < 3; i++) {
        const ring = createEffectNode({
          width: '34px',
          height: '34px',
          background: 'transparent'
        })
        ring.style.border = '2px solid rgba(132, 197, 255, 0.9)'
        ring.style.left = '50%'
        ring.style.top = '50%'
        wave.append(ring)

        gsap.fromTo(
          ring,
          { scale: 0.5, opacity: 0.9 },
          {
            scale: 2.2,
            opacity: 0,
            duration: 0.6,
            delay: i * 0.12,
            repeat: 1
          }
        )
      }

      gsap.to(wave, {
        left: `${end.x}px`,
        top: `${end.y}px`,
        duration: 0.42,
        ease: 'power2.out',
        onComplete: () => {
          applyDamage(audio.tackleHit)
          gsap.to(wave, {
            scale: 2,
            opacity: 0,
            duration: 0.2,
            onComplete: () => wave.remove()
          })
        }
      })
    }

    const launchPoisonStink = () => {
      const effectsLayer = document.querySelector('#battleEffects')
      if (!effectsLayer || !recipient) {
        applyDamage(audio.tackleHit)
        return
      }

      const start = getMonsterCenter(this)
      const end = getMonsterCenter(recipient)
      const cloud = createEffectNode({
        width: '40px',
        height: '40px',
        background: 'radial-gradient(circle at 30% 30%, #adff8b, #2ca84a)',
        boxShadow: '0 0 20px #2ca84a'
      })
      cloud.style.left = `${start.x}px`
      cloud.style.top = `${start.y}px`
      effectsLayer.append(cloud)

      for (let i = 0; i < 6; i++) {
        const puff = createEffectNode({
          width: '12px',
          height: '12px',
          background: 'radial-gradient(circle at 30% 30%, #d6ffbe, #36b954)'
        })
        puff.style.left = '50%'
        puff.style.top = '50%'
        cloud.append(puff)
        gsap.to(puff, {
          x: Math.cos((Math.PI * 2 * i) / 6) * 14,
          y: Math.sin((Math.PI * 2 * i) / 6) * 14,
          yoyo: true,
          repeat: -1,
          duration: 0.35,
          ease: 'sine.inOut'
        })
      }

      gsap.to(cloud, {
        left: `${end.x}px`,
        top: `${end.y}px`,
        duration: 0.5,
        ease: 'power1.out',
        onComplete: () => {
          applyDamage(audio.tackleHit)
          gsap.to(cloud, {
            scale: 2.4,
            opacity: 0,
            duration: 0.28,
            onComplete: () => cloud.remove()
          })
        }
      })
    }

    const launchHealEffect = () => {
      const effectsLayer = document.querySelector('#battleEffects')
      if (!effectsLayer) {
        applyHeal()
        return
      }

      const center = getMonsterCenter(this)
      const aura = createEffectNode({
        width: '36px',
        height: '36px',
        background: 'radial-gradient(circle at 30% 30%, #d8ffd5, #45bc66)',
        boxShadow: '0 0 24px #53c572'
      })
      aura.style.left = `${center.x}px`
      aura.style.top = `${center.y}px`
      effectsLayer.append(aura)

      gsap.fromTo(
        aura,
        { scale: 0.6, opacity: 0.6 },
        {
          scale: 2.2,
          opacity: 0,
          duration: 0.45,
          onComplete: () => {
            aura.remove()
            applyHeal()
          }
        }
      )
    }

    const launchShieldEffect = () => {
      const effectsLayer = document.querySelector('#battleEffects')
      if (!effectsLayer) {
        applyShield()
        return
      }

      const center = getMonsterCenter(this)
      const shield = createEffectNode({
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        background: 'rgba(70, 180, 255, 0.14)',
        boxShadow: '0 0 24px #58b8ff'
      })
      shield.style.border = '2px solid rgba(140, 220, 255, 0.95)'
      shield.style.left = `${center.x}px`
      shield.style.top = `${center.y}px`
      effectsLayer.append(shield)

      gsap.fromTo(
        shield,
        { scale: 0.8, opacity: 0.4 },
        {
          scale: 1.3,
          opacity: 0,
          duration: 0.45,
          onComplete: () => {
            shield.remove()
            applyShield()
          }
        }
      )
    }

    switch (attack.name) {
      case 'Fireball':
      case 'Flame Burst':
        launchFireProjectile()
        break
      case 'Shock Wave':
        launchShockWave()
        break
      case 'Poison Stink':
        launchPoisonStink()
        break
      case 'Cinder Heal':
      case 'Tidal Recover':
      case 'Nature Mend':
        launchHealEffect()
        break
      case 'Blazing Guard':
      case 'Bubble Barrier':
      case 'Leaf Guard':
        launchShieldEffect()
        break
      case 'Aqua Jet':
      case 'Vine Whip':
        applyDamage(audio.tackleHit)
        break
      case 'Tackle':
        const tl = gsap.timeline()

        let movementDistance = 20
        if (this.isEnemy) movementDistance = -20

        tl.to(this.position, {
          x: this.position.x - movementDistance
        })
          .to(this.position, {
            x: this.position.x + movementDistance * 2,
            duration: 0.1,
            onComplete: () => {
              applyDamage(audio.tackleHit)
            }
          })
          .to(this.position, {
            x: this.position.x
          })
        break
      default:
        if (attack.kind === 'heal') {
          launchHealEffect()
          break
        }
        if (attack.kind === 'shield') {
          launchShieldEffect()
          break
        }
        applyDamage(audio.tackleHit)
        break
    }
  }
}

class Boundary {
  static width = 48
  static height = 48
  constructor({ position }) {
    this.position = position
    this.width = 48
    this.height = 48
  }

  draw() {
    c.fillStyle = 'rgba(255, 0, 0, 0)'
    c.fillRect(this.position.x, this.position.y, this.width, this.height)
  }
}

class Character extends Sprite {
  constructor({
    position,
    velocity,
    image,
    frames = { max: 1, hold: 10 },
    sprites,
    animate = false,
    rotation = 0,
    scale = 1,
    dialogue = ['']
  }) {
    super({
      position,
      velocity,
      image,
      frames,
      sprites,
      animate,
      rotation,
      scale
    })

    this.dialogue = dialogue
    this.dialogueIndex = 0
  }
}
