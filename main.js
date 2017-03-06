var factoryCount = parseInt(readline()), // the number of factories
linkCount = parseInt(readline()), // the number of links between factories
currentFactoryTargetId = 0, //Identifier of the factory I want my factories to attack
me = 1,
round = 0;

/**
 * Dealing with links
 **/

//Getting the links between factories and their properties.
var links = [],
linksFromBase = []; //Base is the factory where I started (if we assume it's always 1).

for (var i = 0; i < linkCount; i++) {

    var inputs = readline().split(' ');
    
    var link = {
        fromFactory: parseInt(inputs[0]),
        toFactory: parseInt(inputs[1]),
        distance: parseInt(inputs[2])
    }
    
    links.push(link);
    
    if (link.fromFactory == 1) {
        linksFromBase.push(link);
    }
}

/* Helpers */

//Returns number. Distance from the base
function getByDistanceFromBase(entityId) {

    for (let i = 0; i < linksFromBase.length; i++) {
        if (linksFromBase[i].toFactory == entityId) { return linksFromBase[i].distance }
    }
}

//Returns number.
function turnsUntilAttackedByTroops(factoryId) {

    for (let i = 0; i < enemyTroops.length; i++) {
        if (enemyTroops[i].factoryTargetId === factoryId) {
            return enemyTroops[i].turnsUntilArrival;
        }
    }

    return -1; //not being attacked
}

//returns number.
function getTotalTroopsAttackingFactory(factoryId) {
    let total = 0;

    for (let i = 0; i < enemyTroops.length; i++) {
        if (enemyTroops[i].factoryTargetId === factoryId) {
            total += enemyTroops[i].numberOfCyborgs;
        }
    }

    return total;
}

//Returns an array of objects of all the attacks on the given factory.
function getTroopsAttackIntelOnFactory(factoryId) {
    let attacksOnFactory = [];

    for (let i = 0; i < enemyTroops.length; i++) {
        if (enemyTroops[i].factoryTargetId === factoryId) {
            attacksOnFactory.push(enemyTroops[i]);
        }
    }

    return attacksOnFactory;
}

//Builds an action then adds it to the overall actions
function buildActionAndAddToActions(outputs) {
    let action = '';

    for (let i = 0; i < outputs.length; i++) {
        action += (action.length > 0) ? ' ' + outputs[i] : outputs[i];        
    }

    if (actions.length !== 0) { action = ';' + action }
    actions += action;
}

/**
 * Game loop
 **/
 while (true) {

    //General
    var entityCount = parseInt(readline()), // the number of entities (e.g. factories and troops)
    entities = [],
    factories = [],
    troops = [];
    
    //Mine
    var myFactories = [],
    myTroops = [],
    myBombs = [];

    //Neutral
    var neutralFactories = [],
    neutralFactoriesWithNoProduction = [];
    
    //Enemy
    var enemyFactories = [],
    enemyFactoriesWithNoProduction = [],
    enemyTroops = [],
    enemyBombs = [];
    
    //Gameplay
    var currentFactoryTargetGroup = [],
    currentFactoryDefendingGroup = [],
    actions = '';
    
    //Organising the inputs
    for (let i = 0; i < entityCount; i++) {
        var inputs = readline().split(' ');
        
        var entity = {
            id: parseInt(inputs[0]),
            type: inputs[1],
            owner: parseInt(inputs[2])
        };

        switch (entity.type) {
            case 'FACTORY':
            entity.numberOfCyborgs = parseInt(inputs[3]);
            entity.production = parseInt(inputs[4]);
            entity.turnsUntilProducing = parseInt(inputs[5]);

            entity.distanceFromBase = getByDistanceFromBase(entity.id);
            
            factories.push(entity);
            
            if (entity.owner === 1) {
                myFactories.push(entity);
                
            } else if (entity.owner === 0) {

                if (entity.production === 0) {
                    neutralFactoriesWithNoProduction.push(entity);
                } else {
                    neutralFactories.push(entity);
                }

            } else {

                if (entity.production === 0) {
                    enemyFactoriesWithNoProduction.push(entity);
                } else {
                    enemyFactories.push(entity);
                }
            }

            break;

            case 'TROOP':
            entity.sentFromFactoryId = parseInt(inputs[3]);
            entity.factoryTargetId = parseInt(inputs[4]);
            entity.numberOfCyborgs = parseInt(inputs[5]);
            entity.turnsUntilArrival = parseInt(inputs[6]);
            
            troops.push(entity);
            
            if (entity.owner === me) {
                myTroops.push(entity);
            } else {
                enemyTroops.push(entity);
            }

            break;

            case 'BOMB':
            entity.launchedFromFactoryId = parseInt(inputs[3]);
            entity.factoryTargetId = parseInt(inputs[4]);
            entity.turnsUntilArrival = parseInt(inputs[5]);

            if (entity.owner === me) {
                myBombs.push(entity);
            } else {
                enemyBombs.push(entity);
            }

            break;
        } 

        
        entities.push(entity);
    }

    //Sometimes there is a high amount of neutral factories with no production. If that's the case, then I want to expand onto those as well.
    if (neutralFactoriesWithNoProduction.length >= factoryCount * .5) {
        neutralFactories = neutralFactories.concat(neutralFactoriesWithNoProduction);
    }

    //Updating my currentFactoryDefendingGroup
    for (let i = 0; i < myFactories.length; i++) {
        currentFactoryDefendingGroup.push(getTroopsAttackIntelOnFactory(myFactories[i].id));
    }
    
    
    //Updating my currentFactoryTargetGroup. If there are no neutral factories left to attack, I will move onto enemys' factories.
    if (neutralFactories.length > 0 ) {
        printErr('Attacking neutralFactories');
        currentFactoryTargetGroup = neutralFactories;
    } else if (enemyFactories.length > 0) {
        printErr('Attacking enemyFactories');
        currentFactoryTargetGroup = enemyFactories;
    } else {
        printErr('Nothing to attack anymore!');
        print('WAIT');
        continue;
    }
    
    //Sort factories from smallest to large distanceFromBase, so that my factories can attack in that order.
    neutralFactories.sort((a, b) => a.distanceFromBase - b.distanceFromBase);

    //Sort the enemies by distance then production. 
    enemyFactories.sort((a, b) => a.numberOfCyborgs - b.numberOfCyborgs);
    // enemyFactories.sort((a, b) => b.production - a.production);
    
    //Making my way round currentFactoryTargetGroup (currently from smallest to largest distance from base).
    if (currentFactoryTargetId >= currentFactoryTargetGroup.length - 1) {
        currentFactoryTargetId = 0;
    } else { 
        currentFactoryTargetId++; 
    }

    var currentFactoryTarget = currentFactoryTargetGroup[currentFactoryTargetId];
    
    /**
    * Dealing with my factories' actions
    **/
    for (let i = 0; i < myFactories.length; i++) {

        let myFactory = myFactories[i];
        let action = '';

        //Check if the target factory has 0 production. Only give it troops if it can increase in production straight after
        if (currentFactoryTarget.production === 0 && myFactory.numberOfCyborgs > currentFactoryTarget.numberOfCyborgs + 11) {
            printErr('Im factory', myFactory.id, 'and im sending', currentFactoryTarget.id, 'a starter kit');
            buildActionAndAddToActions(['MOVE', myFactory.id, currentFactoryTarget.id, currentFactoryTarget.numberOfCyborgs + 11]);
            continue;
        }  

        //Check if I'm going to be attacked by a bomb.
        //Because I can't track where the bomb will hit, not much I can do, so I will just hit them right back with a bomb
        if (enemyBombs.length > 0 && myFactory.id === 1) {
            printErr('About to be attacked by a bomb!! Lets send one back');

            let bombLaunchedFromId = enemyBombs[0].launchedFromFactoryId;

            buildActionAndAddToActions(['MOVE', myFactory.id, bombLaunchedFromId, 1]);

            for (let j = 0; j < neutralFactories.length; j++) {

                if (neutralFactories[j].production > 0 && neutralFactories[j].numberOfCyborgs < myFactory.numberOfCyborgs + 1) {
                    buildActionAndAddToActions(['MOVE', myFactory.id, neutralFactories[j].id, neutralFactories[j].numberOfCyborgs + 1]);   
                }
                
            }

            if (myBombs.length === 0) {
                buildActionAndAddToActions(['BOMB', myFactory.id, bombLaunchedFromId]);
            }
        }

        //Check if this factory should increase production
        if (myFactory.production < 3 && myFactory.numberOfCyborgs > 10 && turnsUntilAttackedByTroops(myFactory.id) <= 0) {
            printErr('Increasing my production! ', myFactory.id);
            buildActionAndAddToActions(['INC', myFactory.id]);
            continue;
        } 

        //Check if this factory is about to be attacked by troops. If true, then get my other factories to help defend it
        // if (turnsUntilAttackedByTroops(myFactory.id) > 0) {
        //     printErr('factory ', myFactory.id, 'is about to be attacked by troops');
        //     continue;
        // }

        if (turnsUntilAttackedByTroops(myFactory.id) <= 0) {
        for (let j = 0; j < currentFactoryDefendingGroup.length; j++) {

            for (let k = 0; k < currentFactoryDefendingGroup[j].length; k++) {

                if (currentFactoryDefendingGroup[j][k].factoryTargetId == myFactory.id ) { continue; }

                buildActionAndAddToActions(['MOVE', myFactory.id, currentFactoryDefendingGroup[j][k].factoryTargetId, 1]);
            }
            
        }
        }

        //Work out how many cyborgs this factory will send.
        //If this factory has more than the target's cyborgs, it will send an amount over that so that the factory becomes mine in only 1 round of troops.
        for (let j = 0; j < currentFactoryTargetGroup.length; j++) {
            let totalOfCyborgsToSend = 0;

            if (currentFactoryTargetGroup[j].numberOfCyborgs < myFactory.numberOfCyborgs + 10 && myFactory.production > 1) {
                totalOfCyborgsToSend = currentFactoryTargetGroup[j].numberOfCyborgs + 1;
            }

            buildActionAndAddToActions(['MOVE', myFactory.id, currentFactoryTargetGroup[j].id, totalOfCyborgsToSend]);
        }

        // buildActionAndAddToActions(['MOVE', myFactory.id, currentFactoryTarget.id, totalOfCyborgsToSend]);
        
    }
    

    /* Before we end the turn */
    round++;
    if (actions.length === 0) { actions += 'WAIT'}
    print(actions);
}