#pragma strict
static var networkEnabled : boolean = true;
static var networkReady : boolean = false;
/* global things that persist between scenese
*/
var hyperspaceDestination : int; //destination for our hyperspace exit
var forcedHyperspaceFail : boolean; //do we force a failure?
var useNetwork : boolean = true;
public var deathReason : String = "";
public var survivedTheGame : boolean = false;

public var pilotName : String = "pilotname";
public var tacticalName : String = "tacticalname";
public var engineerName : String = "engineername";
public var captainName : String = "captainname";
public var gmName : String = "gmname";


public static var _instance : PersistentScene;



@HideInInspector




function Awake(){
	DontDestroyOnLoad(this);
	networkEnabled = useNetwork;
	_instance = this;
}

function Start () {
	if(useNetwork == false){
		networkReady = false;
	}

}

function Update () {

}
function gameWin(){
	survivedTheGame = true;
	Application.LoadLevel(5);
}

/* we died, do the global OHYOUBEDEAD things */
function shipDead(reasonText : String){
	var msg : OSCMessage = OSCMessage("/scene/youaredead");
	msg.Append.<String>(reasonText);
	OSCHandler.Instance.SendMessageToAll(msg);
	deathReason = reasonText;
	Application.LoadLevel(5);

}