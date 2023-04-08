var config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};
var game = new Phaser.Game(config);
// var nodes = [];
function preload() {
    this.load.image('ship', 'assets/spaceShips_001.png');
    this.load.image('otherPlayer', 'assets/enemyBlack5.png');
    this.load.image('node', 'assets/node.png');
    this.load.image('check', 'assets/check.png');
    this.load.image('new_node', 'assets/new_node.png');
}


function create() {
    textarea = document.querySelector('textarea');
    this.keys = this.input.keyboard.addKeys({
        // space: Phaser.Input.Keyboard.KeyCodes.SPACE,
        new_node: Phaser.Input.Keyboard.KeyCodes.ONE,
        create_node: Phaser.Input.Keyboard.KeyCodes.TWO,
        ZoomIn: Phaser.Input.Keyboard.KeyCodes.NINE,
        ZoomOut: Phaser.Input.Keyboard.KeyCodes.EIGHT
    });
    var self = this;
    this.socket = io();
    this.socket.on('playerMoved', function (playerInfo) {
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (playerInfo.playerId === otherPlayer.playerId) {
                otherPlayer.setRotation(playerInfo.rotation);
                otherPlayer.setPosition(playerInfo.x, playerInfo.y);
            }
        });
    });
    this.otherPlayers = this.physics.add.group();
    this.socket.on('currentPlayers', function (players) {
        Object.keys(players).forEach(function (id) {
            if (players[id].playerId === self.socket.id) {
                addPlayer(self, players[id]);
            } else {
                addOtherPlayers(self, players[id]);
            }
        });
    });
    this.socket.on('newPlayer', function (playerInfo) {
        addOtherPlayers(self, playerInfo);
    });
    this.socket.on('disconnect', function (playerId) {
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (playerId === otherPlayer.playerId) {
                otherPlayer.destroy();
            }
        });
    });
    this.socket.on('nodeAdded', function (nodeData) {
        // create new node object 
        var newNode = { x: nodeData.x, y: nodeData.y, color: nodeData.y, text: nodeData.text };
        console.log(newNode);
        // nodes.push(newNode);
        drawNode(self, nodeData.text, newNode);
        // emit a message to all players a new node was added
    });
    this.cursors = this.input.keyboard.createCursorKeys();

    let bg = this.add.image(0, 0, "sky").setOrigin(0, 0);
    camera = this.cameras.main;
    // let button = this.add.sprite(0, 0, 'node');
    // button.setInteractive();
    // button.on('pointerdown', function () {
    //     console.log('asdf');
    // });
    new_post = this.add.sprite(0, 0, 'new_node');
    new_post.setOrigin(0.0, 0.0).setDisplaySize(180,100);
    new_post.setInteractive();
    new_post.on('pointerdown', function () {
        console.log('asdfjkl');
    });
}
function addPlayer(self, playerInfo) {
    self.ship = self.physics.add.image(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
    if (playerInfo.team === 'blue') {
        self.ship.setTint(0x0000ff);
    } else {
        self.ship.setTint(0xff0000);
    }
    self.ship.setDrag(100);
    self.ship.setAngularDrag(100);
    self.ship.setMaxVelocity(200);
    // camera.startFollow(self.ship);
    // camera.follow(self.ship);
    // camera.followOffset.set(self.ship.x, self.ship.y);
    camera.setZoom(0.8);
}
function addOtherPlayers(self, playerInfo) {
    const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer').setOrigin(0.5, 0.5).setDisplaySize(53, 40);
    if (playerInfo.team === 'blue') {
        otherPlayer.setTint(0x0000ff);
    } else {
        otherPlayer.setTint(0xff0000);
    }
    otherPlayer.playerId = playerInfo.playerId;
    self.otherPlayers.add(otherPlayer);
}

function drawNode(self, str, node) {
    font_size = 16;
    wrap_width = 19;

    console.log(self.ship.x);
    height = (Math.ceil(str.length / wrap_width) * 18) + 18;
    sprite = self.add.sprite(node.x, node.y, 'node').setDisplaySize(200, height);
    sprite.inputEnabled = true;

    style = { font: `${font_size}px Courier New`, fill: "#ff0044", wordWrap: true, wordWrapWidth: 50, align: "left", backgroundColor: "#ffff00" };

    line = 0;
    for (var i = 0; i < str.length; i += wrap_width) {
        line++;
        // chunks.push(str.substring(i, i + chunkSize));
        chunk = str.substring(i, i + wrap_width);
        // console.log(chunk);
        text = self.add.text(node.x - 80, (node.y - (height / 2)) + (line * font_size), chunk, style);
    }
    // this.socket.emit('newNode', {x: this.ship.x, y: this.ship.y, color: this.ship.team, text: 'hello'})
}

function update() {
    if (this.ship) {
        new_post.x = camera.scrollX - 100;
        new_post.y = camera.scrollY + camera.height - 30;

        const targetX = this.ship.x - (camera.width / 2);
        const targetY = this.ship.y - (camera.height / 2);
        lerp = 0.3;
        camera.scrollX = lerp * targetX + (1 - lerp) * camera.scrollX;
        camera.scrollY = lerp * targetY + (1 - lerp) * camera.scrollY;

        if (this.keys.new_node._justDown) {
            textarea.style.display = 'block';
        }
        if (this.keys.create_node._justDown) {
            textarea.style.display = 'none';
            this.socket.emit('newNode', { x: this.ship.x, y: this.ship.y, color: this.ship.team, text: textarea.value })
        }

        speed = 5;
        if (this.cursors.left.isDown) {
            this.ship.x -= speed;
        }

        if (this.cursors.right.isDown) {
            this.ship.x += speed;
        }

        if (this.cursors.up.isDown) {
            this.ship.y -= speed;
        }

        if (this.cursors.down.isDown) {
            this.ship.y += speed;
        }

        if (this.keys.ZoomIn.isDown) {
            camera.zoom += 0.04
            console.log("want to draw");
            // let graphics = this.add.graphics();
            // graphics.lineBetween(x1, y1, x2, y2);
            //drawLine(0,0,500,500);
        }

        if (this.keys.ZoomOut._justDown) {
            camera.zoom -= 0.04;
        }

        else {
            this.ship.setAcceleration(0);
        }
        // emit player movement
        var x = this.ship.x;
        var y = this.ship.y;
        var r = this.ship.rotation;
        if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)) {
            this.socket.emit('playerMovement', { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation });
        }
        // save old position data
        this.ship.oldPosition = {
            x: this.ship.x,
            y: this.ship.y,
            rotation: this.ship.rotation
        };

        // this.physics.world.wrap(this.ship, 5);
    }
}