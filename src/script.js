import './style.css'
import * as THREE from 'three'
import {UserMarker} from './UserMarker'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'

// Scene
const scene = new THREE.Scene()
const light = new THREE.PointLight(0xffffff, 2);
light.position.set(0, 5, 10);
scene.add(light);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.z = 3

const renderer =  new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.screenSpacePanning = true //so that panning up and down doesn't zoom in/out
//controls.addEventListener('change', render)

let imageWidth = 1200;
let imageHeight = 600;
const segmentsX = 150
const imageAspect = imageWidth/imageHeight
let fov_y = camera.position.z * camera.getFilmHeight() / camera.getFocalLength();
let meshWidth = fov_y * camera.aspect;
let meshHeight = meshWidth / imageAspect;
const planeGeometry = new THREE.PlaneGeometry(meshWidth, meshHeight, segmentsX, segmentsX/imageAspect)
const material = new THREE.MeshPhongMaterial()
const texture = new THREE.TextureLoader().load("/img/texMap.jpeg")
material.map = texture

const displacementMap = new THREE.TextureLoader().load("img/dispMap.jpeg")
material.displacementMap = displacementMap

const plane = new THREE.Mesh(planeGeometry, material)
scene.add(plane)

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    meshWidth = fov_y * camera.aspect
    meshHeight = meshWidth / imageAspect
    regeneratePlaneGeometry()
    points.forEach(point => {
        point.updateMesh(meshWidth,meshHeight)
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

// const gui = new dat.GUI()
material.transparent = true;
material.opacity = 0.20;

var data = {
    color: '#ffffff',
    emissive: material.emissive.getHex(),
    specular: material.specular.getHex()
};

material.color.setHex(Number(data.color.toString().replace('#', '0x')))
material.displacementScale = 0.1;
material.wireframe = true;

function regeneratePlaneGeometry() {
    let newGeometry = new THREE.PlaneGeometry(
        meshWidth, meshHeight, segmentsX, segmentsX/imageAspect
    )
    plane.geometry.dispose()
    plane.geometry = newGeometry
}


function updateMaterial() {
    material.side = Number(material.side)
    material.needsUpdate = true
}


// App

var animate = function () {
    requestAnimationFrame(animate)
    draw()
    render()
};

let points = new Map()
points.set('me',new UserMarker({diameter:1e-4/3, meshWidth:meshWidth, meshHeight:meshHeight}))
points.set('EC',new UserMarker({latitude: 44.8114, longitude: -91.4985, diameter:1e-1/3, meshWidth:meshWidth, meshHeight:meshHeight})) // EC, WI
points.set('CapeCod',new UserMarker({latitude: -33.918861, longitude: 18.423300, diameter:1e-1/3, meshWidth:meshWidth, meshHeight:meshHeight})); // Cape Town
points.set('LA',new UserMarker({latitude: 34.0522, longitude: -118.2437, diameter:1e-1/3, meshWidth:meshWidth, meshHeight:meshHeight})); // Cape Town

getGeolocation()

function draw(){
    points.forEach(point => {

        // Remove old spheres
        point.prevSpheres.forEach((obj) => {
            obj.geometry.dispose();
            obj.material.dispose();
            scene.remove( obj );
        })

        // Add new sphere
        scene.add(point.sphere)
    })
}

function getGeolocation(){
    var options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      };
      
      function success(pos) {
        points.get('me').setGeolocation(pos.coords.latitude, pos.coords.longitude)
      }
      
      function error(err) {
        console.warn(`ERROR(${err.code}): ${err.message}`);
      }

      navigator.geolocation.getCurrentPosition(success, error, options);
}

function render() {
    renderer.render(scene, camera)
}
animate();