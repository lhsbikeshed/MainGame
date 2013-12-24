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

* [Unity](http://unity3d.com/) [3.5.7] (http://unity3d.com/unity/download/archive) (We use the free license)
* [Blender](http://www.blender.org/) [2.67b] (http://download.blender.org/release/Blender2.67/)

* [Processing] (http://www.processing.org/) [2.0] (https://processing.org/download/) [1.5] (https://processing.org/download/)

| Console |  Version |
| :--: |:--:| 
| GM | 2.0 |
| Tactical | 1.5|
| Pilot | 1.5 |
| Engineer | 1.5 |
| Comms | 1.5 |

Main sim code
-------------

Main screen and game currently configured for the cloned display system we're using in the van. If you build and run the project you will get a resolution picker and a windowed option. 

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


