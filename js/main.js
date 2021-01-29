/*
To do list

essential

* basic level generation /

* ability to click on a square to place a tower /

* turrets can only be placed on empty squares /

* enemy spawning and move /

* use lightning turret to avoid bullet maths /

* turrets use sprites and can animate to face enemies /

* turrets can shoot at enemies /

* each enemy has a health value and on collision bullets take away health /

* enemy path finding to the goal

* bullet are off by half their width

* fix bullet speed slowing down as they approach enemy

non-essential

* upgrade system for turrets

nice to have

* 

*/

/*
level map key
0 = empty space
1 = path
2 = enemy spawn
3 = base
*/

/*
blank map

[
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0]
]

*/

/* resource loader */
(function() {
  var resourceCache = {};
  var loading = [];
  var readyCallbacks = [];

  // Load an image url or an array of image urls
  function load(urlOrArr) {
      if(urlOrArr instanceof Array) {
          urlOrArr.forEach(function(url) {
              _load(url);
          });
      }
      else {
          _load(urlOrArr);
      }
  }

  function _load(url) {
      if(resourceCache[url]) {
          return resourceCache[url];
      }
      else {
          var img = new Image();
          img.onload = function() {
              resourceCache[url] = img;

              if(isReady()) {
                  readyCallbacks.forEach(function(func) { func(); });
              }
          };
          resourceCache[url] = false;
          img.src = url;
      }
  }

  function get(url) {
      return resourceCache[url];
  }

  function isReady() {
      var ready = true;
      for(var k in resourceCache) {
          if(resourceCache.hasOwnProperty(k) &&
             !resourceCache[k]) {
              ready = false;
          }
      }
      return ready;
  }

  function onReady(func) {
      readyCallbacks.push(func);
  }

  window.resources = { 
      load: load,
      get: get,
      onReady: onReady,
      isReady: isReady
  };
})();

resources.load([
  './sprites/turret_base.png',
  './sprites/turret_basic.png',
  './sprites/turret_machine.png',
  './sprites/turret_missile.png',
  './sprites/turret_tesla.png',

  './sprites/enemy_maggot.png',

  './sprites/tile_base.png',
  './sprites/tile_enemy_base.png',
  './sprites/tile_path.png',
  './sprites/tile_grass.png',
  './sprites/tile_sand.png',
  './sprites/tile_snow.png'
]);
resources.onReady(main);

/* globally used vars */
let canvasHeight = 800;
let canvasWidth = 800;

let cellHeight = canvasHeight/10;
let cellWidth = canvasWidth/10;

/* default turret stats */
const turret_stats = {
  basic:{
    reload:2,
    damage:1
  },
  machine:{
    reload:1,
    damage:1
  },
  missile:{
    reload:5,
    damage:2
  },
  tesla:{
    reload:3,
    damage:1
  }
}

/* sprite set up */

let turret_base = new Image();
let turret_basic = new Image();
let turret_machine = new Image();
let turret_missile = new Image();
let turret_tesla = new Image();

let enemy_maggot = new Image();

let tile_base = new Image();
let tile_enemy_base = new Image();
let tile_path = new Image();
let tile_grass = new Image();
let tile_sand = new Image();
let tile_snow = new Image();

turret_base.src = './sprites/turret_base.png';
turret_basic.src = './sprites/turret_basic.png';
turret_machine.src = './sprites/turret_machine.png';
turret_missile.src = './sprites/turret_missile.png';
turret_tesla.src = './sprites/turret_tesla.png';

enemy_maggot.src = './sprites/enemy_maggot.png';

tile_base.src = './sprites/tile_base.png';
tile_enemy_base.src = './sprites/tile_enemy_base.png';
tile_path.src = './sprites/tile_path.png';
tile_grass.src = './sprites/tile_grass.png';
tile_sand.src = './sprites/tile_sand.png';
tile_snow.src = './sprites/tile_snow.png';


/* MAP functions */

var level_test1 = [
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,3,0,0,0,0,0],
  [0,0,0,0,1,0,0,0,0,0],
  [0,1,1,1,1,0,0,0,0,0],
  [0,1,0,0,0,0,0,0,0,0],
  [0,1,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,0,0,1,0],
  [2,1,1,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,0,0,0,0]
]

var level_test2 = [
  [0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,0,1,1,3,0],
  [0,1,0,0,1,0,1,0,0,0],
  [0,1,1,0,1,0,1,1,1,0],
  [0,0,1,0,1,0,0,0,1,0],
  [0,1,1,0,1,0,0,0,1,0],
  [0,1,0,0,1,0,0,0,1,0],
  [0,1,1,0,1,0,0,0,1,0],
  [0,0,2,0,1,1,1,1,1,0],
  [0,0,0,0,0,0,0,0,0,0]
]

var level_test3 = [
  [0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,0,0,0,0,1,0],
  [0,1,0,0,0,0,0,0,1,0],
  [0,1,0,0,0,0,0,0,1,0],
  [0,1,0,0,0,0,0,0,1,0],
  [0,1,0,0,0,0,0,0,1,0],
  [0,1,0,0,0,0,0,0,1,0],
  [0,2,0,0,0,0,0,0,3,0],
  [0,0,0,0,0,0,0,0,0,0]
]

const renderMap = ( grid ) => {

  grid.forEach( (row, rowInd) => {
    row.forEach( (cell, cellInd) => {
      
      switch(cell){
        case 0:
          ctx.drawImage(tile_grass, cellInd*cellWidth, rowInd*cellHeight, cellWidth, cellHeight)
          break;
        case 1:
          ctx.drawImage(tile_path, cellInd*cellWidth, rowInd*cellHeight, cellWidth, cellHeight)
          break;
        case 2:
          ctx.drawImage(tile_enemy_base, cellInd*cellWidth, rowInd*cellHeight, cellWidth, cellHeight)
          break;
        case 3:
          ctx.drawImage(tile_base, cellInd*cellWidth, rowInd*cellHeight, cellWidth, cellHeight)
          break;
      }
    } );
   });

}

const renderTurretBases = ( grid ) => {
  grid.forEach( (row, rowInd) => {
    row.forEach( (cell, cellInd) => {
      
      switch(cell){
        default:
          ctx.drawImage(turret_base, cellInd*cellWidth, rowInd*cellHeight, cellWidth, cellHeight)
        case 0:
          break;
      }
    } );
   });
}

const renderTurrets = () => {
  turrets.forEach( (turret) => {
    //rotate the canvas to draw the rotated turret
    ctx.translate(turret.pos[0], turret.pos[1]);
    ctx.rotate(turret.rotation);
    ctx.translate(-(turret.pos[0]), -(turret.pos[1]));

    //pick which sprite to show based on type
    switch(turret.type){
      case 1:
        ctx.drawImage(turret_basic, turret.pos[0]-(cellWidth/2), turret.pos[1]-(cellHeight/2), cellWidth, cellHeight)
        break;
      case 2:
        ctx.drawImage(turret_machine, turret.pos[0]-(cellWidth/2), turret.pos[1]-(cellHeight/2), cellWidth, cellHeight)
        break;
      case 3:
        ctx.drawImage(turret_missile, turret.pos[0]-(cellWidth/2), turret.pos[1]-(cellHeight/2), cellWidth, cellHeight)
        break;
      case 4:
        ctx.drawImage(turret_tesla, turret.pos[0]-(cellWidth/2), turret.pos[1]-(cellHeight/2), cellWidth, cellHeight)
        break;
    }

    // Reset transformation matrix to the identity matrix
    ctx.setTransform(1, 0, 0, 1, 0, 0);

  } )
}

const renderEnemies = () => {
  enemies.forEach( (enemy) => {
    switch(enemy.type){
      case 'maggot':
        ctx.drawImage(enemy_maggot, enemy.pos[0]-20, enemy.pos[1]-10, 40, 20)
        break;
    }
  } )
}

const renderBullets = () => {
  bullets.forEach( (bullet) => {
    switch (bullet.type){
      case 4:
        //rotate the canvas to draw the rotated bullet
        ctx.translate(bullet.pos[0], bullet.pos[1]);
        ctx.rotate(bullet.rotation);
        ctx.translate(-(bullet.pos[0]), -(bullet.pos[1]));

        ctx.fillStyle = 'rgba(255, 255, 0, '+bullet.transparency+')';
        ctx.fillRect(bullet.pos[0], bullet.pos[1], dist_between_points(bullet.pos,bullet.target.pos), 5 );

        // Reset transformation matrix to the identity matrix
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        break;
        break;
      default:
        //rotate the canvas to draw the rotated bullet
        ctx.translate(bullet.pos[0], bullet.pos[1]);
        ctx.rotate(bullet.rotation);
        ctx.translate(-(bullet.pos[0]), -(bullet.pos[1]));

        ctx.fillStyle = 'yellow';
        ctx.fillRect(bullet.pos[0], bullet.pos[1], 10, 5 );

        // Reset transformation matrix to the identity matrix
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        break;
    }
  })
}

const updateEnemies = (dt, index) => {
  enemies.forEach( (enemy) => {
    enemy.pos[0] += (10 * dt);
    if(enemy.health <= 0){
      enemies.splice(index, 1)
    }
  })
}

const updateTurrets = (dt) => {
  turrets.forEach( (turret) =>{

    turret.current_reload += dt;

    //decide whic enemy to target
    //(for now its always enemies[0])
    if(enemies.length <= 0){
      return
    }

    turret.target = enemies[0];

    //get turret to point at enemy
    delta_x = turret.pos[0] - turret.target.pos[0]
    delta_y = turret.pos[1] - turret.target.pos[1]
    theta_radians = Math.atan2(delta_y, delta_x);

    turret.rotation = theta_radians;

    //when turret reload timer is above its reload fire
    if(turret.current_reload > turret.reload){
      turret.current_reload = 0;0
      bullets.push({
        pos: [turret.pos[0],turret.pos[1]],
        rotation: 0,
        target: turret.target,
        damage: 1,
        type:turret.type,
        life:0
      })
    }

  })
}

let bulletSpeed = 1;

const updateBullets = (dt) => {
  bullets.forEach( (bullet, index) => {

    switch (bullet.type){
      case 4:
        //get bullet to point at enemy
        delta_x = bullet.target.pos[0] - bullet.pos[0] 
        delta_y = bullet.target.pos[1] - bullet.pos[1]
        theta_radians = Math.atan2(delta_y, delta_x);

        bullet.rotation = theta_radians;
        bullet.life += dt;
        bullet.transparency = 1-bullet.life;

        if(bullet.transparency <= 0){
          bullets.splice(index, 1)
          bullet.target.health -= bullet.damage
        }
        break;
      default:
        //get bullet to point at enemy
        delta_x = bullet.target.pos[0] - bullet.pos[0] 
        delta_y = bullet.target.pos[1] - bullet.pos[1]
        theta_radians = Math.atan2(delta_y, delta_x);

        bullet.rotation = theta_radians;
        bullet.pos[0] += (delta_x * bulletSpeed * dt);
        bullet.pos[1] += (delta_y * bulletSpeed * dt);

        if(delta_x < 20 && delta_y < 20){
          bullets.splice(index, 1)
          bullet.target.health -= bullet.damage
        }
        break;
    }
  })
}

const getLevelDetails = ( level ) => {
  //find the enemy spawn and the friendly base
  level.forEach( (row, rowInd) => {
    row.forEach( (cell, cellInd) => {
      switch(cell){
        case 2:
          enemy_base_pos = [(cellInd*cellWidth)+(cellWidth/2), (rowInd*cellHeight)+(cellHeight/2)];
          enemy_base_cell = [rowInd, cellInd]
          break;
        case 3:
          friendly_base_pos = [(cellInd*cellWidth)+(cellWidth/2), (rowInd*cellHeight)+(cellHeight/2)];
          friendly_base__cell = [rowInd, cellInd]
          break;
      }
    } );
   });

   //figure out the path between enemy spawn and friendly base


   console.log(findNextBlock(enemy_base_cell))


   console.log('friendly base: ',friendly_base__cell);
}

/* Math functions */
const dist_between_points = (pointA,pointB) => {
  return Math.sqrt( ((pointA[0]-pointB[0])*(pointA[0]-pointB[0])) + ((pointA[1]-pointB[1])*(pointA[1]-pointB[1])) );
}

/* game vars */

let current_level_tiles;
let current_level_turrets;

let enemies = [];
let turrets = [];
let bullets = [];

let enemy_base_pos = [];
let enemy_base_cell = [];
let friendly_base_pos = [];
let friendly_base__cell = [];

/* Canvas bits */

// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.height = canvasHeight;
canvas.width = canvasWidth;
document.body.appendChild(canvas);
ctx.imageSmoothingEnabled = false;

// The main game loop
lastTime = Date.now();
function main() {
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;

    update(dt);
    render();

    lastTime = now;
    requestAnimationFrame(main);
};

// update everything
function update(dt) {
  updateEnemies(dt);
  updateTurrets(dt);
  updateBullets(dt);
}

// Draw everything
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  renderMap(current_level_tiles);
  renderTurretBases(current_level_turrets);
  renderBullets();
  renderEnemies();
  renderTurrets();
};

//canvas click
canvas.addEventListener('click', (event) => {

  let clickX = event.layerX;
  let clickY = event.layerY;

  let tile_row = Math.floor( clickY/cellHeight );
  let tile_col = Math.floor( clickX/cellWidth );

  let selected_cell_tile = current_level_tiles[tile_row][tile_col];
  let selected_cell_turret = current_level_turrets[tile_row][tile_col];

  if( selected_cell_tile == 0 && selected_cell_turret == 0 ){
    // current_level_turrets[tile_row][tile_col] = 1;
    // let turret_type = Math.floor(Math.random() * 4) + 1 ;
    let turret_type = 4 ;
    current_level_turrets[tile_row][tile_col] = turret_type;
    let chosen_turret;
    switch (turret_type){
      case 1:
        chosen_turret = turret_stats.basic;
        break;
      case 2:
        chosen_turret = turret_stats.machine;
        break;
      case 3:
        chosen_turret = turret_stats.missile;
        break;
      case 4:
        chosen_turret = turret_stats.tesla;
        break;
    }
    turrets.push({
      type: turret_type,
      pos: [(tile_col*cellWidth)+(cellWidth/2), (tile_row*cellHeight)+(cellHeight/2)],
      rotation: 0,
      reload:chosen_turret.reload,
      current_reload:0,
      damage:chosen_turret.damage,
      target: null
    });
  }

});

current_level_tiles = level_test1;
current_level_turrets = [
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0]
]
getLevelDetails(current_level_tiles);
window.setInterval(()=>{

  enemies.push({
    pos: JSON.parse(JSON.stringify(enemy_base_pos)),
    rotation: 0,
    type: 'maggot',
    health: 10
  });

},5000)
