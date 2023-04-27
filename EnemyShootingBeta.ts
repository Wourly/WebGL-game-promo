import * as THREE from "three";
import { Model, loadModel } from "../core";
import { CollisionTree } from "../library/collision";
import { EEnemyType } from "./enemyProcessor";
import { PhysicalInstance } from "../core";
import { LaserSpawner } from "../projectiles/Laser";

import {enemyProjectiles} from "../main";

//================================================================================================
//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Enemy shooting beta
//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
//
//	content:
//
//		class EnemyShootingBeta {
//			- 2x1 cannon on each wing
//				- shoots vertically
//			- 1 cannon in the middle
//!				- should be aiming at player				
//      }
//
//		loadEnemyShootingResources() {
//			- used in enemyProcessor.ts
//			- loads cannon model from file
//			* TypeScript does not allow asynchronous operations in constructor
//		}
//
//! 	WORK IN PROCESS
//
//! 	collisionTree codes should be replaced with enum for faster processing
//
//! 	this file currently contains structures, that should be moved into less specialized files
//! 		- EnemyShip, Cannon, IResources

export interface EnemyShip {
	health: number;
}

//! should be transferred out of this file
export class EnemyShip extends PhysicalInstance {
	type:EEnemyType
	isAlive:boolean

	constructor (model:Model, enemyType:EEnemyType) {
		super(model)

		this.type = enemyType;
		this.isAlive = true;
	}

	resolveCollisionWithProjectile (enemyCollisionTree:CollisionTree, projectileCollisionTree:CollisionTree):boolean {
		
		if (enemyCollisionTree.depth === 1) {
			if (projectileCollisionTree.code === "head") {

				const enemyInstance = enemyCollisionTree.topAbstractParent as EnemyShip;
				enemyInstance.health -= 10;

				return true;
			}
		}
			return false;
		
		};
}

//! should be moved to different file after successful implementation
type Cannons = {
	right:EnemyCannon,
	left:EnemyCannon
}

//==============================================================
//========== class: EnemyShootingBeta
//==============================================================
export class EnemyShootingBeta extends EnemyShip {

	collisionTree:CollisionTree

	cannons:Cannons;
	laserSpawners: {
		left:LaserSpawner
		right:LaserSpawner
	}

	isShooting:boolean;
	shootingInterval:number | undefined;

	//--------- constructor
	//---------------------------------------------------------------
	constructor(model:Model, enemyType:EEnemyType, resources:IResources) {
		super(model, enemyType)

		this.health = 1000;

		this.cannons = {} as Cannons;
		this.cannons.right = new EnemyCannon(resources.cannonModelRight);
		this.cannons.left = new EnemyCannon(resources.cannonModelLeft);
		//! this.cannons.middle..

		this.group.add(this.cannons.right.group, this.cannons.left.group);

		this.cannons.right.group.position.set(7.5, -3.8, 0);
		this.cannons.left.group.position.set(-7.5, -3.8, 0);

		this.isShooting = false;
		this.shootingInterval = undefined;

		this.startShooting();

		//--------- LaserSpawners
		//---------------------------------------------------------------
		this.laserSpawners = {} as any; //! must be typed properly, when generalized type will be known
		this.laserSpawners.left = new LaserSpawner({
			speed: -0.5,
			parentPhysicalInstance: this,
			spawnerPosition: this.cannons.left.group.position,
			collisionArray: enemyProjectiles
		});
		this.laserSpawners.right = new LaserSpawner({
			speed: -0.5,
			parentPhysicalInstance: this,
			spawnerPosition: this.cannons.right.group.position,
			collisionArray: enemyProjectiles
		});

		this.collisionTree = new CollisionTree (
		{
			//drawDebug:true,
            //debugMaterialHighlight:'main',
			topAbstractParent:this,
			topPhysicalParent:this.group,
			radius: 90,
			code:"main",
			children: [
				{
					//drawDebug:true,
					radius: 50,
					position: new THREE.Vector3(55, -10, 0),
					code:"right turret"
				},
				{
					//drawDebug:true,
					radius: 50,
					position: new THREE.Vector3(-55, -10, 0),
					code:"left turret"
				}
			]
		})
	}
	//---------------------------------------------------------------
	//--------- constructor end

	startShooting = () => {
		this.shootingInterval = setInterval(this.shoot, 1000);
		this.isShooting = true;
	}

	stopShooting = () => {
		clearInterval(this.shootingInterval);
		this.isShooting = false;
	}

	shoot = () => {
		this.laserSpawners.left.spawn();
		this.laserSpawners.right.spawn();
	}

}
//---------------------------------------------------------------
//--------- MAIN CLASS END


export class EnemyCannon extends PhysicalInstance {

	constructor (model:Model) {
		super(model)

		//! might make sense to add laser spawners here

	}


}


interface IResources {
	cannonModelRight:Model;
	cannonModelLeft:Model;
}

//! middle turret will be added later
export async function loadEnemyShootingResources() {

	const resources = {} as IResources;

	resources.cannonModelRight = await loadModel('enemy_shooting_cannon');
	resources.cannonModelLeft = await loadModel('enemy_shooting_cannon');

	return resources;
}