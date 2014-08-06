LHS BIKESHED
============

This is the main code for the [LHS
Bikeshed](http://lhsbikeshed.tumblr.com/) space simulator. The game is
written using Unity, but it also talks to Processing and Arduino code
which runs the physical consoles via OSC:

* [GM Console](https://github.com/lhsbikeshed/modconsole)
* Tactical [Console](https://github.com/lhsbikeshed/tacticalconsole) & [Arduino](https://github.com/lhsbikeshed/tacticalArduino)
* Pilot [Console](https://github.com/lhsbikeshed/pilotconsole) & [Arduino](https://github.com/lhsbikeshed/pilotArduino)
* Engineer [Console](https://github.com/lhsbikeshed/engineerconsole), [Main Arduino](https://github.com/lhsbikeshed/engineerMainArduino), and [Lower Arduino](https://github.com/lhsbikeshed/engineerLowerArduino)
* Comms [Console](https://github.com/lhsbikeshed/commsconsole) & [Arduino](https://github.com/lhsbikeshed/commsArduino)




Required Software
-----------------

These specific versions of software are required to run/develop the
game - if you use other versions you may experience compatibility issues:

* [Unity](http://unity3d.com/) [4.3.4] (http://unity3d.com/unity/download/archive) (We use the free license)
* [Blender](http://www.blender.org/) [2.6.9.0] (http://download.blender.org/release/Blender2.69/)

* [Processing] (http://www.processing.org/) [2.1.1] (https://processing.org/download/)


Main sim code
-------------

Game is now configured to use two different resolution settings:
* anything where aspect ratio is close to 4:3 will use a single display
* anything above that will generate a second view with a chase cam

The resolution picker no longer works, size has to be set by cmdline options. Use the following ones
* -screen-width and -screen-height - set the window size. Van uses 1024x768 or 2048x768 for chasecam view
* -popup-window - causes the window to render with no border. Used because unity cant fullscreen mode on dual monitors



Notes
-----

Starting scene is "launch"

There are couple of gameobjects that are required in each scene.

"PersistentScripts" : runs the OSC system and stores anything that is persistent across scenes
"SceneScripts" : 	code for scene-specific logic
"TheShip"	: the player ship


persistentscripts and TheShip are set to persist between scenes. Obviously if you load a later scene in the editor they wont be present. They exist in each scene already but are disabled, to test a scene just enable them. MAKE SURE TO DISABLE THEM when you are done, otherwise you end up with two ships when hyperspacing in

config.xml contains IPs and ports for the client machines, set "testmode" to true to use localhost. When building the game for actual use you need to copy this file to assets/ as the build process ignores it

Before running modconsole.pde, check that "serialEnabled" is set to false and "useXboxController" is set to reflect your chosen autopilot control scheme.

Most of the cool shit is in testing branch.


