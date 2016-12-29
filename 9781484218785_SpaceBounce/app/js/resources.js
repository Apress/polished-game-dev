/**

SPACE BOUNCE

Copyright 2015-2016.
Steven Goodwin. 

This file is released under the GNU General Public License Version 3.

Please see the licensing conditions for details.

The latest version is generally available at:
	https://github.com/marquisdegeek/spacebounce

Play it at:
	https://marquisdegeek.com/spacebounce
*/
var gResources = {};

gResources.mini = {};
gResources.mini.musicOff = 3;
gResources.mini.musicOn = 0;
gResources.mini.sfxOff = 9;
gResources.mini.sfxOn = 6;

var audioDataset = {

	"credits" :      {"group": "vox" },
	"instructions" : {"group": "vox" },
	"spacebounce" :  {"group": "vox" },
	"startgame" :    {"group": "vox" },
	 
	"swoosh" :       {"group": "sfx" },
	"breath" :       {"group": "sfx" },
	"death" :        {"group": "sfx" },
	"endlevel" :     {"group": "sfx" },

	"click" :        {"group": "ui" },
	"bing" :         {"group": "ui" },

	"grunt" :        {"group": "player", "count": 8 },
	"ouch" :         {"group": "player", "count": 5 },
	"uhoh" :         {"group": "player" },
	"weee" :         {"group": "player" },
	"yeah" :         {"group": "player" },
	"yeahbig" :      {"group": "player" },
	//
	"p1" :           {"group": "titlefx" },
	"p2" :           {"group": "titlefx" },
	"p4" :           {"group": "titlefx" },
	// 
	"mainmenu" :     {"group": "music" },
	"ingame" :       {"group": "music" },
};

var audioGroups = {
	"music"   : {"factor": 0.8 },
	"vox"     : {"factor": 1.0 },
	"player"  : {"factor": 0.7 },
	"titlefx" : {"factor": 0.9 },
	"sfx"     : {"factor": 0.75},
	"ui"      : {"factor": 0.8 }
};


gResources.prepareFonts = function() {

	sgx.graphics.FontManager.get().registerFont('prose', null, new sgx.graphics.FontParameters(sgx.graphics.FontParameters.eFontTypeNatural, 12, 'Arial'));
	sgx.graphics.FontManager.get().registerFont('ui', 'resources/fonts/std');

	sgx.gui.Engine.get().setDefaultFont('prose');	// the default is a system font and therefore will contain all the letters
}

gResources.prepareAudio = function() {

	for(var groupName in audioGroups) {
		sgx.audio.Engine.get().assignNormalizationGroup(groupName, audioGroups[groupName].factor);
	}

	var sample;
	for(var sampleName in audioDataset) {
		sample = sgx.audio.Engine.get().registerGlobalSound('resources/audio/' + audioDataset[sampleName].group + '/' + sampleName, audioDataset[sampleName].count);
		sample.setNormalizationGroup(audioDataset[sampleName].group);
	}

	sgx.audio.Engine.get().setMasterVolume(0.7);
}

gResources.loadAssets = function() {

	// General textures. Used in menus and game.
	gVars.textures.player = sgx.graphics.TextureManager.get().registerScenarioTexture("resources/sprites/player");
	gVars.textures.playerwin = sgx.graphics.TextureManager.get().registerScenarioTexture("resources/sprites/player_yay");
	gVars.textures.edge = sgx.graphics.TextureManager.get().registerScenarioTexture("resources/sprites/edge");
	gVars.textures.rocks = sgx.graphics.TextureManager.get().registerScenarioTexture("resources/sprites/rock");
	gVars.textures.halite = sgx.graphics.TextureManager.get().registerScenarioTexture("resources/sprites/halite");
	
	// Game textures
	gVars.textures.gameOver = sgx.graphics.TextureManager.get().registerScenarioTexture("resources/sprites/gameover");
	gVars.textures.moon = sgx.graphics.TextureManager.get().registerScenarioTexture("resources/sprites/moon");
	gVars.textures.rope = sgx.graphics.TextureManager.get().registerScenarioTexture("resources/sprites/rope");
	gVars.textures.winch = sgx.graphics.TextureManager.get().registerScenarioTexture("resources/sprites/winch");
	gVars.textures.health = sgx.graphics.TextureManager.get().registerScenarioTexture("resources/sprites/health");

	gVars.textures.backgroundShaft = sgx.graphics.TextureManager.get().registerScenarioTexture("resources/bg/level");
	gVars.textures.backgroundSky = sgx.graphics.TextureManager.get().registerScenarioTexture("resources/bg/sky");
	gVars.textures.floor = sgx.graphics.TextureManager.get().registerScenarioTexture("resources/bg/shaftfloor");

	gVars.textures.scorebacking = sgx.graphics.TextureManager.get().registerScenarioTexture("resources/sprites/scorebacking");
	gVars.textures.overlay = sgx.graphics.TextureManager.get().registerScenarioTexture("resources/bg/overlay");

	// Animations
	gVars.animations.halite = sgx.graphics.AnimationManager.get().loadData("resources/anim/halite");
	gVars.animations.player = sgx.graphics.AnimationManager.get().loadData("resources/anim/player");
	gVars.animations.playerwin = sgx.graphics.AnimationManager.get().loadData("resources/anim/player_yay");
	gVars.animations.winch = sgx.graphics.AnimationManager.get().loadData("resources/anim/winch");
	gVars.animations.rope = sgx.graphics.AnimationManager.get().loadData("resources/anim/rope");
}
