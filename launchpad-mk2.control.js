loadAPI(1);

host.defineController("Novation", "Launchpad MK2 - Netsu", "1.0", "5290680d-7247-4047-b903-0534ea4bf59b", "Netsu");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["Launchpad MK2"], ["Launchpad MK2"]);

//Load LaunchControl constants containing the status for pages and other constant variables
load("launchpad-mk2.constants.js");

var clipHasContent =
[
	[false, false, false, false, false, false, false, false],
	[false, false, false, false, false, false, false, false],
	[false, false, false, false, false, false, false, false],
	[false, false, false, false, false, false, false, false],
	[false, false, false, false, false, false, false, false],
	[false, false, false, false, false, false, false, false],
	[false, false, false, false, false, false, false, false],
	[false, false, false, false, false, false, false, false],
	[false, false, false, false, false, false, false, false]
];

var playbackStates =
[
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0]
];

var clipColor =
[
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0]
];

var trackColor		= [];
var clipSlots		= [];
var trackIsGroup	= [];
var queuedPads		= [];
var currentTime;

var queuedPads		= [];

function init()
{
	// Setup MIDI in stuff
	host.getMidiInPort(0).setMidiCallback(onMidi);

	// create a trackbank (arguments are tracks, sends, scenes)
	trackBank = host.createMasterTrack(0).createSiblingsTrackBank(NUM_TRACKS, NUM_SENDS, NUM_SCENES, false, false);
	transport = host.createTransport();
	transport.getPosition().addTimeObserver(":", 2, 1, 1, 0, function(value){
		currentTime = value;
		updateQueuedPads();
	});

	for (var i = 0; i < NUM_TRACKS; i++)
	{
		clipSlots[i] = trackBank.getTrack(i).getClipLauncherSlots();
		clipSlots[i].addHasContentObserver(hasContentObserver(i));
		clipSlots[i].addColorObserver(clipColorObserver(i));
		clipSlots[i].addPlaybackStateObserver(playbackObserver(i));
		trackBank.getTrack(i).addColorObserver(trackColorObserver(i));
		trackBank.getTrack(i).addIsGroupObserver(isGroupObserver(i));
	}

	updatePads();
}

function updatePad(track, clip)
{
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
			setColor(track, clip, Color.WHITE);
		}
		else if (playbackStates[track][clip] == PlaybackState.QUEUED)
		{
			if (parseInt(currentTime.split(":")[2]) <= 2)
			{
				setColor(track, clip, Color.WHITE);
			}
			else
			{
				setColor(track, clip, defaultColor);
			}
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
    for (var t = 0; t < NUM_TRACKS; t++)
    {
		for (var c = 0; c < NUM_SCENES; c++)
		{
			updatePad(t, c);
		}
	}
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
			//println((red * 255) + " " + (green*255) + " " + (blue*255));
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
				//playbackStates[ch][slot] = PlaybackState.STOPDUE;
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
	println(status + " " + data1 + " " + data2);
	if (status == LAUNCHPAD_BUTTON_STATUS && data2 == 127)
	{
		if (data1 == LAUNCHPAD_BUTTON_UP)
		{
			trackBank.scrollScenesPageUp();
			updatePads();
		}
		else if (data1 == LAUNCHPAD_BUTTON_DOWN)
		{
			trackBank.scrollScenesPageDown();
			updatePads();
		}
		else if (data1 == LAUNCHPAD_BUTTON_LEFT)
		{
			trackBank.scrollTracksUp();
			updatePads();
		}
		else if (data1 == LAUNCHPAD_BUTTON_RIGHT)
		{
			trackBank.scrollTracksDown();
			updatePads();
		}
	}
	if (status == LAUNCHPAD_PAD_STATUS && data2 == 127)
	{
		clipSlots[buttonToChannel(data1)].launch(buttonToClip(data1)) ;
	}
}

function toHex(d)
{
    return  ("0"+(Number(Math.round(d)).toString(16))).slice(-2).toUpperCase()
}

function getColorIndex(red, green, blue)
{
    for (var i = 0; i < COLORS.length; i++)
    {
        var color = COLORS[i];
        if (Math.abs (color[0] - red ) < 0.0001 &&
            Math.abs (color[1] - green) < 0.0001 &&
            Math.abs (color[2] - blue) < 0.0001)
            return color[3];
    }
    return 0;
};

function setColor(track, slot, index)
{
	if (index >= 128)
	{
		index = 0;
	}
	//println(index);
	sendNote(BUTTON_MATRIX[track][slot], index);
}

function setColorRGB(track, slot, r, g, b)
{
	var index = getColorIndex(r, g, b);
	sendNote(BUTTON_MATRIX[track][slot], index);
}

function setColorSysex(track, slot, r, g, b)
{
	var buttonInHex = toHex(BUTTON_MATRIX[track][slot]);
	var sysexString = SYSEX_HEADER + "0B " + buttonInHex + " " + toHex(r*63) + " " + toHex(g*63) + " " + toHex(b*63) + " F7";
	println(sysexString);
	sendSysex(sysexString);
}

function buttonToChannel(button)
{
	return (button % 10) - 1;
}

function buttonToClip(button)
{
	return 9 - (button / 10);
}

function exit()
{
   sendMidi(0xB8, 0x00, 0x00);
}

function sendNote(note, velocity)
{
    sendMidi(0x90, note, velocity);
}
