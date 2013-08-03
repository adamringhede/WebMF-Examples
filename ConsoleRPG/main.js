function Game(){
	var session = this.session;
	var ui = this.ui;
	
	ui = new LoginUI(function(s){
		ui = new MenuUI();
		session = s;
		window.ui = ui;
	});
	window.ui = ui;
}

function IngameUI(){
	
}

function MenuUI(){
	
}
MenuUI.prototype.logout = function(){
	
};
MenuUI.prototype.findMatch = function(){
	
};

function LoginUI(onLogin){
	this.onLogin = onLogin;
}
LoginUI.prototype.login = function(username){
	var session = new MPSession(),
		callback = this.onLogin;
	session.onConnect(function(){
		if (callback) callback(session);
	});
};

function Match(){
	
}

function PlayerModel(){
	this.health;
	this.abilities;
	this.items;
	this.attributes;
}