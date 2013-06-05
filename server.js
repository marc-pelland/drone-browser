(function() {
  var app, currentImg, drone, express, faye, imageSendingPaused, path, server, socket, moveSpeed, midi;
  var trackOnePos = 0;
  var trackTwoPos = 0;
  express = require("express");
  faye = require("faye");
  path = require("path");
  midi = require("midi");
  drone = require("ar-drone").createClient();
  drone.config('general:navdata_demo', 'TRUE');
  moveSpeed = 0.3;
  app = express();
  app.configure(function() {
    app.set('port', process.env.PORT || 3001);
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
    return app.use("/components", express.static(path.join(__dirname, 'components')));
  });
  server = require("http").createServer(app);
  new faye.NodeAdapter({
    mount: '/faye',
    timeout: 45
  }).attach(server);
  socket = new faye.Client("http://localhost:" + (app.get("port")) + "/faye");
  socket.subscribe("/drone/move", function(cmd) {
    var _name;
    console.log("move", cmd);
    return typeof drone[_name = cmd.action] === "function" ? drone[_name](cmd.speed) : void 0;
  });
  socket.subscribe("/drone/animate", function(cmd) {
    console.log('animate', cmd);
    return drone.animate(cmd.action, cmd.duration);
  });
  socket.subscribe("/drone/drone", function(cmd) {
    var _name;
    console.log('drone command: ', cmd);
    return typeof drone[_name = cmd.action] === "function" ? drone[_name]() : void 0;
  });
  server.listen(app.get("port"), function() {
    return console.log("Express server listening on port " + app.get("port"));
  });
  currentImg = null;
  drone.on('navdata', function(data) {
    return socket.publish("/drone/navdata", data);
  });
  imageSendingPaused = false;
  drone.createPngStream().on("data", function(frame) {
    currentImg = frame;
    if (imageSendingPaused) {
      return;
    }
    socket.publish("/drone/image", "/image/" + (Math.random()));
    imageSendingPaused = true;
    return setTimeout((function() {
      return imageSendingPaused = false;
    }), 100);
  });
  app.get("/image/:id", function(req, res) {
    res.writeHead(200, {
      "Content-Type": "image/png"
    });
    return res.end(currentImg, "binary");
  });
  
  function moveDrone(ARG_dir) {
      console.log("MOVE " + ARG_dir);
    return typeof drone[_name = ARG_dir] === "function" ? drone[_name](moveSpeed) : void 0;
  }
 
  function emergencyLand() {
      console.log("EMERGENCY");
      drone["disableEmergency"]();
  }
 
  function resetDrone() {
      console.log("RESET");
      drone["disableEmergency"]();
  }
 
  function takeoff() {
      console.log("TAKEOFF");
      drone["takeoff"]();
  }
  function land() {
      console.log("LAND");
      drone["land"]();
  }
 
  function configEulerMax(ARG_rad) {
      // radians for the max rotation ( between 0 and 0.52 )
      drone.config("control:euler_angle_max",ARG_rad);
  }
 
  function maxAltitude(ARG_height) {
      // drone max altitude, can be anything.. in millimeters
      drone.config("control:altitude_max", ARG_height);
  }
 
  function vertSpeed(ARG_speed) {
      // control the vertical speed of the drone (between 200 and 2000)
      drone.config("control:control_vz_max", ARG_speed);
  }
 
  function isOutdoor(ARG_bool) {
      drone.config("control:outdoor", ARG_bool);
  }
 
  function isOutdoorHull(ARG_bool) {
      drone.config("control:ﬂight_without_shell", ARG_bool);
  }
 
  function setIndoorConfig() {
      configEulerMax("0.1");
      maxAltitude("3000");
      vertSpeed("1500");
      isOutdoor("FALSE");
      isOutdoorHull("FALSE");
  }
 
  function setOutConfig() {
      configEulerMax("0.3");
      maxAltitude("10000");
      vertSpeed("2000");
      isOutdoor("TRUE");
      isOutdoorHull("TRUE");
  }
 
  function ledAnimBlink(ARG_val) {
      drone.config("leds:led_anim", ARG_val);
  }
 
  setIndoorConfig();
 
var keypress = require('keypress');
 
// make `process.stdin` begin emitting "keypress" events
keypress(process.stdin);
 
// listen for the "keypress" event
process.stdin.on('keypress', function (ch, key) {
// console.log('got "keypress"', key.name);
  if (key) {
      switch (key.name) {
            case "w": moveDrone("up");
            break;
            case "s": moveDrone("down");
            break;
            case "a": moveDrone("left");
            break;
            case "d": moveDrone("right");
            break;
            case "e": emergencyLand();
            break;
            case "r": resetDrone();
            break;
            case "t": takeoff();
            break;
            case "y": land();
            break;
            case "o": ledAnimBlink("blinkOrange",4,2);
            break;
      }
  }
});

  var port = 0;
  var input = new midi.input();
  console.log('port count: '+input.getPortCount());
  console.log('port name: '+input.getPortName(port));
  input.on('message', function(deltaTime, message) {
    // console.log('m:' + message + ' d:' + deltaTime);
  // console.log(message[2]);
	cmd = new Object();
	
	if (message[0] == 190) {
		if (message[2] > trackOnePos) {
			moveDrone("up", 0.3);
		} else if (message[2] < trackOnePos) {
			// console.log("MOVE DOWN");
			moveDrone("down", 0.3);
		}
		
		trackOnePos = message[2];
	} else {
		if (message[2] > trackTwoPos) {
			moveDrone("left", 0.3);
		} else if (message[2] < trackTwoPos) {
			moveDrone("right", 0.3);
		}
		
		trackTwoPos = message[2];
	}
  });
  
  
  input.openPort(port);
}).call(this);
