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

function GameCredits(changeState) {
var	creditsUI;
var	creditsScreen;
var animState;
var animPlayerY;

	(function ctor() {
		creditsUI = sgxutils.gui.DesignManager.load("resources/credits/ui", function(design, success) {
			creditsScreen = design.getScreen(0).applyScreen();
			sgx.filesystem.Engine.get().blockingCompletedElement(design, success);
		});
		sgx.filesystem.Engine.get().blockingRegisterElement(creditsUI);
	})();

	function start(surface) {
		animState = sgx.graphics.AnimationManager.get().createState();
		animState.setAnimationDataSet(gVars.animations.player);
		
		animState.startSequence("idle_right"); 
		animPlayerY = 540;

		sgx.audio.Engine.get().playSound("credits");
	}

	function draw(surface) {
		creditsScreen.draw(surface, 0, 0);

		var cell = animState.getCurrentCell();
		surface.setFillTexture(gVars.textures.player, cell);
		surface.fillPoint(265, animPlayerY, sgx.graphics.DrawSurface.eFromTopLeft);
	}
	
	function update(surface, telaps) {
		animState.update(telaps);
		if (--animPlayerY < -gVars.textures.player.getRegionHeight(0)) {
			animPlayerY = 480;
		}

		if ((animPlayerY % 50) == 0) {
			sgx.audio.Engine.get().playSound("breath");
		}

		if (sgx.input.Engine.get().mouseLeft.wasReleased()) {
			sgx.audio.Engine.get().playSound("click");
			changeState('mainmenu');
		}
	}
	
	return {
		start: function(surface) 			{ return start(surface); },
		draw: function(surface) 			{ return draw(surface); },
		update: function(surface, telaps) 	{ return update(surface, telaps); }
	};
}
