#pragma strict
import System.Net;
import System.Collections.Generic;
import UnityOSC;

var test : float;

var updateTime : float = 0.125;


//comms sfx and state
var hailingSound : AudioClip;
var bingbongNoise : AudioClip;
private var commsOnline : boolean = false;
private var lastCommsScreen : String = "ass";


var currentScene : GenericScene; //current scene to route /scene messages to


//references to things we want to monitor
private var playerShip : GameObject;
private var propulsionSystem : PropulsionSystem;
private var shipSystem : ShipCore;
private var miscSystem : MiscSystem;
private var jumpSystem : JumpSystem;
private var targettingSystem : TargettingSystem;




//last update packet send
private var lastShipUpdate : float;



//fucking unityscript
private var separator : char[] = ["/"[0]];

function Start () {
	//reset all osc controls?
	//stop this from pausing when focus lost
	Application.runInBackground = true;
	
}

function Awake(){
	DontDestroyOnLoad(this);
	OSCHandler.Instance.Init(); //init OSC
	var msg : OSCMessage = OSCMessage("/scene/change");
	msg.Append.<int>(Application.loadedLevel);
	OSCHandler.Instance.SendMessageToAll(msg);
	//since this is only ever called at the start of the game
	//send a reset signal to all consoles
	msg = OSCMessage("/game/reset");
	OSCHandler.Instance.SendMessageToAll(msg);
	init();
}



//start of scene stuff, called from awake() and when new scene is loaded
function init(){
	currentScene = GameObject.Find("SceneScripts").GetComponent.<GenericScene>();
	currentScene.configureClientScreens();
	
	playerShip = GameObject.Find("TheShip");
	if(playerShip != null){
		propulsionSystem = playerShip.GetComponent.<PropulsionSystem>();
		shipSystem = playerShip.GetComponent.<ShipCore>();
		miscSystem = playerShip.GetComponent.<MiscSystem>();
		jumpSystem = playerShip.GetComponent.<JumpSystem>();
		targettingSystem = playerShip.GetComponent.<TargettingSystem>();
		//get a list of all radar visible objects
		targettingSystem.updateTrackingList();
	}
}



function OnLevelWasLoaded (level : int) {
	print ("level started");
	//send scene change to all stations
	var msg : OSCMessage = OSCMessage("/scene/change");
	msg.Append.<int>(level);
	OSCHandler.Instance.SendMessageToAll( msg);
	//redo all the object refs
	init();

}
function OnDestroy(){
	
}

function FixedUpdate(){
	
	OSCHandler.Instance.UpdateLogs();
	
	if (lastShipUpdate + updateTime < Time.time && Application.loadedLevel != 5){
		lastShipUpdate = Time.time;
		sendShipStats();
//		if(radarEnabled){
//			//sendRadarStats();
//		}
		targettingSystem.sendOSCUpdates();
		
		//do scene specific updates		
		currentScene.SendOSCMessage();
		
	}
	
	
	//now process incoming messages
	var servers : Dictionary.<String, ServerLog> = OSCHandler.Instance.Servers;
	
	
    for(  var item : KeyValuePair.<String, ServerLog> in servers  ){		
		for( var pkt : OSCPacket in item.Value.packets){
			//if(pkt.TimeStamp > lastTimeStampProcessed){
							//Debug.Log(String.Format(" ADDRESS: {0} ", pkt.Address )); 

			if(pkt.processed == false){
				//Debug.Log(String.Format(" ADDRESS: {0} ", pkt.Address )); 
				OSCHandler.Instance.SendMessageToAll(pkt);
				           
				           
				if(pkt.Address.IndexOf("/scene/") == 0){					
					currentScene.ProcessOSCMessage(pkt);					
				} else if(pkt.Address.IndexOf("/system/") == 0){				//subsystem control
				//Debug.Log(String.Format(" ADDRESS: {0} ", pkt.Address )); 
					systemMessage(pkt);
					
				} else if (pkt.Address.IndexOf("/control/") == 0){		//ship control
					controlMessage(pkt);
				
				} else if (pkt.Address.IndexOf("/game/") == 0){
					gameMessage(pkt);
					
				} else if (pkt.Address.IndexOf("/clientscreen/CommsStation") == 0){
					commsMessage(pkt);
				}
				
				
				
				pkt.processed = true;                      
			}
	   }
	   //item.Value.packets.Clear(); 
    }
}


/* send ship stats
 * reactor energy level
 * warp charge level
 */
 
function sendShipStats(){
	if(Application.loadedLevel != 5){
		var msg : OSCMessage = OSCMessage("/ship/stats");
		
		var oxLevel : float = miscSystem.oxygenLevel;
		var jl : float = jumpSystem.jumpChargePercent;
		var hull : float = playerShip.GetComponent.<ShipCore>().hullState;
		msg.Append.<float>(jl);
		msg.Append.<float>(oxLevel);
		msg.Append.<float>(hull);
		OSCHandler.Instance.SendMessageToAll(msg);
		
		 msg = OSCMessage("/ship/transform");
		
		msg.Append.<float>(playerShip.transform.position.x);
		msg.Append.<float>(playerShip.transform.position.y);
		msg.Append.<float>(playerShip.transform.position.z);
		
		msg.Append.<float>(playerShip.transform.rotation.w);
		msg.Append.<float>(playerShip.transform.rotation.x);
		msg.Append.<float>(playerShip.transform.rotation.y);
		msg.Append.<float>(playerShip.transform.rotation.z);
		
		msg.Append.<float>(playerShip.rigidbody.velocity.x);
		msg.Append.<float>(playerShip.rigidbody.velocity.y);
		msg.Append.<float>(playerShip.rigidbody.velocity.z);
		OSCHandler.Instance.SendMessageToAll(msg);
	}

}


function jumpToScene(id : int){
	Debug.Log("Forcing ship to scene: " + id);
	
	if(currentScene != null){
		currentScene.LeaveScene();
	}
	
	var theShip = GameObject.Find("TheShip");
	theShip.rigidbody.freezeRotation = false;
	theShip.rigidbody.constraints = RigidbodyConstraints.None;
	theShip.GetComponent.<JumpSystem>().didWeWarpIn = true;
	theShip.GetComponent.<MiscSystem>().consuming = true; //reenable air consumption
	theShip.rigidbody.angularDrag = 0.5f;
 	theShip.GetComponent.<PropulsionSystem>().throttleDisabled = false;

	theShip.transform.parent = null;
	Application.LoadLevel(id);
}

function commsMessage(message : OSCPacket){
	var msgAddress = message.Address.Split(separator);
	// [1] = system, 2 = thing, 3 = operation
	var target = msgAddress[3];
	
	if (target == "incomingCall"){
		if(!commsOnline){
			AudioSource.PlayClipAtPoint(hailingSound, playerShip.transform.position);
			var audioCall : boolean = false;
			
			if(message.Data.Count > 0){	//if data present and its a 1 then do audio call, else do video
			
				if(message.Data[0] == 1){
				
					audioCall = true;
				}
			} 
			var msg : OSCMessage = OSCMessage("/clientscreen/CommsStation/setCameraMode");
			OSCHandler.Instance.SendMessageToClient("CommsStation", msg);
			
			if(audioCall){
				OSCHandler.Instance.ChangeClientScreen("CommsStation", "audioDisplay");
				lastCommsScreen = "audioDisplay";
			} else {
				OSCHandler.Instance.ChangeClientScreen("CommsStation", "videoDisplay");
				lastCommsScreen = "videoDisplay";
			}
			commsOnline = true;
		}
	} else if (target == "hangUp"){
		if(commsOnline){
			OSCHandler.Instance.RevertClientScreen("CommsStation", lastCommsScreen);
			commsOnline = false;
			
			
			OSCHandler.Instance.SendMessageToAll(OSCMessage("/ship/comms/hangupCall"));
			
		}
	} else if (target == "playVideo"){
		if(commsOnline){
			OSCHandler.Instance.RevertClientScreen("CommsStation", lastCommsScreen);
			commsOnline = false;
		}
		AudioSource.PlayClipAtPoint(hailingSound, playerShip.transform.position);
		var msg2 : OSCMessage = OSCMessage("/clientscreen/CommsStation/setMovieMode");
		var file : String = message.Data[0];
		msg2.Append(file);
		OSCHandler.Instance.SendMessageToClient("CommsStation", msg2);
		
		OSCHandler.Instance.ChangeClientScreen("CommsStation", "videoDisplay");
		lastCommsScreen = "videoDisplay";
		commsOnline = true;	
		
		//now tell all of the clients that a call is coming in. Eventually replace all of the above with this message
		
		OSCHandler.Instance.SendMessageToAll(OSCMessage("/ship/comms/incomingCall"));
		
	}
				
}



function gameMessage(message : OSCPacket){
	var msgAddress = message.Address.Split(separator);
	// [1] = system, 2 = thing, 3 = operation
	var target = msgAddress[2];
//	var operation = msgAddress.length > 2 ? msgAddress[3] : 0;
	//var sc : warzonescene = GameObject.Find("SceneScripts").GetComponent.<warzonescene>();
	switch(target){
		
		case "takeMeTo":
			//force the ship to hyperspace to given scene id
			var sceneId : int = message.Data[0];
			jumpToScene(sceneId);
			break;
		case "reset":
			//if(Application.loadedLevel == 5){
				OSCHandler.Instance.dieFuckerDie();
				Destroy(GameObject.Find("OSCHandler"));
				Destroy(GameObject.Find("PersistentScripts"));
				Destroy(GameObject.Find("TheShip"));
				Destroy(GameObject.Find("DynamicCamera"));
				Application.LoadLevel(0);
				//FIXME destroy the persistent things
				
			//}
			break;
		case "gameWin":
			var msgd  = OSCMessage("/system/reactor/stateUpdate");		
			msgd.Append.<int>( 0 );		
			msgd.Append.<String>( "" );									
			OSCHandler.Instance.SendMessageToAll(msgd);
			GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>().gameWin();
			break;
		case "KillPlayers":
		Debug.Log(message.Data[0]);
			playerShip.GetComponent.<ShipCore>().damageShip(1000, message.Data[0]);
			break;
		case "Hello":
			var m : OSCMessage = OSCMessage("/scene/change");
			var station : String = msgAddress[3];
			m.Append.<int>( Application.loadedLevel);
			
			OSCHandler.Instance.SendMessageToClient(station, m);
			
			var currentScreen : String = OSCHandler.Instance.clientScreens[station][0].screenName;
			
			m = OSCMessage("/clientscreen/" + station + "/changeTo");
			m.Append.<String>( currentScreen );
			
			OSCHandler.Instance.SendMessageToClient(station, m);
			Debug.Log("Hello from " + station);
			break;	
		case "setNames":		//set the playernames
			var pName : String = message.Data[0];
			var tName : String = message.Data[1];
			var eName : String = message.Data[2];
			var cName : String = message.Data[3];
			var gName : String = message.Data[4];
			PersistentScene._instance.pilotName = pName;
			PersistentScene._instance.tacticalName = tName;
			PersistentScene._instance.engineerName = eName;
			PersistentScene._instance.captainName = cName;
			PersistentScene._instance.gmName = gName;

		
		
			break; 
		
	}
}







/* Control of things */
function controlMessage(message : OSCPacket){
	var msgAddress = message.Address.Split(separator);
	// [1] = System, 2 = Subsystem name, 3 = operation
	var system = msgAddress[2];
	
	
	switch(system){
		case "joystick":							//read joystick state from client
			// x, y, z, tx, ty, throttle
			propulsionSystem.joyPos = Vector3(message.Data[0], message.Data[1], message.Data[2]);
			propulsionSystem.translateJoyPos = Vector3(message.Data[3], message.Data[4], message.Data[5]);
			break;
		case "releaseClamp":						// DOCKING CONNECTOR -------------------------------------
			if (message.Data[0]  == 1){
				shipSystem.releaseClamp();
			} else {
				shipSystem.enableClamp();
			}
			break;
		
		case "subsystemstate":
			shipSystem.setPropulsionPower (message.Data[0]);
			shipSystem.setInternalPower( message.Data[1]);
			
			shipSystem.setSensorPower (message.Data[2]);
			shipSystem.setWeaponsPower (message.Data[3]);
			break;
			
		case "screenSelection":
			//called when the player wants to change screens using a button on the console
			var who : String = message.Data[0];
			var toWhat : String = message.Data[1];
			OSCHandler.Instance.ChangeClientScreen(who, toWhat);
			break;
			
	}
			
		
}

/* Messages for subsystems*/
function systemMessage(message : OSCPacket){
	var msgAddress = message.Address.Split(separator);
	// [1] = System, 2 = Subsystem name, 3 = operation
	var system = msgAddress[2];
	var operation = msgAddress[3];
	switch(system){
		case "reactor":		
			// REACTOR CONTROL --------------------
			shipSystem.GetComponent.<Reactor>().processOSCMessage(message);
			break;
			
		case "ship":
			shipSystem.GetComponent.<ShipCore>().processOSCMessage(message);
		case "propulsion":								// PROPULSION CONTROL -----------------
			propulsionSystem.processOSCMessage(message);
			break;
		case "jump":								// PROPULSION CONTROL -----------------
			shipSystem.GetComponent.<JumpSystem>().processOSCMessage(message);
			break;
		case "misc":									//MISC SYSTEMS -------------------------
			shipSystem.GetComponent.<MiscSystem>().processOSCMessage(message);
			break;
		case "transporter":									//MISC SYSTEMS -------------------------
			shipSystem.GetComponent.<TransporterSystem>().processOSCMessage(message);
			break;
			
		case "jammer":
			shipSystem.GetComponent.<JammingSystem>().processOSCMessage(message);
			break;
		case "targetting":
			shipSystem.GetComponent.<TargettingSystem>().processOSCMessage(message);
			break;
		case "undercarriage":
			if(operation == "state"){
				playerShip.GetComponent.<UndercarriageBehaviour>().setGearState ( message.Data[0] == 1 ? true : false);
			}
			break;
		case "cablePuzzle":
			shipSystem.GetComponent.<CablePuzzleSystem>().processOSCMessage(message);
			break;
		case "keyPuzzle":
			KeySwitchPuzzle.GetInstance().processOSCMessage(message);
			break;
			
		case "effect":
			if(operation == "prayLight" || operation == "seatbeltLight"){
				var d : int = message.Data[0];
				if(d == 1){
					var a : AudioSource = CabinEffects.Instance().PlayClipAt(bingbongNoise, playerShip.transform.position);
					a.volume = 0.3f;
				}
				
			}
			break;
		case "authsystem":
			CodeAuthSystem.Instance.processOSCMessage(message);
			break;
	}
		
	

}