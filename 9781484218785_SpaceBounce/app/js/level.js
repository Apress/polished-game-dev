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

function GameLevel(idx) {
var treasure_data_side;
var treasure_total;
var treasure_count;
var obstacle_data_side;
var tile_data_left;
var tile_data_right;
var haliteWidth = gVars.textures.halite.getRegionWidth(0);
var rockWidth = gVars.textures.rocks.getRegionWidth(0);
var tileWidth = gVars.textures.edge.getRegionWidth(0);
var tileHeight = gVars.textures.edge.getRegionHeight(0);
var leftSide = 0;
var rightSide = 1;
var animStateHalite;
var levelIndex;
var animStateWinch;
var animationWinchData;

	(function ctor() {
		animStateWinch = sgx.graphics.AnimationManager.get().createState();
		animStateWinch.setAnimationDataSet(gVars.animations.winch);

		animStateHalite = sgx.graphics.AnimationManager.get().createState();
		animStateHalite.setAnimationDataSet(gVars.animations.halite);

		newLevel(idx);

	})();

	function newLevel(index) {	
		levelIndex = index;

		var intendedHeight = 1400 + index * 200;
		gVars.topOfWorld = sgxFloor(intendedHeight / tileHeight) * tileHeight - 56;
		gVars.winchTop = gVars.topOfWorld - 145;
		gVars.winchRopeTop = gVars.winchTop - 10;
		gVars.skyPositionY = gVars.topOfWorld;
		gVars.moonPositionY = gVars.topOfWorld - 85;
		gVars.shaftHeight = gVars.topOfWorld - 200;
		gVars.playerStartYPos = gVars.shaftHeight + 40;

		treasure_data_side = [new Array(), new Array()];
		obstacle_data_side = [new Array(), new Array()];
		edge_data_side = [new Array(), new Array()];

		// All crystals animate at the same rate & speed, for convenience
		animStateHalite.startSequence("sparkle");

		animStateWinch.startSequence("unwind");
		
		var countSinceLastObstacle = 0;
		var y = sgxFloor(gVars.shaftHeight / tileHeight);
		var obstacleChance = sgxRescale(levelIndex, 2, 10, 5, 9);
		var haliteChance = sgxRescale(levelIndex, 1, 10, 2, 7);
		y -= 3;	// nothing for the first 3 tiles, i.e. where you start
		treasure_total = 0;
		while(y>=0) {
			obstacle_data_side[leftSide][y] = obstacle_data_side[rightSide][y] = -1;
			treasure_data_side[leftSide][y] = treasure_data_side[rightSide][y] = false;

			edge_data_side[leftSide][y] = sgxRand(10) * 2;
			edge_data_side[rightSide][y] = sgxRand(10) * 2 + 1;

			if (countSinceLastObstacle <= 0 && sgxRand(0, 10) < haliteChance) {
				countSinceLastObstacle = 3;
				if (sgxRand(0, 2)) {
					obstacle_data_side[leftSide][y] = sgxRand(0, 3) * 2;
				} else {
					obstacle_data_side[rightSide][y] = sgxRand(0, 3) * 2 + 1;
				}
				
			} else if (sgxRand(0, 10)  < haliteChance) {
				treasure_data_side[sgxRand(0, 2) ? leftSide : rightSide][y] = true;
				++treasure_total;
			}

			--countSinceLastObstacle;
			--y;
		}

		treasure_count = treasure_total;
	}

	function drawBackground(surface, viewportRect) {
		var screenWidth = surface.getWidth();
		var screenHeight = surface.getHeight();

		var variation = gVars.settings.getOptionAsInt('game.background', 3);
		switch(variation) {
			case 0:
			// 1. Static image, behind everything	
			surface.setFillTexture(gVars.textures.backgroundShaft);
			surface.fillRect();
			break;

			case 1:
			//  Scrolling static image, behind everything	
			var bgy = viewportRect.top % screenHeight;		
			surface.setFillTexture(gVars.textures.backgroundShaft);
			surface.fillRect(0, bgy-screenHeight, screenWidth, bgy);
			surface.fillRect(0, bgy, screenWidth, bgy+screenHeight);
			break;

			case 2:
			// Scrolling static image, paralax behind everything
			var bgy = (viewportRect.top/2) % screenHeight;		
			surface.setFillTexture(gVars.textures.backgroundShaft);
			surface.fillRect(0, bgy-screenHeight, screenWidth, bgy);
			surface.fillRect(0, bgy, screenWidth, bgy+screenHeight);
			break;

			case 3:// with moon
			var bgy = (viewportRect.top/2) % screenHeight;		
			surface.setFillTexture(gVars.textures.backgroundShaft);
			surface.fillRect(0, bgy-screenHeight, screenWidth, bgy);
			surface.fillRect(0, bgy, screenWidth, bgy+screenHeight);
			surface.fillRect(0, bgy+screenHeight, screenWidth, bgy+2*screenHeight);

			// If the sky is still visible, then draw it over the normal background
			//var skyHeight = gVars.textures.backgroundSky.getHeight();
			var skyHeight = gVars.skyPositionY - gVars.shaftHeight;
			var bgy = viewportRect.top - gVars.skyPositionY;
			if (bgy > -skyHeight) {
				surface.setFillTexture(gVars.textures.backgroundSky);
				surface.fillRect(0, bgy, screenWidth, bgy + skyHeight);
			}
			break;
		}	
			
		var moonX = 30;
		var moonY = viewportRect.top - gVars.moonPositionY;
		var phase = SunCalc.getMoonIllumination(new Date()).phase;
		var moonWidth = gVars.textures.moon.getRegionWidth(0);

		surface.setFillTexture(gVars.textures.moon, 0);
		surface.fillPoint(moonX, moonY, sgx.graphics.DrawSurface.eFromTopLeft);
		
		// phase: 0=new, 0.5=full,1.0 waning
		if (phase < 0.5) {
			moonX -= phase * moonWidth * 2;
		} else {
			moonX += (1 - phase) * moonWidth * 2;
		}
		surface.setFillTexture(gVars.textures.moon, 1);
		surface.fillPoint(moonX, moonY, sgx.graphics.DrawSurface.eFromTopLeft);


		// Version 4. TODO: Add a second bg layer, maybe with animation creatures on it, at a different paralax speed.

		// Version 5. TODO: Add a front layer,, maybe with animation creatures on it, at a fast paralax speed

	}

	function draw(surface, viewportRect) {
		var screenWidth = surface.getWidth();
		var screenHeight = surface.getHeight();

		var topShaft = viewportRect.top - gVars.shaftHeight;
		var topShaftTile = sgxFloor(gVars.shaftHeight / tileHeight);

		var cellHalite = animStateHalite.getCurrentCell();
		
		var y = topShaft;
		var tileOffset = topShaftTile;

		drawBackground(surface, viewportRect);

		for(;y<screenHeight+tileHeight && tileOffset >= 0;y+=tileHeight, --tileOffset) {
			if (y < -tileHeight) {
				continue;
			}
			
			surface.setFillTexture(gVars.textures.edge, edge_data_side[leftSide][tileOffset]);
			surface.fillPoint(0, y, sgx.graphics.DrawSurface.eFromTopLeft);
			
			surface.setFillTexture(gVars.textures.edge, edge_data_side[rightSide][tileOffset]);
			surface.fillPoint(screenWidth-tileWidth, y, sgx.graphics.DrawSurface.eFromTopLeft);
			
			if (obstacle_data_side[leftSide][tileOffset] >= 0) {
				surface.setFillTexture(gVars.textures.rocks, obstacle_data_side[leftSide][tileOffset]);
				surface.fillPoint(tileWidth, y, sgx.graphics.DrawSurface.eFromTopLeft);
			}			
			if (obstacle_data_side[rightSide][tileOffset] >= 0) {
				surface.setFillTexture(gVars.textures.rocks, obstacle_data_side[rightSide][tileOffset]);
				surface.fillPoint(screenWidth-(tileWidth+rockWidth), y, sgx.graphics.DrawSurface.eFromTopLeft);
			}			
			
			if (treasure_data_side[leftSide][tileOffset]) {
				surface.setFillTexture(gVars.textures.halite, cellHalite);
				surface.fillPoint(tileWidth, y, sgx.graphics.DrawSurface.eFromTopLeft);
			}			
			if (treasure_data_side[rightSide][tileOffset]) {
				surface.setFillTexture(gVars.textures.halite, cellHalite);
				surface.fillPoint(screenWidth-(tileWidth+haliteWidth), y, sgx.graphics.DrawSurface.eFromTopLeft);
			}			
		}
		
		// Draw floor
		if (y < screenHeight) {
			surface.setFillTexture(gVars.textures.floor);
			surface.fillRect(0, y, screenWidth, y + 300);	// Y2 can vary according to where the shaft stops
		}

	}

	function postDraw(surface, viewportRect) {

		// Draw winch
		var winchTop = viewportRect.top - gVars.winchTop;
		var winchGfxHeight = gVars.textures.winch.getRegionHeight(0);

		if (winchTop > -winchGfxHeight) {
			var cellWinch = animStateWinch.getCurrentCell();
			surface.setFillTexture(gVars.textures.winch, cellWinch);
			surface.fillRect(0, winchTop, 320, winchTop+winchGfxHeight);
		}

		surface.setFillTexture(gVars.textures.overlay);
		surface.fillRect();
	}

	function getCollisions(playerWall, rc) {
	
		// v1. basic arithmetic
		// v2. do it properly, with the collision library. e.g.
		//    var plyCollision = new sgxCollisionBodyRect2f(rc.left, rc.top, rc.right, rc.bottom);
		// v3. switch rock collisions for pixmap

		// This is v1...

		var topmostTile = sgxFloor(rc.top / tileHeight);
		var tile = topmostTile;
		var y = rc.top;
		var score = 0;
		
		// v1. Simply check the 3 tiles we _know_ he's on
		// v2. Note: Player may straddle many tiles. In case the height of player
		// or tiles change, we should do it like this.
		var gotHalite = false;
		var hitObstacle = false;
		while(y  < rc.bottom) {
		
			if (playerWall !== -1) {
				if (treasure_data_side[playerWall][tile]) {
					treasure_data_side[playerWall][tile] = false;
					score += 25;
					gotHalite = true;
					--treasure_count;
				}

				if (obstacle_data_side[playerWall][tile] >= 0) {
					obstacle_data_side[playerWall][tile] = -1;
					hitObstacle = true;
				}
			}
		
			tile -= 1;	// because we work down, from 1000 (top) to 0 (bottom)
			y += tileHeight;
		}
		
		return { score: score, obstacle: hitObstacle, halite: gotHalite };
	}
	
	function getHaliteTotals() {
		return { total: treasure_total, count: treasure_count };
	}
	
	function update(surface, telaps) {
		animStateHalite.update(telaps);
		animStateWinch.update(telaps);
	}
	

	return {
		newLevel: function() 						{ return newLevel(); },
		getLevel: function() 						{ return levelIndex; },

		update: function(surface, telaps) 			{ return update(surface, telaps); },
		draw: function(surface, viewportRect) 		{ return draw(surface, viewportRect); },
		postDraw: function(surface, viewportRect)	{ return postDraw(surface, viewportRect); },

		getCollisions: function(playerWall, rc)		{ return getCollisions(playerWall, rc); },
		getHaliteTotals: function() 				{ return getHaliteTotals(); }
	};
}
