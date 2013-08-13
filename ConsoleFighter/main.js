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
		me: this.match.localPlayerInfo.bind(this.match),
		opponent: this.match.opponentInfo.bind(this.match),
		strike: this.match.action.bind(this.match),
		match: this.match,
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
	var self = this;
	this.mpMatch = mpMatch;
	this.localPlayer = new PlayerModel(this.mpMatch.players.get(this.mpMatch.localPlayerId).name);
	var opponentName;
	if(mpMatch.players.get(0).name === this.mpMatch.localPlayerId){
		opponentName = mpMatch.players.get(1).name;
	} else {
		opponentName = mpMatch.players.get(0).name;
	}
	this.opponent = new PlayerModel(opponentName);
	this.opponent.onDie = function(){
		console.log("Congratulations, you won!");
	};
	this.localPlayer.onDie = function(){
		console.log("You lost. Better luck next time!");
	};
	
	this.mpMatch.onTurnChanged(function(player){
		console.log("Turn changed to: " + player);
	});
	this.mpMatch.onStateChanged("players/" + this.mpMatch.localPlayerId, function(data){
		self.localPlayer.update(data);
	});
	this.mpMatch.bind('strike', function(data){
		self.localPlayer.changeHealth(-data.damage);
	});
}
Match.prototype.leave = function(){
	this.mpMatch.leave();
};
Match.prototype.localPlayerInfo = function(){
	console.log(this.localPlayer);
};
Match.prototype.opponentInfo = function(){
	console.log(this.opponent);
};
Match.prototype.action = function(action){
	console.log(this.mpMatch.getWhosTurn());
	console.log(this.mpMatch.localPlayerId);
	if(this.mpMatch.getWhosTurn().playerId !== this.mpMatch.localPlayerId){
		console.log("Wait for your turn.");
		return;
	}
	//if(action === 'strike'){
		this.mpMatch.trigger('strike', {damage:10});
		this.opponent.changeHealth(-10);
	//}
	this.mpMatch.changeTurn();
};

function PlayerModel(name){
	console.log(name);
	this.name = name;
	this.health = 100;
	this.abilities = "";
	this.attributes = "";
	this.onDie = function(){};
}
PlayerModel.prototype.update = function(data){
	this.health = data.health;
	this.abilities = data.abilities;
	this.attributes = data.attributes;
};
PlayerModel.prototype.toString = function(){
	var str = "---- " + this.name + " ----\n";
		str+= "Health:     " + this.health + "\n";
		str+= "Attributes  " + this.attributes;
	return str;
};
PlayerModel.prototype.changeHealth = function(val){
	this.health += val;
	if(this.health < 0) this.health = 0;
	if(this.health <= 0 && this.onDie) this.onDie();
};


(function(){
	var game = new Game();
})();