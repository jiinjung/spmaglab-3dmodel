import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { nametag } from '../utils/nametag.js'

/**
 * Base
 */

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
let sceneReady = false
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)
const textureLoader = new THREE.TextureLoader()


/**
 * Material
 */

const bakedTexture = textureLoader.load('spmaglab_color.jpg')
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })
bakedTexture.encoding = THREE.sRGBEncoding
bakedTexture.flipY = false
bakedTexture.minFilter = THREE.LinearMipmapLinearFilter


/**
 * GLTF Model
 */

// Identification of transparent materials
let plastic1 = 
['Cube004', 'Cube137', 'Cube138', 'Cube139', 'Cube140',
 'Cube141', 'Cube142', 'Cube143', 'Cube144', 'Cube012', 'Cube317']

let plastic2 = 
['Cube122', 'Cube068', 'Cylinder026','Cylinder', 'Cube345','Cylinder206','Cube092']

// cloning materials
function materialClone (gltfmodel){
    gltfmodel.traverse(function(child){
        if (child.isMesh) {
        child.material = child.material.clone()
    }})
}

let lab
let mixer = null

gltfLoader.load(
    'spmaglab_model.glb',
    (gltf) =>
    {
        lab = gltf.scene
        lab.scale.set(0.03, 0.03, 0.03)
        lab.rotateY(-2)
        lab.position.x =   0.3
        lab.position.y = - 0.5

        gltf.scene.traverse((child) =>
        {
            child.material = bakedMaterial
        })

        scene.add(lab)
        materialClone(lab)

        plastic1.forEach((el)=>{
            let pl1 = lab.children.find((child) => child.name === el)
            pl1.material.transparent = true
            pl1.material.opacity = 0.2
            pl1.material.roughness = 0.0
        }) 

        plastic2.forEach((el)=>{
            let pl2 = lab.children.find((child) => child.name === el)
            pl2.material.transparent = true
            pl2.material.opacity = 0.65
            pl2.material.roughness = 0.0
        }) 

        // animation
        mixer = new THREE.AnimationMixer(lab)
        const action = mixer.clipAction(gltf.animations[0])
        action.play()

        for (let i = 0; i < nametag.length; i++) {
            points.push(
                {  
                   position: new THREE.Vector3(nametag[i].x, nametag[i].y, nametag[i].z),
                   element: document.querySelector('.point-' + String(i))
                }
            )
            
        }

       sceneReady = true
    }

)

// const axesHelper = new THREE.AxesHelper( 5 );
// scene.add( axesHelper );

/**
 * Points of Interests
 */
 const points = []
 function addPoint (n) {
     const pointDiv = document.createElement("div");
     pointDiv.className = "point point-" + String(n);
 
     const labelDiv = document.createElement("div");
     labelDiv.className = "label"
     labelDiv.textContent = String(n + 1);
     pointDiv.appendChild(labelDiv);
 
     const textDiv = document.createElement("div");
     textDiv.className = "text"
     textDiv.textContent = nametag[n].name;
     pointDiv.appendChild(textDiv);
 
     const currentDiv = document.getElementById("loading-bar");
     document.body.insertBefore(pointDiv, currentDiv);
   }
 
for (let i = 0; i < nametag.length; i++) {
     addPoint(i)
}


 /**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputencoding = THREE.sRGBEncoding
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(30, sizes.width / sizes.height, 0.1, 100)
camera.position.set(3, 2, -5)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0, 0)
controls.enableDamping = true
controls.zoomSpeed = 0.5
controls.minDistance = 1
controls.maxDistance = 10;
controls.maxPolarAngle = Math.PI / 2.5;
controls.rotateSpeed = 0.5;
controls.minAzimuthAngle  = 1
controls.maxAzimuthAngle  = 3.3

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding
renderer.setClearColor("#716450")

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    if(mixer)
    {
        mixer.update(deltaTime)
    }

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)

    if(sceneReady)
    {
        for(const point of points)
        {
            const screenPosition = point.position.clone()
            screenPosition.project(camera)

            if ((camera.position.x)**2 + (camera.position.y)**2 + (camera.position.z)**2 < 6.5)
            {
                point.element.classList.add('visible')
            }else{
                point.element.classList.remove('visible')
            }

            const translateX = screenPosition.x * sizes.width * 0.5
            const translateY = - screenPosition.y * sizes.height * 0.5
            point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`
        }
    }
}

tick()