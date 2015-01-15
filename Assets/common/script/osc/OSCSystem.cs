using UnityEngine;
using System;
using System.Net;
using System.Collections.Generic;
using UnityOSC;



public class OSCSystem:MonoBehaviour{
	
	
	public float test;
	
	public float updateTime = 0.125f;
	
	
	//comms sfx and state
	public AudioClip hailingSound;
	public AudioClip bingbongNoise;
	bool commsOnline = false;
	string lastCommsScreen = "ass";
	
	
	public GenericScene currentScene; //current scene to route /scene messages to
	
	
	//references to things we want to monitor
	GameObject playerShip;
	PropulsionSystem propulsionSystem;
	ShipCore shipSystem;
	MiscSystem miscSystem;
	JumpSystem jumpSystem;
	TargettingSystem targettingSystem;
	
	
	
	
	//last update packet send
	float lastShipUpdate;
	
	
	
	//fucking unityscript
	char[] separator = new char[]{'/'};
	
	public void Start() {
		//reset all osc controls?
		//stop this from pausing when focus lost
		Application.runInBackground = true;
		
	}
	
	public void Awake(){
		DontDestroyOnLoad(this);
		OSCHandler.Instance.Init(); //init OSC
		OSCMessage msg = new OSCMessage("/scene/change");
		msg.Append<int>(Application.loadedLevel);
		OSCHandler.Instance.SendMessageToAll(msg);
		//since this is only ever called at the start of the game
		//send a reset signal to all consoles
		msg = new OSCMessage("/game/reset");
		OSCHandler.Instance.SendMessageToAll(msg);
		init();
	}
	
	
	
	//start of scene stuff, called from awake() and when new scene is loaded
	public void init(){
		currentScene = GameObject.Find("SceneScripts").GetComponent<GenericScene>();
		currentScene.configureClientScreens();
		
		playerShip = GameObject.Find("TheShip");
		if(playerShip != null){
			propulsionSystem = playerShip.GetComponent<PropulsionSystem>();
			shipSystem = playerShip.GetComponent<ShipCore>();
			miscSystem = playerShip.GetComponent<MiscSystem>();
			jumpSystem = playerShip.GetComponent<JumpSystem>();
			targettingSystem = playerShip.GetComponent<TargettingSystem>();
			//get a list of all radar visible objects
			targettingSystem.updateTrackingList();
		}
	}
	
	
	
	public void OnLevelWasLoaded(int level) {
		print ("level started");
		//send scene change to all stations
		OSCMessage msg = new OSCMessage("/scene/change");
		msg.Append<int>(level);
		OSCHandler.Instance.SendMessageToAll( msg);
		//redo all the object refs
		init();
	
	}
	public void OnDestroy(){
		
	}
	
	public void FixedUpdate(){
		
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
		Dictionary<string,ServerLog> servers = OSCHandler.Instance.Servers;
		
		
	    foreach(KeyValuePair<string,ServerLog> item in servers){		
			foreach(OSCPacket pkt in item.Value.packets){
				//if(pkt.TimeStamp > lastTimeStampProcessed){
								//Debug.Log(String.Format(" ADDRESS: {0} ", pkt.Address )); 
	
				if(pkt.processed == false){
					//Debug.Log(String.Format(" ADDRESS: {0} ", pkt.Address )); 
					OSCHandler.Instance.SendMessageToAll((OSCMessage)pkt);
					           
					           
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
	 
	public void sendShipStats(){
		if(Application.loadedLevel != 5){
			OSCMessage msg = new OSCMessage("/ship/stats");
			
			float oxLevel = miscSystem.oxygenLevel;
			float jl = jumpSystem.jumpChargePercent;
			float hull = playerShip.GetComponent<ShipCore>().hullState;
			msg.Append<float>(jl);
			msg.Append<float>(oxLevel);
			msg.Append<float>(hull);
			OSCHandler.Instance.SendMessageToAll(msg);
			
			 msg = new OSCMessage("/ship/transform");
			
			msg.Append<float>(playerShip.transform.position.x);
			msg.Append<float>(playerShip.transform.position.y);
			msg.Append<float>(playerShip.transform.position.z);
			
			msg.Append<float>(playerShip.transform.rotation.w);
			msg.Append<float>(playerShip.transform.rotation.x);
			msg.Append<float>(playerShip.transform.rotation.y);
			msg.Append<float>(playerShip.transform.rotation.z);
			
			msg.Append<float>(playerShip.rigidbody.velocity.x);
			msg.Append<float>(playerShip.rigidbody.velocity.y);
			msg.Append<float>(playerShip.rigidbody.velocity.z);
			OSCHandler.Instance.SendMessageToAll(msg);
		}
	
	}
	
	
	public void jumpToScene(int id){
		UnityEngine.Debug.Log("Forcing ship to scene: " + id);
		
		if(currentScene != null){
			currentScene.LeaveScene();
		}
		
		GameObject theShip = GameObject.Find("TheShip");
		theShip.rigidbody.freezeRotation = false;
		theShip.rigidbody.constraints = RigidbodyConstraints.None;
		theShip.GetComponent<JumpSystem>().didWeWarpIn = true;
		theShip.GetComponent<MiscSystem>().consuming = true; //reenable air consumption
		theShip.rigidbody.angularDrag = 0.5f;
	 	theShip.GetComponent<PropulsionSystem>().throttleDisabled = false;
	
		theShip.transform.parent = null;
		Application.LoadLevel(id);
	}
	
	public void commsMessage(OSCPacket message){
		string[] msgAddress = message.Address.Split(separator);
		// [1] = system, 2 = thing, 3 = operation
		string target = msgAddress[3];
		
		if (target == "incomingCall"){
			if(!commsOnline){
				AudioSource.PlayClipAtPoint(hailingSound, playerShip.transform.position);
				bool audioCall = false;
				
				if(message.Data.Count > 0){	//if data present and its a 1 then do audio call, else do video
				
					if((int)message.Data[0] == 1){
					
						audioCall = true;
					}
				} 
				OSCMessage msg = new OSCMessage("/clientscreen/CommsStation/setCameraMode");
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
				
				
				OSCHandler.Instance.SendMessageToAll(new OSCMessage("/ship/comms/hangupCall"));
				
			}
		} else if (target == "playVideo"){
			if(commsOnline){
				OSCHandler.Instance.RevertClientScreen("CommsStation", lastCommsScreen);
				commsOnline = false;
			}
			AudioSource.PlayClipAtPoint(hailingSound, playerShip.transform.position);
			OSCMessage msg2 = new OSCMessage("/clientscreen/CommsStation/setMovieMode");
			string file = "" + message.Data[0];
			msg2.Append(file);
			OSCHandler.Instance.SendMessageToClient("CommsStation", msg2);
			
			OSCHandler.Instance.ChangeClientScreen("CommsStation", "videoDisplay");
			lastCommsScreen = "videoDisplay";
			commsOnline = true;	
			
			//now tell all of the clients that a call is coming in. Eventually replace all of the above with this message
			
			OSCHandler.Instance.SendMessageToAll(new OSCMessage("/ship/comms/incomingCall"));
			
		}
					
	}
	
	
	
	public void gameMessage(OSCPacket message){
		string[] msgAddress = message.Address.Split(separator);
		// [1] = system, 2 = thing, 3 = operation
		string target = msgAddress[2];
	//	var operation = msgAddress.length > 2 ? msgAddress[3] : 0;
		//var sc : warzonescene = GameObject.Find("SceneScripts").GetComponent.<warzonescene>();
		switch(target){
			
			case "takeMeTo":
				//force the ship to hyperspace to given scene id
				int sceneId = (int)message.Data[0];
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
				OSCMessage msgd  = new OSCMessage("/system/reactor/stateUpdate");		
				msgd.Append<int>( 0 );		
				msgd.Append<String>( "" );									
				OSCHandler.Instance.SendMessageToAll(msgd);
				GameObject.Find("PersistentScripts").GetComponent<PersistentScene>().gameWin();
				break;
			case "KillPlayers":
				StartCoroutine(playerShip.GetComponent<ShipCore>().damageShip(1000.0f, "" + message.Data[0]));
				break;
			case "Hello":
				OSCMessage m = new OSCMessage("/scene/change");
				string station = msgAddress[3];
				m.Append<int>( Application.loadedLevel);
				
				OSCHandler.Instance.SendMessageToClient(station, m);
				
				string currentScreen = OSCHandler.Instance.clientScreens[station][0].screenName;
				
				m = new OSCMessage("/clientscreen/" + station + "/changeTo");
				m.Append<String>( currentScreen );
				
				OSCHandler.Instance.SendMessageToClient(station, m);
				UnityEngine.Debug.Log("Hello from " + station);
				break;	
			case "setNames":		//set the playernames
				string pName = "" + message.Data[0];
				string tName = "" + message.Data[1];
				string eName = "" + message.Data[2];
				string cName = "" + message.Data[3];
				string gName = "" + message.Data[4];
				PersistentScene._instance.pilotName = pName;
				PersistentScene._instance.tacticalName = tName;
				PersistentScene._instance.engineerName = eName;
				PersistentScene._instance.captainName = cName;
				PersistentScene._instance.gmName = gName;
	
			
			
				break; 
			
		}
	}
	
	
	
	
	
	
	
	/* Control of things */
	public void controlMessage(OSCPacket message){
		string[] msgAddress = message.Address.Split(separator);
		// [1] = System, 2 = Subsystem name, 3 = operation
		string system = msgAddress[2];
		
		
		switch(system){
			case "joystick":							//read joystick state from client
				// x, y, z, tx, ty, throttle
				propulsionSystem.joyPos = new Vector3((float)(message.Data[0]), (float)(message.Data[1]), (float)(message.Data[2]));
				propulsionSystem.translateJoyPos = new Vector3((float)(message.Data[3]), (float)(message.Data[4]), (float)(message.Data[5]));
				break;
			case "releaseClamp":						// DOCKING CONNECTOR -------------------------------------
				if ((int)message.Data[0]  == 1){
					shipSystem.releaseClamp();
				} else {
					StartCoroutine(shipSystem.enableClamp());
				}
				break;
			
			case "subsystemstate":
				shipSystem.setPropulsionPower ((int)message.Data[0]);
				shipSystem.setInternalPower( (int)message.Data[1]);
				
				shipSystem.setSensorPower ((int)message.Data[2]);
				shipSystem.setWeaponsPower ((int)message.Data[3]);
				break;
				
			case "screenSelection":
				//called when the player wants to change screens using a button on the console
				string who = "" + message.Data[0];
				string toWhat = "" + message.Data[1];
				OSCHandler.Instance.ChangeClientScreen(who, toWhat);
				break;
				
		}
				
			
	}
	
	/* Messages for subsystems*/
	public void systemMessage(OSCPacket message){
		string[] msgAddress = message.Address.Split(separator);
		// [1] = System, 2 = Subsystem name, 3 = operation
		string system = msgAddress[2];
		string operation = msgAddress[3];
		switch(system){
			case "reactor":		
				// REACTOR CONTROL --------------------
				shipSystem.GetComponent<Reactor>().processOSCMessage((OSCMessage)message);
				break;
				
			case "ship":
				shipSystem.GetComponent<ShipCore>().processOSCMessage(message);
                goto case "propulsion";
			case "propulsion":								// PROPULSION CONTROL -----------------
				propulsionSystem.processOSCMessage((OSCMessage)message);
				break;
			case "jump":								// PROPULSION CONTROL -----------------
				shipSystem.GetComponent<JumpSystem>().processOSCMessage((OSCMessage)message);
				break;
			case "misc":									//MISC SYSTEMS -------------------------
				shipSystem.GetComponent<MiscSystem>().processOSCMessage((OSCMessage)message);
				break;
			case "transporter":									//MISC SYSTEMS -------------------------
				shipSystem.GetComponent<TransporterSystem>().processOSCMessage((OSCMessage)message);
				break;
				
			case "jammer":
				shipSystem.GetComponent<JammingSystem>().processOSCMessage((OSCMessage)message);
				break;
			case "targetting":
				shipSystem.GetComponent<TargettingSystem>().processOSCMessage((OSCMessage)message);
				break;
			case "undercarriage":
				if(operation == "state"){
					playerShip.GetComponent<UndercarriageBehaviour>().setGearState ( (int)message.Data[0] == 1 ? true : false);
				}
				break;
			case "cablePuzzle":
				shipSystem.GetComponent<CablePuzzleSystem>().processOSCMessage((OSCMessage)message);
				break;
			case "keyPuzzle":
				KeySwitchPuzzle.GetInstance().processOSCMessage((OSCMessage)message);
				break;
				
			case "effect":
				if(operation == "prayLight" || operation == "seatbeltLight"){
					int d = (int)message.Data[0];
					if(d == 1){
						AudioSource a = CabinEffects.Instance().PlayClipAt(bingbongNoise, playerShip.transform.position);
						a.volume = 0.3f;
					}
					
				}
				break;
			case "authsystem":
				CodeAuthSystem.Instance.processOSCMessage((OSCMessage)message);
				break;
		}
			
		
	
	}
}
