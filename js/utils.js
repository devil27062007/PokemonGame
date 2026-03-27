function rectangularCollision( { rectangle1 , rectangle2 })
{
    return (
        rectangle1.position.x + rectangle1.width >= rectangle2.position.x &&
        rectangle1.position.x <= rectangle2.position.x + rectangle2.width &&
        rectangle1.position.y <= rectangle2.position.y + rectangle2.height &&
        rectangle1.position.y + rectangle1.height >= rectangle2.position.y
    )
}

function checkForCharacterCollision({
    characters,
    players,
    characterOffset = { x : 0 , y : 0}
})
{
    players.interactionAsset = null
    for( let i=0 ; i < characterOffset.length ; i++)
    {
        const character =character[i]
        if(rectangularCollision({
            rectangle1 : player ,
            rectangle2 : {
                ...character,
                position : {
                    x : character.position.x + characterOffset.x,
                    y : character.position.y + characterOffset.y
                }
            }
        }))
        {
            player.interactionAsset = character
            break
        }
    }
}