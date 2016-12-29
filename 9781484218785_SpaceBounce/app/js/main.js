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

function startGame() {
	new sgx.main.System();
	sgx.graphics.Engine.create(320, 480);	// the size of the draw area we (as programmers) will use

	sgx.main.System.writePage();
	sgx.main.System.initialize();	// optionally pass the 'loading_screen' ID here, to hide the contents once loaded

	gVars.mainSurface = sgx.graphics.DrawSurfaceManager.get().getDisplaySurface();
	
	writeLoadingProcess('loading_tracker', 5);	// MainSettings.loadingProgressSize
	sgx.text.processTextData(gLanguageData);
	
	gResources.prepareFonts();
	gResources.prepareAudio();
	gResources.loadAssets();
	
	gVars.settings = new sgxDebugOptions();
	populateSettings(gVars.settings);

	if (gVars.settings.getOption('main.fps')) {
		gVars.fpsMeter = new FPSMeter({theme: 'colorful', graph: 1, history: 20});
	}

	gVars.gameState = new SpaceBounceGame();

	// capture all exceptions so the game doesn't fail too hard in production
	Main.enable(Main.STATE_SAFEMODE_UPDATE);
	Main.enable(Main.STATE_SAFEMODE_DRAW);
}


function writeLoadingProcess(id, count) {
var parent = $('#' + id);
var id = "loading_screen_process_"+i;

	for(var i=0;i<count;++i) {
		var myImage = $('<img/>');
        myImage.attr('id', 'loading_screen_process_' + i);
        myImage.attr('src', 'white.gif');
		
		parent.after(myImage);
	}
}


function SpaceBounceGame() {

var stateList;
var currentState;
var newState;
var newStateFadeTimecum;
var newStateFadeOut;

	(function ctor() {
		sgxSetRandSeed(23063007);

		stateList = { 
			'titles': 	new GameTitlePages(changeState), 
			'mainmenu': new GameMainMenu(changeState),
			'credits':  new GameCredits(changeState),
			'instructions':  new GameInstructions(changeState),
			'game':     new GamePlay(changeState)
		};
	})();
	
	function changeState(state, param) { 
		// We don't change the state here. If we did, then you'd get an update from state 1
		// followed by the draw from state 2. Since start 2 didn't receive an update, it's
		// likely that things would break.
		newState = state;
		newStateFadeTimecum = 0;
		newStateFadeOut = true;
	}
	

	function draw(surface) {
		var rt = false;
		if (currentState && currentState.draw) {
			rt = currentState.draw(surface);
		}
		if (newState) {
			var color = new sgxColorRGBA(1,1,1,/*alpha=*/1);
			if (newStateFadeOut) {
				color.a = sgxMin(1, newStateFadeTimecum);
			} else { // fade in
				color.a = 1 - sgxMin(1, newStateFadeTimecum);
			}
			
			surface.setFillColor(color);
			surface.setFillTexture(gVars.textures.backgroundShaft);
			surface.fillRect();
		}		
		//
		return rt;
	}
	
	// By threading telaps throughout the codebase, adding time-based events
	// is now trivial, because the data is sitting there waiting. Furthermore, since
	// all effects have a time-element, this is a no-brainer.
	function update(surface, telaps) {
		if (newState) {
			newStateFadeTimecum += telaps * gVars.tFadeIntraMenu;
			if (newStateFadeTimecum > 1.0) {
				if (newStateFadeOut) {	// finished fade out
					newStateFadeOut = false;
					newStateFadeTimecum = 0;
					//
					currentState = stateList[newState];	// We fail hard and fast. If this state doesn't exist, there's an exception immediately to follow
					if (currentState.start) {
						currentState.start();
					} else {
						// NOP
					}		

				} else {		// finished fade in
					newState = undefined;
				}

			} else {	// still fading in, or out, so no updates are allowed
				return;
			}
		}

		if (currentState && currentState.update) {
			return currentState.update(surface, telaps);
		}
	}
	

	return {
		start: function() { changeState(gVars.settings.getOption('main.startstate', 'titles')); }, 
		draw: function(surface) { draw(surface); },
		update: function(surface, telaps) { update(surface, telaps); }
	};
};


function SGXPrepare_OS() {}
function SGXinit()		 {}
function SGXstart() 	 {
	gVars.gameState.start();
}

function SGXdraw() {
	var surface = sgx.graphics.DrawSurfaceManager.get().getDisplaySurface();
	gVars.gameState.draw(surface);	
	gVars.fpsMeter && gVars.fpsMeter.tick();
}

function SGXupdate(telaps) {

	if (!gVars.hasGameStarted) {
		var progress = sgx.filesystem.Engine.get().blockingGetProgressStats();
		if (progress[0] === progress[1]) {
			gVars.gameState.start();
			gVars.hasGameStarted = true;
		}
	}

	gVars.gameState.update(gVars.mainSurface, telaps);
}
