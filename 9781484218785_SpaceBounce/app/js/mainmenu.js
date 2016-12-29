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

function GameMainMenu(changeState) {
var	design;
var menuScreen;
var musicChannel;
var transitioning;

	var groups;
	(function ctor() {
		design = sgxutils.gui.DesignManager.load("resources/menu/ui", function(design, success) {
			preparemenuScreen();
			sgx.filesystem.Engine.get().blockingCompletedElement(design, success);
		});
		sgx.filesystem.Engine.get().blockingRegisterElement(design);
	})();

	function start(surface) {
		startMusic();
		
		gui.refreshWidgetMusic(menuScreen.getWidgetOfUserData(0x0201));
		gui.refreshWidgetSFX(menuScreen.getWidgetOfUserData(0x0301));

		transitioning = false;
		sgx.gui.Engine.get().setRootWidget(menuScreen);

		setTimeout(function() { sgx.audio.Engine.get().playSound("spacebounce"); }, 500);
	}

	function draw(surface) {
		menuScreen.draw(surface, 0, 0);
	}
	
	function update(surface, telaps) {
		if (musicChannel && musicChannel.hasFinished()) {
			musicChannel = null;
		}
	}
	

	function preparemenuScreen() {		

		menuScreen = design.getScreen(0).applyScreen();
		menuScreen.setHandler({
		
			onGUIWidgetPressed: function(widget, position) {
				this.onGUIWidgetCursorDragged(widget, position);
				sgx.audio.Engine.get().playSound("click");
				return true;
			},

			onGUIWidgetSelect: function(widget, position) {
				//  Use userdata, instead of index as things move in order, and 
				// position. Bit masks can be your friend here.
				var uid = widget.getUserData();	
				var widget_type = uid & 0xff00;
				var widget_id = uid & 0x00ff;
				var newState = undefined;

				switch(widget_type) {
					case 0x0100: // change state
						if (transitioning) {
							// NOP
						} else {
							switch(widget_id) {
								case 1:
								newState = 'credits';
								break;
								case 2:
								newState = 'instructions';
								break;
								case 3:
								newState = 'game';
								sgx.audio.Engine.get().playSound("startgame");
								break;
							}
							transitioning = true;
							musicChannel && musicChannel.startFadeOut(gVars.tMusicFadeOut, function(e) {
								musicChannel.stop();
								changeState(newState);
							});
							if (!musicChannel) {
								changeState(newState);
							}
						}
						break;

					case 0x0200:
						gui.toggleMuteMusic(widget, musicChannel, startMusic);
						break;

					case 0x0300:
						gui.toggleMuteSFX(widget);
						break;
				}
		
				return true;
			},

			onGUIWidgetCursorDragged: function() { return true; }
		
		}, TRUE);
	}

	function startMusic() {
		musicChannel = sgx.audio.Engine.get().playSound("mainmenu");
		musicChannel.loop();
	}

	return {
		start: function(surface) 			{ return start(surface); },
		draw: function(surface) 			{ return draw(surface); },
		update: function(surface, telaps) 	{ return update(surface, telaps); }
	};
}
