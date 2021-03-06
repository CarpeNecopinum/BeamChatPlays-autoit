const Beam = require('beam-client-node');
const Interactive = require('beam-interactive-node');
const rjs = require('robotjs');
//const au = {Init: function() {}, Send: function(key) {console.log(key);}}; // dummy to test on linux
const au = require('autoit');
const auth = require('./settings/settings.json');
const Packets = require('beam-interactive-node/dist/robot/packets').default;
au.Init();

// Global Vars
app = {
	auth: require('./settings/auth.json'),
	controls: require('./controls/current.json'),
	settings: require('./settings/settings.json')
}

var voting = {
	tap: {},
	hold: {}
};
var prevVotedHolds = {};

const channelId = app.auth['channelID'];
const username = app.auth['username'];
const password = app.auth['password'];

// Connects to interactive
const beam = new Beam();
beam.use('password', {
    username,
    password,
})
.attempt()
.then(() => beam.game.join(channelId))
.then(res => createRobot(res))
.then(robot => performRobotHandShake(robot))
.then(robot => setupRobotEvents(robot))
.catch(err => {
	console.log(err.message);
    if (err.res) {
        throw new Error('Error connecting to Interactive:' + err.res.body.message);
    }
    throw new Error('Error connecting to Interactive', err);
});

// Creating Robot
function createRobot(res, stream) {
	console.log("creating Robot.");
    return new Interactive.Robot({
        remote: res.body.address,
        channel: channelId,
        key: res.body.key,
    });
}

// Robot Handshake
function performRobotHandShake (robot) {
	console.log("performRobotHandShake");
    return new Promise((resolve, reject) => {
        robot.handshake(err => {
            if (err) {
                reject(err);
            }
            resolve(robot);
        });
    });
}

// Robot Events
function setupRobotEvents (robot) {
	console.log("Good news everyone! Interactive is ready to go!");
    robot.on('report', report => {

    	if (report.tactile.length > 0){
    		tactile(report.tactile);
			tactileProgress(report.tactile);
    	}
    	if (report.joystick.length > 0) {
    		joystick(report.joystick[0]);
			joystickProgress(report.joystick[0]);
    	}
    	if (report.screen.length > 0) {
    		screen(report.screen[0]);
			screenProgress(report.screen[0]);
    	}

		progressUpdate(robot);
    });
    robot.on('error', err => {
        throw new Error('There was an error setting up robot events.', err);
    });
}


// Tactile Handler
function tactile(tactile){
	voting = {hold: {}, tap: {}}; // reset votes

	for( i = 0; i < tactile.length; i++){
		// Get Button Settings for ID
		var rawid = tactile[i].id;
		var holding = tactile[i].holding;
		var press = tactile[i].pressFrequency;
        var controls = app.controls;
        var button = controls.tactile[rawid];

		if ( button !== undefined && button !== null){
			var buttonID = button['id'];
			var key = button['key'];
			var movementCounter = button['movementCounter'];
			var cooldown = button['cooldown'];
			var group = button['group'];

			buttonSave(key, holding, press);

			if (isNaN(movementCounter) === true && movementCounter !== null && movementCounter !== undefined && movementCounter !== ""){

				movement(key, movementCounter, buttonID, cooldown);

			} else {
				if(isNaN(holding) === false){
					if (group !== undefined) {
						if (holding > 0 && (!voting.hold[group] || voting.hold[group].count < holding))
						{
							voting.hold[group] = {
								count: holding,
								key: key,
								cooldown: cooldown
							};
						}
					} else {
						tactileHold(key, holding, buttonID, cooldown);
					}
				}

				if (isNaN(press) === false) {
					if (group !== undefined) {
						if (press > 0 && (!voting.tap[group] || voting.tap[group].count < press))
						{
							voting.tap[group] = {
								count: press,
								key: key,
								cooldown: cooldown
							};
						}
					} else {
						tactileTap(key, press, buttonID, cooldown);
					}
				}
			}
		} else {
			console.error("ERROR: Button #"+rawid+" is missing from controls json file. Stopping app.");
            process.exit();
		}
	}
	// resolve votes
	for (group in voting.tap)
	{
		var vote = voting.tap[group];
		console.log(vote.key + " was selected for tap from group " + group + " by " + vote.count + " voters.");
		au.Send("{"+vote.key+" down}");
		setTimeout(function(){
			au.Send("{"+vote.key+" up}");
		}, 20);
	}

	for (group in prevVotedHolds)
	{
		if (voting.hold[group]) continue;
		var prev = prevVotedHolds[group];
		console.log("Nobody voted for group " + group + ", releasing " + prev.key);
		au.Send("{"+prev.key+" up}");
        app[prev.key+'Save'] = false;
		delete prevVotedHolds[group];
	}
	for (group in voting.hold)
	{
		var vote = voting.hold[group];
		var prev = prevVotedHolds[group];
		if (prev && vote.key !== prev.key) {
			console.log("Switching from " + prev.key + " to " + vote.key + " for group " + group);
			au.Send("{"+prev.key+" up}");
	        app[prev.key+'Save'] = false;

			au.Send("{"+vote.key+" down}");
	        app[vote.key+'Save'] = true;
		} else if (!prev) {
			console.log("Pressing " + vote.key + " for group " + group);
			au.Send("{"+vote.key+" down}");
	        app[vote.key+'Save'] = true;
		}
		prevVotedHolds[group] = vote;
	}
}

// Button Saves
// Constantly saves holding number to var for reference in key versus comparisons.
function buttonSave(key, holding, press){
	if (holding > 0){
		app[key] = holding;
	} else if (press > 0){
		app[key] = press;
	} else {
		app[key] = 0;
	}

	if ( app[key+'Save'] === undefined){
		app[key+'Save'] = false;
	}

}

// Movement Keys
function movement(key, movementCounter, buttonID, cooldown){

	var keyOne = app[key];
	var keyOnePressed = app[key+'Save'];
	var keyTwo = app[movementCounter];
	var keyTwoPressed = app[movementCounter+'Save'];

	if (keyOne > keyTwo && keyOnePressed === false){
		console.log("Movement: "+key+" was pressed.");
		au.Send("{"+key+" down}");
        app[key+'Save'] = true;
	}
	if (keyTwo > keyOne && keyTwoPressed === false){
		console.log("Movement: "+movementCounter+" was pressed.");
		au.Send("{"+key+" down}");
        app[movementCounter+'Save'] = true;
	}
	if (keyOne === keyTwo){
		if (keyOnePressed === true || keyTwoPressed === true ){
			au.Send("{"+key+" up}");
			au.Send("{"+movementCounter+" up}");
			app[key+'Save'] = false;
			app[movementCounter+'Save'] = false;
		}
	}
}

// Tactile Key Hold
function tactileHold(key, holding, buttonID, cooldown){
	if (app[key] > 0 && app[key+'Save'] !== true){
		console.log(key+" is being held down.");
		au.Send("{"+key+" down}");
        app[key+'Save'] = true;
	} else if (holding === 0 && app[key+'Save'] !== false){
        console.log(key+" is no longer held down.");
		au.Send("{"+key+" up}");
        app[key+'Save'] = false;
    }
}

// Tactile Key Tap.
function tactileTap(key, press, buttonID, cooldown){
	if (press > 0){
		console.log(key+" was pressed.");
		au.Send("{"+key+" down}");
		setTimeout(function(){
			au.Send("{"+key+" up}");
		}, 20);
	}
}

// Joystick Controls
function joystick(report){
    const mouse = rjs.getMousePos();
    const mean = report.coordMean;
    if (!isNaN(mean.x) && !isNaN(mean.y)) {
        rjs.moveMouse(
            Math.round(mouse.x + 50 * mean.x),
            Math.round(mouse.y + 50 * mean.y)
        );
    }
}

// Screen Controls
function screen(report){
	var screenWidth = 1920;
	var screenHeight = 1080;
    const mean = report.coordMean;
	if (!isNaN(mean.x) && !isNaN(mean.y)) {
		rjs.moveMouse(
			Math.round( screenWidth * mean.x),
			Math.round( screenHeight * mean.y)
		);
	}
}

// Progress Updates

// Progress Compile
function progressUpdate(robot){
	var tactile = app.tactileProgress;
	var screen = app.screenProgress;
	var joystick = app.joystickProgress;

	var progress = {
		"tactile": tactile,
		"screen": screen,
		"joystick": joystick
	}

	//console.log(progress);

	robot.send( new Packets.ProgressUpdate(progress));
	app.tactileProgress = [];
	app.screenProgress = [];
	app.joystickProgress = [];
}

// Tactile
function tactileProgress(tactile){
	var json = [];
	for( i = 0; i < tactile.length; i++){
		var rawid = tactile[i].id;
		var holding = tactile[i].holding;
		var press = tactile[i].pressFrequency;

		var controls = app.controls;
		var button = controls.tactile[rawid]
		var cooldown = button['cooldown'];

		if ( isNaN(holding) === false && holding > 0 || isNaN(press) === false && press > 0){
			json.push({
				"id": rawid,
				"cooldown": cooldown,
				"fired": true,
				"progress": 1
			});
		} else {
			json.push({
				"id": rawid,
				"fired": false,
				"progress": 0
			});
		}
	}
	app.tactileProgress = json;
}

// Screen
function screenProgress(screen){
	var json = [];
	var rawid = screen.id;
	var mean = screen.coordMean;
	var screenX = mean.x;
	var screenY = mean.y;
	var clicks = screen.clicks;

	if ( clicks > 0){
		json.push({
			"id": rawid,
			"clicks": [{
				"coordinate": mean,
				"intensity": 1
			}]
		});
	}
	app.screenProgress = json;
}

// Joystick
function joystickProgress (joystick){
	var json = [];
	var rawid = joystick.id;
	var mean = joystick.coordMean;
	var joyX = mean.x;
	var joyY = mean.y;
	if ( isNaN(joyX) === true){
		var joyX = 0;
	}
	if (isNaN(joyY) === true){
		var joyY = 0;
	}

	var rad =  Math.atan2(joyY, joyX);

	json.push({
		"id": rawid,
		"angle": rad,
		"intensity": 1
	});
	app.joystickProgress = json;
}
