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

function GameTitlePages(changeState) {
var idx = 0;
var minDuration = [ 2, 1, 0];
var maxDuration = [ 5, 4, 3];
var sfx = [ 'p1', 'p2', 'p4'];
var STATE_FADE_IN  = 0;
var STATE_DISPLAY_WAIT = 1;
var STATE_FADE_OUT  = 2;
var state;
var timecum;
var title_screens = [];

	(function ctor() {
		for(var i=0;i<3;++i) {
			title_screens.push(sgx.graphics.TextureManager.get().load("resources/title/i" + i));
		}
	})();

	function startScreen(i) {
		idx = i;
		timecum = 0;
		state = STATE_FADE_IN;

		sgx.audio.Engine.get().playSound(sfx[i]);
	}
	
	function draw(surface) {
		surface.setFillColor(sgxColorRGBA.black);	
		surface.fillRect();

		var color = new sgxColorRGBA(1,1,1,/*alpha=*/1);
		
		// Support different speeds for the fade. Out is generally quicker, since 'in' is the ancipation
		if (state == STATE_FADE_IN) {
			color.a = sgxMin(1, timecum * 3.0);
			color.r = color.g = color.b = color.a;
		} else if (state == STATE_FADE_OUT) {
			color.a = 1 - sgxMin(1, timecum * 5);	// note the range here
			color.r = color.g = color.b = color.a;
		}
		
		surface.setFillColor(color);	
		surface.setFillTexture(title_screens[idx]);
		surface.fillRect();		
	}
	
	function update(surface, telaps) {
		timecum += telaps;
		
		switch(state) {
			case STATE_FADE_IN:
				if (timecum > 1) {
					state = STATE_DISPLAY_WAIT;
					timecum = 0;
				}
				break;
			case STATE_DISPLAY_WAIT:
				if (timecum > minDuration[idx] && (timecum > maxDuration[idx] ||  sgx.input.Engine.get().mouseLeft.wasPressed() || sgx.input.Engine.get().isAnyKeyPressed()) ) {
					state = STATE_FADE_OUT;
					timecum = 0;
				}
				break;
			case STATE_FADE_OUT:
				if (timecum > 1) {
					if (++idx == title_screens.length) {
						changeState('mainmenu');
					} else {
						startScreen(idx);
					}
				}
				break;
		}

	}
	

	return {
		start: function(surface) 			{ return startScreen(0); },
		draw: function(surface) 			{ return draw(surface); },
		update: function(surface, telaps) 	{ return update(surface, telaps); }
	};
}
