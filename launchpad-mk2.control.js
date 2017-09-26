loadAPI(2);

host.defineController("Novation", "Launchpad MK2", "1.0", "5290680d-7247-4047-b903-0534ea4bf59b", "Netsu");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Launchpad MK2"], ["Launchpad MK2"]);

load("launchpad-mk2.constants.js");
load("launchpad-mk2.utils.js");

var clipHasContent = makeTable(NUM_TRACKS, NUM_SCENES, false);
var playbackStates = makeTable(NUM_TRACKS, NUM_SCENES, PlaybackState.STOPPED);
var clipColor 	   = makeTable(NUM_TRACKS, NUM_SCENES, Color.BLACK);
var clipColorRGB   = makeTable(NUM_TRACKS, NUM_SCENES, [0, 0, 0]);
var padPressed     = makeTable(NUM_TRACKS, NUM_SCENES, false);

var notePressed = makeArray(43, false);

var trackColor		= [];
var trackColorRGB	= [];
var clipSlots		= [];
var trackIsGroup	= [];
var queuedPads		= [];

var barNum16;
var currentTime;
var launchpadTracks = NUM_TRACKS;

var canScrollDown;
var canScrollUp;
var canScrollLeft;
var canScrollRight;

var user1Held = false;
var user2Held = false;

var currentScene = 0;

var launchpadMode = Mode.LAUNCHER;
var launchpadSideMode = SideMode.SCENES;
var defaultSideMode = SideMode.SCENES;

var velocityLevel 	 = 6;
var velocityMap 	 = makeArray(128, velocityLevel * 16 - 1);
var transpositionMap = makeArray(128, -1);
var emptyMap		 = makeArray(128, -1);


function init()
{
	initMaps();

	// Setup MIDI in stuff
	host.getMidiInPort(0).setMidiCallback(onMidi);
	LaunchpadNotes = host.getMidiInPort(0).createNoteInput("Launchpad", "??????");
    LaunchpadNotes.setShouldConsumeEvents(false);
	LaunchpadNotes.setKeyTranslationTable(emptyMap);
    LaunchpadNotes.setVelocityTranslationTable(velocityMap);

	// create a trackbank (arguments are tracks, sends, scenes)
	trackBank = host.createMasterTrack(0).createSiblingsTrackBank(NUM_TRACKS, NUM_SENDS, NUM_SCENES, false, false);
	sceneBank = host.createSceneBank(NUM_SCENES);
	transport = host.createTransport();
	prefs     = host.getPreferences();

	transport.getPosition().addTimeObserver(":", 2, 1, 1, 0  , function(value)
	{
		currentTime = value;
		var timeTable = currentTime.split(":");
		barNum16 = timeTable[0] % 16;
		updateTopButtons();
		if (parseInt(timeTable[2]) % 2 == 1)
		{
			updateQueuedPads();
		}
	});

	addScrollingObservers();

	for (var i = 0; i < NUM_TRACKS; i++)
	{
		clipSlots[i] = trackBank.getTrack(i).getClipLauncherSlots();
		clipSlots[i].setIndication(true);
		clipSlots[i].addHasContentObserver(hasContentObserver(i));
		clipSlots[i].addColorObserver(clipColorObserver(i));
		clipSlots[i].addPlaybackStateObserver(playbackObserver(i));
		trackBank.getTrack(i).color().addValueObserver(trackColorObserver(i));
		trackBank.getTrack(i).addIsGroupObserver(isGroupObserver(i));
	}
	
	updatePads();
}

function initMaps()
{
	for (var row = 1; row <= 8; row++) // grid row
	{
		for (var col = 1; col <= 8; col++) // grid column
		{
			transpositionMap[(9-row) * 10 + col] = isomorphicNotes[row-1][col-1] + rootC;
		}
	}
}

function getColours()
{
	for (var i = 0; i < NUM_TRACKS; i++)
	{
		var red = trackBank.getTrack(i).color().red();
		var green = trackBank.getTrack(i).color().green();
		var blue = trackBank.getTrack(i).color().blue();
		var color = getColorIndex(red, green, blue);
		trackColor[i] = color;
		trackColorRGB[i] = [red, green, blue];
	}
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
	trackBank.addSceneScrollPositionObserver(function (value) {
		currentScene = value;
		updatePads();
	}, 0);
}

function firstBeatHalf()
{
	return parseInt(currentTime.split(":")[2]) <= 2;
}

function firstBeatQuarter()
{
	return parseInt(currentTime.split(":")[2]) <= 1;
}

function updatePad(track, clip)
{
	if (padPressed[track][clip])
	{
		setColor(track, clip, Color.WHITE);
	}
	else if (launchpadMode == Mode.LAUNCHER)
	{
		if (track == 8 && launchpadSideMode == SideMode.SCENES)
		{
			setColor(track, clip, Color.WHITE);
		}
		else if (track == 8 && launchpadSideMode == SideMode.MAP)
		{
			if (currentScene == clip * 8)
			{
				setColor(track, clip, Color.WHITE);
			}
			else
			{
				setColor(track, clip, Color.GREEN);
			}
		}
		else if (clipHasContent[track][clip])
		{
			var defaultColor = clipColor[track][clip];
			if (trackIsGroup[track])
				defaultColor = trackColor[track];

			var defaultColorRGB = clipColorRGB[track][clip];
			if (trackIsGroup[track])
				defaultColorRGB = trackColorRGB[track];

			if (playbackStates[track][clip] == PlaybackState.PLAYING)
			{
				setColor(track, clip, Color.WHITE);
			}
			else if (playbackStates[track][clip] == PlaybackState.STOPDUE)
			{
				setColor(track, clip, Color.WHITE);
			}
			else if (playbackStates[track][clip] == PlaybackState.QUEUED)
			{
				setColor(track, clip, firstBeatHalf() ? Color.WHITE : defaultColor);
			}
			else
			{
				setColor(track, clip, defaultColor);
				//queueSysexColor(track, clip, defaultColorRGB[0], defaultColorRGB[1], defaultColorRGB[2]);
			}
		}
		else
		{
			//setColorSysex(track, clip, 0, 0, 0);
			setColor(track, clip, Color.BLACK);
		}
	}
	else if (launchpadMode == Mode.KEYBOARD)
	{
		if (track == 8 && velocityLevel == 8 - clip)
		{
			setColor(track, clip, Color.WHITE);
		}
		else if (track == 8)
		{
			setColor(track, clip, Color.BLACK);
		}
		else
		{
			var note = isomorphicNotes[clip][track];
			if (notePressed[note])
			{
				setColor(track, clip, Color.WHITE);
			}
			else
			{
				setColor(track, clip, isomorphicColours[clip][track]);
			}
		}
	}
}

function updateQueuedPads()
{
	for (var t = 0; t < NUM_TRACKS; t++)
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
	getColours();
	//println(launchpadTracks + " " + curSideButtonConfig);
    for (var t = 0; t < NUM_TRACKS; t++)
    {
		for (var c = 0; c < NUM_SCENES; c++)
		{
			updatePad(t, c);
		}
	}
}

function updateTopButtons()
{
	var activeColor = Color.RED_HI;
	if (!firstBeatHalf())
	{
		activeColor = Color.OFF;
	}
	
	setTopColor(LAUNCHPAD_BUTTON_UP, canScrollUp ? Color.WHITE : Color.BLACK);
	setTopColor(LAUNCHPAD_BUTTON_DOWN, canScrollDown ? Color.WHITE : Color.BLACK);
	setTopColor(LAUNCHPAD_BUTTON_LEFT, canScrollLeft ? Color.WHITE : Color.BLACK);
	setTopColor(LAUNCHPAD_BUTTON_RIGHT, canScrollRight ? Color.WHITE : Color.BLACK);
	setTopColor(LAUNCHPAD_BUTTON_SESSION, activeColor);
	setTopColor(LAUNCHPAD_BUTTON_USER1, launchpadSideMode == SideMode.MAP ? Color.WHITE : Color.BLACK);
	setTopColor(LAUNCHPAD_BUTTON_USER2, launchpadSideMode == SideMode.CLIPS ? Color.WHITE : Color.BLACK);
	setTopColor(LAUNCHPAD_BUTTON_MIXER, launchpadSideMode == SideMode.SCENES ? Color.WHITE : Color.BLACK);
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
			println(color);
			trackColor[ch] = color;
			trackColorRGB[ch] = [red, green, blue];
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
			clipColorRGB[ch][index] = [red, green, blue];
			updatePad(ch, index);
		}
};


var playbackObserver = function(channel)
{
    var ch = channel;
    return function (slot, state, queued)
		{
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
		else if (data1 == LAUNCHPAD_BUTTON_SESSION)
		{
			if (launchpadMode == Mode.LAUNCHER)
			{
				launchpadMode = Mode.KEYBOARD;
				LaunchpadNotes.setKeyTranslationTable(transpositionMap);
			}
			else
			{
				launchpadMode = Mode.LAUNCHER;
				LaunchpadNotes.setKeyTranslationTable(emptyMap);
			}
			updatePads();
		}
		else if (data1 == LAUNCHPAD_BUTTON_USER1)
		{
			launchpadSideMode = SideMode.MAP;
			updatePads();
		}
		else if (data1 == LAUNCHPAD_BUTTON_USER2)
		{
			launchpadSideMode = SideMode.CLIPS;
			updatePads();
		}
		else if (data1 == LAUNCHPAD_BUTTON_MIXER)
		{
			launchpadSideMode = SideMode.SCENES;
			updatePads();
		}
		updateTopButtons();
	}
	
	if (status == LAUNCHPAD_PAD_STATUS)
	{
		var row = buttonToClip(data1);
		var column = buttonToChannel(data1);
		padPressed[column][row] = data2 == 127;
		updatePad(column, row);
		
		if (data2 == 127 && launchpadMode == Mode.LAUNCHER)
		{
			if (launchpadSideMode == SideMode.SCENES && column == 8)
			{
				trackBank.launchScene(row);
			}
			else if (launchpadSideMode == SideMode.MAP && column == 8)
			{
				trackBank.scrollToScene(row * NUM_SCENES);
				//sceneBank.scrollTo(buttonToClip(data1) * NUM_SCENES);
			}
			else
			{
				clipSlots[column].launch(row);
			}
		}
		else if (data2 == 127 && launchpadMode == Mode.KEYBOARD && column == 8)
		{
			oldVelocityLevel = velocityLevel;
			velocityLevel = 8 - row;
			for (var velocity = 0; velocity < 128; velocity++)
			{
				velocityMap[velocity] = 16 * velocityLevel - 1;
			}
			LaunchpadNotes.setVelocityTranslationTable(velocityMap);
			updatePad(8, 8 - oldVelocityLevel);
		}
		else if (data2 == 127 && launchpadMode == Mode.KEYBOARD)
		{
			var note = isomorphicNotes[row][column]
			notePressed[note] = true;
			updatePads();
		}
		else if (data2 == 0 && launchpadMode == Mode.KEYBOARD)
		{
			var note = isomorphicNotes[row][column];
			var found = false;
			for (var i = 0; i < 8; i++)
			{
				for (var j = 0; j < 8; j++)
				{
					if (note == isomorphicNotes[i][j] && padPressed[i][j])
					{
						found = true;
					}
				}
			}
			if (found == false)
			{
				notePressed[note] = false;
			}
			updatePads();
		}
	}
}

function exit()
{
   sendMidi(0xB8, 0x00, 0x00);
}
