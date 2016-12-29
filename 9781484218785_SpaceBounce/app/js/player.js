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

function GamePlayer(uiData) {
	var sstate;
	var currentLevel;
	var bounce_step = 14;	// Try and be perfectly divisible by the width (screenWidth-42-42-32 = 364) - BUGWARN: if sizes change, this breaks
	var x;
	var y;
	var yFallSpeed = 1;
	var animStatePlayer;
	var animPlayerWin;
	var animStateClingingRope;
	var xLeftWall, xRightWall;
	var isPaused;
	var playerHasExpired; 
	var ui;
	var data;

	(function ctor(uiData) {
		animStatePlayer = sgx.graphics.AnimationManager.get().createState();
		animStatePlayer.setAnimationDataSet(gVars.animations.player);

		animPlayerWin = sgx.graphics.AnimationManager.get().createState();
		animPlayerWin.setAnimationDataSet(gVars.animations.playerwin);

		animStateClingingRope = sgx.graphics.AnimationManager.get().createState();
		animStateClingingRope.setAnimationDataSet(gVars.animations.rope);

		ui = uiData;
	})(uiData);
	
	function startGame(gameData) {
		data = gameData;
		data.health = 100; 
		data.score = 0;
	}

	function startLevel(level) {
		var surface = sgx.graphics.DrawSurfaceManager.get().getDisplaySurface();
		var screenWidth = surface.getWidth();

		currentLevel = level;

		isPaused = false;
		playerHasExpired = false;

		ui.score.set(data.score);
		ui.health.set(data.health);

		yFallSpeed = currentLevel.getLevel() + 2;

		xLeftWall = gVars.textures.edge.getRegionWidth(0) - gVars.playerOverlapWithWall;
		xRightWall = screenWidth-gVars.textures.edge.getRegionWidth(0)-gVars.textures.player.getRegionWidth(0) + gVars.playerOverlapWithWall;

		x = xRightWall;
		y = gVars.playerStartYPos;

		sstate = new sgxStateMachine({
			'waiting': { 
				onStart: function(params) { 
				},
				onUpdate: function(params, telaps) {
				},
			},
			'hanging': { 
				onStart: function(params) { 
					x = params['targetx']; 
					animStatePlayer.startSequence("hanging");
					animStateClingingRope.startSequence("rope_right");
				},
				onUpdate: function(params, surface, telaps, timecum) {
					animStatePlayer.update(telaps);
					animStateClingingRope.update(telaps);

					if (timecum > gVars.tHangingTimeout) {
						sgx.audio.Engine.get().playSound("uhoh");
						sstate.changeState('cling', {targetx: x});
					}
				},
			},
			'cling': { 
				onStart: function(params) { 
					x = params['targetx'];
					if(x < 100) {
						animStatePlayer.startSequence("idle_left");
						animStateClingingRope.startSequence("rope_left");
					} else {
						animStatePlayer.startSequence("idle_right");	
						animStateClingingRope.startSequence("rope_right");
					}
				},
				onUpdate: function(params, surface, telaps, timecum) {
					animStatePlayer.update(telaps);
					animStateClingingRope.update(telaps);
					handleInputControl();
					y -= yFallSpeed;

					// Not sure about the breath - what do you think?
					if ((y % 50) == 0) {
						//sgx.audio.Engine.get().playSound("breath");
					}
				},
				onEnd: function() {}
			},
			'bounce': { 
				onStart: function(params) {
					if(params['targetx'] < 100) {
						animStatePlayer.startSequence("bounce_left"); 
					} else {
						animStatePlayer.startSequence("bounce_right"); 
					}
				},
				onUpdate: function(params, surface, telaps, timecum) {
					animStatePlayer.update(telaps);
					if (x < params['targetx']) {
						x += bounce_step;

						// Handle the overshoot, due to bounce_step not being a perfect
						// multiple of the width.
						if (x > params['targetx']) {
							x = params['targetx'];
							sstate.changeState('cling', {targetx: params['targetx']});
						}
					} else if (x > params['targetx']) {
						x -= bounce_step;
					} else {
						sstate.changeState('cling', {targetx: params['targetx']});
					}
					y -= yFallSpeed;
				},
				onEnd: function() {}
			},
			'spring': { 
				onStart: function(params) { 
					if (params['targetx'] === xLeftWall) {	// bounce to left
						animStatePlayer.startSequence("spring_right");
					} else {
						animStatePlayer.startSequence("spring_left");
					}
				},
				onUpdate: function(params, surface, telaps, timecum) {
					animStatePlayer.update(telaps);
					if (animStatePlayer.m_bExtent) {
						sstate.changeState('bounce', {targetx: params['targetx']});
					}
					y -= yFallSpeed;
				},
				onEnd: function() {}
			},
			'dead': {
				onStart: function(params) {
					sgx.audio.Engine.get().playSound("grunt");
					setTimeout(function() {sgx.audio.Engine.get().playSound("death");}, 650);
				},
				onUpdate: function(params, surface, telaps, timecum) {
					if (timecum > gVars.tPostGameWait ) {
						playerHasExpired = true;						
					}
				},
			},
			'endlevel': {
				onStart: function(params) {
					var haliteCollected = currentLevel.getHaliteTotals();
					if (haliteCollected.count == 0) {	// all collected awards a bonus
						addScore(5 * haliteCollected.total);
					}
					
					data.health = sgxMin(100, data.health+5);

					animPlayerWin.startSequence("yay");
					sgx.audio.Engine.get().playSound("yeahbig");
					setTimeout(function() {sgx.audio.Engine.get().playSound("endlevel");}, 450);
				},
				onUpdate: function(params, surface, telaps, timecum) {
					animPlayerWin.update(telaps);
					if (timecum > gVars.tPostGameWait ) {
						playerHasExpired = true;
					}
				}
			}
		});

		sstate.changeState('hanging', {targetx: xRightWall});
	}

	function draw(surface, viewportRect) {
		var playerWidth = gVars.textures.player.getRegionWidth(0);
		var playerHeight = gVars.textures.player.getRegionWidth(0);
		var ropeTop = sgxMax(0, viewportRect.top - gVars.winchRopeTop);

		var cell = sgxFloor(sgxRescale(x, xLeftWall, xRightWall, 0, 9));
		if (sstate.isState('cling') || sstate.isState('hanging')) {
			cell = animStateClingingRope.getCurrentCell();
		}

		surface.setFillTexture(gVars.textures.rope, cell);
		surface.fillRect(xLeftWall + playerWidth/2, ropeTop, xRightWall + playerWidth/2, (viewportRect.top - y) + playerHeight);
	}

	function postDraw(surface, viewportRect) {
		var cell;
		var posY; //need to change the pos of player on yay

		if(sstate.isState('endlevel')) {
			cell = animPlayerWin.getCurrentCell();
			surface.setFillTexture(gVars.textures.playerwin, cell);
			posY = viewportRect.top - y - 15;
		} else {
			cell = animStatePlayer.getCurrentCell();
			surface.setFillTexture(gVars.textures.player, cell);
			posY = viewportRect.top - y;
		}	
		
		surface.fillPoint(x, posY, sgx.graphics.DrawSurface.eFromTopLeft);

		sstate.draw(surface);	// usually a nop - since the update prepares what the state will draw
	}

	function moveTo(xpos) {
		if (!sstate.isState('cling')) {
			return;
		}
		if (x === xpos) {
			return;
		}

		switch(gVars.settings.getOptionAsInt('game.ply_jump', 2)) {
			case 0:
				sstate.changeState('cling', {targetx:xpos});
				break;
			case 1:
				sstate.changeState('bounce', {targetx:xpos});
				break;
			case 2:
				sstate.changeState('spring', {targetx:xpos});
				break;
		}

		sgx.audio.Engine.get().playSound("grunt");
	}
	
	function handleBounceKey() {
		if (x === xLeftWall) {
			moveTo(xRightWall); 
		} else {
			moveTo(xLeftWall);
		}
	}
	
	function handleInputControl() {
		if (sgx.input.Engine.get().isKeyboardKeyPressed(SGX_KEY_LEFT)) {
			moveTo(xLeftWall);
		} else if (sgx.input.Engine.get().isKeyboardKeyPressed(SGX_KEY_RIGHT)) {
			moveTo(xRightWall); 
		}
	}

	function pause() {
		isPaused = true;
	}

	function resume() {
		isPaused = false;
	}
	
	function update(surface, telaps) {

		if (isPaused) {
			return;
		}

		sstate.update(surface, telaps);

		// Handle the player interactions with the world		
		var rc = new sgxRect2f();
		var playerWall = getPlayerWall();

		getCollisionRect(rc);
		
		var collisionData = currentLevel.getCollisions(playerWall, rc);
		
		addScore(collisionData.score);

		if (collisionData.obstacle) {
			sgx.audio.Engine.get().playSound("ouch");
			damagePlayer(gVars.playerDamage * sgxRescale(currentLevel.getLevel(), 0, 5, 1, 1.5));

		} else if (collisionData.halite) {
			sgx.audio.Engine.get().playSound("yeah");
		}		
		
		// TODOC: This assumes that rc.top moves. If it doesn't, then every update will
		// trigger this. Including the start. Or whenever the game is paused!
		// V2. So  we add the telaps&& line
		if ((rc.top % 150) == 0 && telaps != 0) {
			addScore(1);
			// This got annoying, really quick ;(
			// (But feel free to add it back, if you like)
			//sgx.audio.Engine.get().playSound("bing");
		}



		// v1 (but when we added 'wait at top, to show the moon', this broke!)
		// Again, these should be in state, since we might have a state called 'waiting on the
		// bottom of the pit'. However, we currently don't, so it's less error prone to keep it
		// here, since it might get forgotten about if it needs to be added to all _new_ states.
		//if (y > 96) {	// player height
			//y -= 1; //speed
		//}

		// v2. Add limiter in, to prevent bugs in update
		if (y < 96) {	// player height
			y = 96;		
			sstate.changeState('endlevel');	
		}

	}

	function addScore(n) {
		// v6. Don't update a flash thing, if there's no change.
		// This happens when grading scores 
		if (n === 0){
			return;
		}
		
		data.score += n;

		if (data.score < 0) {
			data.score = 0;
		}
		
		// v3. You can see that data.score is separate from it's presentative layer
		// (at the expensive of having two things to change - thus the addScore method)
		//ui.score.set(data.score);
		
		// v4. Don't set, change
		ui.score.change(data.score);
	}
		
	function damagePlayer(amount) { 

		if (data.health) {
			data.health -= amount; 
			if (data.health < 0) {
				data.health = 0;
				sstate.changeState('dead');	
			}
			ui.health.change(data.health);
		}
	}
		
	function getCollisionRect(rc) { 
		rc.left = x; 
		rc.top = y; 
		rc.right = rc.left + gVars.textures.player.getRegionWidth(0); 
		rc.bottom = rc.top + gVars.textures.player.getRegionHeight(0); 
	}

	function getPlayerWall() {
		if (x === xLeftWall) {
			return 0;
		} else if (x === xRightWall) {
			return 1;
		} else {
			return -1;
		}
	}


	return {
		startGame: function(gameData) 			{ return startGame(gameData); },
		startLevel: function(level) 			{ return startLevel(level); },
		draw: function(surface, viewportRect) 	{ return draw(surface, viewportRect); },
		postDraw: function(surface, viewportRect) { return postDraw(surface, viewportRect); },

		pause: function() 					{ pause(); },
		resume: function() 					{ resume(); },

		update: function(surface, telaps) 	{ update(surface, telaps); },

		handleBounceKey: function() 		{ handleBounceKey(); },
		
		// TODOC: v1. isGameOver is incorrect, the player reaches the bottom and/or is dead.
		// However, the game isn't over. The _player_ is. The game should be allowed to continue
		// for a few moments, so the player can see what they missed out on. This let's them
		// curse their stupidity, and convince them to try again.
		// It is perfectly acceptable to introduce extra bonus prizes at this point, as if to say
		// "look how close you were". Don't do it every time, otherwise an astute player will spot
		// the pattern, and
		//isGameOver:function() { return y == 96 ? true : false; },
		hasPlayerExpired:function() 		{ return playerHasExpired; },
		isPlayerDead: function()			{ return data.health <= 0 ? true : false; },
		getHealth: function() 				{ return data.health; },

		damagePlayer: function(amount)		{ damagePlayer(amount); },
		
		getCollisionRect:function(rc) 		{ getCollisionRect(); },
		getPlayerWall: function() 			{ return getPlayerWall(); },
		
		//getViewportPositionY: function() { return y; } // TODOC: version 1
		//getViewportPositionY: function() { return y > 192 ? y : 192; } // TODOC: version 2
		//getViewportPositionY: function() { return y > 192 ? y+10 : 192; }// v3 - but bug at bottom, which you never spot, because you never test it
		//getViewportPositionY: function() { return y > 182 ? y+10 : 192; }// v4

		// v5 reverted to the original, but with additonal logic in the game
		getPositionY: function() 			{ return y; },

	};
};
