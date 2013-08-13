Function.prototype.bind = function(scope) {
  var _function = this;
  
  return function() {
    return _function.apply(scope, arguments);
  }
}

function bind(f, scope){
	return function() {
	    return f.apply(scope, arguments);
	}
}

/**
 * Game handles the switching between user interfaces and initiates the other game compontents
 */
function Game(){
	var session = this.session;
	var uis = {
		loginUI: new LoginUI(function(s){
			session = s;
			uis.menuUI.session = s;
			window.ui = uis.menuUI.getInterface();
		}),
		menuUI: new MenuUI(session, {
			onLogout: function(){
				window.ui = uis.loginUI.getInterface();
			},
			onJoinMatch: function(match){
				uis.ingameUI.setMatch(match);
				window.ui = uis.ingameUI.getInterface();
			}
		}),
		ingameUI: new IngameUI({
			onExit: function(){
				window.ui = uis.menuUI.getInterface();
			}
		})
	}
	
	window.ui = uis.loginUI.getInterface();
}

function IngameUI(callbacks){
	this.match;
	this.onExit = callbacks.onExit;
}
IngameUI.prototype.getInterface = function(){
	return {
		exitToMenu: this.exitToMenu.bind(this),
		me: function(){},
		opponent: function(){},
		strike: function(){},
		turn: function(){},
		help: function() {
			console.log(".me         Return information on the local player.");
			console.log(".opponent   Return information on the other player.");
			console.log(".strike     Make some damage.");
			console.log(".turn       See whose turn it is.");
		}
	}
};
IngameUI.prototype.exitToMenu = function(){
	this.match.leave();
	delete this.match;
	if (this.onExit) this.onExit();
};
IngameUI.prototype.setMatch = function(m){
	this.match = m;
}

function MenuUI(session, callbacks){
	this.session = session;
	this.onLogout = callbacks.onLogout;
	this.onJoinMatch = callbacks.onJoinMatch;
}
MenuUI.prototype.logout = function(){
	this.session.disconnect();
	delete this.session;
	if (this.onLogout) this.onLogout();
};
MenuUI.prototype.findMatch = function(){
	var self = this;
	this.session.startMatchmaking({
		type: "TurnBased",
		filters: {
			min: 2,
			max: 2
		},
		waitForOtherPlayers: true,
		onQueue: function(){
			console.log("Put in queue");
		},
		onMatchFound: function(mpMatch){
			var match = new Match(mpMatch);
			self.onJoinMatch(match);
		}
	});
};
MenuUI.prototype.getInterface = function(){
	return {
		logout: this.logout.bind(this),
		findMatch: this.findMatch.bind(this),
		help: function() {
			console.log(".logout     Go to the login screen.");
			console.log(".findMatch  Starts matchmaking");
		}
	};
};


function LoginUI(onLogin){
	this.onLogin = onLogin;
}
LoginUI.prototype.login = function(username){
	var session = new MPSession(username, "Adams-MacBook-Pro.local", "8083", "ConsoleFighter"),
		callback = this.onLogin;
	session.onConnect(function(){
		if (callback) callback(session);
	});
};
LoginUI.prototype.getInterface = function(){
	return {
		login: this.login.bind(this),
		help: function() {
			console.log(".login(username)    Log into the game. Requires a username.");
		}
	};
}

function Match(mpMatch){
	this.mpMatch = mpMatch;
	this.localPlayer = new PlayerModel();
	this.opponent = new PlayerModel();
	
	this.mpMatch.onTurnChanged(function(player){
		console.log("Changed turn to: " + player.name);
	});
	this.mpMatch.onStateChanged("players/" + this.mpMatch.localPlayerId, function(data){
		this.localPlayer.update(data);
	});
}
Match.prototype.leave = function(){
	this.mpMatch.leave();
};
Match.prototype.localPlayerInfo = function(){
	console.log(this.localPlayer);
}

function PlayerModel(){
	this.health;
	this.abilities;
	this.attributes;
}
PlayerModel.prototype.update = function(data){
	this.health = data.health;
	this.abilities = data.abilities;
	this.attributes = data.attributes;
};
PlayerModel.prototype.toString = function(){
	
}


(function(){
	var game = new Game();
})();