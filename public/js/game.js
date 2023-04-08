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
    this.load.image('cancel', 'assets/cancel.png');
    this.load.image('post', 'assets/post.png');
    this.load.image('reply', 'assets/reply.png');
    this.load.image('place', 'assets/place.png');
}


function create() {
    textarea = document.querySelector('#input');
    text_select = document.querySelector("#select");
    selected_text = "";
    select_range = {};
    text_select.addEventListener('mouseout', (e)=>{
        selected_text = window.getSelection().toString();
        select_range = {
            start: text_select.selectionStart - 1,
            end: text_select.selectionEnd,
        }
        console.log(select_range);
        parent_node.range = select_range;
    });
    this.keys = this.input.keyboard.addKeys({
        // space: Phaser.Input.Keyboard.KeyCodes.SPACE,
        new_node: Phaser.Input.Keyboard.KeyCodes.ONE,
        create_node: Phaser.Input.Keyboard.KeyCodes.TWO,
        ZoomIn: Phaser.Input.Keyboard.KeyCodes.NINE,
        ZoomOut: Phaser.Input.Keyboard.KeyCodes.EIGHT,
        up: Phaser.Input.Keyboard.KeyCodes.UP,
        down: Phaser.Input.Keyboard.KeyCodes.DOWN,
        left: Phaser.Input.Keyboard.KeyCodes.LEFT,
        right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
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
        var newNode = { x: nodeData.x, y: nodeData.y, color: nodeData.y, text: nodeData.text, range:nodeData.range };
        console.log('before draw');
        console.log(newNode);
        // nodes.push(newNode);
        drawNode(self, newNode);
        // emit a message to all players a new node was added
    });
    // this.cursors = this.input.keyboard.createCursorKeys();

    let bg = this.add.image(0, 0, "sky").setOrigin(0, 0);
    camera = this.cameras.main;

    post_button = this.add.sprite(0, 0, 'post');
    post_button.setOrigin(0.0, 0.0).setDisplaySize(180,100);
    post_button.setInteractive();
    post_button.visible = false;
    post_button.on('pointerdown', function () {
        textarea.style.display = 'none';
        new_post.visible = true;
        cancel.visible = false;
        self.socket.emit('newNode', { x: self.ship.x, y: self.ship.y, color: self.ship.team, text: textarea.value })
    });
    reply_post_button = this.add.sprite(0, 0, 'post');
    reply_post_button.setOrigin(0.0, 0.0).setDisplaySize(180,100);
    reply_post_button.setInteractive();
    reply_post_button.visible = false;
    reply_post_button.on('pointerdown', function () {
        textarea.style.display = 'none';
        reply_post_button.visible = false;
        // cancel.visible = false;
        // Redraw parent node
        console.log('parentes');
        console.log(parent_node);
        self.socket.emit('newNode', parent_node)

        console.log('text area');
        console.log(textarea.value);
        self.socket.emit('newNode', { x: self.ship.x, y: self.ship.y, color: self.ship.team, text: textarea.value })
    });
    cancel = this.add.sprite(0, 0, 'cancel');
    cancel.setOrigin(0.0, 0.0).setDisplaySize(180,100);
    cancel.setInteractive();
    cancel.visible = false;
    cancel.on('pointerdown', function () {
        textarea.style.display = 'none';
        new_post.visible = true;
        cancel.visible = false;
        post_button.visible = false;
    });
    cancel_reply = this.add.sprite(0, 0, 'cancel');
    cancel_reply.setOrigin(0.0, 0.0).setDisplaySize(180,100);
    cancel_reply.setInteractive();
    cancel_reply.visible = false;
    cancel_reply.on('pointerdown', function () {
        textarea.style.display = 'none';
        new_post.visible = true;
        cancel_reply.visible = false;
        text_select.style.display = 'none';
        reply.visible = false;
        // post_button.visible = false;
    });
    new_post = this.add.sprite(0, 0, 'new_node');
    new_post.setOrigin(0.0, 0.0).setDisplaySize(180,100);
    new_post.setInteractive();
    new_post.on('pointerdown', function () {
        textarea.style.display = 'block';
        textarea.value = '';
        cancel.visible = true;
        new_post.visible = false;
        post_button.visible = true;
    });
    reply = this.add.sprite(0, 0, 'reply');
    reply.setOrigin(0.0, 0.0).setDisplaySize(180,100);
    reply.setInteractive();
    reply.on('pointerdown', function () {
        text_select.style.display = 'none';
        text_select
        reply.visible = false;
        place.visible = true;
        cancel_reply.visible = false;

        console.log(selected_text);
    });
    reply.visible = false;
    place = this.add.sprite(0, 0, 'place');
    place.setOrigin(0.0, 0.0).setDisplaySize(180,100);
    place.setInteractive();
    place.on('pointerdown', function () {
        textarea.style.display = 'block';
        textarea.value = "";
        place.visible = false;
        reply_post_button.visible = true;
    });
    place.visible = false;
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
    camera.setZoom(0.8);
    // self.socket.emit('newNode', { x: self.ship.x, y: self.ship.y, color: self.ship.team, text: "hello worldddddd hyeyyyyyyyy helppppppp", range: {
    //     start: 2,
    //     end: 15,
    // } });
    // drawNode(self, "Hello world this is a sentence and I hope it works pretty well hopefully!!!", self.ship);
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

function drawNode(self, node) {
    console.log("text!");
    console.log(node.text);
    str = node.text;
    height = 200;
    width = 400;
    sprite = self.add.sprite(node.x, node.y, 'node').setOrigin(0.05,0.1).setDisplaySize(width, height);
    sprite.setInteractive();
    sprite.on('pointerdown', function () {
        parent_node = node;
        console.log('this is djsfklsdf');
        console.log(str);
        console.log(node.text);
        text_select.value = node.text;
        text_select.style.display = 'block';
        new_post.visible = false;
        cancel_reply.visible = true;
        reply.visible = true;
        post_button.visible = false;
        console.log('asdf');
    });
    line_height = 20;
    line_width = 30;
    char_width = 12;

    function cost(i){
        j = 0;
        while(str[i] != " " && i < str.length) {
            i++;
            j++;
        }
        return j;
    }

    v = 0;
    line = 0;
    for(c in str) {
        if(str[c] == "\n") {
            line++;
            v = -1;
        }
        if(cost(c) + v > line_width) {
            line++;
            v = 0;
        } else {
        }
        if(node.range){
            if(c > node.range.start && c < node.range.end) {
                self.add.text(node.x+(v*char_width), node.y+(line*line_height), str[c], { fontFamily: 'Courier, monospace', fontSize: '24px', fill: 'black', fontStyle: 'bold', backgroundColor: "red"});
            } else {
                self.add.text(node.x+(v*char_width), node.y+(line*line_height), str[c], { fontFamily: 'Courier, monospace', fontSize: '24px', fill: 'black', fontStyle: 'bold'});
            }
        } else {
            self.add.text(node.x+(v*char_width), node.y+(line*line_height), str[c], { fontFamily: 'Courier, monospace', fontSize: '24px', fill: 'black', fontStyle: 'bold'});
        }
        v++;
    }

    // test.setStyle({ backgroundColor: '#ffff00' }, 0, 1);
    // test.setTint(50, 50, 100, 100);
    // console.log(test);
    // sprite.height = test.height;
}

function update() {
    if (this.ship) {
        new_post.x = camera.scrollX - 100;
        new_post.y = camera.scrollY + camera.height - 30;
        post_button.x = camera.scrollX - 100;
        post_button.y = camera.scrollY + camera.height - 30;
        reply_post_button.x = camera.scrollX - 100;
        reply_post_button.y = camera.scrollY + camera.height - 30;
        reply.x = camera.scrollX - 100;
        reply.y = camera.scrollY + camera.height - 30;
        place.x = camera.scrollX - 100;
        place.y = camera.scrollY + camera.height - 200;
        cancel.x = camera.scrollX + camera.width - 80;
        cancel.y = camera.scrollY + camera.height - 30;
        cancel_reply.x = camera.scrollX + camera.width - 80;
        cancel_reply.y = camera.scrollY + camera.height - 30;

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
        if (this.keys.left.isDown) {
            this.ship.x -= speed;
        }

        if (this.keys.right.isDown) {
            this.ship.x += speed;
        }

        if (this.keys.up.isDown) {
            this.ship.y -= speed;
        }

        if (this.keys.down.isDown) {
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