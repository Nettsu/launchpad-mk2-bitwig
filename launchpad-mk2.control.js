loadAPI(1);

host.defineController("Novation", "Launchpad MK2 - Netsu", "1.0", "5290680d-7247-4047-b903-0534ea4bf59b", "Netsu");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Launchpad MK2"], ["Launchpad MK2"]);

load("launchpad-mk2.constants.js");
load("launchpad-mk2.utils.js");

var clipHasContent = makeTable(NUM_TRACKS, NUM_SCENES, false);
var playbackStates = makeTable(NUM_TRACKS, NUM_SCENES, PlaybackState.STOPPED);
var clipColor 	   = makeTable(NUM_TRACKS, NUM_SCENES, Color.BLACK);

var trackColor		= [];
var clipSlots		= [];
var trackIsGroup	= [];
var queuedPads		= [];

var currentTime;
var curSideButtonConfig;
var launchpadTracks = NUM_TRACKS;

var canScrollDown;
var canScrollUp;
var canScrollLeft;
var canScrollRight;

var launchpadMode = Mode.SESSION;

function init()
{
	// Setup MIDI in stuff
	host.getMidiInPort(0).setMidiCallback(onMidi);

	// create a trackbank (arguments are tracks, sends, scenes)
	trackBank = host.createMasterTrack(0).createSiblingsTrackBank(NUM_TRACKS, NUM_SENDS, NUM_SCENES, false, false);
	sceneBank = host.createSceneBank(NUM_SCENES);
	transport = host.createTransport();
	prefs     = host.getPreferences();

	transport.getPosition().addTimeObserver(":", 2, 1, 1, 0, function(value){
		currentTime = value;
		if (parseInt(currentTime.split(":")[2]) % 2 == 1)
			updateQueuedPads();
	});

	var modWheelSetting = prefs.getEnumSetting("Side buttons", "Config", ["Launch scenes", "9th track"], "Launch scenes");
    modWheelSetting.addValueObserver(function (value) {
		if (value == "9th track")
		{
			curSideButtonConfig = Configs.NINTH_TRACK;
			launchpadTracks = NUM_TRACKS;
		}
		else if (value == "Launch scenes")
		{
			curSideButtonConfig = Configs.LAUNCH_SCENES;
			launchpadTracks = 8;
		}
		updatePads();
    });

	addScrollingObservers();

	for (var i = 0; i < NUM_TRACKS; i++)
	{
		clipSlots[i] = trackBank.getTrack(i).getClipLauncherSlots();
		clipSlots[i].setIndication(true);
		clipSlots[i].addHasContentObserver(hasContentObserver(i));
		clipSlots[i].addColorObserver(clipColorObserver(i));
		clipSlots[i].addPlaybackStateObserver(playbackObserver(i));
		trackBank.getTrack(i).addColorObserver(trackColorObserver(i));
		trackBank.getTrack(i).addIsGroupObserver(isGroupObserver(i));
	}

	updatePads();
}

function addScrollingObservers()
{
	trackBank.addCanScrollChannelsDownObserver(function(value){
		canScrollRight = value;
		updateTopButtons();
	});
	trackBank.addCanScrollChannelsUpObserver(function(value){
		canScrollLeft = value;
		updateTopButtons();
	});
	trackBank.addCanScrollScenesDownObserver(function(value){
		canScrollDown = value;
		updateTopButtons();
	});
	trackBank.addCanScrollScenesUpObserver(function(value){
		canScrollUp = value;
		updateTopButtons();
	});
}

function firstBeatHalf()
{
	return parseInt(currentTime.split(":")[2]) <= 2;
}

function updatePad(track, clip)
{
	if (track == 8 && curSideButtonConfig == Configs.LAUNCH_SCENES)
		return;

	if (clipHasContent[track][clip])
	{
		var defaultColor = clipColor[track][clip];
		if (trackIsGroup[track])
			defaultColor = trackColor[track];

		if (playbackStates[track][clip] == PlaybackState.PLAYING)
		{
			setColor(track, clip, Color.WHITE);
		}
		else if (playbackStates[track][clip] == PlaybackState.STOPDUE)
		{
			//setColor(track, clip, Color.GREY_MD);
		}
		else if (playbackStates[track][clip] == PlaybackState.QUEUED)
		{
			setColor(track, clip, firstBeatHalf() ? Color.WHITE : defaultColor);
		}
		else
		{
			setColor(track, clip, defaultColor);
		}
	}
	else
	{
		setColor(track, clip, Color.BLACK);
	}
}

function updateQueuedPads()
{
	for (var t = 0; t < launchpadTracks; t++)
    {
		for (var c = 0; c < NUM_SCENES; c++)
		{
			if (playbackStates[t][c] == PlaybackState.QUEUED)
				updatePad(t, c);
		}
	}
}

function updatePads()
{
	//println(launchpadTracks + " " + curSideButtonConfig);
    for (var t = 0; t < launchpadTracks; t++)
    {
		for (var c = 0; c < NUM_SCENES; c++)
		{
			updatePad(t, c);
		}
	}
	if (curSideButtonConfig == Configs.LAUNCH_SCENES)
	{
		for (var c = 0; c < NUM_SCENES; c++)
		{
			setColor(8, c, Color.WHITE);
		}
	}
}

function updateTopButtons()
{
	setTopColor(LAUNCHPAD_BUTTON_UP, canScrollUp ? Color.WHITE : Color.BLACK);
	setTopColor(LAUNCHPAD_BUTTON_DOWN, canScrollDown ? Color.WHITE : Color.BLACK);
	setTopColor(LAUNCHPAD_BUTTON_LEFT, canScrollLeft ? Color.WHITE : Color.BLACK);
	setTopColor(LAUNCHPAD_BUTTON_RIGHT, canScrollRight ? Color.WHITE : Color.BLACK);
	setTopColor(LAUNCHPAD_BUTTON_SESSION, launchpadMode == Mode.SESSION ? Color.WHITE : Color.BLACK);
}

var isGroupObserver = function(channel)
{
    var ch = channel;
    return function (isGroup)
		{
			//println(hasContent);
			trackIsGroup[ch] = isGroup;
			updatePads();
		}
};

var hasContentObserver = function(channel)
{
    var ch = channel;
    return function (index, hasContent)
		{
			//println(hasContent);
			clipHasContent[ch][index] = hasContent;
			updatePad(ch, index);
		}
};

var trackColorObserver = function(channel)
{
    var ch = channel;
    return function (red, green, blue)
		{
			//println((red * 255) + " " + (green*255) + " " + (blue*255));
			var color = getColorIndex(red, green, blue);
			trackColor[ch] = color;
			updatePads();
		}
};

var clipColorObserver = function(channel)
{
    var ch = channel;
    return function (index, red, green, blue)
		{
			var color = getColorIndex(red, green, blue);
			//println(color);
			clipColor[ch][index] = color;
			updatePad(ch, index);
		}
};


var playbackObserver = function(channel)
{
    var ch = channel;
    return function (slot, state, queued)
		{
			//println(ch + " " + slot + " " + state + " " + queued);
			if (state == 0 && !queued)
			{
				playbackStates[ch][slot] = PlaybackState.STOPPED;
			}
			else if (state == 0 && queued)
			{
				playbackStates[ch][slot] = PlaybackState.STOPDUE;
			}
			else if (state == 1 && queued)
			{
				playbackStates[ch][slot] = PlaybackState.QUEUED;
			}
			else if (state == 1 && !queued)
			{
				playbackStates[ch][slot] = PlaybackState.PLAYING;
			}
			updatePad(ch, slot);
		}
};

function onMidi(status, data1, data2)
{
	//println(status + " " + data1 + " " + data2);
	if (status == LAUNCHPAD_BUTTON_STATUS && data2 == 127)
	{
		if (data1 == LAUNCHPAD_BUTTON_UP)
		{
			trackBank.scrollScenesPageUp();
			sceneBank.scrollPageUp();
			sceneBank.getScene(0).showInEditor();
			updatePads();
		}
		else if (data1 == LAUNCHPAD_BUTTON_DOWN)
		{
			trackBank.scrollScenesPageDown();
			sceneBank.scrollPageDown();
			sceneBank.getScene(NUM_SCENES - 1).showInEditor();
			updatePads();
		}
		else if (data1 == LAUNCHPAD_BUTTON_LEFT)
		{
			trackBank.scrollTracksUp();
			trackBank.getTrack(0).makeVisibleInMixer();
			updatePads();
		}
		else if (data1 == LAUNCHPAD_BUTTON_RIGHT)
		{
			trackBank.scrollTracksDown();
			trackBank.getTrack(NUM_TRACKS - 1).makeVisibleInMixer();
			updatePads();
		}
	}
	if (status == LAUNCHPAD_PAD_STATUS && data2 == 127)
	{
		if (curSideButtonConfig == Configs.LAUNCH_SCENES && buttonToChannel(data1) == 8)
		{
			sceneBank.launchScene(buttonToClip(data1));
		}
		else
		{
			clipSlots[buttonToChannel(data1)].launch(buttonToClip(data1));
		}
	}
}

function exit()
{
   sendMidi(0xB8, 0x00, 0x00);
}
