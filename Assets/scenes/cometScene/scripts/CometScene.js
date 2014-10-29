﻿#pragma strict


/* ship enters Scene
 * comet storm starts
 * ship takes a big hit and the cablepuzzle starts
 * lock the ships rotation to point at the large comet
 * wait for cable puzzle to complete
 * once complete trigger the code auth for emergency jump on engineer
 * configure jump system for emergency and continue to warzone scene
 */
public class CometScene extends GenericScene implements CodeAuthSystem.AuthCodeListener {

	public var mainComet : Transform;
	public var distanceToDeath : float = 1000f;
	public var theShip : Transform;
	public var skyboxCamera : Transform;
	
	var cablePuzzleSystem : CablePuzzleSystem;
	
	var puzzleState = PuzzleState.STATE_ENTER;
	
	function Start () {
		skyboxCameraActive = true;
		theShip = GameObject.Find("TheShip").transform;
		skyboxCamera = GameObject.Find("SkyboxCamera").transform;
		cablePuzzleSystem = theShip.GetComponent.<CablePuzzleSystem>();
		CodeAuthSystem.Instance.addListener(this);

		startScene();
	}

	function FixedUpdate () {
		distanceToDeath = (skyboxCamera.position - mainComet.position).magnitude;
		
		if(puzzleState == puzzleState.STATE_CABLE){
			doCableWait();
		} else if(puzzleState == puzzleState.STATE_CODE){
			doCodeWait();
		}

	}
	
	/* wait for the auth code to complete*/
	function doCodeWait(){
	}
	
	/* wait for the cable puzzle to complete, once complete send out the auth screen stuff */
	function doCableWait(){	
		if(cablePuzzleSystem.hasBeenCompleted){
			//show the emergency jump auth screen
			puzzleState = puzzleState.STATE_CODE;
			CodeAuthSystem.Instance.startCodeRequest("EngineerStation", "EMERGENCY JUMP CODE", "62918", 100000);
		}
	}
	
	/* code ok, prepare the ship for emergency jump
	*/
	function puzzleComplete(){
			CodeAuthSystem.Instance.stopCodeRequest("EngineerStation");
			theShip.GetComponent.<JumpSystem>().enableSystem();
			theShip.GetComponent.<PropulsionSystem>().enableSystem();
			var ps : PersistentScene = GameObject.Find("PersistentScripts").GetComponent.<PersistentScene>();
			ps.hyperspaceDestination = 3;
			ps.forcedHyperspaceFail = false;	
			theShip.GetComponent.<JumpSystem>().jumpDest = 1;

			theShip.GetComponent.<JumpSystem>().canJump = true;
			theShip.GetComponent.<JumpSystem>().inGate = true;
			theShip.GetComponent.<JumpSystem>().jumpRoute = 1;
			var s1 : OSCMessage = OSCMessage("/ship/jumpStatus");
			s1.Append.<int>(1);
			OSCHandler.Instance.SendMessageToAll(s1);
			
			OSCHandler.Instance.DisplayBannerAtClient("EngineerStation", "SUCCESS", "ENGAGE JUMP DRIVE", 4000);
	}
	
	function startScene(){
		//turn off the propulsion system but allow rotations
		theShip.GetComponent.<PropulsionSystem>().disableSystem();	
		//turn off jumpSystem	
		theShip.GetComponent.<JumpSystem>().disableSystem();
		//play a failure sound effect of some sort
		
		cablePuzzleSystem.forceStart();
		puzzleState = puzzleState.STATE_CABLE;
	}
	
	function LeaveScene(){
		CodeAuthSystem.Instance.removeListener(this);
		CodeAuthSystem.Instance.stopCodeRequest("EngineerStation");
	
	}

	


	function ProcessOSCMessage( msg : OSCPacket ){
	
	
	
	}

	function SendOSCMessage(){}

	/* send out osc messages for client screens */
	function configureClientScreens(){}
	
	//callbacks from code aith
	function authCodeReturn(state : CodeAuthSystem.CodeState){
		if(puzzleState == puzzleState.STATE_CODE){
			Debug.Log("auth code return state : " + state);
			if(state == CodeAuthSystem.CodeState.CODE_OK){
				//yay! restore power and start emergency jump system
				puzzleComplete();
				
			}
		}
	}
	
	enum PuzzleState {
		STATE_ENTER = 0,
		STATE_CABLE = 1,
		STATE_CODE = 2,
		STATE_COMPLETE = 3
	}
	
}