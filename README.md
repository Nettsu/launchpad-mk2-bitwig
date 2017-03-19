Novation Launch Control Bitwig Script
=====================================

This Bitwig Studio controller script is very simple and does just a few things:
- The eight columns on the controller correspond to the first eight tracks in
  the project. If the track is a group, then both the group and all it's
  children are controlled by this one column.
- The knobs control the first two macros of the primary device on each track.
- The pads indicate the state of the clip launcher for the track:
    + bright green means a clip is queued
    + dark green means it is playing
    + yellow means it is queued for stop
    + no colour means all clips are stopped
- Press the pad to stop clips on the corresponding track.
- While holding the RIGHT directional button you can use the pads to mute tracks.
- While holding the DOWN button you can use them to solo tracks.

The script was tested only with Bitwig 1.3.x and needs the Launch Control to be
in 'User 1' mode.
