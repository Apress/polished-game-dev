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

//
// Utility helper class
//

function GameStyleText(style, initialValue) {
var value;
var color;
var peakColor;
// v4
var targetValue;
// v5 - enlarge on change
var attackTimecum;
var decayTimecum;

	(function ctor(style, initialValue) {
		value = targetValue = initialValue;

		if (style === "score") {
			color = sgxColorRGBA.White;
			peakColor = new sgxColorRGBA(179, 182, 183, 1);
		} else {
			color = sgxColorRGBA.White;
			peakColor = new sgxColorRGBA(179, 182, 183, 1);
		}

	})(style, initialValue);


	function drawHealth(surface, x, y, alpha) {
		// v5. pulse - background
		var pulseSize = gVars.textures.health.getRegionWidth(0);
		if (attackTimecum < 1) {	// growing
			pulseSize += attackTimecum * 10;
		} else if (decayTimecum < 1) {
			pulseSize += (1-decayTimecum) * 10;
		}

		var cell = sgxFloor(sgxRescale(targetValue, 100, 0, 0, gVars.textures.health.getNumRegions() - 1));

		surface.setFillColor(new sgxColorRGBA(1,1,1, alpha));
		surface.setFillTexture(gVars.textures.health, cell);
		surface.fillRect(x-pulseSize/2, y-pulseSize/2, x+pulseSize/2, y+pulseSize/2);
	}

	function draw(surface, x, y) {

		var font = sgx.graphics.FontManager.get().getFont('ui');

		// v5. pulse - background
		var pulseSize = 20;
		if (attackTimecum < 1) {	// growing
			pulseSize += attackTimecum * 10;
		} else if (decayTimecum < 1) {
			pulseSize += (1-decayTimecum) * 10;
		}
		// v6. Adjust box size
		var boxSize = sgxMax(3, sgxStrlen("" + value)) * font.getCharacterWidth('0');
		boxSize *= 2;
		boxSize += pulseSize;

		var rc = new sgxRect2f(x-boxSize/2, y-pulseSize+5, boxSize, pulseSize*2);	//  Centre rect
//		var rc = new sgxRect2f(x-pulseSize*2, y-pulseSize-5, pulseSize*4, pulseSize*2);	// Centre rect
		// NOTE: these values (e.g. -5) and *4 *2 are determine by trial and error, and therefore
		// only work with the font given. If it changes, we need to come back, and re-do.
		// This is especially true on the score box. While the number of lives, for example,
		// maybe reasonably consider to have a limit of 0 to 5, the score might extend to 100,
		// 10000 or even 10000. This code make no attempt to fix that.

		surface.setFillTexture(gVars.textures.scorebacking);
		surface.setFillColor(sgxColorRGBA.white);
		surface.fillRect(rc);
		// v6. Change in-built font, for custom font handler
		
		
		// v1. Standard
		surface.setCurrentFont('ui');
		surface.setFontColor(color);
		surface.setFillColor(color);

		// v4. change colour on extent. Might be overkill
		if (pulseSize > 25) {
			surface.setFontColor(peakColor);
			surface.setFillColor(peakColor);
		}

		// v1
		// formatting centred on x,y	 - , CSGXFontFormatting.AlignMiddle needs font
		//surface.drawText(value, x, y, sgx.graphics.FontParameters.AlignMiddle);	

		// v2. Drawing text as textures, because it's easier to customize and control
		// pulseSize
		function processScore(txt, x, y, bDraw, scale) {
			var font = sgx.graphics.FontManager.get().getFont('ui');
			var txt = "" + txt;
			var w = 0;
			var cw;
			var ch;
			var character;
			
			for(var i=0;i<txt.length;++i) {
				character = sgxAtoi(txt.substr(i,1));
	
				cw = sgxFloor(font.getCharacterWidth(character) * scale);
				ch = sgxFloor(font.getHeight() * scale);
				
				if (bDraw) {
					surface.setFillTexture(font.textureList[character]);	// BUGWAN: Hack, dipping into the encapsulated data
					surface.fillRect(x, y-ch/2, x+cw, y+ch)			
					x += cw;
				}
				w += cw;
			}
			
			return w;
		}
		
		var w = processScore(value, x, y, false, pulseSize/20);
		processScore(value, x-w/2, y, true, pulseSize/20);
		
		// v3. Even this is not completely perfect! Imagine if the font was proportional: 111 would
		// be more narrow than 888. A jump in score from 111 to 881, although unlikely, might be
		// possible, and therefore the numbers will appear to jump slightly, so a
		// better (I daren't say 'best', as someone will disprove me) solution is to determine the middle
		// digit, centre it, and place all the other digits around it. However, I don't think anyone will
		// notice because the speed of the action, and so I have not bothered to write this code.
		// If you really have nothing else to work on, I leave it as an exercise for the reader.

	}
	
	// v4. basic cycle
	function updateCycleThrough(telaps) {
		if (targetValue > value)  {
			++value; 
		} else if (targetValue < value) {
			--value; 
		}
	}
		
	// v5. basic pulse
	function updatePulseGrowth(telaps) {
		if (attackTimecum < 1) {	// growing
			attackTimecum += telaps * 15;	// speed=15
		} else {
			decayTimecum += telaps * 5; // speed=5
		}
	}

	function update(surface, telaps) {
		// v4. add update and do _something_ different
		updatePulseGrowth(telaps);
	}

	function set(newValue) {
		// v4, second part
		value = newValue; 
		targetValue = value;
	}

	function change(newValue) {
		// v5 attackTimecum
		targetValue = newValue;

		/*v5*/ 
		value = newValue; 
		attackTimecum = 0; 
		decayTimecum = 0;
	}

	return {
		draw: function(surface, x, y)				{ draw(surface, x, y); },
		drawHealth: function(surface, x, y, alpha) 	{ drawHealth(surface, x, y, alpha); },
		update: function(surface, telaps) 			{ update(surface, telaps); }, 
		set: function(newValue) 					{ set(newValue); },	
		change: function(newValue) 					{ change(newValue); } 
	};
}

function GameStyle() {
}

GameStyle.drawText = function(surface, style, value, x, y) {
	surface.setFontColor(style==="score" ? sgxColorRGBA.White :  sgxColorRGBA.Red);
	surface.drawText(value, x, y);
}

GameStyle.createStyledText = function(style, value) {
	return new GameStyleText(style, value);
}
