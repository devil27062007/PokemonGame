const monster = {
    Emby : {
        position : {
            x : 250 ,
            y : 325
        },
        image : {
            src : './images/embySprite.png'
        },
        frames : {
            max : 4 ,
            hold : 30
        },
        animate : true ,
        name : 'Emby' ,
        attacks : [attacks.Tackle , attacks.Fireball]
    }
}