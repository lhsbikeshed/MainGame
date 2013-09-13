#pragma strict

var levelPrefix : int = 0;
var shipView : NetworkView;
var rBodyView : NetworkView;

function Awake () {
	Network.InitializeServer(32, 25000, false);
	
}

function Start(){
	OnLevelWasLoaded(Application.loadedLevel);
	Network.SetLevelPrefix(levelPrefix);
	SetupShip(Network.AllocateViewID(), Network.AllocateViewID());
	PersistentScene.networkReady = true;
}

/* add a networkview for the <ship> script and for the networkrigidbody on the ship */
@RPC
function SetupShip (shipId : NetworkViewID, rBodyId : NetworkViewID){
	var theShip : GameObject = GameObject.Find("TheShip");	
	shipView = theShip.AddComponent("NetworkView");
	shipView.viewID = shipId;
	shipView.observed = theShip.GetComponent(ship);
	
	
	
	rBodyView = theShip.AddComponent("NetworkView");
	rBodyView.viewID = rBodyId;
	rBodyView.observed = theShip.GetComponent(NetworkRigidbody);
	rBodyView.stateSynchronization = NetworkStateSynchronization.Unreliable;
	

}


function Update () {

}

@RPC
function NetworkLoadLevel(level : int, prefix : int){
	levelPrefix = prefix;
	//Network.SetSendingEnabled(0, false);	
	
	
	//Network.isMessageQueueRunning = false;
	
	
	Network.SetLevelPrefix(prefix);
	Application.LoadLevel(level);
	yield;
	yield;
	
	// Allow receiving data again
	//Network.isMessageQueueRunning = true;
	// Now the level has been loaded and we can start sending out data to clients
	//Network.SetSendingEnabled(0, true);
}


/* new scene, reconnect all of the objects and rpc their IDs out to the client*/
function OnLevelWasLoaded(level : int){
	///levelPrefix ++;
	//Network.SetLevelPrefix(levelPrefix);

	UpdateForAllPlayers();
	
}


//sends a level update out for all players
function UpdateForAllPlayers(){
var sceneScript : GenericScene = GameObject.Find("SceneScripts").GetComponent.<GenericScene>();
	
	var ct : int = 0;
	for(var obj : Component in sceneScript.networkObjects){
		
		//var netCom : NetworkView = obj.GetComponent.<NetworkView>();
		//if(netCom == null){
			var vId : NetworkViewID = Network.AllocateViewID();
			//assign this to the local object
			var localView : NetworkView = obj.gameObject.AddComponent(NetworkView);
			
			var rigidView : NetworkRigidbody = obj.GetComponent.<NetworkRigidbody>();
			if(rigidView != null){
				localView.observed = rigidView;
			}
			if(sceneScript.rpcOnly[ct] == true){
				localView.observed = null;
				localView.stateSynchronization = NetworkStateSynchronization.Off;
			}
			localView.viewID = vId;
			
			Debug.Log("allocated " + vId.ToString() + " for " + obj.gameObject.name);
		
			networkView.RPC ("ConnectObject", RPCMode.Others, obj.gameObject.name, vId, sceneScript.rpcOnly[ct]);
		//}
		ct++;
	}
}

/* send a set of viewids out to a single player */
function UpdateForNewPlayer(player : NetworkPlayer){
	var sceneScript : GenericScene = GameObject.Find("SceneScripts").GetComponent.<GenericScene>();
	var ct : int = 0;
	for(var obj : Component in sceneScript.networkObjects){
		
		var netCom : NetworkView[] = obj.GetComponents.<NetworkView>();
		for(var n : NetworkView in netCom){
		
			if(n.viewID.ToString().Contains("Allocate")){
				//get its view id and pass to client
				
			
				networkView.RPC ("ConnectObject", player, obj.gameObject.name, n.viewID, sceneScript.rpcOnly[ct]);
			
			}
		}
		ct ++;
	}
	
	
	
	networkView.RPC ("SetupShip", player, shipView.viewID, rBodyView.viewID );
	
	
}


function OnPlayerConnected(player: NetworkPlayer) {
	UpdateForNewPlayer(player);
	
}

@RPC
function ConnectObject(objName : String, viewId : NetworkViewID, rpcOnly : boolean){

}
