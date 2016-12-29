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

/*
Settings can affect methods and change the default parameters of the 
game. e.g. gravity, scores

We hold them in a separate file, committed as settings.js.example, and loaded statically.

But they could be loaded as a JSON. If you do this, you won't be able to use the settings
methods until it's loaded, which can limit the ability of using settings to affect the
start-up sequence.
*/
function populateSettings(settings) {
	var cmd = new CCommandLine();

	settings.setOption('main.startstate', 'titles');	// usually titles or mainmenu
	settings.setOption('main.fps', cmd.getOptionAsBool(null, 'main.fps', false));
	settings.setOption('game.winch', false);

	var musicOn = sgxLocalStorage.getOptionAsBool("audio.music", true);
	musicOn = cmd.getOptionAsBool(null, 'audio.music', musicOn);
	gui.refresMixerMusic(musicOn);

	var sfxOn = sgxLocalStorage.getOptionAsBool("audio.sfx", true);
	sfxOn = cmd.getOptionAsBool(null, 'audio.sfx', sfxOn);
	gui.refresMixerSFX(sfxOn);
}
