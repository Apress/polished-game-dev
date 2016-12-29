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
var gui = {};

gui.polishHandler = function(obj) {
	var category = $(obj).data('cat');
	var selection = $(obj).text();

	$('.button.' + category + '.radio').removeClass('checked');
	$(obj).addClass('checked');

	gVars.settings.setOption('game.' + category, selection);

	return false;
}

//
// Replaying and logging user input
//
gui.startLogging = function() {
	gui.keyLog = new sgx.input.Logger();
	gui.keyLog.start();
	//gui.keyLog.sgxSetRandSeed(0);

	sgx.input.Engine.get().assignLogger(gui.keyLog);
}

gui.endLogging = function() {
	sgx.input.Engine.get().assignLogger(NULL);

	gui.keyLog.end();
}

gui.replayLogging = function() {
	if (gui.keyLog) {
		gui.keyLog.replay();
	}
}

//
// Handling the music and sfx controls
//
gui.toggleMuteSFX = function(widget) {
	var current = sgx.audio.Engine.get().getNormalizationLevel('vox');	

	sgxLocalStorage.setOption("audio.sfx", current ? false : true);

	gui.refresMixerSFX(!current);
	gui.refreshWidgetSFX(widget);
}

gui.refreshWidgetSFX = function(widget) {
	var current = sgx.audio.Engine.get().getNormalizationLevel('vox');	

	widget.setFirstRegion(current ? gResources.mini.sfxOn : gResources.mini.sfxOff);
}

gui.refresMixerSFX = function(audible) {
	sgx.audio.Engine.get().setNormalizationLevel('vox', audible ? audioGroups['vox'].factor : 0);
	sgx.audio.Engine.get().setNormalizationLevel('sfx', audible ? audioGroups['sfx'].factor : 0);
	sgx.audio.Engine.get().setNormalizationLevel('player', audible ? audioGroups['player'].factor : 0);
	sgx.audio.Engine.get().setNormalizationLevel('ui', audible ? audioGroups['ui'].factor : 0);
}

gui.toggleMuteMusic = function(widget, currentlyPlayingMusicChannel, startMusicCallback) {
	if (currentlyPlayingMusicChannel && currentlyPlayingMusicChannel.isPlaying()) {
		currentlyPlayingMusicChannel.startFadeOut(gVars.tMusicFadeOut, function(e) {
			currentlyPlayingMusicChannel.stop();
			gui.toggleMuteMusic(widget, NULL, NULL);
		});
	} else {

		var currentVolumeLevel = sgx.audio.Engine.get().getNormalizationLevel('music');
		var isAudible = currentVolumeLevel ? false : true;	// Toggle the state

		sgxLocalStorage.setOption("audio.music", isAudible);

		gui.refresMixerMusic(isAudible);
		gui.refreshWidgetMusic(widget);

		if (isAudible && startMusicCallback) {
			startMusicCallback();
		}
	}
}

gui.refresMixerMusic = function(audible) {
	sgx.audio.Engine.get().setNormalizationLevel('music', audible ? audioGroups['music'].factor : 0);
}

gui.refreshWidgetMusic = function(widget) {
	var current = sgx.audio.Engine.get().getNormalizationLevel('music');	

	widget.setFirstRegion(current ? gResources.mini.musicOn : gResources.mini.musicOff);
}
