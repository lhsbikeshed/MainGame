LHS BIKESHED
============

Main sim code
-------------

Main screen and game 
currently configured for the cloned display system were using in the van. 


Notes
-----

Starting scene is "launch"

There are couple of gameobjects that are required in each scene.

"PersistentScripts" : runs the OSC system and stores anything that is persistent across scenes
"SceneScripts" : 	code for scene-specific logic
"TheShip"	: the player ship


persistentscripts and TheShip are set to persist between scenes. Obviously if you load a later scene in the editor they wont be present. They exist in each scene already but are disabled, to test a scene just enable them. MAKE SURE TO DISABLE THEM when you are done, otherwise you end up with two ships when hyperspacing in

config.xml contains IPs and ports for the client machines, set "testmode" to true to use localhost. When building the game for actual use you need to copy this file to assets/ as the build process ignores it


Most of the cool shit is in testing branch.


