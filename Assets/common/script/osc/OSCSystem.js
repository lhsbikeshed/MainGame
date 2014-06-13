#pragma strict
import System.Net;
import System.Collections.Generic;
import UnityOSC;

var test : float;

var updateTime : float = 0.125;
//var engineerStationIPAddress : String;
//var pilotStationIPAddress : String;
//var captainStationIPAddress : String;
//var tacticalStationIPAddress : String;
//var modStationIPAddress : String;


var hailingSound : AudioClip;
var bingbongNoise : AudioClip;

var currentScene : GenericScene; //current scene to route /scene messages to

//references to things we want to monitor
private var playerShip : GameObject;
private var propulsionSystem : PropulsionSystem;
private var shipSystem : ship;
private var miscSystem : MiscSystem;
private var jumpSystem : JumpSystem;
private var targettingSystem : TargettingSystem;

private var commsOnline : boolean = false;

//last packet timestamp. Used because the OSC lib doesnt remove packets from its queue once processed
private var lastTimeStampProcessed : long;

//last update packet send
private var lastShipUpdate : float;

//list of radar visible objects
//private var radarList: List.<Transform>;
//private var radarScaleLevel : float; //from the skybox camera translate scale
//var radarEnabled : boolean = false;

//SCENE THINGS
private var dropScene : DropScene;
private var warpScene : Hyperspace;

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
	init();
}



//start of scene stuff, called from awake() and when new scene is loaded
function init(){
	currentScene = GameObject.Find("SceneScripts").GetComponent.<GenericScene>();
	currentScene.configureClientScreens();
	
	playerShip = GameObject.Find("TheShip");
	if(playerShip != null){
		propulsionSystem = playerShip.GetComponent.<PropulsionSystem>();
		shipSystem = playerShip.GetComponent.<ship>();
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
					
				} else if (pkt.Address.IndexOf("/clientscreen/CommsStation/incomingCall") == 0){
					if(!commsOnline){
						AudioSource.PlayClipAtPoint(hailingSound, playerShip.transform.position);
						OSCHandler.Instance.ChangeClientScreen("CommsStation", "videoDisplay");
						commsOnline = true;
					}
				} else if (pkt.Address.IndexOf("/clientscreen/CommsStation/hangUp") == 0){
					if(commsOnline){
						OSCHandler.Instance.RevertClientScreen("CommsStation");
						commsOnline = false;
					}
				
			 	}
				
				
				lastTimeStampProcessed =  pkt.TimeStamp;    
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
		var hull : float = playerShip.GetComponent.<ship>().hullState;
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
	var theShip = GameObject.Find("TheShip");
	theShip.rigidbody.freezeRotation = false;
	theShip.rigidbody.constraints = RigidbodyConstraints.None;
	theShip.GetComponent.<ship>().didWeWarpIn = true;
	theShip.GetComponent.<MiscSystem>().consuming = true; //reenable air consumption
	theShip.rigidbody.angularDrag = 0.5f;
 	theShip.GetComponent.<PropulsionSystem>().throttleDisabled = false;

	theShip.transform.parent = null;
	Application.LoadLevel(id);
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
			playerShip.GetComponent.<ship>().damageShip(1000, message.Data[0]);
			break;
		case "Hello":
			var m : OSCMessage = OSCMessage("/scene/change");
			var station : String = msgAddress[3];
			m.Append.<int>( Application.loadedLevel);
			
			OSCHandler.Instance.SendMessageToClient(station, m);
			
			var currentScreen : String = OSCHandler.Instance.clientScreens[station].Peek();;
			
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
			playerShip.GetComponent.<ship>().joyPos = Vector3(message.Data[0], message.Data[1], message.Data[2]);
			playerShip.GetComponent.<ship>().translateJoyPos = Vector3(message.Data[3], message.Data[4], message.Data[5]);
			break;
		case "releaseClamp":						// DOCKING CONNECTOR -------------------------------------
			if (message.Data[0]  == 1){
				shipSystem.releaseDock();
			} else {
				shipSystem.dock();
			}
			break;
		
		case "subsystemstate":
			shipSystem.propulsionPower = message.Data[0];
			shipSystem.internalPower = message.Data[1];
			shipSystem.weaponsPower = message.Data[3];
			shipSystem.sensorPower = message.Data[2];
			break;
			
		case "grapplingHookState":
			var ghState : boolean = message.Data[0] == 1 ? true : false;
			playerShip.GetComponent.<TargettingSystem>().hookArmed = ghState;
			if(ghState){
				OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "Grappling Hook", "Launcher enabled", 2000);
				OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "Grappling Hook", "Launcher enabled", 2000);
			} else {
				OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "Grappling Hook", "Launcher disabled", 2000);
				OSCHandler.Instance.DisplayBannerAtClient("TacticalStation", "Grappling Hook", "Launcher disabled", 2000);
			}
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
		Debug.Log("Reactor fail");							// REACTOR CONTROL --------------------
			shipSystem.GetComponent.<Reactor>().processOSCMessage(message);
			break;
			
			
		case "propulsion":								// PROPULSION CONTROL -----------------
			shipSystem.GetComponent.<PropulsionSystem>().processOSCMessage(message);
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
			
		case "effect":
			if(operation == "prayLight" || operation == "seatbeltLight"){
				var d : int = message.Data[0];
				if(d == 1){
					var a : AudioSource = CabinEffects.Instance().PlayClipAt(bingbongNoise, playerShip.transform.position);
					a.volume = 0.3f;
				}
				
			}
			break;
			
	}
		
	

}