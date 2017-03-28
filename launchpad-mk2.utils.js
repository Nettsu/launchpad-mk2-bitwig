var queuedColorUpdates = "";

function toHex(d)
{
    return  ("0"+(Number(Math.round(d)).toString(16))).slice(-2).toUpperCase()
}

function getColorIndex(red, green, blue)
{
    for (var i = 0; i < BITWIG_COLOR_MAP.length; i++)
    {
        var color = BITWIG_COLOR_MAP[i];
        if (Math.abs (color[0] - red ) < 0.001 &&
            Math.abs (color[1] - green) < 0.001 &&
            Math.abs (color[2] - blue) < 0.001)
		{
			//println(color[3]);
            return color[3];
		}
    }
	println("Color not found: " + red + "/" + green + "/" + blue);
    return 0;
};

function setColor(track, slot, index)
{
	if (index >= 128)
	{
		index = 0;
	}
	//println(index);
	sendMidi(NOTE_CHANNEL, getButtonNumber(track, slot), index);
}

function setBlinkColor(track, slot, index1)
{
	//println(index);
	sendMidi(BLINK_CHANNEL, getButtonNumber(track, slot), index1);
}

function setColorRGB(track, slot, r, g, b)
{
	var index = getColorIndex(r, g, b);
	sendMidi(NOTE_CHANNEL, getButtonNumber(track, slot), index);
}

function setTopColor(button, index)
{
	sendMidi(TOP_CHANNEL, button, index);
}

function queueSysexColor(track, slot, r, g, b)
{
	r = r * r * 63;
	g = g * g * 63;
	b = b * b * 63;
	var buttonInHex = toHex(getButtonNumber(track, slot));
	var colorString = " " + buttonInHex + " " + toHex(r) + " " + toHex(g) + " " + toHex(b);

	queuedColorUpdates += colorString;
}

function flushQueuedSysexColors()
{
	if (queuedColorUpdates != "")
	{
		var sysexString = SYSEX_HEADER + "0B" + queuedColorUpdates + " F7";
		sendSysex(sysexString);
		queuedColorUpdates = "";
	}
}

function setSysexColor(track, slot, r, g, b)
{
	// r, g and b are a value between 0 and 1, need to multiply 63 to get Launchpad scope
	// also launchpad LEDs light up non-linearly, so I make the scale exponential

	r = r * r * 63;
	g = g * g * 63;
	b = b * b * 63;

	//println(r + " " + g + " " + b);

	var buttonInHex = toHex(getButtonNumber(track, slot));
	var sysexString = SYSEX_HEADER + "0B " + buttonInHex + " " + toHex(r) + " " + toHex(g) + " " + toHex(b) + " F7";
	sendSysex(sysexString);
}

function makeTable(x, y, init)
{
	var table = new Array(x);
	for (var i = 0; i < x; i++)
	{
		table[i] = new Array(y);
		for (var j = 0; j < y; j++)
		{
			table[i][j] = init;
		}
	}
	return table;
}

function getButtonNumber(channel, clip)
{
	return (channel + 1) + ((8 - clip) * 10);
}

// channel numbering is 0-based
function buttonToChannel(button)
{
	return (button % 10) - 1;
}

// clip numbering is 1-based
function buttonToClip(button)
{
	return 9 - (button / 10);
}

function sendMidiClock()
{
	sendSysex("F8");
}
