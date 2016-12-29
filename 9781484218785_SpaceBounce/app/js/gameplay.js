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

function GamePlay(changeState) {
var GAME_IS_STARTING = 0;
var GAME_IS_PLAYING = 1;
var GAME_IS_WATCHING_PLAYER_DIE = 2;
var GAME_IS_DOING_GAME_OVER_ANIM = 3;
var GAME_IS_AWAITING_RESTART = 4;
var GAME_IS_RUNNING_IGM = 5;
var GAME_IS_RETURNING_TO_MENU = 6;
var GAME_IS_PREPARING_NEXT_LEVEL = 7;
var GAME_IS_WAITING_FOR_NEXT_LEVEL = 8;
var currentLevel;
var playerData;
var data;
var viewportRect;	
var ui;
var substate;
var substateTimecum;
var interfaceGame;
var interfaceIGM;
var igmResumeState;
var musicChannel;

	(function ctor() {
		ui = {};
		ui.inmenu = sgxutils.gui.DesignManager.load("resources/ui/game", function(design, success) {
			// prepare interface
			var uiHandlerSelect = function(widget, position) {
				var uid = widget.getUserData();
				switch(uid) {
					case 2:
					openInGameMenu();
					break;

					case 3:
					playerData.handleBounceKey();
					break;

					// IGM
					case 0x201:
					gui.toggleMuteMusic(widget, musicChannel, startMusic);
					break;

					case 0x301:
					gui.toggleMuteSFX(widget);
					break;

					case 11:
					closeInGameMenu();
					break;

					case 12:
					closeInGameMenu();

					if (!musicChannel.isPlaying()) {
						changeState('mainmenu');
					} else {
						setSubstate(GAME_IS_RETURNING_TO_MENU);
						musicChannel.startFadeOut(gVars.tMusicFadeOut, function(e) {
							changeState('mainmenu');
						});
					}
					break;
				}
			}

			var uiHandlerPressed = function(widget, position) {
				if (3 !== widget.getUserData()) {
					sgx.audio.Engine.get().playSound("click");
				}
				return true;
			};

			interfaceGame = ui.inmenu.getScreen(0).applyScreen();
			interfaceGame.setHandler({onGUIWidgetSelect:uiHandlerSelect, onGUIWidgetPressed:uiHandlerPressed}, TRUE);

			interfaceIGM = ui.inmenu.getScreen(1).applyScreen();
			interfaceIGM.setHandler({onGUIWidgetSelect:uiHandlerSelect, onGUIWidgetPressed:uiHandlerPressed}, TRUE);


			sgx.filesystem.Engine.get().blockingCompletedElement(design, success);
		});
		sgx.filesystem.Engine.get().blockingRegisterElement(ui.inmenu);

		viewportRect = new sgxRect2f(0, gVars.topOfWorld, 0, 0);
		playerData = new GamePlayer(ui);
		
		ui.score = GameStyle.createStyledText('score');
		ui.health = GameStyle.createStyledText('health');
	})();

	function startGame(surface) {
		data = {level: 0};

		playerData.startGame(data);

		newLevel();
	}

	function newLevel() {
		currentLevel = new GameLevel(data.level);
		playerData.startLevel(currentLevel);
		
		// Now level-specific
		setSubstate(GAME_IS_STARTING);

		sgx.gui.Engine.get().setRootWidget(interfaceGame);

		startMusic();
		setTimeout(function() { sgx.audio.Engine.get().playSound("swoosh"); }, 500);
	}

	function nextLevel() {
		++data.level;
		newLevel();
	}

	function setSubstate(state) {
		substate = state;
		substateTimecum = 0;
	}

	function startMusic() {
		musicChannel = sgx.audio.Engine.get().playSound("ingame");
		musicChannel.loop();
	}
	
	function openInGameMenu() {
		if (substate !== GAME_IS_RUNNING_IGM) {
			igmResumeState = substate;
			pauseGame();
			setSubstate(GAME_IS_RUNNING_IGM);
			sgx.gui.Engine.get().setRootWidget(interfaceIGM);

			gui.refreshWidgetMusic(interfaceIGM.getWidgetOfUserData(0x201));
			gui.refreshWidgetSFX(interfaceIGM.getWidgetOfUserData(0x301));
		}
	}

	function closeInGameMenu() {
		if (substate === GAME_IS_RUNNING_IGM) {
			setSubstate(igmResumeState);
			sgx.gui.Engine.get().setRootWidget(interfaceGame);

			resumeGame();
		}
	}

	function draw(surface) {

		surface.clear();
		surface.setFillColor(sgxColorRGBA.White);
				
		currentLevel.draw(surface, viewportRect);

		playerData.draw(surface, viewportRect);	
		currentLevel.postDraw(surface, viewportRect);

		playerData.postDraw(surface, viewportRect);	

		// ====== Draw health
		var howFarDown = gVars.moonPositionY - viewportRect.top;
		var alpha = sgxRescale(howFarDown, 70, 110, 0, 1);
		ui.health.drawHealth(surface, 40, 35, alpha)

		
		// ====== Draw score
		// v1. Basic, traditional
		//surface.drawText(data.score, 205, 5);
		// v2. Abstract it, to allow for generic style
		//GameStyle.drawText(surface, "score", data.score, 205, 5);
		// v3. Use a object to hold the data.. it's not a functional improvement... yet
		// NOTE: Never use atomic types, as they can't we expanded upon.
		// NOTE: Draw information != represented data != collision area
		ui.score.draw(surface, surface.getWidth()/2, 30);

		switch(substate) {
			case GAME_IS_RETURNING_TO_MENU:
				// The screen fade expects to happen over 3 seconds, but out
				// fade time might vary, therefore rescale here.
				drawScreenFadeOut(surface, substateTimecum / gVars.tFadeToMenu);
				break;

			case GAME_IS_DOING_GAME_OVER_ANIM:
				drawGameOver(surface, substateTimecum);
				break;

			case GAME_IS_PREPARING_NEXT_LEVEL:
				drawNextLevel(surface, substateTimecum);
				break;
			case GAME_IS_WAITING_FOR_NEXT_LEVEL:
				drawNextLevel(surface, gVars.tFadeToNextLevel);
				break;
			
			case GAME_IS_AWAITING_RESTART:
				drawGameOverFade(surface, substateTimecum);
				drawGameOver(surface, 1.0);
				break;

			case GAME_IS_RUNNING_IGM:
				drawScreenFade(surface, 3*substateTimecum);	// fast fade for IGM
				surface.setFillColor(sgxColorRGBA.White);
				interfaceIGM.draw(surface, 0, 0);
				break;

			default:
				interfaceGame.draw(surface, 0, 0);
				break;
		}
	}

	function drawScreenFade(surface, t) {
		drawScreenFadeOut(surface, sgxMin(t, 1) * 0.7);
	}

	function drawScreenFadeOut(surface, alpha) {
		var color = new sgxColorRGBA(0,0,0, alpha);
		surface.setFillColor(color);
		surface.setFillTexture(gVars.textures.backgroundShaft);
		surface.fillRect();
	}

	function drawNextLevel(surface, t) {
		var t = sgxMin(t, 4) / 4;	// scales between 0 and 1, over 4 seconds
		var width = t * gVars.textures.gameOver.getRegionWidth(2);
		var height = t * gVars.textures.gameOver.getRegionHeight(2);

		surface.setFillColor(sgxColorRGBA.White);
		surface.setFillTexture(gVars.textures.gameOver, 1);

		var x = (surface.getWidth() - width) / 2;
		var y = 100;
		surface.fillRect(x, y, x + width, y + height);
	}

	function drawGameOver(surface, t) {
		var width = t * gVars.textures.gameOver.getRegionWidth(0);
		var height = t * gVars.textures.gameOver.getRegionHeight(0);

		surface.setFillColor(sgxColorRGBA.White);
		surface.setFillTexture(gVars.textures.gameOver);

		var x = (surface.getWidth() - width) / 2;
		var y = 60;
		surface.fillRect(x, y, x + width, y + height);
	}

	function drawGameOverFade(surface, t) {
		
		drawScreenFade(surface, t);

		// NOTE: v1. Of course you use do this...
		surface.setFillColor(sgxColorRGBA.White);
		// ...but since you have the telaps value, why not use it?
		// v2
		var color = new sgxColorRGBA(1, 1, 1, sgxMin(t*3, 1)); // It fades up really quick, compared to the fade out,

		// but in doing so
		// NOTE: v3.Add some effect on the text. Maybe as separate animation frames?
		// frame = sgxFloor(t); // produces a 1fps animation, without having to do anything!
		// NOTE: use tools to generate animations to improve this
		surface.setFillColor(color);
		surface.setFillTexture(gVars.textures.gameOver, 2);
		surface.fillPoint(surface.getWidth() / 2, 320);
	}
	
	function pauseGame() {
		playerData.pause();
	}

	function resumeGame() {
		playerData.resume();
	}
	
	function update(surface, telaps) {
		if (sgx.input.Engine.get().isKeyboardKeyPressed(SGX_KEY_ESCAPE)) {
			if (substate === GAME_IS_RUNNING_IGM) {
				closeInGameMenu();	
			} else {
				openInGameMenu();	
			}
			return;
		}

		viewportRect.left = 0;
		viewportRect.right = surface.getWidth();

		var y = playerData.getPositionY();
		switch(gVars.settings.getOptionAsInt('game.viewport', 3)) {
			case 0:
				break;
			case 1:
				if (y < gVars.playerPositionOffset) {
					y = gVars.playerPositionOffset;
				}
				break;
			case 2:
				if (y < gVars.playerPositionOffset) {
					y = gVars.playerPositionOffset;
				} else {
					y += 10;
				}
				break;
			case 3:
				if (y < gVars.playerPositionOffset) {
					y = gVars.playerPositionOffset;
				}
				y += gVars.playerPosition;
				break;
		}

		viewportRect.top = y;
		viewportRect.bottom = y + surface.getHeight();

		currentLevel.update(surface, telaps);
		playerData.update(surface, telaps);
		
		ui.score.update(surface, telaps);
		ui.health.update(surface, telaps);

		substateTimecum += telaps;

		switch(substate) {
			case GAME_IS_STARTING:
			if (substateTimecum > gVars.tPreGameWait) {
				setSubstate(GAME_IS_PLAYING);
			}
			break;

			case GAME_IS_PLAYING:
			if (playerData.hasPlayerExpired()) {
				musicChannel.startFadeOut(gVars.tFadeToMenu);

				if (playerData.isPlayerDead()) {
					setSubstate(GAME_IS_WATCHING_PLAYER_DIE);
				} else {
					setSubstate(GAME_IS_PREPARING_NEXT_LEVEL);	
				}
			}
			break;

			case GAME_IS_PREPARING_NEXT_LEVEL:
			if (sgx.input.Engine.get().mouseLeft.wasPressed() || sgx.input.Engine.get().isAnyKeyPressed()) {
				nextLevel();
			} else if (substateTimecum > gVars.tFadeToNextLevel) {	
				setSubstate(GAME_IS_WAITING_FOR_NEXT_LEVEL);
			}
			break;
			case GAME_IS_WAITING_FOR_NEXT_LEVEL:
			if (sgx.input.Engine.get().mouseLeft.wasPressed() || sgx.input.Engine.get().isAnyKeyPressed()) {
				nextLevel();
			}
			break;


			case GAME_IS_WATCHING_PLAYER_DIE:
			if (substateTimecum > gVars.tFadeToGameOver) {	
				setSubstate(GAME_IS_DOING_GAME_OVER_ANIM);
			}
			break;
			case GAME_IS_DOING_GAME_OVER_ANIM:
			if (sgx.input.Engine.get().mouseLeft.wasPressed() || sgx.input.Engine.get().isAnyKeyPressed()) {
				changeState('mainmenu');
			} else if (substateTimecum > 1) {
				setSubstate(GAME_IS_AWAITING_RESTART);
			}
			break;
			case GAME_IS_AWAITING_RESTART:
			if (sgx.input.Engine.get().mouseLeft.wasPressed() || sgx.input.Engine.get().isAnyKeyPressed()) {
				changeState('mainmenu');
			}
			break;
		}
	}
	

	return {
		start: function(surface)			{ return startGame(surface); },
		draw: function(surface) 			{ return draw(surface); },
		update: function(surface, telaps) 	{ return update(surface, telaps); }
	};
}
