var LOWEST_CC = 21;
var HIGHEST_CC = 48;

var SYSEX_HEADER = "F0 00 20 29 02 18 ";

var LAUNCHPAD_BUTTON_STATUS = 176;
var LAUNCHPAD_PAD_STATUS = 144;

var LAUNCHPAD_BUTTON_UP        = 104;
var LAUNCHPAD_BUTTON_DOWN      = 105;
var LAUNCHPAD_BUTTON_LEFT      = 106;
var LAUNCHPAD_BUTTON_RIGHT     = 107;
var LAUNCHPAD_BUTTON_SESSION   = 108;
var LAUNCHPAD_BUTTON_NOTE      = 109;
var LAUNCHPAD_BUTTON_DEVICE    = 110;
var LAUNCHPAD_BUTTON_USER      = 111;

var BUTTON_MATRIX =
[
	[81, 71, 61, 51, 41, 31, 21, 11],
	[82, 72, 62, 52, 42, 32, 22, 12],
	[83, 73, 63, 53, 43, 33, 23, 13],
	[84, 74, 64, 54, 44, 34, 24, 14],
	[85, 75, 65, 55, 45, 35, 25, 15],
	[86, 76, 66, 56, 46, 36, 26, 16],
	[87, 77, 67, 57, 47, 37, 27, 17],
    [88, 78, 68, 58, 48, 38, 28, 18],
    [89, 79, 69, 59, 49, 39, 29, 19]
];

var configs =
{
    LAUNCH_SCENES:0,
    NINTH_TRACK:1
};

var COLORS =
[
    [ 0.3294117748737335 , 0.3294117748737335 , 0.3294117748737335 , 1],    // Dark Gray
    [ 0.47843137383461   , 0.47843137383461   , 0.47843137383461   , 2],    // Gray
    [ 0.7882353067398071 , 0.7882353067398071 , 0.7882353067398071 , 3],    // Light Gray
    [ 0.5254902243614197 , 0.5372549295425415 , 0.6745098233222961 , 40],   // Silver
    [ 0.6392157077789307 , 0.4745098054409027 , 0.26274511218070984, 11],   // Dark Brown
    [ 0.7764706015586853 , 0.6235294342041016 , 0.43921568989753723, 12],   // Brown
    [ 0.34117648005485535, 0.3803921639919281 , 0.7764706015586853 , 80],   // Dark Blue
    [ 0.5176470875740051 , 0.5411764979362488 , 0.8784313797950745 , 49],   // Light Blue
    [ 0.5843137502670288 , 0.2862745225429535 , 0.7960784435272217 , 58],   // Purple
    [ 0.8509804010391235 , 0.21960784494876862, 0.4431372582912445 , 57],   // Pink
    [ 0.8509804010391235 , 0.18039216101169586, 0.1411764770746231 , 6],    // Red
    [ 1                  , 0.34117648005485535, 0.0235294122248888 , 60],   // Orange
    [ 0.8509804010391235 , 0.615686297416687  , 0.062745101749897  , 62],   // Light Orange
    [ 0.45098039507865906, 0.5960784554481506 , 0.0784313753247261 , 18],   // Green
    [ 0                  , 0.615686297416687  , 0.27843138575553894, 26],   // Cold Green
    [ 0                  , 0.6509804129600525 , 0.5803921818733215 , 34],   // Bluish Green
    [ 0                  , 0.6000000238418579 , 0.8509804010391235 , 42],   // Light Blue
    [ 0.7372549176216125 , 0.4627451002597809 , 0.9411764740943909 , 48],   // Light Purple
    [ 0.8823529481887817 , 0.4000000059604645 , 0.5686274766921997 , 56],   // Light Pink
    [ 0.9254902005195618 , 0.3803921639919281 , 0.34117648005485535, 4],    // Skin
    [ 1                  , 0.5137255191802979 , 0.24313725531101227, 10],   // Redish Brown
    [ 0.8941176533699036 , 0.7176470756530762 , 0.30588236451148987, 61],   // Light Brown
    [ 0.6274510025978088 , 0.7529411911964417 , 0.2980392277240753 , 18],   // Light Green
    [ 0.24313725531101227, 0.7333333492279053 , 0.3843137323856354 , 25],   // Bluish Green
    [ 0.26274511218070984, 0.8235294222831726 , 0.7254902124404907 , 32],   // Light Blue
    [ 0.2666666805744171 , 0.7843137383460999 , 1                  , 37]    // Blue
];

var Color = // Novation are from the UK
{
    BLACK               :0,
    GREY_LO             :1,
    GREY_MD             :2,
    WHITE               :3,
    ROSE                :4,
    RED_HI              :5,
    RED                 :6,
    RED_LO              :7,
    RED_AMBER           :8,
    AMBER_HI            :9,
    AMBER               :10,
    AMBER_LO            :11,
    AMBER_YELLOW        :12,
    YELLOW_HI           :13,
    YELLOW              :14,
    YELLOW_LO           :15,
    YELLOW_LIME         :16,
    LIME_HI             :17,
    LIME                :18,
    LIME_LO             :19,
    LIME_GREEN          :20,
    GREEN_HI            :21,
    GREEN               :22,
    GREEN_LO            :23,
    GREEN_SPRING        :24,
    SPRING_HI           :25,
    SPRING              :26,
    SPRING_LO           :27,
    SPRING_TURQUOISE    :28,
    TURQUOISE_LO        :29,
    TURQUOISE           :30,
    TURQUOISE_HI        :31,
    TURQUOISE_CYAN      :32,
    CYAN_HI             :33,
    CYAN                :34,
    CYAN_LO             :35,
    CYAN_SKY            :36,
    SKY_HI              :37,
    SKY                 :38,
    SKY_LO              :39,
    SKY_OCEAN           :40,
    OCEAN_HI            :41,
    OCEAN               :42,
    OCEAN_LO            :43,
    OCEAN_BLUE          :44,
    BLUE_HI             :45,
    BLUE                :46,
    BLUE_LO             :47,
    BLUE_ORCHID         :48,
    ORCHID_HI           :49,
    ORCHID              :50,
    ORCHID_LO           :51,
    ORCHID_MAGENTA      :52,
    MAGENTA_HI          :53,
    MAGENTA             :54,
    MAGENTA_LO          :55,
    MAGENTA_PINK        :56,
    PINK_HI             :57,
    PINK                :58,
    PINK_LO             :59
};

var Mode =
{
    SESSION:0,
    USER1:1,
    USER2:2,
    MIXER:3
};

var PlaybackState =
{
	QUEUED:0,
	STOPDUE:1,
	STOPPED:2,
	PLAYING:3,
};

var PlaybackStateColor	=
[
	Color.GREEN_FULL,
	Color.YELLOW_FULL,
	Color.OFF,
	Color.GREEN_LOW
];

var MuteColor =
[
	Color.OFF,
	Color.RED_FULL
];

var SoloColor =
[
	Color.OFF,
	Color.YELLOW_FULL
];
