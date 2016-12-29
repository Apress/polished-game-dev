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

function GameInstructions(changeState) {
var	pageImages = [ 
	sgx.graphics.TextureManager.get().load("resources/instructions/p1"),
	sgx.graphics.TextureManager.get().load("resources/instructions/p2")
	];
var page;
var otherPage;
var pageTurnDirection;
var pageTurnTimecum;
// Version 3
var designInfo;
var interfaceList = [];
var animStatePlayer;
var animStateHalite;

	(function ctor() {
		animStatePlayer = sgx.graphics.AnimationManager.get().createState();
		animStatePlayer.setAnimationDataSet(gVars.animations.player);

		animStateHalite = sgx.graphics.AnimationManager.get().createState();
		animStateHalite.setAnimationDataSet(gVars.animations.halite);

		designInfo = sgxutils.gui.DesignManager.load("resources/instructions/ui", function(design, success) {
			prepareInterface();
			sgx.filesystem.Engine.get().blockingCompletedElement(design, success);
		});
		sgx.filesystem.Engine.get().blockingRegisterElement(designInfo);
	})();

	function prepareInterface() {
		interfaceList[0] = designInfo.getScreen(0).applyScreen();
		interfaceList[1] = designInfo.getScreen(1).applyScreen();

			var uiHandlerSelect = function(widget, position) {
				var uid = widget.getUserData();
				if (uid === 1) {
					nextPage();
				} else if (uid === 2) {
					previousPage();
				}
			};
			var uiHandlerPressed = function(widget, position) {
				sgx.audio.Engine.get().playSound("click");
				return true;
			};

			
			interfaceList[0].setHandler({onGUIWidgetSelect:uiHandlerSelect, onGUIWidgetPressed:uiHandlerPressed}, TRUE);
			interfaceList[1].setHandler({onGUIWidgetSelect:uiHandlerSelect, onGUIWidgetPressed:uiHandlerPressed}, TRUE);
	}

	function start(surface) {
		page = 0; 
		pageTurnDirection = 0;

		animStateHalite.startSequence("sparkle"); 
		sgx.gui.Engine.get().setRootWidget(interfaceList[0]);

		sgx.audio.Engine.get().playSound("instructions");
	}

	// version 3
	function nextPage() {
		if (1+page == pageImages.length) {
			changeState('mainmenu');	
		} else {
			otherPage = page + 1;
			pageTurnDirection = 1;
			pageTurnTimecum = 0;

			animStatePlayer.startSequence("bounce_left"); 
			sgx.audio.Engine.get().playSound("weee");
		}
	}

	function previousPage() {
		otherPage = page - 1;
		pageTurnDirection = -1;
		pageTurnTimecum = 0;		

		animStatePlayer.startSequence("bounce_right"); 
		sgx.audio.Engine.get().playSound("weee");
	}

	function draw(surface) {
		var surfaceWidth = surface.getWidth();
		var playerWidth;
		var x;
		var cell;

		// version 2
		/*		
		switch(pageTurnDirection) {
			case 0:
			surface.setFillTexture(pageImages[page]);
			surface.fillRect();
			break;
			
			case -1: 	// back
			x = pageTurnTimecum * surfaceWidth;
			surface.setFillTexture(pageImages[page]);
			surface.fillPoint(x, 0, sgx.graphics.DrawSurface.eFromTopLeft);

			x -= surfaceWidth;
			surface.setFillTexture(pageImages[otherPage]);
			surface.fillPoint(x, 0, sgx.graphics.DrawSurface.eFromTopLeft);

			playerWidth = gVars.textures.player.getRegionWidth(0);
			x = sgxRescale(pageTurnTimecum, 0, 1, -playerWidth, surfaceWidth+playerWidth);
			surface.setFillTexture(gVars.textures.player, 0);
			surface.fillPoint(x, 0, sgx.graphics.DrawSurface.eFromTopLeft);
			break;
			
			case 1: // forward
			x = -(pageTurnTimecum * surfaceWidth);
			surface.setFillTexture(pageImages[page]);
			surface.fillPoint(x, 0, sgx.graphics.DrawSurface.eFromTopLeft);

			x += surfaceWidth;
			surface.setFillTexture(pageImages[otherPage]);
			surface.fillPoint(x, 0, sgx.graphics.DrawSurface.eFromTopLeft);

			// NOTE: By moving the player further (from just off right to just off left)
			// give a paralax effect for free.
			playerWidth = gVars.textures.player.getRegionWidth(0);
			x = sgxRescale(pageTurnTimecum, 0, 1, surfaceWidth+playerWidth, -playerWidth);
			surface.setFillTexture(gVars.textures.player, 0);
			surface.fillPoint(x, 0, sgx.graphics.DrawSurface.eFromTopLeft);
			break;		
		}
		*/
		// version 3
		var playerWidth = gVars.textures.player.getRegionWidth(0);
		var playerHeight = gVars.textures.player.getRegionWidth(0);
		var ropeCell;

		cell = animStatePlayer && animStatePlayer.getCurrentCell();

		switch(pageTurnDirection) {
			case 0:
			x = 0;
			interfaceList[page].draw(surface, 0, 0);
			break;
			
			case -1: 	// back
			x = pageTurnTimecum * surfaceWidth;
			interfaceList[page].draw(surface, x, 0);

			x -= surfaceWidth;
			interfaceList[otherPage].draw(surface, x, 0);

			// Version 4. NOTE: it's faster than the scroll
			x = sgxRescale(pageTurnTimecum, 0, 1, -playerWidth, surfaceWidth+playerWidth);

			ropeCell = sgxFloor(sgxRescale(x, 0, surfaceWidth, 0, 9));
			surface.setFillTexture(gVars.textures.rope, ropeCell);
			surface.fillRect(x-playerWidth/2, 0, x + playerWidth/2, 100+playerHeight);

			surface.setFillTexture(gVars.textures.player, cell);
			surface.fillPoint(x, 100 + playerHeight/2);
			break;
			
			case 1: // forward
			x = -(pageTurnTimecum * surfaceWidth);
			interfaceList[page].draw(surface, x, 0);

			x += surfaceWidth;
			interfaceList[otherPage].draw(surface, x, 0);

			x = sgxRescale(pageTurnTimecum, 0, 1, surfaceWidth+playerWidth, -playerWidth);
			ropeCell = sgxFloor(sgxRescale(x, 0, surfaceWidth, 0, 9));
			surface.setFillTexture(gVars.textures.rope, ropeCell);
			surface.fillRect(x-playerWidth/2, 0, x + playerWidth/2, 100+playerHeight);

			// NOTE: By moving the player further (from just off right to just off left)
			// give a paralax effect for free.
			surface.setFillTexture(gVars.textures.player, cell);
			surface.fillPoint(x, 100 + playerHeight/2);
			break;		
		}

		// This is "something animating"
		if (page === 0 && pageTurnDirection === 0) {
			cell = animStateHalite && animStateHalite.getCurrentCell();
			surface.setFillTexture(gVars.textures.halite, cell);
			surface.fillPoint(176 + x, 366);
		}
	}
	
	function update(surface, telaps) {

		animStateHalite.update(telaps);

		switch(pageTurnDirection) {
			case -1: // back
			case 1: // forward
			animStatePlayer.update(telaps);

			pageTurnTimecum += telaps * gVars.settings.getOption('ui.slide_speed', 1);
			if (pageTurnTimecum > 1) {
				pageTurnDirection = 0;
				page = otherPage;
				// version 3
				sgx.gui.Engine.get().setRootWidget(interfaceList[page]);
			}
			break;
		}
	}
	
	return {
		start: function(surface) 			{ return start(surface); },
		draw: function(surface) 			{ return draw(surface); },
		update: function(surface, telaps) 	{ return update(surface, telaps); }
	};
}
